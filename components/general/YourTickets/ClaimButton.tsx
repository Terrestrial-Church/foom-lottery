import SpinnerText from '@/components/shared/spinner-text'

interface ClaimButtonProps {
  ticket: string
  onClaim: () => void
  isLoading: boolean
  isPending?: boolean
  isLost: boolean
  disabled?: boolean
}

export function ClaimButton({ ticket, onClaim, isLoading, isPending, isLost, disabled = false }: ClaimButtonProps) {
  return (
    <button
      className="px-2 py-1 bg-accent text-black rounded disabled:opacity-50 text-nowrap font-bold disabled:cursor-not-allowed disabled:saturate-[0.25] disabled:brightness-75 hover:brightness-110"
      onClick={onClaim}
      disabled={isLoading || isLost || isPending /* || disabled */}
      style={{
        boxShadow: !isLoading && !isLost && !isPending ? '0 0 8px 1px #00ffd0, 0 0 16px 2px #00ffd088' : undefined,
        transition: 'box-shadow 0.2s',
        outline: !isLoading && !isLost && !isPending ? '2px solid #00ffd0' : undefined,
      }}
    >
      {isLoading ? <SpinnerText /> : 'Collect'}
    </button>
  )
}
