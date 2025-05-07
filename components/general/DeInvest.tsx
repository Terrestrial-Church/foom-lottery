import { useEffect, useState } from 'react'
import { DEINVEST_LS_KEY, useDeinvest, type DeinvestAction } from '@/hooks/useDeinvest'
import { useLottery } from '@/providers/LotteryProvider'
import SpinnerIcon from '@/components/ui/icons/SpinnerIcon'
import DeinvestIcon from '@/components/ui/icons/DeinvestIcon'
import { useAccount, useReadContract } from 'wagmi'
import { toast } from 'sonner'
import { EthLotteryAbi } from '@/abis/eth-lottery'
import { LOTTERY } from '@/lib/utils/constants/addresses'
import { useChainId } from 'wagmi'
import { formatEther, parseUnits, type AbiFunction } from 'viem'
import { _log } from '@/lib/utils/ts'
import { ContractFunctionReturnType } from 'viem'
import { RoundSpinner } from '@/components/ui/RoundSpinner'
import { useFoomPrice } from '@/hooks/useFoomPrice'
import { formatNumber } from '@/lib/utils/math'
import { useLocalStorage } from 'usehooks-ts'
import { useLotteryUserWalletBalance } from '@/hooks/useLotteryUserWalletBalance'

type WalletBalanceResult = ContractFunctionReturnType<typeof EthLotteryAbi, 'view', 'walletBalanceOf'>

export default function DeInvest() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const { addDeinvest } = useDeinvest()
  const { payOutMutation } = useLottery()
  const account = useAccount()
  const chainId = useChainId()
  const foomPrice = useFoomPrice()
  const [deinvests] = useLocalStorage<DeinvestAction[]>(DEINVEST_LS_KEY, [])

  const userInvestmentsQuery = useLotteryUserWalletBalance()
  const walletBalance: WalletBalanceResult | undefined = userInvestmentsQuery.data
  const isLoadingBalance = userInvestmentsQuery.isLoading || userInvestmentsQuery.isFetching

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || isNaN(Number(amount))) {
      return
    }

    if (!account.address) {
      toast('Please connect your wallet first to collect your investments.')
      return
    }

    setLoading(true)
    try {
      await payOutMutation.mutateAsync({ amount: parseUnits(amount, 18) })
      addDeinvest(BigInt(amount).toString())
    } catch (error: any) {
      if (error?.cause?.cause?.code === 4001) {
        toast.info('Cancelled')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-neutral-900/95 to-neutral-800/95 backdrop-blur-sm border border-cyan-400/30 rounded-2xl shadow-2xl p-8 mt-12 mb-12 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-400/5 to-blue-500/5 pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-cyan-400/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>

        <form
          onSubmit={handleSubmit}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <div className="text-center mb-2">
            <h3 className="text-xl font-bold text-cyan-300 mb-1">De-invest FOOM</h3>
            <p className="text-xs text-neutral-400">Withdraw your invested tokens</p>
          </div>

          {/* Total Investment Display */}
          <div className="w-full bg-neutral-800/60 border border-cyan-400/20 rounded-lg p-4 mb-2">
            <div className="text-center">
              <p className="text-xs text-neutral-400 mb-1">Your Total Investment (+&nbsp;Dividends)</p>
              <p className="text-lg font-bold text-cyan-300">
                {isLoadingBalance ? (
                  <span className="animate-pulse">Loading...</span>
                ) : walletBalance ? (
                  `${parseFloat(formatEther(walletBalance as bigint)).toLocaleString()} FOOM`
                ) : (
                  '0 FOOM'
                )}
              </p>
              {walletBalance && foomPrice.data && (
                <p className="text-sm">
                  ~${formatNumber(parseFloat(formatEther(walletBalance as bigint)) * foomPrice.data)}
                </p>
              )}
            </div>
          </div>

          <div className="w-full space-y-2">
            <label
              htmlFor="deinvest-amount"
              className="block text-sm font-semibold text-cyan-300 tracking-wide"
            >
              Amount (FOOM)
            </label>
            <div className="relative">
              <input
                id="deinvest-amount"
                type="number"
                min="0"
                step="any"
                max={walletBalance ? formatEther(walletBalance as bigint) : undefined}
                className="w-full rounded-xl border-2 border-cyan-400/50 bg-neutral-800/80 text-cyan-100 px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-300 text-lg placeholder:text-cyan-400/60 transition-all duration-300 shadow-inner backdrop-blur-sm"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/5 to-blue-500/5 pointer-events-none"></div>
            </div>

            {/* Percentage Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[25, 50, 75, 100].map(percentage => {
                const isActive =
                  walletBalance &&
                  amount &&
                  Math.abs(parseFloat(amount) - (parseFloat(formatEther(walletBalance as bigint)) * percentage) / 100) <
                    0.0001

                return (
                  <button
                    key={percentage}
                    type="button"
                    onClick={() => {
                      if (walletBalance && typeof walletBalance === 'bigint') {
                        const maxAmount = parseFloat(formatEther(walletBalance))
                        const targetAmount = (maxAmount * percentage) / 100
                        setAmount(targetAmount.toString())
                      }
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all duration-200 disabled:opacity-50 ${
                      isActive
                        ? 'bg-cyan-400 text-black border-cyan-400'
                        : 'bg-neutral-800/80 border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400'
                    }`}
                    disabled={!walletBalance || isLoadingBalance}
                  >
                    {percentage}%
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] group"
            disabled={loading}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {loading ? (
              <span className="relative flex items-center justify-center gap-3">
                <RoundSpinner />
                <span className="text-lg">Processing...</span>
              </span>
            ) : (
              <span className="relative text-lg flex items-center justify-center gap-2">
                <DeinvestIcon />
                Pay Out
              </span>
            )}
          </button>

          {/* Important Notice */}
          <div className="w-full text-center">
            <p className="text-xs text-yellow-400/80 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
              You can only <em>pay out</em> once per dividend period!
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
