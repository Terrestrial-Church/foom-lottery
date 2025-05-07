import { useChainId } from 'wagmi'
import { getIndexerForChain } from '@/lib/getIndexerForChain'

export const useCurrentIndexer = () => {
  const currentChainId = useChainId()

  return getIndexerForChain(currentChainId)
}
