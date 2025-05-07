import React, { useState } from 'react'
import { formatUsd } from '@/lib/utils'
import { nFormatter } from '@/lib/utils/node'
import { _log, forceToBigint } from '@/lib/utils/ts'
import { useFoomPrice } from '@/hooks/useFoomPrice'
import { getChainIcon } from './utils/tableHelpers'

interface RewardCellProps {
  reward: any
  chain: string
  isLastRow?: boolean
}

export function RewardCell({ reward, chain, isLastRow }: RewardCellProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const foomPrice = useFoomPrice()

  let value = typeof reward === 'object' && reward !== null ? reward.reward : reward
  const isJackpot = value !== '-' && value !== '0' && value !== '0.0'

  let fullFoom = !isNaN(value) ? forceToBigint(value).toLocaleString() : value

  let usd = ''
  if (isJackpot && !Number.isNaN(Number(value)) && foomPrice.data && !Number.isNaN(Number(foomPrice.data))) {
    usd = formatUsd(Number(value) * Number(foomPrice.data)) || ''
  }

  let rewardBits = 0
  let remainingReward = reward.reward
  if (remainingReward >= 4194304000000) {
    rewardBits |= 4
    remainingReward -= 4194304000000
  }
  if (remainingReward >= 65536000000) {
    rewardBits |= 2
    remainingReward -= 65536000000
  }
  if (remainingReward >= 1024000000) {
    rewardBits |= 1
    remainingReward -= 1024000000
  }

  return (
    <span
      className={`whitespace-nowrap text-right flex justify-between items-center gap-2`}
      style={
        isJackpot
          ? {
              color: '#00ffd0',
              textShadow: '0 0 8px #00ffd0, 0 0 16px #00ffd0',
              fontWeight: 600,
              borderRadius: 4,
              letterSpacing: '0',
              position: 'relative',
              cursor: 'help',
            }
          : { position: 'relative' }
      }
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 4].map((bitFlag, idx) => {
          let displayValue = '0'
          if (value === '-') {
            displayValue = '-'
          }

          let highlight = false
          if (rewardBits & bitFlag) {
            highlight = true
            if (bitFlag === 1) displayValue = nFormatter(1024000000) || '0'
            if (bitFlag === 2) displayValue = nFormatter(2 ** 16 * 10 ** 6) || '0'
            if (bitFlag === 4) displayValue = nFormatter(2 ** 22 * 10 ** 6) || '0'
          }
          const isZero = displayValue === '0'

          return (
            <span
              key={idx}
              className={isZero ? 'opacity-75' : highlight && isJackpot ? 'animate-blink-jackpot' : ''}
              style={
                isZero
                  ? { color: 'white', textShadow: 'none', fontWeight: 400 }
                  : highlight
                    ? { color: '#00ffd0', textShadow: '0 0 8px #00ffd0, 0 0 16px #00ffd0', fontWeight: 600 }
                    : undefined
              }
            >
              {displayValue}
            </span>
          )
        })}
      </div>

      {isJackpot && showTooltip && (
        <div
          style={
            isLastRow
              ? {
                  position: 'absolute',
                  left: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  textShadow: 'none',
                  background: 'rgba(30,30,30,0.97)',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: 8,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  minWidth: 120,
                }
              : {
                  position: 'absolute',
                  textShadow: 'none',
                  left: '-100%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(30,30,30,0.97)',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: 8,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                  minWidth: 120,
                }
          }
        >
          <div>{fullFoom} FOOM</div>
          {!!usd && <div>~{usd}</div>}
        </div>
      )}
    </span>
  )
}
