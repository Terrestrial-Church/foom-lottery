import Modal from 'react-modal'
import { RelayerType, CollectMutationType } from './types'

interface RelayerModalProps {
  showRelayerModal: boolean
  setShowRelayerModal: (show: boolean) => void
  selectedRelayer: RelayerType | null
  setSelectedRelayer: (relayer: RelayerType | null) => void
  collectViaRelayerMutation: CollectMutationType
  chain: any
}

export default function RelayerModal({
  showRelayerModal,
  setShowRelayerModal,
  selectedRelayer,
  setSelectedRelayer,
  collectViaRelayerMutation,
  chain,
}: RelayerModalProps) {
  return (
    <Modal
      isOpen={showRelayerModal}
      onRequestClose={() => setShowRelayerModal(false)}
      className="relative z-50 outline-none m-2"
      overlayClassName="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-40"
      contentLabel="Choose a relayer"
    >
      <div className="bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] rounded-xl border border-[#00ffcc] shadow-2xl p-8 max-w-lg w-full mx-auto relative overflow-hidden">
        {/* Cyberpunk glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00ffcc] via-transparent to-[#00ffcc] opacity-10 blur-3xl"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00ffcc] to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00ffcc] to-transparent"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00ffcc] to-[#ffffff] bg-clip-text text-transparent mb-2">
              Choose a Relayer
            </h2>
            <p className="text-gray-400 text-sm">Select a relayer to process your reward collection</p>
          </div>

          {/* Relayer Options */}
          <div className="space-y-4 mb-8">
            <button
              className={`w-full p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                selectedRelayer === 'secondary'
                  ? 'border-[#00ffcc] bg-gradient-to-r from-[#00ffcc]/20 to-[#00ffcc]/10 text-[#00ffcc] shadow-lg shadow-[#00ffcc]/20'
                  : 'border-gray-600 bg-gray-800/50 text-white hover:border-[#00ffcc]/50 hover:bg-gray-700/50'
              }`}
              onClick={() => setSelectedRelayer('secondary')}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold">Official Relayer</span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono break-all">
                    0x442de4B67B9cB75f73b33Df3B11F694C89F811c2
                  </div>
                </div>
                {selectedRelayer === 'secondary' && <div className="text-[#00ffcc] text-xl">✓</div>}
              </div>
            </button>

            <div className="relative group">
              <button
                disabled
                className={`w-full p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedRelayer === 'main'
                    ? 'border-[#00ffcc] bg-gradient-to-r from-[#00ffcc]/20 to-[#00ffcc]/10 text-[#00ffcc] shadow-lg shadow-[#00ffcc]/20'
                    : 'border-gray-600 bg-gray-800/50 text-white hover:border-[#00ffcc]/50 hover:bg-gray-700/50'
                } disabled:shadow-none disabled:opacity-50`}
                onClick={() => setSelectedRelayer('main')}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="font-semibold">Secondary Relayer</span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono break-all">
                      0x8C1eC61c722Ff48531c84D4769bFbFe291015511
                    </div>
                  </div>
                  {selectedRelayer === 'main' && <div className="text-[#00ffcc] text-xl">✓</div>}
                </div>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-[#00ffcc] text-sm rounded-lg border border-[#00ffcc]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                Soon!
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#00ffcc]/30"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              className="flex-1 bg-gradient-to-r from-[#00ffcc] to-[#00d4aa] hover:from-[#00d4aa] hover:to-[#00ffcc] text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg shadow-[#00ffcc]/20"
              disabled={!selectedRelayer}
              onClick={() => {
                setShowRelayerModal(false)
                collectViaRelayerMutation.mutate({
                  chain: chain?.id!,
                })
              }}
            >
              Collect Reward
            </button>
            <button
              className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
              onClick={() => setShowRelayerModal(false)}
            >
              Cancel
            </button>
          </div>

          {/* Close button */}
          <button
            className="absolute -top-2 -right-2 text-gray-400 hover:text-[#00ffcc] transition-colors duration-300"
            onClick={() => setShowRelayerModal(false)}
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
        </div>
      </div>
    </Modal>
  )
}
