import { getIndexerForChain } from '@/lib/getIndexerForChain'
import indexer from '@/lib/indexer'

export const fetchLastLeaf = async (chain: number): Promise<
  [bigint | number, bigint | number, bigint | number, bigint | number]
> => {
  const response = await getIndexerForChain(chain).get('/lottery/last-leaf')

  if (response.status !== 200) {
    throw new Error(`Failed to fetch last leaf: ${response.statusText}`)
  }

  return response.data
}
