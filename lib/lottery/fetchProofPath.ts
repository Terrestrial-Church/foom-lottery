import { getIndexerForChain } from '@/lib/getIndexerForChain'

export const fetchProofPath = async (chain: number, index: number, nextIndex?: number): Promise<bigint[]> => {
  const response = await getIndexerForChain(chain).get('/lottery/proof-path', {
    params: {
      index,
      nextIndex: nextIndex || undefined,
    },
  })

  if (response.status !== 200) {
    throw new Error(`Failed to fetch proof path: ${response.statusText}`)
  }

  return response.data
}
