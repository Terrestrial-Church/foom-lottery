import { useAspectRatio } from '@/hooks/useAspectRatio'
import { _log } from '@/lib/utils/ts'
import Link from 'next/link'
import { useMediaQuery } from 'react-responsive'
import { useEffect, useState } from 'react'

function detectMobile() {
  if (typeof window === 'undefined') {
    return false
  }

  const ua = window.navigator.userAgent
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
}

const Footer = () => {
  const [isMobile, setIsMobile] = useState(false)

  const aspectRatio = useAspectRatio(1)
  const isMediaMobile = useMediaQuery({ maxWidth: 640 })

  useEffect(() => {
    setIsMobile(isMediaMobile || detectMobile())
  }, [isMediaMobile])

  const isTall = aspectRatio.height > 896 || isMobile

  return (
    <div
      className={`${
        isTall ? 'w-full' : 'w-[calc(100%-32px)] mx-[16px]'
      } flex items-center mt-4 fixed bottom-0 left-0 bg-gradient-to-b from-transparent to-[#050f0c] z-10
        ${isTall ? 'flex-col justify-end' : 'justify-between'}`}
    >
      <Link
        href={`https://github.com/Terrestrial-Church/foom-lottery/commit/${process.env.NEXT_PUBLIC_GIT_COMMIT}/`}
        target="_blank"
        className="text-xs opacity-70 hover:underline active:underline max-sm:text-[8px] max-sm:translate-y-0.5"
      >
        rev. {process.env.NEXT_PUBLIC_GIT_COMMIT}
      </Link>
      <p className="mb-3.5 max-sm:text-xs">&copy; FOOM AI corporation 2025</p>
    </div>
  )
}

export default Footer
