import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { useAppKitAccount } from '@reown/appkit/react'
import { useWalletClient, usePublicClient, useChainId } from 'wagmi'
import { useLotteryContract } from '@/lib/lottery/hooks/useLotteryContract'
import { pedersenHash } from '@/lib/lottery/utils/pedersen'
import { leBigintToBuffer } from '@/lib/lottery/utils/bigint'
import indexer from '@/lib/indexer'
import { _log, _error, safeHexToDecimal, assertIsHex, safeDecimalToHex, _warn } from '@/lib/utils/ts'
import type { Address, Hex } from 'viem'
import type { ICommitment } from '@/types/lottery'
import { FOOM } from '@/lib/utils/constants/addresses'
import { erc20Abi, parseEther } from 'viem'
import { UNISWAP_V3_ROUTER, UNISWAP_V3_ROUTER_ABI, WETH } from '@/lib/utils/constants/uniswap'
import { toast } from 'sonner'
import { fetchLastLeaf } from '@/lib/lottery/fetchLastLeaf'
import { findBetSafe } from '@/lib/lottery/withdraw'
import { leavesDB } from '@/lib/db/leavesDb'
import { FEE_MIN, REFUND_CUSTOM, REFUND_MAX } from '@/lib/lottery/constants'
import { useFees } from '@/hooks/useFees'
import type { LeafEntry } from '@/lib/db/leavesDb'
import useAsyncEffect from '@/hooks/react/useAsyncEffect'
import { _redact, toSecretPower } from '@/lib/lottery'
import { useChain } from '@/hooks/useChain'
import { DEFAULT_CHAIN } from '@/lib/lottery/db'

export type PlayArgs = Parameters<ReturnType<typeof useLotteryContract>['playMutation']['mutate']>[0]

interface LotteryContextValue {
  isClient: boolean
  status: string
  setStatus: React.Dispatch<React.SetStateAction<string>>
  commitment: ICommitment | undefined
  setCommitment: React.Dispatch<React.SetStateAction<ICommitment | undefined>>
  tickets: LeafEntry[]
  setTickets: {
    add: (ticketObj: { chain: number; secret: string; index: number; power: number; date?: string }) => Promise<void>
    remove: (secret: string, index?: number) => Promise<void>
    refresh: (customNewState?: LeafEntry[]) => Promise<void>
  }
  redeemHex: string
  setRedeemHex: React.Dispatch<React.SetStateAction<string>>
  lotteryHashes: string[]
  setLotteryHashes: React.Dispatch<React.SetStateAction<string[]>>
  commitIndex: number
  setCommitIndex: React.Dispatch<React.SetStateAction<number>>
  account: ReturnType<typeof useAppKitAccount>
  walletClient: ReturnType<typeof useWalletClient>['data']
  publicClient: ReturnType<typeof usePublicClient>
  playAndPrayMutation: ReturnType<typeof useLotteryContract>['playAndPrayMutation']
  cancelBetMutation: ReturnType<typeof useLotteryContract>['cancelBetMutation']
  makeWithdrawProofMutation: ReturnType<typeof useLotteryContract>['makeWithdrawProofMutation']
  playMutation: ReturnType<typeof useLotteryContract>['playMutation']
  swapUsdcToWeth: (args: { amountIn: bigint; slippage?: number }) => Promise<void>
  handleRedeem: () => Promise<
    | {
        hash: string
        index: number
        rand: bigint
        proof: any
        reward:
          | {
              maskedBits: string[]
              reward: string
              maskBits: string[]
              bits: string[]
            }
          | undefined
      }
    | undefined
  >
  play: (args: PlayArgs) => void
  handleStatus: (data: string) => void
  recipient: Hex | undefined
  setRecipient: React.Dispatch<React.SetStateAction<Hex | undefined>>
  redeemIndex: number | '' | undefined
  setRedeemIndex: React.Dispatch<React.SetStateAction<number | '' | undefined>>
  lastLeaf: {
    nextIndex: bigint | number
    blockNumber: bigint | number
    lastRoot: bigint | number
    lastLeaf: bigint | number
  } | null
  payOutMutation: ReturnType<typeof useLotteryContract>['payOutMutation']
}

