import { useQuery } from '@tanstack/react-query'
import { useAccount, useChainId } from 'wagmi'
import { readContract } from '@wagmi/core'
import { wagmiAdapter } from '@/providers/app-kit'
import { EthLotteryAbi } from '@/abis/eth-lottery'
import { LOTTERY } from '@/lib/utils/constants/addresses'
import { ContractFunctionReturnType } from 'viem'
import { useLocalStorage } from 'usehooks-ts'
import { DEINVEST_LS_KEY, type DeinvestAction } from '@/hooks/useDeinvest'

type WalletBalanceResult = ContractFunctionReturnType<typeof EthLotteryAbi, 'view', 'walletBalanceOf'>

export function useLotteryUserWalletBalance() {
  const account = useAccount()
  const chainId = useChainId()
  const [deinvests] = useLocalStorage<DeinvestAction[]>(DEINVEST_LS_KEY, [])

  return useQuery({
    queryKey: ['walletBalance', account.address, chainId, deinvests?.length /** @dev refetch on de-invest action */],
    queryFn: async () =>
      readContract(wagmiAdapter.wagmiConfig, {
        address: LOTTERY[chainId],
        abi: EthLotteryAbi,
        functionName: 'walletBalanceOf',
        args: [account.address],
      }),
    enabled: !!account.address && !!chainId,
  }) as { data: WalletBalanceResult | undefined; isLoading: boolean; isFetching: boolean }
}
