import { InputBox } from '../../ui/CyberpunkCardLayout'
import { type Address, isAddress } from 'viem'
import InfoIcon from '../../../public/InfoIcon'
import styled from 'styled-components'
import React, { useState, useEffect } from 'react'

const Tooltip = styled.div`
  position: relative;
  display: inline-block;

  &:hover .tooltip-content {
    opacity: 1;
    visibility: visible;
  }
`

const TooltipContent = styled.div`
  visibility: hidden;
  opacity: 0;
  width: max-content;
  background-color: #222;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 6px 12px;
  position: absolute;
  z-index: 10;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  transition:
    opacity 0.2s,
    visibility 0.2s;
  font-size: 0.85em;
  pointer-events: none;
  box-shadow: 0 2px 8px black;
`

interface TicketInputSectionProps {
  ticketInput: string
  setTicketInput: (value: string) => void
  redeemHex: string
  setRedeemHex: (value: string) => void
  setPowerHex: (value: string) => void
  redeemIndex: number | '' | undefined
  setRedeemIndex: (value: number | '' | undefined) => void
  hash: string
  recipient: Address | null | undefined
  setRecipient: (value: Address) => void
  handleCheckTicket: () => void
  setHash: (hash: string) => void
  setWitness: (witness: any) => void
  setReward: (reward: any) => void
  isCheckingTicket: boolean
}

