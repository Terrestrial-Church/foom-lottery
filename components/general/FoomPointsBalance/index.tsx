import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { fetchFoomPointsBalance } from './utils'
import { _error } from '@/lib/utils/ts'

interface FoomPointsBalanceProps {
  className?: string
}

const FoomPointsBalance: React.FC<FoomPointsBalanceProps> = ({ className = '' }) => {
  const [foomPointsBalance, setFoomPointsBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)

  const { address: userAddress } = useAccount()

  const fetchBalance = async () => {
    setIsLoading(true)

    try {
      const result = await fetchFoomPointsBalance(undefined, userAddress)
      setFoomPointsBalance(result.balance)
    } catch (error) {
      _error('Error in balance fetch:', error)
      setFoomPointsBalance('0')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userAddress) {
      fetchBalance()
    }
  }, [userAddress])

  if (!userAddress) {
    return null
  }

  return (
    <div
      className={`-translate-y-4 -mb-4 bg-[var(--background-secondary)] border border-[var(--border-primary)] rounded-md px-3 py-2 backdrop-blur-sm ${className}`}
    >
      <h3 className="text-sm">
        <span className="opacity-75">Your</span> Foom Points
      </h3>
      <div className="text-lg font-extrabold text-[var(--text-primary)]">
        {isLoading ? <span className="animate-pulse text-sm">Loading...</span> : <>{foomPointsBalance}</>}
      </div>
      {isLoading && (
        <div className="mt-1">
          <div className="w-full bg-[var(--background-tertriary)] rounded-full h-0.5">
            <div className="bg-[var(--primary)] h-0.5 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FoomPointsBalance
