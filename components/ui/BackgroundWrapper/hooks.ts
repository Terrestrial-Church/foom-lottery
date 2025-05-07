import { useEffect, useState } from 'react'

export interface StrobeData {
  id: number
  top: number
  opacity: number
  duration: number
}

export const useStrobes = () => {
  const [strobes, setStrobes] = useState<StrobeData[]>([])
  const strobeDuration = 250

  useEffect(() => {
    let timeout: NodeJS.Timeout

    const triggerStrobe = () => {
      const vh = window.innerHeight
      const randomTop = Math.floor(Math.random() * (vh - 8))
      const randomOpacity = 0.4 + Math.random() * 0.4
      const randomDuration = 1250 + Math.random() * (strobeDuration - 100)
      const uniqueId = Date.now() + Math.random()

      setStrobes(prev => [...prev, { id: uniqueId, top: randomTop, opacity: randomOpacity, duration: randomDuration }])

      setTimeout(() => {
        setStrobes(prev => prev.filter(s => s.id !== uniqueId))
      }, randomDuration)

      timeout = setTimeout(triggerStrobe, 700 + Math.random() * 1900)
    }

    triggerStrobe()

    return () => clearTimeout(timeout)
  }, [])

  return strobes
}

export const useCRTJump = () => {
  const [crtJumping, setCrtJumping] = useState(false)

  useEffect(() => {
    let jumpTimeout: NodeJS.Timeout
    let intervalTimeout: NodeJS.Timeout

    const triggerJump = () => {
      setCrtJumping(process.env.NEXT_PUBLIC_DEV_DISABLE_CRT_FLICKER ? false : true)
      jumpTimeout = setTimeout(() => setCrtJumping(false), 320)
      intervalTimeout = setTimeout(triggerJump, 350 + Math.random() * 2000)
    }

    triggerJump()

    return () => {
      clearTimeout(jumpTimeout)
      clearTimeout(intervalTimeout)
    }
  }, [])

  return crtJumping
}