export default function TicketInputSection({
  ticketInput,
  setTicketInput,
  redeemHex,
  setRedeemHex,
  setPowerHex,
  redeemIndex,
  setRedeemIndex,
  hash,
  recipient,
  setRecipient,
  handleCheckTicket,
  setHash,
  setWitness,
  setReward,
  isCheckingTicket,
}: TicketInputSectionProps) {
  const [showSecretMask, setShowSecretMask] = useState(true)
  const [showEyeTooltip, setShowEyeTooltip] = useState(false)
  const [showIndexMask, setShowIndexMask] = useState(true)
  const [showIndexEyeTooltip, setShowIndexEyeTooltip] = useState(false)

  /** Listen for proof recalculation request – when recipient changes to a valid address */
  useEffect(() => {
    if (!(recipient && isAddress(recipient) && redeemHex && redeemHex.length === 66)) {
      return
    }

    setHash('')
    setWitness(undefined)
    setReward(undefined)

    handleCheckTicket()
  }, [recipient, redeemHex])

  const inputStyle =
    'bg-[#101820] border border-[#00ffcc] rounded-md px-3 py-2 text-[#00ffcc] placeholder:text-[#00ffcc]/60 focus:outline-none focus:ring-2 focus:ring-[#00ffcc] focus:border-[#00ffcc] transition-all duration-200 shadow-md ring-2 ring-[white]/30 border-[#00ffcc]/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#101820]/50'

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-nowrap gap-3">
        <div className="flex-grow relative">
          <label className="block text-sm font-medium text-[#00ffcc] mb-2">Lottery Ticket</label>
          <div className="relative w-full flex flex-row flex-nowrap items-center">
            <InputBox
              placeholder="Enter your lottery ticket (0x...)"
              type={showSecretMask ? 'password' : 'text'}
              value={ticketInput}
              onChange={e => {
                const val = e.target.value
                setTicketInput(val)
                const trimmed = val.trim()
                const parts = trimmed.split(',')
                if (parts.length === 3) {
                  let [secret, power, index] = parts
                  if (
                    secret.startsWith('0x') &&
                    secret.length === 66 - 2 &&
                    power.length === 2 &&
                    /^[0-9a-fA-F]{2}$/.test(power)
                  ) {
                    setRedeemHex(secret + power)
                    setPowerHex(power)
                  } else if (secret.startsWith('0x') && secret.length === 66) {
                    setRedeemHex(secret)
                    setPowerHex(secret.slice(-2))
                  } else {
                    setRedeemHex('')
                    setPowerHex('')
                  }
                  const parsedIndex = index === '' ? '' : isNaN(Number(index)) ? '' : Number(index)
                  setRedeemIndex(parsedIndex)
                } else if (trimmed.startsWith('0x') && trimmed.length === 66) {
                  setRedeemHex(trimmed)
                  setPowerHex(trimmed.slice(-2))
                  setRedeemIndex('')
                } else {
                  setRedeemHex('')
                  setPowerHex('')
                  setRedeemIndex('')
                }
              }}
              disabled={isCheckingTicket}
              className={`transition-all duration-300 pr-10 ${inputStyle}`}
            />
            {ticketInput && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <button
                  className="text-lg text-cyan-400 hover:text-cyan-300 transition-colors relative"
                  type="button"
                  onClick={() => setShowSecretMask(!showSecretMask)}
                  onMouseEnter={() => setShowEyeTooltip(true)}
                  onMouseLeave={() => setShowEyeTooltip(false)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  aria-label={showSecretMask ? 'Unhide secret' : 'Hide secret'}
                >
                  {showSecretMask ? '👁️' : '🙈'}
                </button>
                {showEyeTooltip && (
                  <div className="absolute right-0 -top-10 bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                    {showSecretMask ? 'Unhide secret!' : 'Hide secret!'}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-shrink flex-grow-0 min-w-[120px] relative">
          <Tooltip>
            <div className="w-full relative">
              <label className="block text-sm font-medium text-[#00ffcc]/50 mb-2">
                Bet Index <span className="text-xs text-gray-400 italic">[optional]</span>
              </label>
              <div className="relative flex items-center">
                <InputBox
                  placeholder="Leave blank if unsure!"
                  type={showIndexMask ? 'password' : 'text'}
                  min={0}
                  value={redeemIndex}
                  onChange={e => {
                    let val = e.target.value
                    if (val !== '' && !isNaN(Number(val))) {
                      val = Math.abs(Number(val)).toString()
                    }
                    setRedeemIndex(val as number | '' | undefined)
                  }}
                  disabled={isCheckingTicket}
                  className={`transition-all duration-300 pr-10 ${inputStyle}`}
                />
                {redeemIndex !== undefined && redeemIndex !== '' && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <button
                      className="text-lg text-cyan-400 hover:text-cyan-300 transition-colors relative"
                      type="button"
                      onClick={() => setShowIndexMask(!showIndexMask)}
                      onMouseEnter={() => setShowIndexEyeTooltip(true)}
                      onMouseLeave={() => setShowIndexEyeTooltip(false)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      aria-label={showIndexMask ? 'Unhide index' : 'Hide index'}
                    >
                      {showIndexMask ? '👁️' : '🙈'}
                    </button>
                    {showIndexEyeTooltip && (
                      <div className="absolute right-0 -top-10 bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                        {showIndexMask ? 'Unhide index!' : 'Hide index!'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <TooltipContent className="tooltip-content bg-gray-900 border border-[#00ffcc]/30 shadow-lg shadow-[#00ffcc]/20">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <InfoIcon />
                Enter for increased privacy
              </span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Hash display with enhanced styling */}
      {!!hash && (
        <div className="bg-gradient-to-r from-[#00ffcc]/10 to-transparent border-l-2 border-[#00ffcc] pl-4 py-3 rounded-r-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00ffcc] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-[#00ffcc]">Ticket Hash:</span>
          </div>
          <p className="!text-[10px] text-gray-300 break-all mt-1">{hash}</p>
        </div>
      )}

      {/* Recipient address input */}
      <div>
        <label className="block text-sm font-medium text-[#00ffcc] mb-2">Recipient Address</label>
        <InputBox
          placeholder="Enter reward receiving wallet address"
          value={recipient || ''}
          onChange={e => setRecipient(e?.target?.value as Address)}
          disabled={isCheckingTicket}
          className={`transition-all duration-300 ${inputStyle}`}
        />
      </div>
    </div>
  )
}
