import React from 'react'
import { Strobe } from './styles'
import { useStrobes } from './hooks'

export const StrobeEffect: React.FC = () => {
  const strobes = useStrobes()

  if (process.env.NEXT_PUBLIC_DEV_DISABLE_CRT_STROBE) {
    return null
  }

  return (
    <>
      {strobes.map(s => (
        <Strobe
          key={s.id}
          $top={s.top}
          $opacityVal={s.opacity}
          $duration={s.duration}
        />
      ))}
    </>
  )
}
