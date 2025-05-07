import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { base, mainnet } from 'viem/chains'
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer'
import { useChainId } from 'wagmi'
import { _log } from '@/lib/utils/ts'
import { useLottery } from '@/providers/LotteryProvider'

const ROUND_LENGTH_APPROX_SECONDS = {
  [base.id]: 35 * 60,
  [mainnet.id]: 1.5 * 60 * 60,
}

export function useRoundEndCountdown() {
  const chainId = useChainId()
  const indexer = useCurrentIndexer()
  const [secondsPassed, setSecondsPassed] = useState(0)
  const lottery = useLottery()

  const { data, isLoading } = useQuery({
    queryKey: [
      'lottery/round-time',
      chainId,
      /** @dev refetch on round update (last tree bet index update) */ lottery?.lastLeaf?.nextIndex,
    ],
    queryFn: async () => {
      const res = await indexer.get('lottery/round-time')
      return res.data
    },
    /** @dev refetch each max only */
    refetchInterval: ROUND_LENGTH_APPROX_SECONDS[chainId] * 1_000,
  })

  const roundLength = ROUND_LENGTH_APPROX_SECONDS[chainId]
  const secondsLeft = roundLength - secondsPassed
  const isAboutNow = secondsLeft <= 0
  const hours = Math.floor(Math.max(0, secondsLeft) / 3600)
  const minutes = Math.floor((Math.max(0, secondsLeft) % 3600) / 60)

  useEffect(() => {
    _log('Seconds left (round):', secondsLeft, roundLength, secondsPassed)

    if (data?.seconds === undefined) {
      return
    }

    setSecondsPassed(data.seconds)

    const interval = setInterval(() => {
      setSecondsPassed(prev => prev + 60)
    }, 60_000)
    return () => clearInterval(interval)
  }, [data?.seconds])

  return {
    isLoading,
    isAboutNow,
    hours,
    minutes,
    secondsLeft,
  }
}
