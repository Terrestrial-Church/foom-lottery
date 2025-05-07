import { useFoomPrice } from '@/hooks/useFoomPrice'
import { useRewardStats } from '@/hooks/useRewardStats'
import { formatNumber } from '../../lib/utils/math'
import { _log, safeToBigint } from '@/lib/utils/ts'
import { formatUnits, formatEther } from 'viem'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { base } from 'viem/chains'
import DeInvest from '@/components/general/DeInvest'
import UserStatCard from '@/components/general/UserStatCard'
import { useLotteryUserWalletBalance } from '@/hooks/useLotteryUserWalletBalance'
import { ContractFunctionReturnType } from 'viem'
import { EthLotteryAbi } from '@/abis/eth-lottery'
import SpinnerText from '@/components/shared/spinner-text'

const betMin = 1_000_000
const INVESTORS_FEE = 0.04

export default function InvestPage() {
  const foomPriceQuery = useFoomPrice()
  const foomPriceBigint = foomPriceQuery.data ? safeToBigint(foomPriceQuery.data) : undefined
  const rewardStats = useRewardStats()

  const chainId = useChainId()
  const account = useAccount()

  const userInvestmentsQuery = useLotteryUserWalletBalance()
  const walletBalance: ContractFunctionReturnType<typeof EthLotteryAbi, 'view', 'walletBalanceOf'> | undefined =
    userInvestmentsQuery.data
  const isLoadingBalance = userInvestmentsQuery.isLoading || userInvestmentsQuery.isFetching

  const userFoomBalance =
    walletBalance && foomPriceQuery.data ? parseFloat(formatEther(walletBalance as bigint)) * foomPriceQuery.data : 0

  const scrollRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const [atEnd, setAtEnd] = useState(true)

  const [periodCountdown, setPeriodCountdown] = useState<{
    hours: number
    minutes: number
    seconds: number
    blocksLeft: number
  } | null>(null)

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) {
      return
    }

    const check = () => {
      setAtEnd(element.scrollLeft + element.offsetWidth >= element.scrollWidth - 1)
    }
    const raf = requestAnimationFrame(check)

    element.addEventListener('scroll', check)
    window.addEventListener('resize', check)
    return () => {
      cancelAnimationFrame(raf)
      element.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  const [investorDailyRevenue, setInvestorDailyRevenue] = useState(0)
  const [investorWeeklyRevenue, setInvestorWeeklyRevenue] = useState(0)
  const [investorMonthlyRevenue, setInvestorMonthlyRevenue] = useState(0)
  const [investorYearlyRevenue, setInvestorYearlyRevenue] = useState(0)
  const [investorHourlyRevenue, setInvestorHourlyRevenue] = useState(0)
  const [userSharePercentage, setUserSharePercentage] = useState(0)
  const [poolInUSD, setPoolInUSD] = useState(0)
  const [visiblePeriods, setVisiblePeriods] = useState(15)

  const handleLoadMore = () => {
    setVisiblePeriods(prev => prev + 10)
    setTimeout(() => {
      if (tableRef.current) {
        const tableTop = tableRef.current.getBoundingClientRect().top + window.pageYOffset
        const offset = window.innerHeight * 0.33
        window.scrollTo({
          top: tableTop - offset,
          behavior: 'smooth',
        })
      }
    }, 100)
  }

  const calculateUserRevenue = (userBalance: number, totalPoolUSD: number, lastPeriodBetsUSD: number) => {
    if (userBalance <= 0 || totalPoolUSD <= 0) {
      return {
        userShare: 0,
        hourly: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
      }
    }

    const userShare = userBalance / totalPoolUSD
    const dailyRevenue = ((lastPeriodBetsUSD * INVESTORS_FEE) / 56) * 24
    const investorDailyRevenue = dailyRevenue * userShare

    return {
      userShare,
      hourly: investorDailyRevenue / 24,
      daily: investorDailyRevenue,
      weekly: investorDailyRevenue * 7,
      monthly: investorDailyRevenue * 7 * 4,
      yearly: investorDailyRevenue * 365,
    }
  }

  /** @dev Invest-info-updating effect */
  useEffect(() => {
    if (!(rewardStats.data?.periodInfo && foomPriceBigint?.value)) {
      return
    }

    const lastPeriod = rewardStats.data.periods[rewardStats.data.periods.length - 1]
    const totalShares = lastPeriod.shares
    const lastPeriodBets = lastPeriod.bets
    const lastPeriodBetsinUSD = Number(
      formatUnits(BigInt(lastPeriodBets) * BigInt(betMin) * foomPriceBigint.value, foomPriceBigint.decimals)
    )
    const totalSharesinUSD = Number(
      formatUnits(BigInt(totalShares) * BigInt(betMin) * foomPriceBigint.value, foomPriceBigint.decimals)
    )

    setPoolInUSD(totalSharesinUSD)

    const revenue = calculateUserRevenue(userFoomBalance, totalSharesinUSD, lastPeriodBetsinUSD)

    setUserSharePercentage(revenue.userShare)
    setInvestorHourlyRevenue(revenue.hourly)
    setInvestorDailyRevenue(revenue.daily)
    setInvestorWeeklyRevenue(revenue.weekly)
    setInvestorMonthlyRevenue(revenue.monthly)
    setInvestorYearlyRevenue(revenue.yearly)

    if (userFoomBalance > 0) {
      _log({
        lastPeriod,
        totalShares,
        userFoomBalance,
        totalSharesinUSD,
        userSharePercentageString: `${(revenue.userShare * 100).toFixed(2)}%`,
        dailyRevenue: ((lastPeriodBetsinUSD * INVESTORS_FEE) / 56) * 24,
        revenue,
      })
    }
  }, [
    rewardStats.isFetching,
    rewardStats.isLoading,
    !!rewardStats.data,
    userFoomBalance,
    foomPriceBigint,
    account.address,
  ])

  /** @dev Time-updating effect */
  useEffect(() => {
    if (!rewardStats.data?.periodInfo) {
      return
    }
    let { blocksLeft } = rewardStats.data.periodInfo

    let blockTime = 12
    if (chainId === base.id) {
      blockTime = 2
    }

    let totalSeconds = blocksLeft * blockTime
    const getTimeParts = (secs: number) => {
      const h = Math.floor(secs / 3600)
      const m = Math.floor((secs % 3600) / 60)
      const s = secs % 60
      return { hours: h, minutes: m, seconds: s }
    }

    setPeriodCountdown({ ...getTimeParts(totalSeconds), blocksLeft })
    if (totalSeconds <= 0) {
      return
    }

    const interval = setInterval(() => {
      totalSeconds -= 1
      if (totalSeconds < 0) {
        clearInterval(interval)
        setPeriodCountdown({ hours: 0, minutes: 0, seconds: 0, blocksLeft: 0 })
        return
      }
      const { hours, minutes, seconds } = getTimeParts(totalSeconds)
      const newBlocksLeft = Math.ceil(totalSeconds / blockTime)

      setPeriodCountdown({ hours, minutes, seconds, blocksLeft: newBlocksLeft })
    }, 1000)

    return () => clearInterval(interval)
  }, [rewardStats.isLoading, !!rewardStats.data, rewardStats.isFetching, chainId])

  const cards = [
    {
      label: 'Prize Pool (USD)',
      value: poolInUSD ? `$${formatNumber(poolInUSD, true)}` : '…',
      isMoney: false,
      isConnected: true,
      isLoading: false,
    },
    {
      label: 'All Tickets',
      value: formatNumber(rewardStats.data?.totalTickets ?? 0, false),
      isMoney: false,
      isConnected: true,
      isLoading: rewardStats.isLoading,
    },
    {
      label: 'Current APR',
      value: rewardStats.data?.periods?.length
        ? `${[...rewardStats.data.periods].reverse().find(p => p.apr)?.apr}%`
        : '—',
      isPercent: false,
      isConnected: true,
      isLoading: rewardStats.isLoading,
    },
    {
      label: 'Your Investment',
      value: formatNumber(userFoomBalance, true),
      isMoney: true,
      isConnected: !!account.address,
      isLoading: rewardStats.isLoading || isLoadingBalance,
    },
    {
      label: 'Your share (%)',
      value: userFoomBalance > 0 ? formatNumber(userSharePercentage * 100, true) : 0,
      isPercent: true,
      isConnected: !!account.address,
      isLoading: rewardStats.isLoading || isLoadingBalance,
    },
    {
      label: 'Daily Revenue',
      value: formatNumber(investorDailyRevenue, true),
      isMoney: true,
      isConnected: !!account.address,
      isLoading: rewardStats.isLoading || isLoadingBalance,
    },
    {
      label: 'Weekly Revenue',
      value: formatNumber(investorWeeklyRevenue, true),
      isMoney: true,
      isConnected: !!account.address,
      isLoading: rewardStats.isLoading || isLoadingBalance,
    },
    {
      label: 'Monthly Revenue',
      value: formatNumber(investorMonthlyRevenue, true),
      isMoney: true,
      isConnected: !!account.address,
      isLoading: rewardStats.isLoading || isLoadingBalance,
    },
    {
      label: 'Yearly Revenue',
      value: formatNumber(investorYearlyRevenue, true),
      isMoney: true,
      isConnected: !!account.address,
      isLoading: rewardStats.isLoading || isLoadingBalance,
    },
  ]

  return (
    <div className="text-white min-h-screen">
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center pb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
              <span className="text-cyan-400">FOOM</span> APY
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto">
              FOOM Lottery investor stats: see live lottery's FOOM balance, total tickets, and APY history below. Track
              how rewards and participation evolve over time.
            </p>
          </div>
          {/* Reward Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {cards.map(card => (
              <UserStatCard
                key={card.label}
                {...card}
              />
            ))}
          </div>

          {/* Period End Time Section */}
          <div className="mb-6 text-center text-cyan-200 text-sm">
            {rewardStats.isLoading ? (
              'Loading period info…'
            ) : rewardStats.data?.periodInfo ? (
              <div className="flex flex-col">
                <span>
                  Latest period ends in {periodCountdown?.hours ?? 0}h {periodCountdown?.minutes ?? 0}m{' '}
                  {periodCountdown?.seconds !== undefined ? periodCountdown.seconds.toString().padStart(2, '0') : '00'}s
                  ({periodCountdown?.blocksLeft ?? rewardStats.data.periodInfo.blocksLeft} blocks left)
                </span>
                <span>
                  {periodCountdown?.blocksLeft !== undefined && periodCountdown.blocksLeft < 0
                    ? '(period is late)'
                    : ''}
                </span>
              </div>
            ) : null}
          </div>

          {/* Reward Periods Table */}
          <div
            className="w-full mb-12"
            ref={tableRef}
          >
            <div className="overflow-x-auto rounded-lg border border-neutral-800">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-neutral-900/80 text-cyan-400">
                  <tr>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Period</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Bets (USD)</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Revenue 4% (USD)</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Shares (USD)</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">APR</th>
                  </tr>
                </thead>
                <tbody>
                  {rewardStats.isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-4"
                      >
                        Loading…
                      </td>
                    </tr>
                  ) : rewardStats.data?.periods?.length ? (
                    rewardStats.data.periods.slice(-visiblePeriods).map((p, i) => (
                      <tr
                        key={p.period}
                        className="even:bg-neutral-900/40"
                      >
                        <td className="px-3 py-1 text-right">{p.period}</td>
                        <td className="px-3 py-1 text-right">
                          {foomPriceBigint
                            ? `$${formatNumber(Number(formatUnits(BigInt(p.bets) * BigInt(betMin) * foomPriceBigint.value, foomPriceBigint.decimals)))}`
                            : '—'}
                        </td>
                        <td className="px-3 py-1 text-right">
                          {foomPriceBigint
                            ? `$${formatNumber(Number(formatUnits(BigInt(p.bets) * BigInt(betMin) * foomPriceBigint.value, foomPriceBigint.decimals)) * INVESTORS_FEE)}`
                            : '—'}
                        </td>
                        <td className="px-3 py-1 text-right">
                          {foomPriceBigint
                            ? `$${formatNumber(Number(formatUnits(BigInt(p.shares) * BigInt(betMin) * foomPriceBigint.value, foomPriceBigint.decimals)))}`
                            : '—'}
                        </td>
                        <td className="px-3 py-1 text-right">
                          <span className="inline-block font-bold text-green-300 rounded py-0.5 shadow-sm">
                            {p.apr !== undefined && p.apr !== null ? `${p.apr}%` : 'Huge!'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-4"
                      >
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {rewardStats.data?.periods?.length && visiblePeriods < rewardStats.data.periods.length && (
              <div className="text-center mt-4">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  See more ({rewardStats.data.periods.length - visiblePeriods} remaining)
                </button>
              </div>
            )}
          </div>

          <DeInvest />

          {/* Footer quote */}
          <div className="mt-16 text-center">
            <p className="text-lg italic">“Power up. Play smart. Win big.”</p>
          </div>
        </div>
      </main>
    </div>
  )
}
