import React, { useState } from 'react'
import { _redact } from '@/lib/lottery'
import { toast } from 'sonner'
import { ConfirmCopyModal } from './ConfirmCopyModal'
import CopyIcon from '@/components/ui/CopyIcon'
import { maskSecret } from '@/components/general/YourTickets/utils/formatters'

interface OldTicketsTableProps {
  tickets: ({ ticket: string; index: string; date: string } | string)[]
}

export function OldTicketsTable({ tickets }: OldTicketsTableProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingCopy, setPendingCopy] = useState<string | null>(null)

  const handleCopyClick = (ticketStr: string) => {
    setPendingCopy(ticketStr)
    setModalOpen(true)
  }

  const handleConfirmCopy = () => {
    if (pendingCopy) {
      navigator.clipboard.writeText(pendingCopy)
      toast('Copied!')
    }
    setModalOpen(false)
    setPendingCopy(null)
  }

  const handleCancelCopy = () => {
    setModalOpen(false)
    setPendingCopy(null)
  }

  return (
    <>
      <table className="w-full border border-neutral-800 text-xs mt-2 bg-neutral-900/40 rounded shadow-none">
        <thead className="bg-neutral-900/30 text-cyan-300">
          <tr>
            <th className="border border-neutral-800 px-2 py-1 text-left font-normal whitespace-nowrap">Secret</th>
            <th
              className="border border-neutral-800 px-2 py-1 text-left font-normal whitespace-nowrap"
              style={{ width: 1, minWidth: 0, textAlign: 'center' }}
            >
              Time
            </th>
            <th
              className="border border-neutral-800 px-2 py-1 text-left font-normal whitespace-nowrap"
              style={{ width: 1, minWidth: 0 }}
            ></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket, i) => {
            let ticketStr = typeof ticket === 'string' ? ticket : ticket.ticket
            let redacted = maskSecret(ticketStr, { start: 8 }) as string
            let date =
              typeof ticket === 'object' && ticket !== null && ticket.date
                ? new Date(ticket.date).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'
            return (
              <tr key={typeof ticket === 'string' ? `${i}_${ticket}` : `${i}_${ticket.ticket}_${ticket.index}`}>
                <td className="border border-neutral-800 px-2 py-1 text-white/60">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{redacted}</span>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        marginLeft: 8,
                        cursor: 'pointer',
                        verticalAlign: 'middle',
                        display: 'inline-block',
                        opacity: 0.7,
                      }}
                      onClick={() => handleCopyClick(ticketStr)}
                      title="Copy ticket secret"
                      aria-label="Copy ticket secret"
                    >
                      <CopyIcon
                        color="#99ff99"
                        size={16}
                      />
                    </button>
                  </div>
                </td>
                <td
                  className="border border-neutral-800 px-2 py-1 text-white/60"
                  style={{ width: 1, minWidth: 0, textAlign: 'center', whiteSpace: 'nowrap' }}
                >
                  {date}
                </td>
                <td
                  className="border border-neutral-800 px-2 py-1 text-white/60"
                  style={{ width: 1, minWidth: 0, textAlign: 'right' }}
                ></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <ConfirmCopyModal
        open={modalOpen}
        onConfirm={handleConfirmCopy}
        onCancel={handleCancelCopy}
      />
    </>
  )
}
