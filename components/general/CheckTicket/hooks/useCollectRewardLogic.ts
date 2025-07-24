import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useMutation } from '@tanstack/react-query'
import { decodeAbiParameters, parseUnits, type Address, type Hex } from 'viem'
import { EthLotteryAbi } from '@/abis/eth-lottery'
import { LOTTERY } from '@/lib/utils/constants/addresses'
import { toast } from 'sonner'
import { _error, _log } from '@/lib/utils/ts'
import { getRelayerForChain } from '@/lib/getRelayerForChain'
import { toAddress } from '@/lib/utils'

interface UseCollectRewardLogicProps {
  witness: any
  selectedRelayer: 'main' | 'secondary' | null
  investmentAmount: string
  setRelayerSuccess: (success: string | null) => void
  handleStatus: (status: string) => void
  chain: any
}

export function useCollectRewardLogic({
  witness,
  selectedRelayer,
  investmentAmount,
  setRelayerSuccess,
  handleStatus,
  chain,
}: UseCollectRewardLogicProps) {
  const address = useAccount().address
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const collectManuallyMutation = useMutation({
    mutationFn: async () => {
      if (!walletClient || !publicClient) {
        toast('Please, connect your wallet first!')
        throw new Error('Wallet not connected')
      }
      if (!chain) {
        toast('No chain found, please connect to a network')
        throw new Error('No chain found')
      }
      if (!witness || !witness.raw || !address) {
        throw new Error('Missing witness or address')
      }

      const d = decodeAbiParameters(
        [{ type: 'uint256[2]' }, { type: 'uint256[2][2]' }, { type: 'uint256[2]' }, { type: 'uint256[7]' }],
        witness.encoded
      )
      _log('Decoded witness:', d)

      const dA = d[0] as [bigint, bigint]
      const dB = d[1] as [[bigint, bigint], [bigint, bigint]]
      const dC = d[2] as [bigint, bigint]
      const dData = d[3] as [
        /** root */ bigint,
        /** nullifier */ bigint,
        /** rewardbits */ bigint,
        /** recipient */ bigint,
        /** relayer */ bigint,
        /** fee */ bigint,
        /** refund */ bigint,
      ]

      const _root = dData[0]
      const _nullifier = dData[1]
      const _recipient = toAddress(dData[3])
      const _relayer = toAddress(dData[4])
      const _fee = dData[5]
      const _refund = dData[6]
      const _rewardBits = dData[2]
      /** @dev custom, no-proof value */
      const _invest = parseUnits(investmentAmount, 18)
      const args = [
        /** uint256[2] _pA */ dA,
        /** uint256[2][2] _pB */ dB,
        /** uint256[2] _pC */ dC,
        /** uint256 _root */ _root,
        /** uint256 _nullifierHash */ _nullifier,
        /** address _recipient */ _recipient,
        /** address _relayer */ _relayer,
        /** uint256 _fee */ _fee,
        /** uint256 _refund */ _refund,
        /** uint256 _rewardbits */ _rewardBits,
        /** uint256 _invest */ _invest,
      ]
      _log('Collect args:', args)

      const simulateParams = {
        address: LOTTERY[chain?.id],
        abi: EthLotteryAbi,
        functionName: 'collect',
        args,
        account: address,
      }
      if (_refund && _refund !== 0n) {
        simulateParams['value'] = _refund
      }
      const simulation = await publicClient.simulateContract(simulateParams)
      _log('Simulation result:', simulation)

      const { request } = simulation
      const tx = await walletClient.writeContract(request)
      handleStatus(`Collect tx sent: ${tx}`)

      await publicClient.waitForTransactionReceipt({ hash: tx })
      handleStatus('Reward collected!')

      return { hash: tx }
    },
    onError: error => {
      _error(error)
      _error({ ...error })

      if ((error?.cause as any)?.reason === 'Incorrect refund amount received by the contract') {
        const message = 'This is a losing bet! Nothing to collect.'
        toast(message)
        handleStatus(message)
        return
      }

      /** @dev if gas fee error */
      if ((error?.cause as any)?.cause?.name === 'InsufficientFundsError') {
        toast('Gas fee is insufficient for your transaction, please try again')
      }
      /** @dev if reward already collected */
      if ((error?.cause as any)?.reason === 'Incorrect nullifier') {
        const message = 'This reward was already collected before!'
        toast(message)
        handleStatus(message)
        return
      }
      /** @dev cancelled */
      if ((error as any)?.cause?.cause?.code === 4001) {
        toast('Transaction cancelled')
        handleStatus('Transaction cancelled')
        return
      }

      const message = `Collect failed: ${error?.message || String(error) || (error?.cause as any)?.reason}`
      toast(message)
      handleStatus(error?.message || String(error))
    },
    onSuccess: (data: { hash: Hex }) => {
      setRelayerSuccess('Reward collected successfully! TX: ' + data?.hash)
      toast('Reward collected successfully!')
    },
  })

  const collectViaRelayerMutation = useMutation({
    mutationFn: async ({ chain }: { chain: number }) => {
      if (!witness || !witness.encoded) {
        throw new Error('Missing witness/proof')
      }
      if (!selectedRelayer) {
        throw new Error('No relayer selected')
      }
      if (!chain) {
        throw new Error('No network detected!')
      }

      if (selectedRelayer === 'main') {
        const url = `https://foom.cash/files/${chain === 1 ? 'ethereum' : 'base'}/cgi?receipt=${encodeURIComponent(witness.encoded)}`
        const res = await getRelayerForChain(chain).get(url)
        if (res.status !== 200) {
          throw new Error('Main relayer failed')
        }
        _log('Main relayer response:', res.data)
        return res.data
      } else {
        const res = await getRelayerForChain(chain).post('/collect', {
          proof: witness.encoded,
          invest: investmentAmount || undefined,
        })
        return res.data
      }
    },
    onSuccess: (data: { hash: Hex }) => {
      handleStatus('Relayer request sent!')

      if (selectedRelayer === 'main') {
        toast(`${data}`)
      }

      if (selectedRelayer === 'secondary') {
        setRelayerSuccess('Success, reward collected! TX: ' + data?.hash)
        toast(`Relayer has processed your request! TX: ${data?.hash}`)
      }
    },
    onError: error => {
      _error(error)
      const relayerErrorMessage = (error as any)?.response?.data?.message
      if (relayerErrorMessage) {
        toast(relayerErrorMessage)
        handleStatus(relayerErrorMessage)
        return
      }
      if ((error as any)?.response?.data?.cause?.reason === 'Incorrect refund amount received by the contract') {
        const message = 'This is a losing bet! Nothing to collect.'
        toast(message)
        handleStatus(message)
        return
      }
      if ((error as any)?.response?.data?.cause?.reason?.includes('Incorrect nullifier')) {
        const message = 'This reward was already collected before!'
        toast(message)
        handleStatus(message)
        return
      }
      toast(String(error?.message))
      handleStatus(String(error))
    },
  })

  return {
    collectManuallyMutation,
    collectViaRelayerMutation,
  }
}
