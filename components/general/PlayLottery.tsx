'use client'
import { useEffect, useState, useMemo } from 'react'
import {
  CardWrapper,
  Title,
  Balance,
  InputBox,
  DetailsRow,
  InfoBlock,
  Label,
  Value,
  TicketButton,
  Footer,
  ReadMoreLink,
  InvestButton,
} from '../ui/CyberpunkCardLayout'
import { useFoomBalance } from '@/hooks/useFoomBalance'
import { _log, safeToBigint } from '@/lib/utils/ts'
import SpinnerText from '@/components/shared/spinner-text'
import { useFoomPrice } from '@/hooks/useFoomPrice'
import { formatUnits } from 'viem'
import { nFormatter } from '@/lib/utils/node'
import { useLottery } from '@/providers/LotteryProvider'
import styled from 'styled-components'
import { usePublicClient, useAccount, useBalance } from 'wagmi'
import { formatNumber } from '@/lib/utils/math'
import { getHash, getSecretPower } from '@/lib/lottery/getHash'
import Modal from 'react-modal'
import { FaDownload } from 'react-icons/fa'
import InfoIcon from '../../public/InfoIcon'
import { bigintToHex, hexToBigint } from '@/lib/lottery/utils/bigint'
import Link from 'next/link'
import { toast } from 'sonner'
import { RoundSpinner } from '../ui/RoundSpinner'
import { useChain } from '@/hooks/useChain'

/** @dev react-modal fixup */
if (typeof window !== 'undefined') {
  Modal.setAppElement('#__next')
}

const SliderWrapper = styled.div`
  width: 300px;
  margin: 20px;
`

const StyledSlider = styled.input.attrs({ type: 'range' })`
  width: 100%;
  height: 4px; /* wysokość suwaka */

  &::-webkit-slider-thumb {
    appearance: none;
    width: 10px;
    height: 16px;
    background-color: black;
    border-radius: 2px;
    cursor: pointer;
    border: none;
    margin-top: -6px;
  }

  &::-moz-range-thumb {
    width: 10px;
    height: 16px;
    background-color: black;
    border-radius: 2px;
    cursor: pointer;
    border: none;
  }

  &::-webkit-slider-runnable-track {
    height: 4px;
    background-color: #ccc;
    border-radius: 2px;
  }

  &::-moz-range-track {
    height: 4px;
    background-color: #ccc;
    border-radius: 2px;
  }
`

const Labels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 10px;
  font-size: 10px;
  color: white;
`

const ValueLabel = styled.div`
  margin-top: 10px;
  text-align: center;
  font-weight: bold;
