import React from 'react'
import { BackgroundWrapperStyled } from './styles'
import { StrobeEffect } from './StrobeEffect'
import { useCRTJump } from './hooks'
import { useRouter } from 'next/router'
import { _log } from '@/lib/utils/ts'

interface BackgroundWrapperProps {
  children: React.ReactNode
}

const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({ children }) => {
  const crtJumping = useCRTJump()
  const router = useRouter()

  const isLanding = router?.pathname === '/'

  return (
    <BackgroundWrapperStyled
      $dimmed={isLanding}
      $crtJumping={crtJumping}
    >
      <StrobeEffect />
      {children}
    </BackgroundWrapperStyled>
  )
}

export default BackgroundWrapper
