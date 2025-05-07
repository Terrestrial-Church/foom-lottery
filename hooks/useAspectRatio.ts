import { useLayoutEffect, useState } from 'react'

/**
 * useAspectRatio
 * Returns the current aspect ratio (width / height), a boolean if it's below a threshold,
 * and the current width and height.
 * @param threshold number (e.g. 1 for square, <1 for portrait, >1 for landscape)
 *
 * This hook is safe for SSR/Next.js server environments.
 */
export function useAspectRatio(threshold: number) {
  const [dims, setDims] = useState<{
    width: number
    height: number
    aspectRatio: number
  } | null>(null)
  const [isBelow, setIsBelow] = useState(false)

  useLayoutEffect(() => {
    function getDims() {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        aspectRatio: window.innerWidth / window.innerHeight,
      }
    }
    function handleResize() {
      const dims = getDims()
      setDims(dims)
      setIsBelow(dims.aspectRatio < threshold)
    }
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [threshold])

  return {
    aspectRatio: dims ? dims.aspectRatio : 1,
    isBelow,
    width: dims ? dims.width : 0,
    height: dims ? dims.height : 0,
  }
}
