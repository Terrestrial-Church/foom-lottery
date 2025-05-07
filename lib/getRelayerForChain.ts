import relayer from '@/lib/relayer'
import { base, mainnet } from 'viem/chains'

/**
 * Returns the correct relayer instance for a given chainId.
 * Falls back to base if chainId is not supported.
 */
export function getRelayerForChain(chainId: number): typeof relayer.base | typeof relayer.eth {
  if (chainId === mainnet.id) {
    return relayer.eth
  }
  if (chainId === base.id) {
    return relayer.base
  }
  return relayer.base
}
