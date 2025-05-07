import { EthLotteryAbi } from '@/abis/eth-lottery'
import { useChain } from '@/hooks/useChain'
import { LOTTERY } from '@/lib/utils/constants/addresses'
import { PublicClient } from 'viem'

export async function getLotteryStatus(publicClient: PublicClient): Promise<[bigint, bigint, bigint, bigint]> {
  const chain = useChain()

  if (!chain) {
    throw new Error('No chain found')
  }

  return (await publicClient.readContract({
    address: LOTTERY[chain.id],
    abi: EthLotteryAbi,
    functionName: 'getStatus',
  })) as [bigint, bigint, bigint, bigint]
}
