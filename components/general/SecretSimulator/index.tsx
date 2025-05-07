import { getTicketPrice } from '@/components/general/YourTickets/utils/formatters'
import { useFoomPrice } from '@/hooks/useFoomPrice'
import { fetchLastLeaf } from '@/lib/lottery/fetchLastLeaf'
import { secretLuck } from '@/lib/lottery/secretLuck'
import { isDevelopment } from '@/lib/utils/environment'
import { formatNumber } from '@/lib/utils/math'
import { _log } from '@/lib/utils/ts'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Hex } from 'viem'
import { useChainId } from 'wagmi'

interface SecretSimulatorProps {
  secret?: Hex
  onSecretValidated?: (secret: Hex) => void
}

interface SimulationStat {
  power: number
  cost: number
  reward: number
  profit: number
  netProfit: number
  luck: number
}

const SecretSimulator: React.FC<SecretSimulatorProps> = ({ secret, onSecretValidated }) => {
  const [simulationStats, setSimulationStats] = useState<SimulationStat[]>([])
  const [loading, setLoading] = useState(false)
  const [nextIndex, setNextIndex] = useState<number | null>(null)
  const [numRand, setNumRand] = useState<number | null>()
  const [lastSimNumRand, setLastSimNumRand] = useState<number | null>(null)
  const [showCheckAgain, setShowCheckAgain] = useState(false)
  const [showMask, setShowMask] = useState(false)

  const DEFAULT_NUM_RAND = 30
  const { data: foomPrice, isLoading: foomPriceLoading } = useFoomPrice()
  const foomPrice_: number | undefined = foomPrice
  const chainId = useChainId()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchIndexFromLeaf() {
      try {
        const lastLeaf = await fetchLastLeaf(chainId)
        const nextIndex = Number(lastLeaf[0])
        setNextIndex(nextIndex)
      } catch (e) {
        setNextIndex(0)
      }
    }
    fetchIndexFromLeaf()
  }, [chainId])

  const handleCheckLuck = async (secret?: Hex) => {
    if (!secret || nextIndex === null) {
      return
    }

    _log('checking', secret)

    if (secret.length !== 64) {
      toast('Your Secret is invalid! (Use a 64-char 0x-prefixed hex)')
      return
    }

    setLoading(true)
    try {
      const wins = await secretLuck(chainId, secret, nextIndex, numRand || DEFAULT_NUM_RAND)
      const bets = wins[23]
      const stats: SimulationStat[] = []
      const price = isDevelopment() ? 1 : typeof foomPrice === 'number' ? foomPrice : undefined

      for (let i = 0; i <= 21; i++) {
        const costFoom = bets * (2 + 2 ** i) * 1_000_000 /** @dev 1 million FOOMs */
        const rewardFoom = wins[i] * 1_000_000 /** @dev 1 million FOOMs */
        const profitFoom = rewardFoom - costFoom
        const luck = costFoom > 0 ? (rewardFoom * 100) / costFoom : 0
        const netProfitFoom = rewardFoom * 0.96 - costFoom

        const cost = price ? costFoom * price : NaN
        const reward = price ? rewardFoom * price : NaN
        const profit = price ? profitFoom * price : NaN
        const netProfit = price ? netProfitFoom * price : NaN

        stats.push({
          power: i,
          cost,
          reward,
          profit,
          netProfit,
          luck,
        })
      }

      console.table(stats)
      setSimulationStats(stats)
      setLastSimNumRand(numRand ?? DEFAULT_NUM_RAND)
      setShowCheckAgain(false)

      if (onSecretValidated) {
        onSecretValidated(secret)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatUsdCompact = (value?: number | null): string | undefined => {
    if (typeof value !== 'number' || isNaN(value)) return undefined
    if (Math.abs(value) < 1000) {
      return value.toFixed(2)
    }
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value)
  }

  useEffect(() => {
    function checkMask() {
      const el = scrollRef.current
      if (!el) return
      setShowMask(el.scrollWidth > el.clientWidth && el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
    }
    checkMask()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkMask)
    }
    window.addEventListener('resize', checkMask)
    return () => {
      if (el) el.removeEventListener('scroll', checkMask)
      window.removeEventListener('resize', checkMask)
    }
  }, [simulationStats.length])

  useEffect(() => {
    if (lastSimNumRand === null || (numRand ?? DEFAULT_NUM_RAND) === lastSimNumRand) {
      return
    }
    setShowCheckAgain(true)
  }, [numRand, lastSimNumRand])

  useEffect(() => {
    if (
      !(
        secret &&
        nextIndex !== null &&
        /^0x[0-9a-fA-F]{62}$/.test(secret) &&
        !foomPriceLoading &&
        (isDevelopment() || typeof foomPrice === 'number')
      )
    ) {
      return
    }

    handleCheckLuck(secret as Hex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret, nextIndex, foomPrice, foomPriceLoading])

  return (
    <div className="overflow-x-auto mt-6">
      <h2 className="text-[20px] leading-[140%] font-bold text-white mt-6 mb-2 flex items-center justify-between flex-wrap gap-2">
        2# Check the luck of the secret!{' '}
        <span className="text-white text-sm whitespace-nowrap inline-flex flex-grow justify-end">
          [{simulationStats.length > 0 ? (lastSimNumRand ?? DEFAULT_NUM_RAND) : DEFAULT_NUM_RAND} draws]
        </span>
      </h2>
      <div
        className="w-full overflow-x-auto"
        ref={scrollRef}
        style={
          showMask
            ? {
                WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
                maskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
              }
            : {}
        }
      >
        <table className="w-full border border-neutral-800 text-sm max-sm:text-xs text-white">
          <thead className="bg-neutral-900/70 text-cyan-400">
            <tr>
              <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">PRICE (~)</th>
              <th className="border border-neutral-800 px-3 py-2 text-right font-bold w-full whitespace-nowrap">
                LUCK %
              </th>
              <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">COST (~$)</th>
              <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">REWARD (~$)</th>
              <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">PROFIT (~$)</th>
              <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">NET PROFIT (~$)</th>
            </tr>
          </thead>
          <tbody>
            {simulationStats.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: 'center',
                    height: '120px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2em',
                    padding: 0,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background: 'rgba(0, 0, 0, 0.3)',
                      fontSize: '18px',
                    }}
                  >
                    Simulate to run tests.
                  </div>
                </td>
              </tr>
            ) : (
              simulationStats.flatMap(({ power, cost, reward, profit, netProfit, luck }, idx) => {
                if (power === 10 || power === 16) {
                  return [
                    <tr
                      key={`header-repeat-${power}`}
                      className="bg-neutral-900/70 text-cyan-400"
                    >
                      <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">PRICE (~)</th>
                      <th className="border border-neutral-800 px-3 py-2 text-right font-bold w-full whitespace-nowrap">
                        LUCK %
                      </th>
                      <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">COST (~$)</th>
                      <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">REWARD (~$)</th>
                      <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">PROFIT (~$)</th>
                      <th className="border border-neutral-800 px-2 py-2 text-right whitespace-nowrap">
                        NET PROFIT (~$)
                      </th>
                    </tr>,
                  ]
                }
                return [
                  <tr
                    key={power}
                    className="even:bg-neutral-900/40"
                  >
                    <td className="border border-neutral-800 px-2 py-1 text-right whitespace-nowrap">
                      ${formatNumber(getTicketPrice(power, foomPrice_, true))}
                    </td>
                    <td
                      className={`border border-neutral-800 px-3 py-1 text-right font-bold w-full ${luck >= 99.5 && netProfit <= 0 ? 'text-yellow-400' : netProfit > 0 ? 'text-green-400' : ''}`}
                    >
                      {luck.toFixed(2)}%
                    </td>
                    <td className="border border-neutral-800 px-2 py-1 text-right whitespace-nowrap">
                      {formatUsdCompact(cost)}
                    </td>
                    <td className="border border-neutral-800 px-2 py-1 text-right whitespace-nowrap">
                      {formatUsdCompact(reward)}
                    </td>
                    <td className="border border-neutral-800 px-2 py-1 text-right whitespace-nowrap">
                      {formatUsdCompact(profit)}
                    </td>
                    <td className="border border-neutral-800 px-2 py-1 text-right whitespace-nowrap">
                      {formatUsdCompact(Number(netProfit.toFixed(2)))}
                    </td>
                  </tr>,
                ]
              })
            )}
          </tbody>
        </table>
      </div>
      {simulationStats.length > 0 && (
        <div className="flex flex-row flex-wrap items-center justify-center mt-4 mb-1 !text-xs">
          <label
            htmlFor="numRand"
            className="text-neutral-300 mr-2 whitespace-nowrap text-xs font-medium"
          >
            Change the number of draws:
          </label>
          <input
            id="numRand-again"
            type="number"
            className="p-2 rounded-md bg-neutral-900/50 text-white mr-2"
            value={numRand === null ? '' : numRand}
            min={1}
            max={1024}
            placeholder={DEFAULT_NUM_RAND.toString()}
            onChange={e => {
              const val = e.target.value
              setNumRand(val === '' ? null : Math.abs(Number(val)))
            }}
            disabled={loading}
          />
          <button
            className="bg-cyan-400 text-black px-6 py-2 rounded-md font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleCheckLuck(secret)}
            disabled={loading || !secret || !showCheckAgain}
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin size-4 border-2 border-t-transparent border-black rounded-full"></span>
              </span>
            ) : (
              'Simulate (again)'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default SecretSimulator
