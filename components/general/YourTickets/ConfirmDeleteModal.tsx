import ReactDOM from 'react-dom'
import { maskSecret } from './utils/formatters'

interface ConfirmDeleteModalProps {
  open: boolean
  ticket: string | null
  index?: number | null
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({ open, ticket, index, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  if (!open || typeof window === 'undefined') return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-900 border border-white/20 rounded-lg p-6 shadow-xl min-w-[320px] max-w-[90vw]">
        {/** TODO: Check the ticket reward too */}
        <div className="mb-4 text-lg font-semibold text-white">Delete Ticket?</div>
        <div className="mb-6 text-white/80 text-sm">
          Are you sure you want to delete this ticket?
          <br />
          <span className="break-all text-xs text-white/60">
            {maskSecret(ticket, { end: 4 })}
            {typeof index === 'number' ? `,${index}` : ''}
          </span>
        </div>
        <div className="flex gap-4 justify-end">
          <button
            className="px-4 py-1 rounded border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 rounded border border-red-500 bg-red-700 text-white hover:bg-red-800 transition-colors"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
