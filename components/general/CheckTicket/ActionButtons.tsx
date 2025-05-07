import { TicketButton } from '../../ui/CyberpunkCardLayout'
import SpinnerText from '../../shared/spinner-text'
import { WitnessType, CollectMutationType } from './types'

interface ActionButtonsProps {
  witness: WitnessType | undefined
  collectManuallyMutation: CollectMutationType
  collectViaRelayerMutation: CollectMutationType
  setShowRelayerModal: (show: boolean) => void
  relayerSuccess: string | null
}

export default function ActionButtons({
  witness,
  collectManuallyMutation,
  collectViaRelayerMutation,
  setShowRelayerModal,
  relayerSuccess,
}: ActionButtonsProps) {
  if (!witness) return null

  return (
    <>
      <div className="w-full space-y-3">
        <div className="flex gap-4">
          <TicketButton
            className="flex-1 !text-[16px] !bg-gradient-to-r from-[#00ffcc] to-[#00d4aa] hover:from-[#00d4aa] hover:to-[#00ffcc] !text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg shadow-[#00ffcc]/20"
            onClick={() => collectManuallyMutation.mutate()}
            disabled={collectManuallyMutation.isPending}
          >
            {collectManuallyMutation.isPending ? (
              <SpinnerText />
            ) : (
              <>
                Collect the reward <span className="font-normal">[manually]</span>
              </>
            )}
          </TicketButton>

          <TicketButton
            className="flex-1 !text-[16px] !bg-gradient-to-r from-[#00ffcc] to-[#00d4aa] hover:from-[#00d4aa] hover:to-[#00ffcc] !text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg shadow-[#00ffcc]/20"
            onClick={() => setShowRelayerModal(true)}
            disabled={collectViaRelayerMutation.isPending}
          >
            {collectViaRelayerMutation.isPending ? (
              <SpinnerText />
            ) : (
              <>
                Collect the reward <span className="font-normal">[via relayer]</span>
              </>
            )}
          </TicketButton>
        </div>
      </div>

      {/* Success message */}
      {relayerSuccess && (
        <div className="w-full bg-gradient-to-r from-green-900/50 to-green-800/50 border border-green-500/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-green-400 font-medium">{relayerSuccess}</p>
          </div>
        </div>
      )}
    </>
  )
}