`

export const PrayersInput = styled.input`
  width: 100%;
  height: 44px;
  border-radius: 8px;
  color: white;
  background-color: #2a2a2a;
  border: 2px solid #404040;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  margin-top: 1rem;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
  outline: none;

  &::placeholder {
    color: #888;
    font-style: italic;
  }

  &:focus {
    border-color: #7dffcf;
    background-color: #333;
    box-shadow: 0 0 0 1px rgba(125, 255, 207, 0.3);
  }

  &:hover {
    border-color: #555;
    background-color: #333;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const betMin = 1_000_000
const jackpotLevels = [1024, 65536, 4194304]

const lotteryTiers = [
  { price: 3, odds: ['1/1024', '1/65536', '1/4194304'] },
  { price: 4, odds: ['1/512', '1/65536', '1/4194304'] },
  { price: 6, odds: ['1/256', '1/65536', '1/4194304'] },
  { price: 10, odds: ['1/128', '1/65536', '1/4194304'] },
  { price: 18, odds: ['1/64', '1/65536', '1/4194304'] },
  { price: 34, odds: ['1/32', '1/65536', '1/4194304'] },
  { price: 66, odds: ['1/16', '1/65536', '1/4194304'] },
  { price: 130, odds: ['1/8', '1/65536', '1/4194304'] },
  { price: 258, odds: ['1/4', '1/65536', '1/4194304'] },
  { price: 514, odds: ['1/2', '1/65536', '1/4194304'] },
  { price: 1026, odds: ['1/1', '1/65536', '1/4194304'] },
  { price: 2050, odds: ['1/1024', '1/32', '1/4194304'] },
  { price: 4098, odds: ['1/1024', '1/16', '1/4194304'] },
  { price: 8194, odds: ['1/1024', '1/8', '1/4194304'] },
  { price: 16386, odds: ['1/1024', '1/4', '1/4194304'] },
  { price: 32770, odds: ['1/1024', '1/2', '1/4194304'] },
  { price: 65538, odds: ['1/1024', '1/1', '1/4194304'] },
  { price: 131074, odds: ['1/1024', '1/65536', '1/32'] },
  { price: 262146, odds: ['1/1024', '1/65536', '1/16'] },
  { price: 524290, odds: ['1/1024', '1/65536', '1/8'] },
  { price: 1048578, odds: ['1/1024', '1/65536', '1/4'] },
  { price: 2097154, odds: ['1/1024', '1/65536', '1/2'] },
  { price: 4194306, odds: ['1/1024', '1/65536', '1/1'] },
]

// const tierRanges = {
//   0: { start: 0, end: 10 },
//   1: { start: 11, end: 16 },
//   2: { start: 17, end: 22 },
// }

const tierRanges = {
  0: { start: 0, end: 22 },
  1: { start: 0, end: 22 },
  2: { start: 0, end: 22 },
}

const getPricesByTier = tierName => {
  const tierMap = { Small: 0, Medium: 1, Big: 2 }
  const tierIndex = tierMap[tierName]
  const { start, end } = tierRanges[tierIndex]
  return lotteryTiers.slice(start, end + 1).map(t => t.price)
}

function getBestTierForJackpot(jackpotIndex) {
  let bestTier = 0,
    bestOdds = Infinity
  lotteryTiers.forEach((tier, idx) => {
    const oddsStr = tier.odds[jackpotIndex]
    const denominator = parseInt(oddsStr.split('/')[1])
    if (denominator < bestOdds) {
      bestOdds = denominator
      bestTier = idx
    }
  })
  return bestTier
}

function isJackpotButtonHighlighted(index, selectedTier) {
  if (index === 0) return selectedTier <= 10
  if (index === 1) return selectedTier > 10 && selectedTier <= 16
  if (index === 2) return selectedTier > 16
  return false
}

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
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  transition:
    opacity 0.2s,
    visibility 0.2s;
  font-size: 0.85em;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`

const SliderTooltipWrapper = styled.div`
  position: relative;
  width: 100%;
  z-index: 1000;
`

const SliderTooltip = styled.div<{ $visible: boolean; $left: number }>`
  position: absolute;
  top: -32px;
  left: ${({ $left }) => $left}px;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: none;
  transition: opacity 0.15s;
  z-index: 999 !important;
`

export default function PlayLottery({ customSecret }: { customSecret?: bigint | null }) {
  const [selectedTier, setSelectedTier] = useState(0)
  const [selectedJackpot, setSelectedJackpot] = useState(0)
  const [currentTicket, setCurrentTicket] = useState('Small')
  const [steps, setSteps] = useState(getPricesByTier('Small'))
  const [stepIndex, setStepIndex] = useState(0)
  const [investModalOpen, setInvestModalOpen] = useState(false)
  const [investAmount, setInvestAmount] = useState('')
  const [invest, setInvest] = useState<string | null>(null)
  const [playInputCurrency, setPlayInputCurrency] = useState<'ETH' | 'FOOM'>('ETH')

  const lottery = useLottery()
  const foomBalanceQuery = useFoomBalance()
  const foomPriceQuery = useFoomPrice()
  const foomPriceBigint = foomPriceQuery.data ? safeToBigint(foomPriceQuery.data) : undefined

  const foomBalanceUsd =
    foomBalanceQuery.data !== undefined && foomPriceBigint !== undefined
      ? formatUnits(foomBalanceQuery.data * foomPriceBigint.value, 18 + foomPriceBigint.decimals)
      : undefined

  const value = steps[stepIndex] || 0

  const { address } = useAccount()
  const { data: ethBalanceData } = useBalance({ address })
  const chain = useChain()

  const balanceInfo = useMemo(
    () => ({
      foom: !address ? 0 : nFormatter(foomBalanceQuery.data),
      foomUsd: foomBalanceUsd !== undefined ? Number(foomBalanceUsd).toFixed(2) : !address ? 0 : undefined,
      eth: ethBalanceData !== undefined ? Number(ethBalanceData.formatted).toFixed(4) : !address ? 0 : undefined,
    }),
    [foomBalanceQuery.data, foomBalanceUsd, ethBalanceData?.formatted, chain?.id]
  )

  /** @dev based on user FOOM balance, use FOOMs to play. If user has less than 800_000_000 (~$100) FOOM, stay with using ETH. */
  useEffect(() => {
    if (!foomBalanceQuery.data) {
      return
    }

    try {
      if (BigInt(foomBalanceQuery.data) >= 800_000_000n * 10n ** 18n) {
        setPlayInputCurrency('FOOM')
      } else {
        setPlayInputCurrency('ETH')
      }
    } catch {}
  }, [foomBalanceQuery.data])

  useEffect(() => {
    const idx = getPricesByTier(currentTicket).indexOf(value)
    if (idx !== -1) setSelectedTier(idx + tierRanges[selectedJackpot].start)
  }, [stepIndex])

  const handleTicketChange = ticket => {
    setCurrentTicket(ticket)
    const prices = getPricesByTier(ticket)
    setSteps(prices)
  }

  const getTicketValue = (priceTier: number, includeUniswapFee: boolean = false) => {
    if (!foomPriceBigint) {
      return '0.00'
    }

    const numerator = BigInt(priceTier) * BigInt(betMin) * foomPriceBigint.value
    const denominator = 10n ** BigInt(foomPriceBigint.decimals)
    const baseValue = Number(numerator) / Number(denominator)
    if (includeUniswapFee) {
      const withFee = baseValue * 1.0025
      return withFee.toFixed(2)
    }
    return baseValue.toFixed(2)
  }

  const tier = lotteryTiers[selectedTier]
  const ticketValue = getTicketValue(tier.price)
  const potentialWin = (
    jackpotLevels[selectedJackpot] *
    betMin *
    Number(formatUnits(foomPriceBigint?.value || 0n, foomPriceBigint?.decimals || 0))
  ).toFixed(2)
  const odds = tier.odds[selectedJackpot]

  const [oddsValue, setOddsValue] = useState(lotteryTiers[0].odds)
  const [prayer, setPrayer] = useState('')
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [pendingSecret, setPendingSecret] = useState<string | null>(null)
  const [pendingHash, setPendingHash] = useState<string | null>(null)
  const [pendingPlayArgs, setPendingPlayArgs] = useState<{
    power: number
    inputCurrency: 'FOOM' | 'ETH'
    pray?: string
    _commitment: Awaited<ReturnType<typeof getHash>>
  } | null>(null)
  const [generatingSecret, setGeneratingSecret] = useState(false)
  const [sliderHover, setSliderHover] = useState(false)
  const [sliderLeft, setSliderLeft] = useState(0)
  const [sliderActive, setSliderActive] = useState(false)

  async function handleBuyTicket(currency: 'FOOM' | 'ETH' = 'FOOM') {
    setGeneratingSecret(true)

    const toastId = toast(
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RoundSpinner />
        <span>Please wait…</span>
      </div>,
      { duration: Infinity }
    )

    try {
      const _commitment = customSecret
        ? await getSecretPower(customSecret, BigInt(selectedTier))
        : await getHash([`0x${Number(selectedTier).toString(16)}`])
      _log('Generated commitment:', _commitment)

      setPendingSecret(_commitment.secret_power)
      setPendingHash(_commitment.hash)
      setShowSecretModal(true)
      setPendingPlayArgs({
        power: selectedTier,
        pray: prayer,
        _commitment,
        inputCurrency: playInputCurrency,
      })
    } finally {
      setGeneratingSecret(false)

      toast.dismiss(toastId)
    }
  }

  function handleConfirmSecret() {
    if (pendingPlayArgs) {
      const toastId = toast(
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RoundSpinner />
          <span>Sending transaction, please check your wallet…</span>
        </div>,
        { duration: Infinity, id: 'play-lottery-pending' }
      )
      ;(async () => {
        try {
          await lottery.playMutation.mutateAsync(pendingPlayArgs)

          toast.dismiss(toastId)
        } catch (e) {
          toast.error('Failed to send ticket. Please try again.')

          toast.dismiss(toastId)
        }
      })()
    }
    setShowSecretModal(false)
    setPendingSecret(null)
    setPendingHash(null)
    setPendingPlayArgs(null)
  }

  const secretDownloadUrl = (() => {
    if (!pendingSecret) return ''
    const content = `Lottery Ticket Secret\n\nSecret: ${pendingSecret}\nHash: ${pendingHash}\n\nKeep this file safe! You will need it to claim your winnings.`
    return typeof window !== 'undefined' ? URL.createObjectURL(new Blob([content], { type: 'text/plain' })) : ''
  })()

  useEffect(() => {
    setOddsValue(lotteryTiers[stepIndex].odds)
  }, [stepIndex])

  useEffect(() => {
    if (customSecret) {
      _log('Received hash from parent:', customSecret)
    }
  }, [customSecret])

  const getThumbLeft = (slider: HTMLInputElement) => {
    const min = Number(slider.min)
    const max = Number(slider.max)
    const val = Number(slider.value)

    const percent = (val - min) / (max - min)
    const sliderWidth = slider.offsetWidth

    return percent * (sliderWidth - 10) + 5
  }

  return (
    <div className="flex flex-col w-full">
      <h2 className="text-[20px] leading-[140%] font-bold text-white mb-2 mt-8">3# Buy ticket for your secret.</h2>
      <CardWrapper>
        <div className="flex justify-end w-full -translate-y-4 [@media(max-width:730px)]:translate-y-0 [@media(max-width:730px)]:translate-x-4">
          <button
            className="px-2 py-1 text-xs text-white/80 bg-transparent border border-white/20 rounded hover:border-white/40 hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-1"
            onClick={() => setPlayInputCurrency(playInputCurrency === 'ETH' ? 'FOOM' : 'ETH')}
            type="button"
          >
            Playing using:<span className="font-medium">{playInputCurrency}</span>
            <img
              src={playInputCurrency === 'ETH' ? '/icons/eth.webp' : '/icon.svg'}
              alt={playInputCurrency}
              className={`w-3 h-3 rounded-full ${playInputCurrency === 'ETH' ? '' : 'border border-solid border-white'}`}
            />
          </button>
        </div>

        <Title>Buy lottery ticket</Title>
        <Balance className="flex flex-col">
          <p>
            Your Balance: {balanceInfo.foom ?? '…'} FOOM ($
            {balanceInfo.foomUsd !== undefined ? balanceInfo.foomUsd : '…'})
          </p>
          <p>Your ETH Balance: {balanceInfo.eth ? `${balanceInfo.eth} ETH` : !address ? 0 : '…'}</p>
        </Balance>

        <DetailsRow
          style={{
            justifyContent: 'center',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'stretch',
            flexWrap: 'wrap',
          }}
        >
          {['Small', 'Medium', 'Big'].map((label, index) => (
            <TicketButton
              key={label}
              onClick={() => {
                setSelectedJackpot(index)
                setSelectedTier(getBestTierForJackpot(index))
                setStepIndex(getBestTierForJackpot(index))
                handleTicketChange(label)
              }}
              style={{
                flex: '1 1 120px',
                minWidth: 120,
                maxWidth: 160,
                fontSize: '1rem',
                borderColor: stepIndex >= 0 && isJackpotButtonHighlighted(index, stepIndex) ? 'var(--accent)' : 'white',
                color: 'white',
                margin: '0 0.5rem 0.5rem 0',
                backgroundColor: 'transparent',
                boxShadow:
                  stepIndex >= 0 && isJackpotButtonHighlighted(index, stepIndex) ? '0 0 32px 8px #a7fbec47' : 'none',
                borderStyle: 'solid',
                borderWidth: '2px',
              }}
            >
              ~${formatNumber(Number(getTicketValue(jackpotLevels[index])))}
              <br />
              <span style={{ fontSize: '0.7rem' }}>{oddsValue[index]}</span>
            </TicketButton>
          ))}
        </DetailsRow>
        <SliderTooltipWrapper>
          <StyledSlider
            className="mb-2"
            min={0}
            max={steps.length - 1}
            value={stepIndex}
            step={1}
            onChange={e => setStepIndex(parseInt(e.target.value))}
            onMouseMove={e => {
              const slider = e.currentTarget
              setSliderLeft(getThumbLeft(slider))
            }}
            onMouseEnter={e => {
              setSliderHover(true)
              setSliderLeft(getThumbLeft(e.currentTarget))
            }}
            onMouseLeave={() => setSliderHover(false)}
            onTouchStart={e => {
              setSliderActive(true)
              setSliderLeft(getThumbLeft(e.currentTarget))
            }}
            onTouchMove={e => {
              setSliderLeft(getThumbLeft(e.currentTarget))
            }}
            onTouchEnd={() => setSliderActive(false)}
            onFocus={e => {
              setSliderActive(true)
              setSliderLeft(getThumbLeft(e.currentTarget))
            }}
            onBlur={() => setSliderActive(false)}
          />
          <SliderTooltip
            $visible={sliderHover || sliderActive}
            $left={sliderLeft}
          >
            Power: {stepIndex}
          </SliderTooltip>
        </SliderTooltipWrapper>

        <PrayersInput
          type="text"
          value={prayer}
          placeholder="Enter your prayer [optional]"
          onChange={e => setPrayer(e.target.value)}
        />

        {/* <label style={{ color: 'white', fontSize: '0.5rem' }}>
        Select power:
        <InputBox
          as="select"
          value={selectedTier}
          onChange={e => setSelectedTier(parseInt(e.target.value))}
        >
          {lotteryTiers.map((tier, index) => (
            <option key={index} value={index}>
              Power {index} (Price: ${getTicketValue(tier.price)})
            </option>
          ))}
        </InputBox>
      </label> */}

        {/* <DetailsRow>
        <InfoBlock>
          <Label>Ticket value</Label>
          <Value>${ticketValue}</Value>
        </InfoBlock>
        <InfoBlock>
          <Label>Winning odds</Label>
          <Value>{odds}</Value>
        </InfoBlock>
        <InfoBlock>
          <Label>Potential win</Label>
          <Value>${potentialWin}</Value>
        </InfoBlock>
      </DetailsRow> */}

        <TicketButton
          disabled={lottery.playMutation.isPending || generatingSecret}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleBuyTicket(playInputCurrency)}
        >
          {generatingSecret || lottery.playMutation.isPending ? <SpinnerText /> : `Buy this ticket: `}{' '}
          <b>
            ~$
            {formatNumber(
              Number(getTicketValue(lotteryTiers[selectedTier].price, playInputCurrency === 'ETH' ? true : false))
            )}
          </b>
        </TicketButton>

        {/* Secret Modal using react-modal */}
        <Modal
          isOpen={showSecretModal}
          onRequestClose={() => setShowSecretModal(false)}
          contentLabel="Save Your Ticket Secret"
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000 },
            content: {
              background: '#222',
              color: 'white',
              padding: typeof window !== 'undefined' && window.innerWidth <= 648 ? 12 : 32,
              borderRadius: 12,
              maxWidth: 400,
              margin: 'auto',
              textAlign: 'center',
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              transform: 'translate(-50%, -50%)',
              width: typeof window !== 'undefined' && window.innerWidth <= 648 ? 'calc(100vw - 64px)' : undefined,
              minWidth: 0,
              boxSizing: 'border-box',
            },
          }}
        >
          {generatingSecret ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
              }}
            >
              <SpinnerText />
              <div style={{ marginTop: 16 }}>Generating your secret…</div>
            </div>
          ) : (
            <>
              <h2>Save your Secret!</h2>
              <p style={{ color: '#ffb347', fontWeight: 'bold' }}>
                This secret is required to claim your winnings. If you lose it, you will lose access to your prize!
              </p>
              <div style={{ margin: '16px 0', wordBreak: 'break-all', fontSize: 14 }}>{pendingSecret}</div>
              {pendingSecret && (
                <a
                  href={secretDownloadUrl}
                  download={`lottery-secret-${pendingHash?.slice(0, 10) || 'ticket'}.txt`}
                  style={{
                    color: '#3498db',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    margin: '12px 0',
                    fontWeight: 'bold',
                    gap: 6,
                  }}
                  onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  <FaDownload style={{ marginRight: 6 }} />
                  Download Secret as .txt
                </a>
              )}
              <button
                style={{
                  marginTop: 16,
                  padding: '8px 24px',
                  background: '#7DFFCF',
                  color: 'black',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={handleConfirmSecret}
              >
                I have saved my secret, continue
              </button>
            </>
          )}
        </Modal>
        {/* <Link
        href="/rules"
        className="flex justify-between items-center mt-8 w-min flex-nowrap text-nowrap [&_*]:hover:underline"
      >
        <Footer>
          <ReadMoreLink style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            How do tickets work?
          </ReadMoreLink>
          &nbsp;Read more&nbsp;
          <img
            src="/icons/book.svg"
            alt="Book Icon"
          />
        </Footer>
      </Link> */}

        {/* Invest Modal */}
        <Modal
          isOpen={investModalOpen}
          onRequestClose={() => setInvestModalOpen(false)}
          contentLabel="Invest in Lottery"
          style={{
            overlay: { backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000 },
            content: {
              background: '#222',
              color: 'white',
              padding: typeof window !== 'undefined' && window.innerWidth <= 600 ? 0 : 32,
              borderRadius: 12,
              maxWidth: 400,
              width: '90vw',
              minWidth: 0,
              margin: 'auto',
              textAlign: 'center',
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              transform: 'translate(-50%, -50%)',
              boxSizing: 'border-box',
            },
          }}
        >
          <h2>Invest in Lottery</h2>
          <p style={{ color: '#ffb347', fontWeight: 'bold', marginBottom: 16 }}>
            Enter the amount you want to invest. This is the amount of FOOM you will contribute from your prize to the
            lottery pool and later earn from.
          </p>
          <input
            type="number"
            min="0"
            value={investAmount}
            onChange={e => setInvestAmount(e.target.value)}
            placeholder="Enter FOOM amount…"
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: 4,
              border: 'none',
              marginBottom: 16,
              background: '#444',
              color: 'white',
              fontSize: 14,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <Tooltip>
              <button
                style={{
                  padding: '8px 24px',
                  background: '#7DFFCF',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setInvest(investAmount)
                  setInvestModalOpen(false)
                  setInvestAmount('')
                }}
                disabled={!investAmount || Number(investAmount) <= 0}
              >
                Confirm Invest
              </button>
              <TooltipContent className="tooltip-content">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <InfoIcon />
                  Coming soon!
                </span>
              </TooltipContent>
            </Tooltip>
            <button
              style={{
                padding: '8px 24px',
                background: '#444',
                color: '#bbb',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
                cursor: 'not-allowed',
                opacity: 0.6,
              }}
              disabled
            >
              De-invest
            </button>
            <button
              style={{
                padding: '8px 24px',
                background: '#444',
                color: '#bbb',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
                cursor: 'not-allowed',
                opacity: 0.6,
              }}
              disabled
            >
              Collect Dividend
            </button>
            <p className="text-sm mt-2 text-gray-400">These settings will apply during the ticket collection phase.</p>
          </div>
        </Modal>
      </CardWrapper>
    </div>
  )
}
