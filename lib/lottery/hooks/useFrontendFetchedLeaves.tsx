import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { parseAbiItem, decodeEventLog } from 'viem'
// import { mimcsponge3 } from '@/lib/lottery/utils/mimcsponge'
import { EthLotteryAbi } from '@/abis/eth-lottery'
import { _log } from '@/lib/utils/ts'
import { LOTTERY } from '@/lib/utils/constants/addresses'
import { useChain } from '@/hooks/useChain'

const LOG_BET_IN_EVENT = parseAbiItem('event LogBetIn(uint256 index, uint256 newHash)')
const LOG_UPDATE_EVENT = parseAbiItem('event LogUpdate(uint256 index, uint256 newRand, uint256 newRoot)')

export function useFrontendFetchedLeaves({ fromBlock = 0n }: { fromBlock?: bigint }) {
  const publicClient = usePublicClient()
  const chain = useChain()

  return useQuery({
    queryKey: ['leaves', fromBlock],
    queryFn: async () => {
      if (!publicClient) {
        throw new Error('No public client')
      }

      if (!chain) {
        throw new Error('No chain found')
      }

      const [rawBetIns, rawUpdates] = await Promise.all([
        publicClient.getLogs({
          address: LOTTERY[chain.id],
          event: LOG_BET_IN_EVENT,
          fromBlock,
          toBlock: 'latest',
        }),
        publicClient.getLogs({
          address: LOTTERY[chain.id],
          event: LOG_UPDATE_EVENT,
          fromBlock,
          toBlock: 'latest',
        }),
      ])

      const betIns = rawBetIns.map(log =>
        decodeEventLog({
          abi: EthLotteryAbi,
          data: log.data,
          topics: log.topics,
        })
      ) as any

      const updates = rawUpdates.map(log =>
        decodeEventLog({
          abi: EthLotteryAbi,
          data: log.data,
          topics: log.topics,
        })
      ) as any

      _log('Decoded BetIns:', betIns)
      _log('Decoded Updates:', updates)

      betIns.sort((a: any, b: any) => (a.args.index as bigint) - (b.args.index as bigint))
      updates.sort((a: any, b: any) => (a.args.index as bigint) - (b.args.index as bigint))

      const leaves: bigint[] = []
      let lastIndex: bigint = -1n
      let lastRand: bigint | undefined
      let lastHash: bigint | undefined

      for (const bet of betIns) {
        const index = bet.args.index as bigint
        const hash = bet.args.newHash as bigint

        const update = updates.find((u: any) => (u.args.index as bigint) >= index)
        if (!update) continue

        const rand = update.args.newRand as bigint
        // TODO: Fix, mimic3sponge was here
        const leaf = null as any

        leaves.push(leaf)
        lastIndex = index
        lastRand = rand
        lastHash = hash
      }

      return {
        index: lastIndex,
        newRand: lastRand,
        newHash: lastHash,
        data: leaves,
        betLogs: betIns,
      }
    },
  })
}
