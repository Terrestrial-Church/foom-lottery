import indexer from '@/lib/indexer'
import { _log } from '@/lib/utils/ts'
import { base, mainnet } from 'viem/chains'

/**
 * Returns the correct indexer instance for a given chainId.
 * Falls back to base if chainId is not supported.
 */
export function getIndexerForChain(chainId: number): typeof indexer.base | typeof indexer.eth {
  if (chainId === mainnet.id) {
    return indexer.eth
  }
  if (chainId === base.id) {
    return indexer.base
  }
  return indexer.base
}
