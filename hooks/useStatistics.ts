import { useQuery } from '@tanstack/react-query'
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer'
import { useChainId } from 'wagmi'
import { useRewardStats } from './useRewardStats'

export interface Statistics {
  baseStats: {
    APR: number | undefined
    APR_from3DaysVol: number

    totalVolume?: number
    calculateVolFromLastDays?: number
    totalVolFromLast3Days?: number

    totalVolUSD?: number
    calculateVolUSDFromLastDays?: number
    totalVolUSDFromLast3Days?: number

    uniquePlayers: number
    lotteryLiquidityBase: number

    foomPrice?: number
    lotteryLiquidityBaseUSD?: number
  }
}

export function useStatistics() {
  const currentIndexer = useCurrentIndexer()
  const chainId = useChainId()
  const rewardStatsQuery = useRewardStats()

  return useQuery<Statistics>({
    queryKey: ['statistics', chainId, rewardStatsQuery.data?.periods?.length],
    queryFn: async () => {
      const res = await currentIndexer.get('/blockchain/statistics')
      const data = res.data as Statistics

      /** @dev patch APR */
      if (rewardStatsQuery.isSuccess && rewardStatsQuery.data?.periods?.length) {
        data.baseStats.APR = rewardStatsQuery.data.periods[rewardStatsQuery.data.periods.length - 1].apr
      } else {
        data.baseStats.APR = undefined
      }
      return data
    },
    staleTime: 30 * 60_000,
  })
}
