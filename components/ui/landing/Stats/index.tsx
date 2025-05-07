import { useRewardStats } from '@/hooks/useRewardStats'
import Stat from './Stat'
import { useFoomPrice } from '@/hooks/useFoomPrice'
import { safeToBigint } from '@/lib/utils/ts'
import { formatUnits } from 'viem'
import SpinnerText from '@/components/shared/spinner-text'
import React from 'react'
import { useRoundEndCountdown } from '@/components/general/YourTickets/useRoundEndCountdown'

export interface IStatParams {
  title: string | React.ReactNode
  subtitle: string
  icon: string
  link?: string
}

export const Stats = () => {
  const rewardStats = useRewardStats()
  const foomPriceQuery = useFoomPrice()
  const foomPriceBigint = foomPriceQuery.data ? safeToBigint(foomPriceQuery.data) : undefined
  const { isLoading: isCountdownLoading, isAboutNow, hours, minutes, secondsLeft } = useRoundEndCountdown()

  /** @dev FOOM amount */
  const grandPrize = 4_260_864_000_000n
  const grandPrizeUsd = foomPriceBigint
    ? formatUnits(grandPrize * foomPriceBigint.value, foomPriceBigint.decimals)
    : undefined

  const statsData: IStatParams[] = [
    {
      title: grandPrizeUsd ? (
        `$${Number(grandPrizeUsd).toLocaleString()}`
      ) : foomPriceQuery.isLoading ? (
        <SpinnerText />
      ) : (
        '…'
      ),
      subtitle: 'Current Grand Prize',
      icon: '/icons/landing/ether.svg',
    },
    {
      title: isCountdownLoading ? (
        <SpinnerText />
      ) : isAboutNow ? (
        'Anytime now!'
      ) : hours > 0 ? (
        `${hours}h ${minutes}m`
      ) : (
        `${minutes}m`
      ),
      subtitle: 'Time Until Next Draw',
      icon: '/icons/landing/clock.svg',
    },
    {
      title:
        (rewardStats.data?.totalTickets ? Number(rewardStats.data?.totalTickets).toLocaleString() : '') ||
        (rewardStats.isLoading ? <SpinnerText /> : '0'),
      subtitle: 'All Tickets',
      icon: '/icons/landing/ticket.svg',
    },
    {
      title: rewardStats.isLoading ? (
        <SpinnerText />
      ) : rewardStats.data?.periods?.length ? (
        `${[...rewardStats.data.periods].reverse().find(p => p.apr)?.apr}%`
      ) : (
        '—'
      ),
      subtitle: 'Current APR',
      icon: '/icons/landing/cash.svg',
      link: '/invest',
    },
  ]

  return (
    <div className="flex flex-wrap justify-center items-stretch gap-4 sm:gap-6 max-w-7xl mx-auto">
      {statsData.map((stat, index) => (
        <div key={index} className="flex-shrink-0 w-full sm:w-auto min-w-[280px] max-w-[320px]">
          <Stat
            {...stat}
          />
        </div>
      ))}
    </div>
  )
}
