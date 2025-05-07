import { EthLotteryAbi } from '@/abis/eth-lottery'
import { useChain } from '@/hooks/useChain'
import { leavesDB } from '@/lib/db/leavesDb'
import { secretPowerToSecret } from '@/lib/lottery'
import { BET_MIN } from '@/lib/lottery/constants'
import { DEFAULT_CHAIN } from '@/lib/lottery/db'
import { fetchLastLeaf } from '@/lib/lottery/fetchLastLeaf'
import { getHash } from '@/lib/lottery/getHash'
import { leBigintToBuffer } from '@/lib/lottery/utils/bigint'
import { getLotteryStatus } from '@/lib/lottery/utils/nextjs/getLotteryStatus'
import { pedersenHash } from '@/lib/lottery/utils/pedersen'
import { keccak256Abi, keccak256Uint } from '@/lib/solidity'
import { FOOM, LOTTERY } from '@/lib/utils/constants/addresses'
import { UNISWAP_V3_QUOTER, UNISWAP_V3_QUOTER_ABI, WETH } from '@/lib/utils/constants/uniswap'
import { _error, _log, _warn } from '@/lib/utils/ts'
import { useMutation } from '@tanstack/react-query'
import { groth16 } from 'snarkjs'
import { toast } from 'sonner'
import { decodeEventLog, erc20Abi, formatEther, zeroAddress } from 'viem'
import { waitForTransactionReceipt } from 'viem/actions'
import { usePublicClient, useWalletClient } from 'wagmi'
import { generateWithdraw } from '../withdraw'
import { mainnet } from 'viem/chains'
import { sleep } from '@/lib/utils/node'

export type FormattedProof = {
  pi_a: [bigint, bigint]
  pi_b: [[bigint, bigint], [bigint, bigint]]
  pi_c: [bigint, bigint]
}

export function formatProofForContract(proof: any): FormattedProof {
  return {
    pi_a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
    pi_b: [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
    ],
    pi_c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
  }
}

