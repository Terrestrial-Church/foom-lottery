import { YourTickets } from '@/components/general/YourTickets'
import { useRestoreSecret } from '@/lib/db/useSecretDb'
import { safeHexToDecimal } from '@/lib/utils/ts'
import { useLottery } from '@/providers/LotteryProvider'
import { useEffect, useState } from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'
import type { Hex } from 'viem'
import BetsList from '../general/BetsList'
import CheckTicket from '../general/CheckTicket'
import PlayLottery from '../general/PlayLottery'
import SecretGenerator from '../general/SecretGenerator'
import SecretSimulator from '../general/SecretSimulator'
import Stats from './Stats'
import { renderColoredText } from '../../lib/react-utils'

declare global {
  interface Window {
    openCheckTicketModal?: () => void
    closeCheckTicketModal?: () => void
  }
}

const FlexContainer = styled.div<{ $isBelow: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  width: ${({ $isBelow }) => ($isBelow ? '100%' : '100vh')};
`

const Row = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
`

const StepDot = styled.div<{ $active: boolean }>`
  position: absolute;
  left: -48px;
  top: 0;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background-color: ${({ $active }) => ($active ? 'var(--accent)' : 'var(--background-primary)')};
  border: 2px solid ${({ $active }) => 'var(--accent)'};
  transition: all 0.3s ease;
  z-index: 1;

  @media (max-width: 1046px) {
    left: -25px;
  }
`

const StepLine = styled.div`
  position: absolute;
  left: -40.5px;
  top: 17px;
  width: 2px;
  height: calc(100% + 8px);
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: repeating-linear-gradient(
      to bottom,
      var(--accent) 0px,
      var(--accent) 2px,
      transparent 2px,
      transparent 9px
    );
  }

  @media (max-width: 1046px) {
    left: -17px;
  }
`

const StepRow = styled.div`
  position: relative;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
`

const Layout: React.FC = () => {
  const [showCheckTicket, setShowCheckTicket] = useState(false)
  const [hash, setHash] = useState<bigint | null>(null)
  const [secret, setSecret] = useState<Hex>()
  const [isClient, setIsClient] = useState(false)
  const [lotteryStep, setLotteryStep] = useState<1 | 2 | 3 | 4>(1)
  const lottery = useLottery()

  useRestoreSecret(secret => {
    setSecret(secret)
    setHash(safeHexToDecimal(secret))
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (showCheckTicket) {
      setTimeout(() => {
        const checkBtn = document.getElementById('check-ticket-btn')
        if (checkBtn) {
          ;(checkBtn as HTMLElement).click()
        }
      }, 100)
    }
  }, [showCheckTicket])

  /** @dev modal onclick global handler setup */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Modal.setAppElement('#__next')
    }
  }, [])
  useEffect(() => {
    window.openCheckTicketModal = () => setShowCheckTicket(true)
    window.closeCheckTicketModal = () => setShowCheckTicket(false)

    return () => {
      delete window.openCheckTicketModal
      delete window.closeCheckTicketModal
    }
  }, [])

  return (
    <div className="flex flex-col mb-[10vh]">
      <div className="flex center flex-col mb-16 mt-8 max-sm:mb-8 max-sm:mt-4 gap-[18px] text-[38px] leading-[140%] lg:w-[calc(100%+8vw)] lg:-translate-x-[4vw]">
        <h1 className="text-center font-bold">
          {renderColoredText('{FOOM.Cash} Lottery.')}
          <br />
          <span className="max-sm:hidden">
            {renderColoredText('Possibly The Most {Fair Lottery} in the World.')}
            <br />
          </span>
        </h1>
        <span className="text-[20px] text-[--accent] leading-[140%] max-sm:mb-1">
          Trustless and completely anonymous.
        </span>
      </div>

      <Row>
        <Stats />
      </Row>

      <StepRow>
        {/* #1 */}
        <StepDot
          $active={lotteryStep >= 1}
          className="translate-y-[30px]"
        />
        <StepLine className="translate-y-[30px]" />
        <div className="w-full">
          <SecretGenerator
            secret={secret}
            onSecretChange={setSecret}
            onSharedSecretChange={setHash}
          />
        </div>
      </StepRow>

      <StepRow>
        {/* #2 */}
        <StepDot
          $active={lotteryStep >= 2}
          className="translate-y-[54px]"
        />
        <StepLine className="translate-y-[54px]" />
        <div className="w-full">
          <SecretSimulator secret={secret} />
        </div>
      </StepRow>

      <StepRow>
        {/* #3 */}
        <StepDot
          $active={lotteryStep >= 3}
          className="translate-y-[38px]"
        />
        <StepLine className="translate-y-[66px] !h-[calc(100%-24px)]" />
        <PlayLottery customSecret={hash} />
      </StepRow>

      <StepRow>
        {/* #4 */}
        <StepDot
          $active={lotteryStep >= 4}
          className="translate-y-[46px]"
        />
        <YourTickets />
      </StepRow>

      <Modal
        isOpen={showCheckTicket}
        onRequestClose={() => setShowCheckTicket(false)}
        className="!rounded-[16px] bg-[var(--background)] border !border-[var(--border-primary)] shadow-xl p-4 sm:p-6 max-w-lg mx-2 my-0 sm:mt-32 -translate-y-8 outline-none z-50 max-h-[90vh] overflow-y-auto fixed bottom-0 left-0 right-0 sm:static sm:rounded-lg sm:my-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-40"
        contentLabel="Check Ticket Modal"
        shouldCloseOnOverlayClick={true}
      >
        <CheckTicket onClose={() => setShowCheckTicket(false)} />
      </Modal>

      {/* <HackBanner /> */}

      <Row>
        <p className="text-[20px] leading-[140%] font-bold mt-8 max-sm:mt-6 -mb-2">Last plays:</p>
        <BetsList />
      </Row>

      <span className="text-[10px] text-neutral-400 mt-4">
        FOOM.Cash is fully open source:{' '}
        <a
          href="https://github.com/Terrestrials/foomlottery"
          target="_blank"
          className="text-white font-bold hover:underline"
          rel="noopener noreferrer"
        >
          Github
        </a>{' '}
        <div></div>
        FOOM.Cash is part of Foom Club — AGI Ecosystem:{' '}
        <a
          href="https://foom.club"
          target="_blank"
          className="text-white font-bold hover:underline"
          rel="noopener noreferrer"
        >
          foom.club
        </a>
      </span>
    </div>
  )
}

export default Layout