const LotteryContext = createContext<LotteryContextValue | undefined>(undefined)

export function useLottery() {
  const ctx = useContext(LotteryContext)
  if (!ctx) throw new Error('useLottery must be used within a LotteryProvider')
  return ctx
}

export const LotteryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isClient, setIsClient] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [commitment, setCommitment] = useState<ICommitment>()
  const [recipient, setRecipient] = useState<Hex>()
  const [tickets, setTicketsState] = useState<LeafEntry[]>([])

  /** @dev NOTE: secret, not hash! */
  const [redeemHex, setRedeemHex] = useState<string>(process.env.NEXT_PUBLIC_TEMP_TICKET || '')
  const [redeemIndex, setRedeemIndex] = useState<number | ''>()
  const [lotteryHashes, setLotteryHashes] = useState<string[]>([])
  /** @dev deprecated */
  const [commitIndex, setCommitIndex] = useState<number>(lotteryHashes.length)
  const [lastLeaf, setLastLeaf] = useState<{
    nextIndex: bigint | number
    blockNumber: bigint | number
    lastRoot: bigint | number
    lastLeaf: bigint | number
  } | null>(null)

  const chainId = useChainId()
  const account = useAppKitAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const fees = useFees()
  const chain = useChain()

  const handleStatus = useCallback((data: string) => setStatus(prev => `> ${data}${prev ? '\n\n' + prev : ''}`), [])
  const { playAndPrayMutation, cancelBetMutation, makeWithdrawProofMutation, playMutation, payOutMutation } =
    useLotteryContract({
      onStatus: handleStatus,
      tickets,
      setTickets: setTicketsState,
    })

  const play = useCallback(
    (args: PlayArgs) => {
      playMutation.mutate(args)
    },
    [playMutation]
  )

  const swapUsdcToWeth = useCallback(
    async ({ amountIn }: { amountIn: bigint; slippage?: number }) => {
      if (!amountIn || amountIn <= 0n) {
        setStatus('Invalid amount')
        return
      }
      if (!chain) {
        setStatus('No chain selected')
        return
      }

      try {
        if (!walletClient || !account?.address || !publicClient) {
          setStatus('Wallet not connected')
          return
        }

        const allowance: bigint = await publicClient.readContract({
          address: WETH[chain.id],
          abi: erc20Abi,
          functionName: 'allowance',
          args: [account.address as `0x${string}`, UNISWAP_V3_ROUTER[chain.id]],
        })

        if (allowance < amountIn) {
          setStatus('Approving WETH...')
          const approveTx = await walletClient.writeContract({
            address: WETH[chain.id],
            abi: erc20Abi,
            functionName: 'approve',
            args: [UNISWAP_V3_ROUTER[chain.id], amountIn],
            account: account.address as `0x${string}`,
          })
          await publicClient.waitForTransactionReceipt({ hash: approveTx })
        } else {
          setStatus('Sufficient WETH allowance, skipping approval.')
        }

        setStatus('Swapping WETH to FOOM...')
        const params = {
          tokenIn: WETH[chain.id],
          tokenOut: FOOM[chain.id],
          fee: 3000,
          recipient: account.address as `0x${string}`,
          amountIn,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96: 0n,
        }
        const { request } = await publicClient.simulateContract({
          address: UNISWAP_V3_ROUTER[chain.id],
          abi: UNISWAP_V3_ROUTER_ABI,
          functionName: 'exactInputSingle',
          args: [params],
          value: 0n,
          account: account.address as `0x${string}`,
        })
        const swapTx = await walletClient.writeContract(request)
        await publicClient.waitForTransactionReceipt({ hash: swapTx })
        setStatus('Swap complete!')
      } catch (error) {
        setStatus(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        _error('Swap error:', error)
      }
    },
    [walletClient, account, publicClient]
  )

  const handleRedeem = useCallback(async () => {
    if (!redeemHex) {
      return
    }

    let ticketHashHex = ''
    let result: Awaited<ReturnType<(typeof makeWithdrawProofMutation)['mutateAsync']>> | undefined = undefined
    try {
      const ticketSecret = BigInt(redeemHex)
      const power = ticketSecret & 0xffn
      const secret = ticketSecret >> 8n
      const ticketHash = await pedersenHash(leBigintToBuffer(secret, 31))

      ticketHashHex = `0x${ticketHash.toString(16)}`
      _log('Ticket hash computed:', ticketHash, ticketHashHex)

      const collector = recipient || (account?.address as Address)

      if (!collector) {
        toast.error('Please enter the ticket recipient first!')
        throw new Error('No recipient address provided')
      }

      _log('Using recipient for proof:', collector)
      const mutationResult = await makeWithdrawProofMutation.mutateAsync({
        secretPower: ticketSecret,
        betIndex: redeemIndex,
        recipient: collector,
        relayer: '0x0',
        fee: fees.fees?.feeFoom ? parseEther(`${fees.fees?.feeFoom}`) : FEE_MIN,
        refund: REFUND_CUSTOM,
      })
      result = mutationResult
    } catch (error) {
      if (`${error}`.includes('Assert Failed') && !!redeemIndex) {
        toast('The bet index you provided is invalid! Verify it and try again.')
      }
      _error('Failed to fetch startIndex:', error)
    }

    return {
      hash: ticketHashHex,
      index: result?.witness.bet.index || 0,
      rand: result?.witness.bet.rand || 0n,
      proof: result,
      reward: result?.witness?.reward,
    }
  }, [redeemHex, redeemIndex, makeWithdrawProofMutation, account])

  /**
   * Refreshes exported tickets state; syncs from IndexedDB.
   */
  const refreshTickets = useCallback(
    async (customNewState?: LeafEntry[]) => {
      _log('Refreshing tickets from leavesDB to schedule GUI update...')

      if (customNewState) {
        _log('[refreshTickets] Using `customNewState`:', _redact(customNewState))
      }

      /** @dev valid (having a secret) tickets from IDB (chain,index,secret,power,date) new format (excludes indices fetched for spoofing) */
      const allIdb = customNewState?.filter(item => !!item.secret) || (await leavesDB.getAllTickets(chainId))

      /** @dev valid (having a secret) tickets from IDB old (index,secret,power,date-only) format (with .chain appended to default to Base) */
      const allIdbV0 = (await leavesDB.table('leaves').toArray())
        .filter(item => !!item.secret)
        .map(item => ({ ...item, chain: DEFAULT_CHAIN }))
        .filter(item => item.chain === chainId)

      // _log('Tickets fetched from leavesDB V0 (`leaves`):', _redact(allIdbV0))
      // _log('Tickets fetched from leavesDB V1 (`leaves_002`):', _redact(allIdb))

      const mergedByIndices = [...allIdb, ...allIdbV0].reduce((acc: LeafEntry[], item) => {
        const existingIndex = acc.findIndex(leaf => leaf.index === item.index && leaf.chain === item.chain)
        if (existingIndex === -1) {
          acc.push(item)
        } else {
          /** @dev prefer newer format, if exists */
          acc[existingIndex] = {
            ...acc[existingIndex],
            ...item,
          }
        }
        return acc
      }, [])

      // _log('Tickets merged, about to update current GUI with them:', _redact(mergedByIndices))
      setTicketsState(mergedByIndices)
    },
    [chainId]
  )

  const addTicket = useCallback(
    async (ticketObj: { chain: number; secret: string; index: number; power: number; date?: string }) => {
      await leavesDB.patchLeaf(ticketObj.index, {
        chain: ticketObj.chain,
        secret: ticketObj.secret,
        power: ticketObj.power,
        date: ticketObj.date || new Date().toISOString(),
      })

      await refreshTickets()
    },
    [refreshTickets]
  )

  const removeTicket = useCallback(
    async (secretPower: string, index?: number) => {
      const all = await leavesDB.getAll(chainId)
      const found = all.find(idbLeaf => {
        return (
          typeof idbLeaf.secret === 'string' &&
          typeof secretPower === 'string' &&
          toSecretPower(safeHexToDecimal(idbLeaf.secret as Hex), idbLeaf.power).toLowerCase() ===
            secretPower.toLowerCase() &&
          (typeof index !== 'number' || idbLeaf.index === index)
        )
      })

      if (found) {
        _log('Removing ticket from leavesDB:', found)
        await leavesDB.leaves_002.delete([found.chain, found.index])
        window?.dispatchEvent(new Event('leavesDbChanged'))
        await refreshTickets()

        /** @dev === LS: === support removal from older format localStorage (if present) */
        const lsTicketsRaw = localStorage.getItem('lotteryTickets')
        if (lsTicketsRaw) {
          try {
            const lsTickets = JSON.parse(lsTicketsRaw)
            /** @dev support both older string and object formats */
            const filtered = lsTickets.filter((t: any) => {
              if (typeof t === 'string') {
                /** @dev old format: secret_power as string */
                return t.toLowerCase() !== secretPower.toLowerCase()
              } else if (t && typeof t === 'object' && t.ticket) {
                /** @dev newer format: { ticket, ... } */
                return t.ticket.toLowerCase() !== secretPower.toLowerCase()
              }
              return true
            })
            localStorage.setItem('lotteryTickets', JSON.stringify(filtered))
          } catch {}
        }
      }
    },
    [refreshTickets]
  )

  /** @dev trigger ticket refresh on chain update */
  useEffect(() => {
    if (!account.address) {
      return
    }
    if (!chainId) {
      return
    }

    refreshTickets()
  }, [chainId, account.address])

  /** @dev old-format localStorage ticket migration to IndexedDB */
  /** @dev deprecated */
  useAsyncEffect(async () => {
    return

    const lsLeavesRaw = localStorage.getItem('lotteryTickets')
    if (!lsLeavesRaw) {
      return
    }

    try {
      const lsLeaves = JSON.parse(lsLeavesRaw!)
      const idbLeaves = await leavesDB.getAll(chainId)

      _log('Migrating leaves from localStorage to IndexedDB:', _redact(lsLeaves))

      const leavesToPut: LeafEntry[] = []
      for (const lsLeaf of lsLeaves) {
        /** @dev support old format: string, secret_power-only-format */
        if (assertIsHex(lsLeaf)) {
          _warn('Migrating (V0.1) leaf from LS:', _redact(lsLeaf))
          const isAlreadyMigrated = idbLeaves.some(
            idbLeaf =>
              idbLeaf?.secret?.toLowerCase() === safeDecimalToHex(safeHexToDecimal(lsLeaf) >> 8n)?.toLowerCase()
          )
          if (!isAlreadyMigrated) {
            leavesToPut.push({
              secret: safeDecimalToHex(safeHexToDecimal(lsLeaf) >> 8n),
              power: Number(safeHexToDecimal(lsLeaf) & 0xffn),
              /** @dev old format was Base-only */
              chain: DEFAULT_CHAIN,
            })
          }
        } else if (!!lsLeaf.ticket) {
          _warn('Migrating (V0.2) leaf from LS:', _redact(lsLeaf))
          const isAlreadyMigrated = idbLeaves.some(
            idbLeaf =>
              idbLeaf?.secret?.toLowerCase() === safeDecimalToHex(safeHexToDecimal(lsLeaf.ticket) >> 8n)?.toLowerCase()
          )
          if (!isAlreadyMigrated) {
            leavesToPut.push({
              index: !!lsLeaf.index || lsLeaf.index === 0 ? Number(lsLeaf.index) : undefined,
              secret: safeDecimalToHex(safeHexToDecimal(lsLeaf.ticket) >> 8n),
              power: Number(safeHexToDecimal(lsLeaf.ticket) & 0xffn),
              date: lsLeaf.date,
              /** @dev old format was Base-only */
              chain: DEFAULT_CHAIN,
            })
          }
        }
      }

      if (leavesToPut.length > 0) {
        _log('Putting migrated leaves to IndexedDB:', leavesToPut)
        await leavesDB.patchLeaves(
          leavesToPut.map(item => ({
            index: Number(item.index),
            patch: { ...item },
          })),
          false
        )
      }
      _log('All leaves migrated.')

      await refreshTickets()
    } catch {}
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (commitment?.hash) {
      const hashStr = `0x${commitment?.hash?.toString(16)}`
      if (lotteryHashes.includes(hashStr)) return
      setLotteryHashes(prev => {
        const updated = [...prev, hashStr]
        localStorage.setItem('lotteryHashes', JSON.stringify(updated))
        return updated
      })
    }
  }, [commitment?.hash, lotteryHashes.length])
  useEffect(() => {
    const stored = localStorage.getItem('lotteryHashes')
    if (stored) {
      try {
        const hashes = JSON.parse(stored)
        setLotteryHashes(hashes)
      } catch {
        setLotteryHashes([])
      }
    }
  }, [])
  useEffect(() => {
    if (lotteryHashes.length) {
      const lastHash = lotteryHashes[lotteryHashes.length - 1]
      _log('Last hash:', lastHash)
    }
  }, [lotteryHashes.length])
  useEffect(() => {
    const stored = localStorage.getItem('commitIndex')
    if (stored) {
      setCommitIndex(Number(stored))
    }
  }, [])

  useEffect(() => {
    if (!chain) {
      return
    }

    let interval: NodeJS.Timeout | undefined
    const fetchLeaf = async () => {
      try {
        const fetched = await fetchLastLeaf(chain.id)
        setLastLeaf({
          nextIndex: fetched[0],
          blockNumber: fetched[1],
          lastRoot: fetched[2],
          lastLeaf: fetched[3],
        })
        _log('Last index synced:', fetched[0])
      } catch (err) {
        _error('Failed to fetch last leaf:', err)
      }
    }
    fetchLeaf()

    interval = setInterval(fetchLeaf, 30_000 /** @dev 30s */)
    return () => interval && clearInterval(interval)
  }, [chain?.id])

  /** @dev sync rands for bets, periodically (i.e. when the current network's lastLeaf changes – time for an update.) */
  useEffect(() => {
    if (!lastLeaf?.nextIndex) {
      return
    }

    /** @dev returns all tickets with Pending state and index < lastLeaf.nextIndex */
    const fetchPendingRands = async () => {
      _log('Fetching pending rands for tickets...')

      try {
        if (!Array.isArray(tickets) || typeof tickets[0] === 'string') {
          return
        }
        const pendingTickets: LeafEntry[] = []
        for (const ticket of tickets) {
          if (!ticket.secret || typeof ticket.index !== 'number') {
            continue
          }
          /** @dev don't process tickets that weren't included in the tree yet */
          if (ticket.index >= Number(lastLeaf?.nextIndex)) {
            continue
          }
          const leaf = await leavesDB.leaves_002.get([ticket.chain, ticket.index])
          if (!leaf?.rand || !Number(leaf?.rand)) {
            pendingTickets.push(ticket)
          }
        }
        for (const ticket of pendingTickets) {
          try {
            const bet = await findBetSafe(ticket.chain, ticket.index!)
            _log(`Fetched rand for ticket index ${ticket.index}:`, bet[1])
          } catch (err) {
            _error(`Failed to fetch rand for ticket index ${ticket.index}:`, err)
          }
        }
      } catch (err) {
        _error('Error fetching pending rands:', err)
      }
    }

    fetchPendingRands()
  }, [lastLeaf?.nextIndex])

  const value: LotteryContextValue = {
    isClient,
    status,
    setStatus,
    commitment,
    setCommitment,
    tickets,
    setTickets: {
      add: addTicket,
      remove: removeTicket,
      refresh: refreshTickets,
    },
    redeemHex,
    setRedeemHex,
    lotteryHashes,
    setLotteryHashes,
    commitIndex,
    setCommitIndex,
    account,
    walletClient,
    publicClient,
    playAndPrayMutation,
    playMutation,
    cancelBetMutation,
    makeWithdrawProofMutation,
    swapUsdcToWeth,
    handleRedeem,
    play,
    handleStatus,
    recipient,
    setRecipient,
    redeemIndex,
    setRedeemIndex,
    lastLeaf,
    payOutMutation,
  }

  return <LotteryContext.Provider value={value}>{children}</LotteryContext.Provider>
}
