import SpinnerText from '@/components/shared/spinner-text'
import React, { useRef, useEffect, useState } from 'react'

interface UserStatCardProps {
  label: string
  value: string | number
  isPercent?: boolean
  isLoading: boolean
  isMoney?: boolean
  isConnected?: boolean
}

const UserStatCard: React.FC<UserStatCardProps> = ({ label, value, isPercent, isLoading, isMoney, isConnected }) => {
  const textRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(24)

  let displayValue: React.ReactNode

  if (isLoading) {
    displayValue = '…'
  } else if (isConnected) {
    if (isPercent) {
      displayValue = `${value}%`
    } else if (isMoney) {
      displayValue = `$${value}`
    } else {
      displayValue = value
    }
  } else {
    displayValue = (
      <SpinnerText
        loader="?"
        interval={500}
      />
    )
  }

  useEffect(() => {
    if (!textRef.current || displayValue === '…' || typeof displayValue !== 'string') return

    const adjustFontSize = () => {
      const element = textRef.current!
      const container = element.parentElement!

      const containerWidth = container.offsetWidth - 48

      const fontSizes = [24, 20, 18, 16, 14, 12]

      for (const size of fontSizes) {
        element.style.fontSize = `${size}px`

        if (element.scrollWidth <= containerWidth) {
          setFontSize(size)
          break
        }
      }
    }

    /** @dev re-render trigger */
    const timeoutId = setTimeout(adjustFontSize, 0)

    window.addEventListener('resize', adjustFontSize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', adjustFontSize)
    }
  }, [displayValue, isLoading, isConnected])

  return (
    <div className="bg-neutral-900/70 border border-cyan-400 rounded-lg p-6 flex flex-col items-center">
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      <div
        ref={textRef}
        className="font-bold text-cyan-300 w-full text-center flex items-center justify-center"
        style={{
          fontSize: `${fontSize}px`,
          minHeight: '2rem',
        }}
      >
        {displayValue === '…' ? <SpinnerText /> : displayValue}
      </div>
    </div>
  )
}

export default UserStatCard
