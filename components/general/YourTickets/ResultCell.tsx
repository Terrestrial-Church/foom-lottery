import { _log } from '@/lib/utils/ts'
import { useState } from 'react'

interface ResultCellProps {
  reward:
    | '-'
    | {
        ticket: string
        maskedBits: string[]
        reward: string
        maskBits: string[]
        bits: string[]
      }
  status: string
  /** @dev betIndex */
  bet: number
}

export function ResultCell({ reward, status, bet }: ResultCellProps) {
  const [showTooltipIdx, setShowTooltipIdx] = useState<number | null>(null)

  let maskedBitsArr =
    typeof reward === 'object' && reward !== null && Array.isArray(reward.maskedBits) ? reward.maskedBits : null

  /** @dev show all 3 sets of bits, not just one */
  let tooltips: string[] = []
  if (maskedBitsArr) {
    tooltips = maskedBitsArr.map(b => {
      if (typeof b === 'string') {
        const ones = b.split('').filter(char => char === '1').length
        if (ones === 0) return 'No "1"\'s! Congratulations!'
        else return `${ones} too many "1"'s!`
      }
      return ''
    })
  }

  const renderMaskedBits = (b: string, rowIndex: number) => {
    if (typeof b !== 'string') return b || '-'

    const chars = b.split('')
    const merged: {
      text: string
      isMerged: boolean
      color: string
      textShadow: string
      background: string
    }[] = []

    let i = 0
    while (i < chars.length) {
      if (chars[i] === 'ˍ' && i + 1 < chars.length) {
        const nextChar = chars[i + 1]
        merged.push({
          text: 'ˍ' + nextChar,
          isMerged: true,
          color: nextChar === '1' ? '#dc3545' : '#00ffd0',
          textShadow: nextChar === '1' ? 'none' : '0 0 8px #00ffd0, 0 0 16px #00ffd0',
          background: '#00ffd010',
        })
        i += 2
      } else {
        merged.push({
          text: chars[i],
          isMerged: false,
          color: chars[i] === '1' ? '#dc3545' : '#00ffd0',
          textShadow: chars[i] === '1' ? 'none' : '0 0 8px #00ffd0, 0 0 16px #00ffd0',
          background: chars[i] === '1' ? '#111111a0' : '#111111a0',
        })
        i++
      }
    }

    const isLost = chars.some(char => char === '1')

    return (
      <span style={{ position: 'relative', display: 'inline-block' }}>
        {merged.map((item, idx) => (
          <span
            key={idx}
            className={!isLost && status === 'Jackpot!' ? 'animate-blink-jackpot' : undefined}
            style={{
              color: item.color,
              textShadow: isLost ? 'none' : item.textShadow,
              fontWeight: 600,
              background: isLost ? item.background : '#00ffd010',
              borderRadius: 4,
              display: 'inline-block',
              letterSpacing: '0',
              minWidth: 14,
              minHeight: 22,
              lineHeight: '22px',
              textAlign: 'center',
              padding: item.isMerged ? '0 2px' : undefined,
              boxShadow: '#00ffd0',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: item.isMerged ? 'scaleY(2) translate(0,-4px)' : undefined,
              }}
            >
              {item.text}
            </span>
          </span>
        ))}
        {isLost && (
          <span
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: 4,
              background: '#0f0000',
              opacity: 1,
              pointerEvents: 'none',
              zIndex: 0,
              transform: 'translateY(-50%)',
            }}
          />
        )}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {maskedBitsArr && maskedBitsArr.length > 0 ? (
        maskedBitsArr.map((b, i) => (
          <span
            key={i}
            style={{ display: 'inline', whiteSpace: 'pre', position: 'relative', marginBottom: 2 }}
            onMouseEnter={() => setShowTooltipIdx(i)}
            onMouseLeave={() => setShowTooltipIdx(null)}
          >
            {renderMaskedBits(b, i)}
            {showTooltipIdx === i && tooltips[i] && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '120%',
                  transform: 'translateX(-50%)',
                  background: 'var(--background)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  zIndex: 1,
                  pointerEvents: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                }}
              >
                {tooltips[i]}
              </div>
            )}
          </span>
        ))
      ) : (
        <span>-</span>
      )}
    </div>
  )
}
