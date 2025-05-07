import { useQuery } from '@tanstack/react-query'
import { treeDB } from '@/lib/db/treeDb'

export function useLeaf(index: number) {
  return useQuery({
    queryKey: ['leaf', index],
    queryFn: async () => {
      const leaf = await (treeDB as any).leaves.get(index)

      return leaf
    },
    enabled: index !== undefined,
  })
}