export function useLotteryContract(
  {
    onStatus,
    tickets,
    setTickets,
  }: {
    onStatus?: (msg: string) => void
    tickets: any[]
    setTickets: React.Dispatch<React.SetStateAction<any[]>>
  } = {} as any
) {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chain = useChain()

  /** TODO: make this accept the same as `_log` to enable proper `_log` f call formatting; only just later format params to be concat with spaces and json-stringified if current param is of type `object`. */
  const handleStatus = (data: string) => {
    _log(data)
    onStatus?.(data)
  }

  async function prepareAndPlay({
    power,
    inputCurrency,
    pray,
    _commitment,
    onStatus,
    customArgs = {},
  }: {
    power: number
    inputCurrency: 'ETH' | 'FOOM'
    pray?: string
    _commitment?: Awaited<ReturnType<typeof getHash>>
    onStatus?: (msg: string) => void
    customArgs?: Record<string, any>
  }) {
    const status = (msg: string) => {
      _log(msg)
      onStatus?.(msg)
    }

    if (!walletClient || !publicClient) {
      throw new Error('Wallet not connected')
    }
    if (!chain) {
      throw new Error('No chain found')
    }

    /** @dev play value based on ticket power (lottery accepts FOOM amount, not the power value) */
    const requiredFoomAmount = BET_MIN * (2n + 2n ** BigInt(power))
    _log('Play value (net FOOM):', formatEther(requiredFoomAmount), 'FOOM')

    /** @dev calculate ETH play AOT if applicable (if not playing with FOOMs) */
    let ethPlayAmount: bigint | undefined
    if (inputCurrency === 'FOOM') {
      ethPlayAmount = undefined
      _log('Playing with FOOM:', 'bet_min', `= ${formatEther(requiredFoomAmount)} FOOM`)
    } else {
      ethPlayAmount = await getAmountEthForPower(power)
      _log('Playing with:', '<uniswap return value>', '* bet_min', `= ${formatEther(ethPlayAmount)} ETH`)
    }

    status('Generating commitment...')
    const commitment = _commitment || (await getHash([`0x${Number(power).toString(16)}`, 0]))

    status(`Commitment Hash: ${commitment.hash}`)
    status(`Ticket: ${commitment.secret_power}`)

    const correctNonce = await publicClient.getTransactionCount({
      address: walletClient.account.address,
    })
    _log('Nonce:', correctNonce)

    const _pray = pray?.trim()
    const isPray = !!_pray
    const requestChainId = chain.id
    const args = {
      address: LOTTERY[chain.id],
      abi: EthLotteryAbi,
      functionName: isPray
        ? inputCurrency === 'FOOM'
          ? 'playAndPray'
          : 'playETHAndPray'
        : inputCurrency === 'FOOM'
          ? 'play'
          : 'playETH',
      args: isPray ? [BigInt(commitment.hash), BigInt(power), _pray] : [BigInt(commitment.hash), BigInt(power)],
      account: walletClient.account.address,
      ...(ethPlayAmount !== undefined ? { value: ethPlayAmount } : {}),
    }

    /** @dev approve for FOOM play when playing directly with FOOM */
    if (inputCurrency === 'FOOM') {
      const allowance: bigint = await publicClient.readContract({
        address: FOOM[chain.id],
        abi: erc20Abi,
        functionName: 'allowance',
        args: [walletClient.account.address, LOTTERY[chain.id]],
      })

      if (allowance < requiredFoomAmount) {
        status('Approving FOOMs for lottery contract...')

        const approveTx = await walletClient.writeContract({
          address: FOOM[chain.id],
          abi: erc20Abi,
          functionName: 'approve',
          args: [LOTTERY[chain.id], requiredFoomAmount],
        })
        await waitForTransactionReceipt(publicClient, { hash: approveTx })
        status('FOOM approved!')
      }
    }

    _log('Args:', args)
    const result = await publicClient.simulateContract(args)
    const { request: playRequest } = result
    _log('Chain ID used:', requestChainId)
    _log('Play simulation result:', result)

    const playTx = await walletClient.writeContract({
      ...playRequest,
      value: ethPlayAmount,
    })
    const receipt = await waitForTransactionReceipt(publicClient, { hash: playTx })

    /** @dev get 'index' from LogBetIn */
    let ticketIndex: string | undefined = undefined
    try {
      const logs = receipt.logs.map(log => ({ address: log.address, data: log.data, topics: log.topics }))
      const decodedLogs = logs
        .map(log => {
          try {
            return decodeEventLog({
              abi: [...EthLotteryAbi, ...erc20Abi],
              data: log.data,
              topics: log.topics,
            })
          } catch (err) {
            return null
          }
        })
        .filter(log => log !== null)
      const logBetIn = decodedLogs.find(log => log.eventName === 'LogBetIn')
      if (logBetIn && logBetIn.args) {
        if (Array.isArray(logBetIn.args)) {
          ticketIndex = logBetIn.args[0]?.toString()
        } else if (typeof logBetIn.args === 'object' && 'index' in logBetIn.args) {
          ticketIndex = logBetIn.args.index?.toString()
        }
      }
    } catch (error) {
      _warn('Failed to extract LogBetIn index:', error)
    }

    _log('Saving ticket locally…')
    const now = new Date().toISOString()
    try {
      if (ticketIndex !== undefined && ticketIndex !== '') {
        const newLeaf = {
          secret: secretPowerToSecret(commitment.secret_power),
          date: now,
          power: Number(power),
          chain: requestChainId || DEFAULT_CHAIN,
        }

        await leavesDB.patchLeaf(Number(ticketIndex), newLeaf)

        /** @dev update GUI */
        setTickets(prev => [...prev, { ...newLeaf, index: Number(ticketIndex) }])

        _log('Saved to leavesDB.')
      } else {
        _warn('No ticket index found, cannot save to leavesDB!')
      }
    } catch (err) {
      _warn('Failed to save ticket data to leavesDB!', err)
    }

    const secret = BigInt(commitment.secret_power) >> 8n

    const lastLeaf = await fetchLastLeaf(chain.id)

    status(
      `Ticket: ${commitment.secret_power}, Next Index: ${lastLeaf[0]}, block number: ${lastLeaf[1]}, Power: ${power}`
    )

    return {
      receipt,
      secretPower: commitment.secret_power,
      secret,
      hash: commitment.hash,
      startIndex: lastLeaf[0],
      startBlock: lastLeaf[1],
    }
  }

  const playMutation = useMutation({
    mutationFn: async ({
      power,
      inputCurrency,
      pray,
      _commitment,
    }: {
      power: number
      inputCurrency: 'ETH' | 'FOOM'
      pray?: string
      _commitment?: Awaited<ReturnType<typeof getHash>>
    }) => {
      try {
        return await prepareAndPlay({ power, inputCurrency, pray, _commitment, onStatus })
      } catch (error: any) {
        _error(error)

        try {
          if (`${error}`?.includes?.('not connected')) {
            toast('Please connect your wallet first!')

            await sleep(500)
            toast.dismiss('play-lottery-pending')

            return
          }
        } catch {}

        if (error?.cause?.cause?.code === 4001) {
          toast('Cancelled')
        } else if (error?.cause?.cause?.name === 'InsufficientFundsError') {
          toast(
            `You don't have enough ETH to play! (you need ${formatEther(await getAmountEthForPower(power))} ETH + gas fees)`
          )
        } else {
          toast('There is not enough liquidity in the pool to play this bet. Please, try again later.')
        }

        handleStatus(`Error: ${error.message}`)
      }
    },
    onSuccess: (data: any) => {
      if (data) {
        const { receipt, ...output } = data
        handleStatus(`Receipt: ${JSON.stringify(receipt, null, 2)}`)
        handleStatus(`Result: ${JSON.stringify(output, null, 2)}`)

        const logs = receipt.logs.map(log => ({ address: log.address, data: log.data, topics: log.topics }))
        _log('Raw TX logs:', logs)

        const decodedLogs = logs
          .map(log => {
            try {
              return decodeEventLog({
                abi: [...EthLotteryAbi, ...erc20Abi],
                data: log.data,
                topics: log.topics,
              })
            } catch (err) {
              return null
            }
          })
          .filter(log => log !== null)
        _log('Decoded Logs:', decodedLogs)

        handleStatus(`Logs: ${JSON.stringify(decodedLogs, null, 2)}`)
        toast.success('Congrats! See your bet in Your Lottery Tickets now')
      }
    },
  })

  const playAndPrayMutation = useMutation({
    mutationFn: async ({
      power,
      inputCurrency,
      prayValue,
      prayText,
      _commitment,
    }: {
      power: number
      inputCurrency: 'ETH' | 'FOOM'
      prayValue: bigint
      prayText: string
      _commitment?: Awaited<ReturnType<typeof getHash>>
    }) => {
      try {
        return await prepareAndPlay({
          power,
          inputCurrency,
          _commitment,
          onStatus,
          customArgs: {
            value: prayValue,
            functionName: 'playAndPray',
            args: [prayText],
          },
        })
      } catch (error: any) {
        _error(error)
        toast(error?.cause?.cause?.code === 4001 ? 'Cancelled' : error?.cause?.reason || error?.message || `${error}`)
        handleStatus(`Error: ${error.message}`)
      }
    },
    onSuccess: (data: any) => {
      if (data) {
        const { receipt, ...output } = data
        handleStatus(`Receipt: ${JSON.stringify(receipt, null, 2)}`)
        handleStatus(`Result: ${JSON.stringify(output, null, 2)}`)
        const logs = receipt.logs.map(log => ({ address: log.address, data: log.data, topics: log.topics }))
        _log('Raw TX logs:', logs)
        const decodedLogs = logs
          .map(log => {
            try {
              return decodeEventLog({
                abi: [...EthLotteryAbi, ...erc20Abi],
                data: log.data,
                topics: log.topics,
              })
            } catch (err) {
              return null
            }
          })
          .filter(log => log !== null)
        _log('Decoded Logs:', decodedLogs)
        handleStatus(`Logs: ${JSON.stringify(decodedLogs, null, 2)}`)
      }
    },
  })

  /**
   * Solely calls proof generation.
   * AKA generate witness/proof (and store it for further use)
   */
  const makeWithdrawProofMutation = useMutation({
    mutationFn: async ({
      secretPower,
      betIndex,
      recipient,
      relayer,
      fee = 0n,
      refund = 0n,
    }: {
      secretPower: bigint
      betIndex?: number | ''
      recipient: string
      relayer: string
      fee?: bigint
      refund?: bigint
    }) => {
      /** @dev proof build */
      /** @dev relayer is always defined as 0x0 to make anyone able to relay this transaction */
      _log('Generating withdraw proof…')

      if (!chain) {
        throw new Error('No chain found')
      }

      const witness = await generateWithdraw({
        chain: chain.id,
        secretPowerHex: `0x${secretPower.toString(16)}`,
        manualBetIndex: betIndex,
        recipientHex: recipient,
        /** @dev this is always set to 0x0 (not string!) to allow anyone to relay */
        relayerHex: zeroAddress,
        feeHex: `0x${fee.toString(16)}`,
        refundHex: `0x${refund.toString(16)}`,
        handleStatus,
      })

      /** @dev Relayer handoff */
      /** @dev NOTICE: Handled by `collectViaRelayerMutation now` */
      // handleStatus('Handing off to chosen relayer…')
      // const handoffObject = witness.encoded
      // let response: AxiosResponse<any, any> | undefined = undefined

      // try {
      //   response = await relayerApi.post('/relay/withdraw', handoffObject)
      // } catch (error) {
      //   _warn(error)
      // }

      _log('Relayer API response:', '<no API picked for `collect()` call>')
      return {
        witness,
      }
    },
  })

  const cancelBetMutation = useMutation({
    mutationFn: async ({ ticket, index }: { ticket: string; index: number }) => {
      try {
        handleStatus('Parsing ticket input...')
        const secretPower = BigInt(ticket)

        const secret = secretPower >> 8n
        const hash = await pedersenHash(leBigintToBuffer(secret, 31))

        handleStatus('Generating cancel proof...')
        const input = { inHash: hash, secret }
        const { proof } = await generateCancelBet(input)

        const pA = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])]
        const pB = [
          [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
          [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
        ]
        const pC = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])]

        if (!walletClient || !publicClient) {
          throw new Error('Wallet not connected')
        }
        if (!chain) {
          throw new Error('No chain found')
        }

        handleStatus('Sending cancel transaction...')
        const tx = await walletClient.writeContract({
          address: LOTTERY[chain.id],
          abi: EthLotteryAbi,
          functionName: 'cancelbet',
          args: [pA, pB, pC, index, walletClient.account.address],
        })
        const receipt = await waitForTransactionReceipt(publicClient, { hash: tx })

        handleStatus(`CancelBet TX hash: ${receipt.transactionHash}`)
        return { receipt }
      } catch (error: any) {
        _error(error)
        handleStatus(`Error: ${error.message}`)
        throw error
      }
    },
  })

  const payOutMutation = useMutation({
    mutationFn: async ({ amount }: { amount: bigint }) => {
      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }
      if (!chain) {
        throw new Error('No chain found')
      }

      try {
        const simulation = await publicClient.simulateContract({
          address: LOTTERY[chain.id],
          abi: EthLotteryAbi,
          functionName: 'payOut',
          args: [amount],
          account: walletClient.account.address,
        })

        const { request } = simulation

        const tx = await walletClient.writeContract(request)
        const receipt = await waitForTransactionReceipt(publicClient, { hash: tx })
        toast.success('De-investment successful!')

        return { receipt }
      } catch (error: any) {
        if (error?.cause?.reason === 'Wait till the next dividend period') {
          toast.error(
            'You have already de-invested during the current investment period! Please wait until the next one starts.'
          )
          return
        }

        _error({ ...error })
        throw error
      }
    },
  })

  async function getEthInForFoomOut(amountOut: bigint): Promise<bigint> {
    if (!publicClient) {
      throw new Error('No public client')
    }
    if (!chain) {
      throw new Error('No chain found')
    }

    const result = await publicClient.readContract({
      address: UNISWAP_V3_QUOTER[chain.id],
      abi: UNISWAP_V3_QUOTER_ABI,
      functionName: 'quoteExactOutputSingle',
      args: [
        {
          tokenIn: WETH[chain.id],
          tokenOut: FOOM[chain.id],
          amount: amountOut,
          fee: chain.id === mainnet.id ? 500n : 3000n,
          sqrtPriceLimitX96: 0n,
        },
      ],
    })

    if (!Array.isArray(result) || typeof result?.[0] !== 'bigint') {
      throw new Error('Unexpected result from Uniswap Quoter')
    }

    _log('Uniswap V3 quote result:', result)
    return result[0]
  }

  /**
   * Calculates amount of ETH to deposit for the play of given power to happen.
   * @dev yields >= the amount of ETH that swaps to enough FOOMs via Uniswap V3
   */
  async function getAmountEthForPower(power: number | bigint): Promise<bigint> {
    if (power > 22) {
      throw new Error('Invalid bet amount')
    }

    const amountFoomNeeded = BET_MIN * (2n + 2n ** BigInt(power))
    const amountEthNeeded = await getEthInForFoomOut(amountFoomNeeded)
    /** @dev 3% buffer to add to avoid underflow */
    const amount = amountEthNeeded + (amountEthNeeded * 3n) / 100n

    return amount
  }

  return {
    playMutation,
    playAndPrayMutation,
    cancelBetMutation,
    makeWithdrawProofMutation,
    payOutMutation,
    formatProofForContract,
    keccak256Abi,
    keccak256Uint,
    getLotteryStatus,
    getHash,
    getAmountEthForPower,
  }
}
async function generateCancelBet(input: { inHash: bigint; secret: bigint }): Promise<{ proof: any }> {
  const circuitInput = {
    inHash: input.inHash,
    secret: input.secret,
  }

  const { proof } = await groth16.fullProve(
    circuitInput,
    'circuit_artifacts/cancelbet_js/cancelbet.wasm',
    'circuit_artifacts/cancelbet_final.zkey'
  )

  return { proof }
}
