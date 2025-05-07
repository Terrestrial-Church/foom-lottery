import { useQuery } from '@tanstack/react-query'

/**
 * TBD: Accept a single path -> path fetcher with caching into dexiejs
 */
export function useLeaves({ fromBlock = 0n }: { fromBlock?: bigint }) {
  return useQuery({
    queryKey: ['leaves', fromBlock],
    queryFn: async () => {
      // const response = await indexer.get('/lottery/leaves', {
      //   params: {
      //     fromBlock: fromBlock.toString(),
      //   },
      // })

      // const { data } = response.data

      // if (Array.isArray(data)) {
      //   await treeDB.leaves.bulkPut(data)
      // }

      // return response.data

      return []
    },
  })
}
