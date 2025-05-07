import { bitsToReward } from '@/lib/lottery'
import { WitnessType, RewardType } from './types'
import { useFoomPrice } from '@/hooks/useFoomPrice'
import { formatNumber } from '@/lib/utils/math'

interface RewardDisplayProps {
  witness: WitnessType | undefined
  reward: RewardType | undefined
}

export default function RewardDisplay({ witness, reward }: RewardDisplayProps) {
  const { data: foomPrice } = useFoomPrice()

  if (!witness) {
    return null
  }

  return (
    <div className="w-full bg-gradient-to-br from-[#00ffcc]/10 to-transparent border border-[#00ffcc]/30 rounded-xl p-6 backdrop-blur-sm">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <p className="text-lg font-bold text-[#00ffcc]">Your Reward</p>
        </div>
        <p className="text-2xl font-bold text-white">
          {foomPrice ? '~$' : ''}
          {formatNumber(bitsToReward(witness?.raw?.rewardbits, { foomPrice }))}
          {foomPrice ? '' : ' FOOM'}
        </p>
      </div>

      <div className="w-full overflow-x-auto bg-black/30 rounded-lg p-4 border border-[#00ffcc]/20">
        <div style={{ minWidth: 420, display: 'inline-block' }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#00ffcc]/30">
                <th className="pr-4 py-2 text-[#00ffcc] text-left">1024</th>
                <th className="pr-4 py-2 text-[#00ffcc] text-left">65536</th>
                <th className="pr-4 py-2 text-[#00ffcc] text-left">4194304</th>
              </tr>
            </thead>
            <tbody>
              <tr className="whitespace-nowrap">
                {reward?.maskedBits?.map((b, i) => {
                  let ones = 0
                  if (typeof b === 'string') {
                    ones = b.split('').filter(char => char === '1').length
                  }
                  let info = ''
                  if (typeof b === 'string') {
                    info = ones === 0 ? 'No "1"\'s! Congratulations!' : `${ones} too many '1'\'s!`
                  }
                  return (
                    <td
                      key={i}
                      className="pr-4 py-2 text-left"
                    >
                      <span style={{ display: 'inline', whiteSpace: 'pre' }}>
                        {typeof b === 'string'
                          ? (() => {
                              const groups: { char: string; count: number }[] = []
                              let lastChar = ''
                              let count = 0
                              b.split('').forEach((char, idx) => {
                                if (char === lastChar) {
                                  count++
                                } else {
                                  if (lastChar !== '') {
                                    groups.push({ char: lastChar, count })
                                  }
                                  lastChar = char
                                  count = 1
                                }
                                if (idx === b.length - 1 && lastChar !== '') {
                                  groups.push({ char: lastChar, count })
                                }
                              })
                              return groups.map((group, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    color: group.char === '1' ? '#ff3b3b' : '#00ffd0',
                                    textShadow: group.char === '1' ? 'none' : '0 0 8px #00ffd0, 0 0 16px #00ffd0',
                                    fontWeight: 600,
                                    background: group.char === '1' ? 'rgba(255,59,59,0.1)' : 'rgba(0,255,208,0.1)',
                                    borderRadius: 4,
                                    display: 'inline',
                                    letterSpacing: '0',
                                    padding: '1px 2px',
                                  }}
                                >
                                  {group.char.repeat(group.count)}
                                </span>
                              ))
                            })()
                          : b}
                      </span>
                      <div
                        className="mt-1 text-xs font-medium text-left"
                        style={{ color: ones === 0 ? '#00ffd0' : '#ff3b3b' }}
                      >
                        {info}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
