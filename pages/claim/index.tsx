import { useState } from 'react'
import { useLotteryContract } from '@/lib/lottery/hooks/useLotteryContract'
import indexer from '@/lib/indexer'
import SpinnerText from '@/components/shared/spinner-text'

export default function ClaimTokenPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { playMutation, getHash } = useLotteryContract()

  const handleClaim = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const commitment = await getHash([`0x${Number(0).toString(16)}`, 0])
      await playMutation.mutateAsync({ power: 0, inputCurrency: 'ETH', _commitment: commitment })

      const mintResultQuery = await indexer.post('/lottery/mint', {
        data: commitment.secret_power,
        hash: commitment.hash,
      })
      setStatus(`Token minted! You should have received your coin now. TX: ${mintResultQuery.data.txHash}`)

      setSuccess(true)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-white min-h-screen">
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center border-b border-neutral-800 pb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
              <span className="text-cyan-400">FOOM</span> Claim
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto">
              Mint your exclusive ERC404 token in one click. Fast, easy, and yours to keep.
            </p>
          </div>

          <div className="text-lg text-neutral-200 mt-12 max-sm:mt-4 text-center">
            Experience the next generation of tokens. Claim your ERC404 and join the future of digital assets.
          </div>

          <div className="flex justify-center mt-4">
            <div className="border border-white bg-neutral-900/70 rounded shadow-lg p-8 flex flex-col items-center w-full max-w-md">
              <h2 className="text-3xl font-bold mb-4 text-cyan-400">Mint Your Coin</h2>
              <p className="mb-6 text-neutral-300 text-center">
                Ready to own a piece of the ERC404 revolution? Click below to mint your token instantly.
              </p>
              <button
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
                onClick={handleClaim}
                disabled={loading || success}
              >
                {loading ? <SpinnerText loader="Claiming..." /> : success ? 'Claimed!' : 'Claim Token'}
              </button>
              {status && <div className="mt-4 text-sm text-cyan-300">{status}</div>}
              {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-lg italic">“Power up. Play smart. Win big.”</p>
          </div>
        </div>
      </main>
    </div>
  )
}
