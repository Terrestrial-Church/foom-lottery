import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import { getIndexerForChain } from '@/lib/getIndexerForChain'

export type RewardStatsPeriod = {
  period: string
  bets: number
  shares: number
  apy: number
  apr: number
}

export type RewardStats = {
  foomBalanceM: number
  totalTickets: number
  periods: RewardStatsPeriod[]
  periodInfo?: {
    blocksLeft: number
    hours: number
    minutes: number
  }
}

export function useRewardStats() {
  const chain = useChainId()
  return useQuery({
    queryKey: ['rewardStats', chain],
    queryFn: async () => {
      const res = await getIndexerForChain(chain).get('/lottery/reward-stats')
      return res.data
    },
    staleTime: 60_000,
  })
}
