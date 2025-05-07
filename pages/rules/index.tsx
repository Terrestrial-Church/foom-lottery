import { useFoomPrice } from '@/hooks/useFoomPrice'
import { formatNumber } from '../../lib/utils/math'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { _log, safeToBigint } from '@/lib/utils/ts'
import { formatUnits } from 'viem'
import Metadata from '@/components/ui/Metadata'

const jackpotData = [
  { price: 3, power: 0, odds: ['1/1024', '1/65536', '1/4194304'] },
  { price: 4, power: 1, odds: ['1/512', '1/65536', '1/4194304'] },
  { price: 6, power: 2, odds: ['1/256', '1/65536', '1/4194304'] },
  { price: 10, power: 3, odds: ['1/128', '1/65536', '1/4194304'] },
  { price: 18, power: 4, odds: ['1/64', '1/65536', '1/4194304'] },
  { price: 34, power: 5, odds: ['1/32', '1/65536', '1/4194304'] },
  { price: 66, power: 6, odds: ['1/16', '1/65536', '1/4194304'] },
  { price: 130, power: 7, odds: ['1/8', '1/65536', '1/4194304'] },
  { price: 258, power: 8, odds: ['1/4', '1/65536', '1/4194304'] },
  { price: 514, power: 9, odds: ['1/2', '1/65536', '1/4194304'] },
  { price: 1026, power: 10, odds: ['1/1', '1/65536', '1/4194304'] },
  { price: 2050, power: 11, odds: ['1/1024', '1/32', '1/4194304'] },
  { price: 4098, power: 12, odds: ['1/1024', '1/16', '1/4194304'] },
  { price: 8194, power: 13, odds: ['1/1024', '1/8', '1/4194304'] },
  { price: 16386, power: 14, odds: ['1/1024', '1/4', '1/4194304'] },
  { price: 32770, power: 15, odds: ['1/1024', '1/2', '1/4194304'] },
  { price: 65538, power: 16, odds: ['1/1024', '1/1', '1/4194304'] },
  { price: 131074, power: 17, odds: ['1/1024', '1/65536', '1/32'] },
  { price: 262146, power: 18, odds: ['1/1024', '1/65536', '1/16'] },
  { price: 524290, power: 19, odds: ['1/1024', '1/65536', '1/8'] },
  { price: 1048578, power: 20, odds: ['1/1024', '1/65536', '1/4'] },
  { price: 2097154, power: 21, odds: ['1/1024', '1/65536', '1/2'] },
  { price: 4194306, power: 22, odds: ['1/1024', '1/65536', '1/1'] },
]

