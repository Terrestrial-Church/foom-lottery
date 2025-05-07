import { InputBox } from '../../ui/CyberpunkCardLayout'
import { WitnessType } from './types'
import { useState } from 'react'

interface InvestmentAmountSectionProps {
  witness: WitnessType | undefined
  selectedPercent: number | null
  setSelectedPercent: (percent: number | null) => void
  showCustomInput: boolean
  setShowCustomInput: (show: boolean) => void
  investmentAmount: string
  setInvestmentAmount: (amount: string) => void
}

export default function InvestmentAmountSection({
  witness,
  selectedPercent,
  setSelectedPercent,
  showCustomInput,
  setShowCustomInput,
  investmentAmount,
  setInvestmentAmount,
}: InvestmentAmountSectionProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (!witness) return null

  return (
    <div className="w-full bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-600/50 rounded-xl p-6 max-sm:py-2 max-sm:pb-0 max-sm:px-0 backdrop-blur-sm">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <label className="block text-lg font-medium text-[#00ffcc]">Investment Amount (FOOM)</label>
          <div className="relative">
            <button
              type="button"
              className="w-5 h-5 rounded-full bg-[#00ffcc]/20 border border-[#00ffcc]/50 text-[#00ffcc] text-xs font-bold hover:bg-[#00ffcc]/30 hover:border-[#00ffcc] transition-all duration-300 flex items-center justify-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              ?
            </button>
            {showTooltip && (
              <div className="absolute bottom-6 -right-2.5 bg-gray-900 border border-[#00ffcc]/50 rounded-lg p-3 text-sm text-white w-56 z-50 shadow-lg shadow-[#00ffcc]/20">
                <div className="absolute -bottom-1 right-4 w-2 h-2 bg-gray-900 border-r border-b border-[#00ffcc]/50 rotate-45"></div>
                Choose if you want to become an investor by clicking any amount of FOOM you wish to invest in the
                Lottery.
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {[25, 50, 75, 100].map(percent => {
            const jackpotSum = (witness as any)?.reward?.reward

            const isSelected = selectedPercent === percent

            return (
              <button
                key={percent}
                type="button"
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                  isSelected
                    ? 'border-[#00ffcc] bg-gradient-to-r from-[#00ffcc]/20 to-[#00ffcc]/10 text-[#00ffcc] shadow-lg shadow-[#00ffcc]/20'
                    : 'border-gray-600 bg-gray-800/50 text-white hover:border-[#00ffcc]/50 hover:bg-gray-700/50'
                }`}
                onClick={() => {
                  if (isSelected) {
                    setSelectedPercent(null)
                    setInvestmentAmount('')
                  } else {
                    setSelectedPercent(percent)
                    setShowCustomInput(false)
                    if (jackpotSum > 0) {
                      setInvestmentAmount((jackpotSum * (percent / 100) * (percent === 100 ? 0.95 : 1)).toString())
                    }
                  }
                }}
                disabled={jackpotSum === 0}
              >
                {percent}%
              </button>
            )
          })}
          <button
            type="button"
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-[1.02] ${
              showCustomInput
                ? 'border-[#00ffcc] bg-gradient-to-r from-[#00ffcc]/20 to-[#00ffcc]/10 text-[#00ffcc] shadow-lg shadow-[#00ffcc]/20'
                : 'border-gray-600 bg-gray-800/50 text-white hover:border-[#00ffcc]/50 hover:bg-gray-700/50'
            }`}
            onClick={() => {
              if (showCustomInput) {
                setShowCustomInput(false)
                setInvestmentAmount('')
              } else {
                setShowCustomInput(true)
                setSelectedPercent(null)
              }
            }}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom input field */}
      {showCustomInput && (
        <div className="mt-4">
          <InputBox
            id="investment-amount"
            placeholder="Enter FOOM amount to invest"
            type="number"
            min={0}
            value={investmentAmount}
            onChange={e => setInvestmentAmount(e.target.value)}
            disabled={false}
            className="rounded-xl max-sm:mx-4 max-sm:!w-[calc(100%-32px)] !border-2 !border-[#00ffcc]/50 !bg-gray-800/50 !text-white transition-all duration-300 focus:!border-[#00ffcc] focus:shadow-lg focus:shadow-[#00ffcc]/20"
          />
        </div>
      )}
    </div>
  )
}
