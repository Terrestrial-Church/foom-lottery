import { useChainId } from 'wagmi'
import { getRelayerForChain } from '@/lib/getRelayerForChain'

export const useCurrentRelayer = () => {
  const currentChainId = useChainId()

  return getRelayerForChain(currentChainId)
}
