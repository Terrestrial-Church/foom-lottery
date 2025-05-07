import ReactDOM from 'react-dom'

interface ConfirmCopyModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmCopyModal({ open, onConfirm, onCancel }: ConfirmCopyModalProps) {
  if (!open || typeof window === 'undefined') return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-900 border border-white/20 rounded-lg p-6 shadow-xl min-w-[320px] max-w-[90vw]">
        <div className="mb-4 text-lg font-semibold text-yellow-400">Warning!</div>
        <div className="mb-6 text-white/80 text-sm">This will copy your secret to clipboard.</div>
        <div className="flex gap-4 justify-end">
          <button
            className="px-4 py-1 rounded border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1 rounded border border-yellow-500 bg-yellow-700 text-white hover:bg-yellow-800 transition-colors"
            onClick={onConfirm}
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
