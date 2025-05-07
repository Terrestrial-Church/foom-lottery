import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import CopyIcon from '@/components/ui/CopyIcon'
import { ConfirmCopyModal } from './ConfirmCopyModal'
import { _redact } from '@/lib/lottery'
import { maskSecret } from '@/components/general/YourTickets/utils/formatters'

interface SecretCellProps {
  secret: string
  power: number
  index: number
}

export function SecretCell({ secret, power, index }: SecretCellProps) {
  let powerHex = ''
  if (typeof power === 'number') {
    powerHex = power.toString(16).padStart(2, '0')
  } else if (typeof power === 'string') {
    const number = parseInt(power, 10)
    if (!isNaN(number)) powerHex = number.toString(16).padStart(2, '0')
  }

  const display = `${secret},${powerHex},${index}`
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [atEnd, setAtEnd] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) {
      return
    }

    const check = () => {
      setAtEnd(element.scrollLeft + element.offsetWidth >= element.scrollWidth - 1)
    }
    check()
    element.addEventListener('scroll', check)
    return () => element.removeEventListener('scroll', check)
  }, [])

  const handleCopy = () => {
    setShowCopyModal(true)
  }

  const handleConfirmCopy = () => {
    navigator.clipboard.writeText(display)
    toast('Copied!')
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
    setShowCopyModal(false)
  }

  const handleCancelCopy = () => {
    setShowCopyModal(false)
  }

  return (
    <div className="w-full">
      <div
        className="relative flex items-center justify-between"
        style={{ position: 'relative' }}
      >
        <div
          ref={scrollRef}
          className={`block ${atEnd ? 'at-end' : ''}`}
          style={{
            width: '60px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            position: 'relative',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitMaskImage: atEnd ? 'none' : 'linear-gradient(to right, #050f0c 70%, transparent 100%)',
            maskImage: atEnd ? 'none' : 'linear-gradient(to right, #050f0c 70%, transparent 100%)',
            transition: 'WebkitMaskImage 0.2s, maskImage 0.2s',
          }}
        >
          <span style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>{_redact(display)}</span>
        </div>
        <div
          style={{ position: 'relative', display: 'inline-block' }}
          className="-mr-1"
        >
          <button
            onClick={handleCopy}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              verticalAlign: 'middle',
              display: 'inline-block',
            }}
            title="Copy secret"
            aria-label="Copy secret"
          >
            <CopyIcon
              color="white"
              size={20}
            />
          </button>
          {showTooltip && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(30,30,30,0.95)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                marginTop: 4,
                whiteSpace: 'nowrap',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </div>
          )}
        </div>
      </div>
      <ConfirmCopyModal
        open={showCopyModal}
        onConfirm={handleConfirmCopy}
        onCancel={handleCancelCopy}
      />
    </div>
  )
}
