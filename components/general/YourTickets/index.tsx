import React, { useLayoutEffect, useRef, useState } from 'react'
import { useChainId } from 'wagmi'
import { base } from 'viem/chains'
import { useLocalStorage } from 'usehooks-ts'
import { useLottery } from '@/providers/LotteryProvider'
import { useTicketData } from './hooks/useTicketData'
import { useTicketActions } from './hooks/useTicketActions'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { TicketTable } from './TicketTable'
import { OldTicketsTable } from './OldTicketsTable'
import { injectTableStyles } from './utils/tableHelpers'
import { useRoundEndCountdown } from './useRoundEndCountdown'
import { toast } from 'sonner'

export function YourTickets() {
  const [showMask, setShowMask] = useState(false)
  const [breakout, setBreakout] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [lsTickets] = useLocalStorage<
    ({ ticket: string; index: string; date: string } /** @dev V0.1 */ | string) /** @dev V0.2 */[]
  >('lotteryTickets', [])
  const [showOldTickets, setShowOldTickets] = useState(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('showOldTickets')
      return v === null ? true : v === 'true'
    }
    return true
  })

  const lottery = useLottery()
  const chainId = useChainId()
  const { claiming, confirmDelete, handleClaim, handleDeleteTicket, confirmDeleteAction, cancelDeleteAction } =
    useTicketActions()
  const { processedData } = useTicketData()
  const { isLoading: isCountdownLoading, isAboutNow, hours, minutes, secondsLeft } = useRoundEndCountdown()

  useLayoutEffect(() => {
    function checkMask() {
      const element = scrollRef.current
      if (!element) return
      const isPortrait = window.innerHeight > window.innerWidth
      setShowMask(
        element.scrollWidth > element.clientWidth && element.scrollLeft + element.clientWidth < element.scrollWidth - 2
      )
      setBreakout(isPortrait && element.scrollWidth > element.clientWidth)
    }
    checkMask()
    const el = scrollRef.current
    if (!el) return
    const resizeObserver = new window.ResizeObserver(() => {
      checkMask()
    })
    resizeObserver.observe(el)
    el.addEventListener('scroll', checkMask)
    window.addEventListener('resize', checkMask)
    return () => {
      resizeObserver.disconnect()
      if (el) el.removeEventListener('scroll', checkMask)
      window.removeEventListener('resize', checkMask)
    }
  }, [processedData.length])

  injectTableStyles()

  return (
    <div className="w-full flex flex-col mb-2 relative">
      <ConfirmDeleteModal
        open={confirmDelete.open}
        ticket={confirmDelete.ticket}
        index={confirmDelete.index}
        onConfirm={confirmDeleteAction}
        onCancel={cancelDeleteAction}
      />

      {lottery.isClient && (
        <div className="w-full break-all whitespace-pre-wrap">
          <p className="text-[20px] leading-[140%] font-bold mt-8 py-2">4# Your lottery tickets:</p>

          <div className="text-cyan-200 text-sm mb-2">
            <div className="flex flex-col">
              <span>
                {isCountdownLoading
                  ? 'Loading round time...'
                  : isAboutNow
                    ? 'Rewards will be drawn in round end anytime now! Please be patient.'
                    : hours === 0 && minutes === 0 && secondsLeft > 0
                      ? 'Rewards will be drawn in round end in less than 1 minute.'
                      : `Rewards will be drawn in round end in about ~${hours ? `${hours} hours and ` : ''}${minutes} minutes.`}
              </span>
            </div>
          </div>

          <TicketTable
            {...{
              data: processedData,
              claiming,
              onClaim: handleClaim,
              onDelete: handleDeleteTicket,
              showMask,
              breakout,
              scrollRef,
            }}
          />

          {!lottery?.tickets?.length && (
            <div className="py-4 center">
              {`You have no ${lsTickets?.length ? 'new tickets' : `tickets on ${chainId === base.id ? 'Base' : 'Ethereum'}`} yet!`}
            </div>
          )}

          {!!lsTickets?.length && (
            <div className="mt-1">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                  marginTop: 8,
                  margin: 0,
                  background: 'rgba(0,0,0, 0.5)',
                  color: '#ddd',
                  padding: '4px 14px',
                  borderRadius: 6,
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                {/** Baza starych symulacji - powrot do sekretow ktore sie komus podobaly, a np. nie zostaly wykonane. */}
                <p>Older tickets:</p>
                <button
                  style={{
                    fontSize: 12,
                    padding: '2px 10px',
                    borderRadius: 4,
                    border: '1px solid #444449a',
                    background: '#1818189a',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setShowOldTickets(v => {
                      localStorage.setItem('showOldTickets', String(!v))
                      return !v
                    })
                  }
                >
                  [{showOldTickets ? 'hide' : 'show'}]
                </button>
              </div>

              {showOldTickets && <OldTicketsTable {...{ tickets: lsTickets }} />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
