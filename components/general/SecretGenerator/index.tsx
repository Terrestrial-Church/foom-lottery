import { ConfirmCopyModal } from '@/components/general/YourTickets/ConfirmCopyModal'
import SpinnerText from '@/components/shared/spinner-text'
import CopyIcon from '@/components/ui/CopyIcon'
import { useStoreSecret } from '@/lib/db/useSecretDb'
import { makeSecret } from '@/lib/lottery/getHash'
import { bigintToHex } from '@/lib/lottery/utils/bigint'
import React, { useState } from 'react'
import { toast } from 'sonner'
import type { Hex } from 'viem'

interface SecretGeneratorProps {
  secret?: Hex
  onSecretChange: (secret: Hex) => void
  onSharedSecretChange: (secret: bigint) => void
  loading?: boolean
}

const SecretGenerator: React.FC<SecretGeneratorProps> = ({
  secret,
  onSecretChange,
  onSharedSecretChange,
  loading = false,
}) => {
  const [generatingSecret, setGeneratingSecret] = useState(false)
  const [showSecretMask, setShowSecretMask] = useState(true)
  const [showEyeTooltip, setShowEyeTooltip] = useState(false)
  const [showCopyTooltip, setShowCopyTooltip] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)

  useStoreSecret(secret)

  const handleGenerateSecret = async () => {
    setGeneratingSecret(true)
    try {
      const _secret = await makeSecret()
      const secretHex = bigintToHex(_secret.secret)
      const _secretUnshifted = `0x${secretHex.slice(4)}` as Hex

      onSecretChange(_secretUnshifted)
      onSharedSecretChange(_secret.secret)
    } finally {
      setGeneratingSecret(false)
    }
  }

  const handleInputChange = (value: string) => {
    onSecretChange(value as Hex)
    if (/^0x[0-9a-fA-F]{62}$/.test(value)) {
      try {
        onSharedSecretChange(BigInt(value))
      } catch {}
    }
  }

  return (
    <div>
      <h2 className="text-[20px] leading-[140%] font-bold text-white mt-6 mb-2">1# Generate your lucky secret.</h2>
      <div className="text-neutral-200 max-sm:mt-4">
        <div className="flex flex-row items-center justify-center">
          <div className="relative w-full flex flex-row flex-nowrap  border border-cyan-500/30 rounded-[7px]">
            <input
              type="text"
              className="w-full p-2 rounded-md bg-neutral-900/50 text-white pr-20"
              placeholder="Or enter your secret manually"
              value={secret ?? ''}
              onChange={e => handleInputChange(e.target.value)}
              disabled={loading || generatingSecret}
            />
            {secret && showSecretMask && (
              <div
                className="absolute pointer-events-none rounded-md sm:inset-[4px] inset-[13px]"
                style={{
                  position: 'absolute',
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 3vw, black 6vw, black calc(612px), transparent calc(648px))',
                  maskImage:
                    'linear-gradient(to right, transparent 3vw, black 6vw, black calc(612px), transparent calc(648px))',
                  background: '#001c06',
                  backgroundImage: "url('/images/tape-secret.png')",
                  backgroundRepeat: 'repeat',
                  backgroundSize: 'auto 100%',
                }}
              />
            )}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-full pl-3 flex flex-row flex-nowrap center gap-2 rounded-lg backdrop-blur-sm bg-[#03120ca0] px-2">
              {secret && (
                <div className="">
                  <button
                    className="text-lg text-cyan-400 hover:text-cyan-300 transition-colors relative"
                    onClick={() => setShowSecretMask(!showSecretMask)}
                    onMouseEnter={() => setShowEyeTooltip(true)}
                    onMouseLeave={() => setShowEyeTooltip(false)}
                  >
                    {showSecretMask ? '👁️' : '🙈'}
                  </button>
                  {showEyeTooltip && (
                    <div className="absolute right-0 -top-10 bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                      {showSecretMask ? 'Unhide secret!' : 'Hide secret!'}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
                    </div>
                  )}
                </div>
              )}
              {secret && (
                <div className="flex center">
                  <button
                    className="text-lg hover:text-cyan-300 transition-colors relative"
                    onClick={() => setShowCopyModal(true)}
                    onMouseEnter={() => setShowCopyTooltip(true)}
                    onMouseLeave={() => setShowCopyTooltip(false)}
                    aria-label="Copy secret"
                  >
                    <CopyIcon
                      size={22}
                      color="#22d3eee6"
                    />
                  </button>
                  {showCopyTooltip && (
                    <div className="absolute right-0 -top-10 bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                      Copy secret
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-800"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            className="bg-cyan-400 text-black px-4 py-2 rounded-md ml-2 disabled:opacity-50 font-bold"
            onClick={handleGenerateSecret}
            disabled={loading || generatingSecret}
          >
            {generatingSecret ? (
              <span className="inline-block whitespace-nowrap">
                Generating
                <SpinnerText />
              </span>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>
      <ConfirmCopyModal
        open={showCopyModal}
        onCancel={() => setShowCopyModal(false)}
        onConfirm={() => {
          if (secret) {
            navigator.clipboard.writeText(secret)
            toast.success('Secret copied to clipboard!')
          }
          setShowCopyModal(false)
        }}
      />
    </div>
  )
}

export default SecretGenerator
