import React, { useEffect, useState } from 'react'

const Frame: React.FC = () => {
  const ASPECT_RATIO = 1724 / 1457
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()

    const ua = window.navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !('MSStream' in window))

    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const updateFrameSize = () => {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      const pixelPadding = 4
      let width = windowWidth
      let height = width / ASPECT_RATIO

      if (height > windowHeight) {
        height = windowHeight
        width = height * ASPECT_RATIO - pixelPadding
      }

      setFrameSize({ width, height })
    }
    updateFrameSize()

    window.addEventListener('resize', updateFrameSize)
    return () => window.removeEventListener('resize', updateFrameSize)
  }, [])

  return (
    <>
      {!isMobile && frameSize.width > 0 && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: `calc((100vw - ${frameSize.width}px) / 2)`,
              height: '100dvh',
              background: 'linear-gradient(to bottom, #040e0b 0%, #05140c 25%, #000c08 50%, #02120a 75%, #08120a 100%)',
              zIndex: 2,
              pointerEvents: 'none',
              transition: 'width 0.3s',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: `calc((100vw - ${frameSize.width}px) / 2)`,
              height: '100dvh',
              background: 'linear-gradient(to bottom, #040e0b 0%, #05140c 25%, #000805 50%, #02120a 75%, #060f0a 100%)',
              zIndex: 2,
              pointerEvents: 'none',
              transition: 'width 0.3s',
            }}
          />
        </>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{
          position: 'fixed',
          minHeight: '100dvh',
          width: '100vw',
          height: '100dvh',
          top: 0,
          left: 0,
          backgroundImage: `url('/images/frame.avif')`,
          backgroundSize: isMobile ? 'cover' : 'auto 100dvh',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      {isIOS && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            bottom: 0,
            width: '100%',
            height: '40px',
            background: '#050f0c',
            zIndex: 1,
            pointerEvents: 'none',
            transform: 'translateY(36px)',
          }}
        />
      )}
    </>
  )
}

export default Frame