export default function RulesPage() {
  const foomPriceQuery = useFoomPrice()
  const foomPriceBigint = foomPriceQuery.data ? safeToBigint(foomPriceQuery.data) : undefined

  const formatPrice = useCallback(
    (price: number) => {
      return `$${foomPriceBigint ? formatNumber(price * foomPriceQuery.data * 10 ** 6) : '…'}`
    },
    [foomPriceQuery.data]
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const [atEnd, setAtEnd] = useState(true)

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
  }, [jackpotData.length])

  return (
    <div className="text-white min-h-screen">
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center border-b border-neutral-800 pb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
              <span className="text-cyan-400">FOOM</span> Lottery Rules
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto">
              Learn how POWER and PRIZE work. Win one, two, or all three jackpots per ticket.
            </p>
          </div>

          <Metadata />

          {/* Main description */}
          <div className="text-lg text-neutral-200 mt-12 max-sm:mt-4">
            There are 3 jackpots – and you can win all 3.
          </div>

          {/* Jackpot boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mt-4 [&>*]:px-2">
            {[
              {
                label: 'SMALL',
                amount: '1024M',
                value: 1024_000_000,
                dollarSigns: '$',
              },
              {
                label: 'MEDIUM',
                amount: '65 536M',
                value: 65_536_000_000,
                dollarSigns: '$$',
              },
              {
                label: 'BIG',
                amount: '4 194 304M',
                value: 4_194_304_000_000,
                dollarSigns: '$$$',
              },
            ].map(jackpot => (
              <div
                key={jackpot.label}
                className="border border-white bg-neutral-900/50 py-4 rounded"
              >
                <div className="text-2xl font-bold text-white inline-flex flex-wrap items-center justify-center gap-2">
                  <span>{jackpot.amount}</span>
                  <span className="flex-shrink-0 flex items-center">
                    <img
                      src="/icon.svg"
                      alt="FOOM Logo"
                      className="inline-block size-6 border-[1.5px] border-white rounded-full"
                    />
                  </span>
                </div>
                <div className="font-bold text-neutral-300">
                  ~${foomPriceQuery.data ? formatNumber(jackpot.value * foomPriceQuery.data) : '…'}
                </div>
                <div className="text-green-300 mt-2 tracking-wide">
                  {jackpot.label} <span className="italic">{jackpot.dollarSigns}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Odds Table */}
          <div className="w-full">
            <div className="relative">
              <div
                ref={scrollRef}
                className="overflow-x-auto mt-16 relative"
                style={{
                  WebkitMaskImage: atEnd ? 'none' : 'linear-gradient(to right, #18181b 80%, transparent 100%)',
                  maskImage: atEnd ? 'none' : 'linear-gradient(to right, #18181b 80%, transparent 100%)',
                  transition: 'WebkitMaskImage 0.2s, maskImage 0.2s',
                }}
              >
                <table className="min-w-full border border-neutral-800 text-sm max-sm:text-xs text-white table-fixed overflow-y-clip">
                  <thead className="bg-neutral-900/70 text-cyan-400">
                    <tr>
                      <th className="border border-neutral-800 px-3 py-2 text-right whitespace-nowrap">PRICE (~)</th>
                      <th className="border border-neutral-800 px-3 py-2 text-right whitespace-nowrap">POWER</th>
                      <th className="border border-neutral-800 px-3 py-2 text-right whitespace-nowrap">SMALL</th>
                      <th className="border border-neutral-800 px-3 py-2 text-right whitespace-nowrap">MEDIUM</th>
                      <th className="border border-neutral-800 px-3 py-2 text-right whitespace-nowrap">BIG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jackpotData.map(({ price, power, odds }) => (
                      <tr
                        key={power}
                        className="even:bg-neutral-900/40"
                      >
                        <td className="border border-neutral-800 px-3 py-1 flex items-center gap-1 break-words justify-end text-right">
                          {formatPrice(price)}
                          <span className="relative group inline-block">
                            <button
                              type="button"
                              tabIndex={0}
                              aria-label={`Show FOOM amount: ${price}M FOOM`}
                              className="ml-1 text-cyan-400 hover:text-cyan-300 focus:outline-none"
                            >
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline align-middle"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            </button>
                            <span
                              className={`absolute left-1/2 z-[1] -translate-x-1/2 mt-2 ${power === 22 ? '!-mt-4' : ''} w-max rounded bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity border border-neutral-700 pointer-events-none`}
                            >
                              {price}M FOOM
                            </span>
                          </span>
                        </td>
                        <td className="border border-neutral-800 px-3 py-1 whitespace-nowrap text-right">{power}</td>
                        <td className="border border-neutral-800 px-3 py-1 whitespace-nowrap text-right">{odds[0]}</td>
                        <td className="border border-neutral-800 px-3 py-1 whitespace-nowrap text-right">{odds[1]}</td>
                        <td className="border border-neutral-800 px-3 py-1 whitespace-nowrap text-right">{odds[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="mt-12 text-sm text-neutral-300 space-y-1">
            <p>Lottery charges 5% when collecting rewards:</p>
            <p>1% – goes to the random number generator,</p>
            <p>4% – goes to investors.</p>
          </div>

          {/* Footer quote */}
          <div className="mt-16 text-center">
            <p className="text-lg italic">“Power up. Play smart. Win big.”</p>
          </div>
        </div>
      </main>
    </div>
  )
}
