import React, { useEffect, useState } from 'react'

interface Props {
  loader?: string
  interval?: number
  time?: string
  shuffle?: boolean
}

export default function SpinnerText({ loader = '...', interval = 200, time = 'duration-200', shuffle = false }: Props) {
  const [transparentIndex, setTransparentIndex] = useState(0)
  const [shuffled, setShuffled] = useState(Array.from(loader))
  const charsLength = Array.from(loader).length

  useEffect(() => {
    let tick = 0
    const _interval = setInterval(() => {
      setTransparentIndex(prev => (prev + 1) % (charsLength + 1))

      if (shuffle) {
        tick++
        if (tick % charsLength === 0) {
          setShuffled(prev => {
            const arr = [...prev]
            for (let i = arr.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[arr[i], arr[j]] = [arr[j], arr[i]]
            }
            return arr
          })
        }
      }
    }, interval)

    return () => {
      clearInterval(_interval)
    }
  }, [interval, loader, shuffle, charsLength])

  const chars = shuffle ? shuffled : Array.from(loader)

  return (
    <span>
      {chars.map((element, index) => (
        <span
          className={`inline-block whitespace-nowrap transition-all ${time} ease-out ${
            transparentIndex === index ? 'opacity-0 -translate-y-[0.125em]' : ''
          }`}
          key={`${element}_${index}`}
        >
          {element}
        </span>
      ))}
    </span>
  )
}
