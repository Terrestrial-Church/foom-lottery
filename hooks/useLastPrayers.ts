import { useQuery } from '@tanstack/react-query'
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer'
import { useChainId } from 'wagmi'

export function useLastPrayers() {
  const currentIndexer = useCurrentIndexer()
  const currentChainId = useChainId()

  return useQuery({
    queryKey: ['lastPrayers', currentChainId],
    queryFn: async () => {
      const res = await currentIndexer.get('/lottery/prayers')
      return res.data
    },
    staleTime: 4_000,
  })
}
