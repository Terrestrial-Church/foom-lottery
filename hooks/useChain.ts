import { useAccount } from 'wagmi'
import { chains } from '@/lib/utils/constants/addresses'

/**
 * Returns the current chain object from the chains array based on the connected chainId.
 */
export function useChain() {
  const { chainId } = useAccount()
  const chain = chains.find(chain => chain.id === chainId)
  return chain
}
