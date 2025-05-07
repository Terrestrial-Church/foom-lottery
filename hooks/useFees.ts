import { useEffect, useState } from 'react'
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer'

export interface FeeData {
  feeFoom: number
  refundEth: number
  _relayer: string
}

export function useFees() {
  const [fees, setFees] = useState<FeeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentIndexer = useCurrentIndexer()

  useEffect(() => {
    async function fetchFees() {
      setLoading(true)
      setError(null)

      try {
        let text: string
        try {
          const res = await currentIndexer.get('/lottery/fees')
          text = res.data
        } catch {
          /** @dev fallback */
          text = '10000000,0.001,0x67b184FE307c7d0dBE5310BF9A997d26F34911f2'
        }

        const [feeFoom, refundEth, _relayer] = text.trim().split(',')
        setFees({
          feeFoom: Number(feeFoom),
          refundEth: Number(refundEth),
          _relayer: _relayer.trim(),
        })
      } catch (e: any) {
        setError(e.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchFees()
  }, [])

  return { fees, loading, error }
}
