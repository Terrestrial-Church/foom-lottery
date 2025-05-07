import { useQuery } from '@tanstack/react-query'
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer'
import { _log } from '@/lib/utils/ts'
import { useChainId } from 'wagmi'

export function useLotteryPlaysQuery({ page, limit, filter }) {
  const currentIndexer = useCurrentIndexer()
  const currentChainId = useChainId()

  return useQuery({
    queryKey: ['lotteryPlays', page, limit, filter, currentChainId],
    queryFn: async () => {
      const res = await currentIndexer.get('/lottery/plays', {
        params: { page, limit, filter },
      })
      return res.data.data
    },
    placeholderData: prev => prev,
    refetchInterval: 1000 * 60,
    staleTime: 1000 * 5,
  })
}
