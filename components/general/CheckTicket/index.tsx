'use client'
import { useAccount } from 'wagmi'
import { CardWrapper } from '../../ui/CyberpunkCardLayout'
import { useLottery } from '@/providers/LotteryProvider'
import { useEffect, useState } from 'react'
import { type Address } from 'viem'
import Modal from 'react-modal'
import { useChain } from '@/hooks/useChain'
import TicketInputSection from './TicketInputSection'
import RewardDisplay from './RewardDisplay'
import InvestmentAmountSection from './InvestmentAmountSection'
import ActionButtons from './ActionButtons'
import RelayerModal from './RelayerModal'
import { useCheckTicketLogic } from './hooks/useCheckTicketLogic'
import { useCollectRewardLogic } from './hooks/useCollectRewardLogic'
import { WitnessType, RewardType, RelayerType } from './types'

export default function CheckTicket({ onClose }: { onClose?: () => void }) {
  const [hash, setHash] = useState('')
  const [witness, setWitness] = useState<WitnessType>()
  const [reward, setReward] = useState<RewardType>()
  const [relayerSuccess, setRelayerSuccess] = useState<string | null>(null)
  const [showRelayerModal, setShowRelayerModal] = useState(false)
  const [selectedRelayer, setSelectedRelayer] = useState<RelayerType | null>(null)
  const [powerHex, setPowerHex] = useState<string>('')
  const [ticketInput, setTicketInput] = useState<string>('')
  const [investmentAmount, setInvestmentAmount] = useState<string>('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null)

  const address = useAccount().address
  const chain = useChain()

  const {
    makeWithdrawProofMutation,
    redeemHex,
    redeemIndex,
    setRedeemHex,
    setRedeemIndex,
    recipient,
    setRecipient,
    handleStatus,
  } = useLottery()

  const handleCheckTicket = useCheckTicketLogic({
    redeemHex,
    setHash,
    setWitness,
    setReward,
    handleStatus,
  })

  const { collectManuallyMutation, collectViaRelayerMutation } = useCollectRewardLogic({
    witness,
    selectedRelayer,
    investmentAmount,
    setRelayerSuccess,
    handleStatus,
    chain,
  })

  /** @dev init recipient */
  useEffect(() => {
    if (!address || !!recipient) {
      return
    }
    setRecipient(address)
  }, [address, recipient, setRecipient])

  useEffect(() => {
    if (
      redeemHex &&
      redeemHex.length === 66 &&
      powerHex &&
      powerHex.length === 2 &&
      ticketInput !==
        `${redeemHex.slice(0, 66 - 2)},${powerHex},${redeemIndex !== undefined && redeemIndex !== '' ? redeemIndex : ''}`
    ) {
      setTicketInput(
        `${redeemHex.slice(0, 66 - 2)},${powerHex},${redeemIndex !== undefined && redeemIndex !== '' ? redeemIndex : ''}`
      )
    }
  }, [redeemHex, powerHex, redeemIndex])

  useEffect(() => {
    if (redeemHex && redeemHex.length === 66 && /^[0-9a-fA-F]+$/.test(redeemHex.slice(2))) {
      const secretPart = redeemHex.slice(0, 66 - 2)
      const power = redeemHex.slice(-2)
      setTicketInput(`${secretPart},${power},${redeemIndex !== undefined && redeemIndex !== '' ? redeemIndex : ''}`)
    }
  }, [redeemHex, redeemIndex])

  if (typeof window !== 'undefined') {
    Modal.setAppElement('#__next')
  }

  return (
    <CardWrapper
      className="!bg-none flex flex-col flex-grow flex-shrink-0 !h-auto relative overflow-hidden !p-2 max-sm:!p-2"
      id="check-ticket"
    >
      {/* Close button */}
      {onClose && (
        <button
          className="absolute -top-1 -right-1 text-gray-400 hover:text-[#00ffcc] transition-colors duration-300 z-20"
          onClick={onClose}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold !text-white text-transparent mb-2">Check Ticket</h1>
        </div>

        <TicketInputSection
          {...{
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
            isCheckingTicket: makeWithdrawProofMutation.isPending,
          }}
        />

        {/* Action section */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Check ticket button */}
          <button
            className="mb-2 disabled:!cursor-not-allowed text-[12px] bg-gradient-to-r from-[#00ffcc] to-[#00d4aa] hover:from-[#00d4aa] hover:to-[#00ffcc] text-black font-bold transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-[#00ffcc]/20 disabled:opacity-50 disabled:transform-none px-6 py-3 rounded-lg"
            disabled={!(redeemHex && redeemHex.length === 66) || makeWithdrawProofMutation.isPending}
            onClick={handleCheckTicket}
            id="check-ticket-btn"
          >
            {makeWithdrawProofMutation.isPending ? (
              'Checking...'
            ) : witness || reward ? (
              <span>
                <span className="text-[16px]">↻ </span>Re-check ticket
              </span>
            ) : (
              'Check Ticket'
            )}
          </button>

          <RewardDisplay {...{ witness, reward }} />

          <InvestmentAmountSection
            {...{
              witness,
              selectedPercent,
              setSelectedPercent,
              showCustomInput,
              setShowCustomInput,
              investmentAmount,
              setInvestmentAmount,
            }}
          />

          {investmentAmount && parseFloat(investmentAmount) > 0 && (
            <div className="text-center text-sm text-[#00ffcc] bg-[#00ffcc]/10 border border-[#00ffcc]/20 rounded-lg p-3 mt-2">
              <p>
                When collecting, you will invest <span className="font-bold text-white">{investmentAmount} FOOM</span>!
              </p>
            </div>
          )}

          <ActionButtons
            {...{
              witness,
              collectManuallyMutation,
              collectViaRelayerMutation,
              setShowRelayerModal,
              relayerSuccess,
            }}
          />
        </div>
      </div>

      <RelayerModal
        {...{
          showRelayerModal,
          setShowRelayerModal,
          selectedRelayer,
          setSelectedRelayer,
          collectViaRelayerMutation,
          chain,
        }}
      />
    </CardWrapper>
  )
}
