import React from 'react'
import { formatNumber } from '@/lib/utils/math'
import { _log } from '@/lib/utils/ts'
import { useStatistics } from '@/hooks/useStatistics'
import SpinnerText from '@/components/shared/spinner-text'

const Stats: React.FC = () => {
  const { data: statistics, isLoading, error } = useStatistics()

  const baseStats = statistics?.baseStats

  return (
    <div className="w-full px-4 mb-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 max-w-6xl mx-auto">
        {[
          {
            label: 'Players',
            value: formatNumber(baseStats?.uniquePlayers, false),
          },
          {
            label: 'Liquidity',
            value: `$${formatNumber(Number(baseStats?.lotteryLiquidityBaseUSD), false)}`,
          },
          {
            label: 'APR',
            value: `${baseStats?.APR ? Number(baseStats?.APR).toFixed(2) : '—'}%`,
          },
          {
            label: 'Volume',
            sublabel: '24h',
            value: `$${formatNumber(Number(baseStats?.calculateVolUSDFromLastDays), false)}`,
          },
          {
            label: 'Volume',
            sublabel: '7d',
            value: `$${formatNumber(Number(baseStats?.totalVolUSDFromLast3Days), false)}`,
          },
          {
            label: 'Volume',
            value: `$${formatNumber(Number(baseStats?.totalVolUSD), false)}`,
          },
        ].map(({ label, sublabel, value }, i) => (
          <div
            key={i}
            className="bg-black/40 border border-cyan-500/30 rounded-lg p-3 sm:p-4 flex flex-col items-center text-center backdrop-blur-sm hover:bg-black/30 transition-colors"
          >
            <div className="text-xs sm:text-sm text-cyan-400/90 mb-1 sm:mb-2 relative min-h-[20px] flex flex-row items-center justify-center">
              <span className="">{label}</span>
              {sublabel && (
                <span className="block !text-[10px] sm:text-xs text-neutral-300 mt-1">
                  &nbsp;({sublabel})
                </span>
              )}
            </div>
            <div
              className="text-sm sm:text-base font-semibold text-cyan-200 min-w-0 text-center"
              style={{
                fontSize: `${Math.max(0.6, 1.33 - String(value).length * 0.04)}rem`,
                width: '100%',
                display: 'block',
                whiteSpace: 'nowrap',
              }}
            >
              {isLoading ? <SpinnerText loader="..." /> : value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Stats
