import styled, { keyframes, css } from 'styled-components'
import React from 'react'

const crtStrobe = keyframes`
  0% { opacity: 0; transform: translateY(-8px); }
  20% { opacity: var(--strobe-opacity, 0.3); transform: translateY(0); }
  80% { opacity: var(--strobe-opacity, 0.3); transform: translateY(4px); }
  100% { opacity: 0; transform: translateY(8px); }
`

const crtJump = keyframes`
  0% { transform: translateY(0); }
  8% { transform: translateY(-0.5px); }
  12% { transform: translateY(2px); }
  20% { transform: translateY(-1px); }
  28% { transform: translateY(1px); }
  32% { transform: translateY(0); }
  100% { transform: translateY(0); }
`

export const Strobe = styled.div.attrs<{ $top: number; $opacityVal: number; $duration: number }>(props => ({
  style: {
    top: `${props.$top}px`,
    '--strobe-opacity': props.$opacityVal,
    animationDuration: `${props.$duration}ms`,
  } as React.CSSProperties,
}))`
  pointer-events: none;
  position: fixed;
  left: 0;
  width: 100%;
  height: 12px;
  mix-blend-mode: color-dodge;
  background: linear-gradient(
    to bottom,
    rgba(28, 150, 105, 0) 0%,
    rgba(28, 150, 105, calc(var(--strobe-opacity, 0.3) * 0.7)) 30%,
    rgba(129, 217, 217, var(--strobe-opacity, 0.3)) 70%,
    rgba(129, 217, 217, 0) 100%
  );
  z-index: 1;
  opacity: 0;
  animation: ${crtStrobe} linear;
  will-change: opacity, transform;
  box-shadow: 16px 0 32px 8px #000000a0;
  backdrop-filter: blur(1px) brightness(1.2) contrast(1.3) drop-shadow(16px 0 12px #7dffcf);
  transform: translateX(18px) skewX(-12deg) scaleX(1.12);
`

export const BackgroundWrapperStyled = styled.div<{ $crtJumping?: boolean; $dimmed?: boolean }>`
  position: relative;
  min-height: 100vh;
  width: 100%;
  z-index: 0;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    filter: brightness(${({ $dimmed }) => ($dimmed ? 0.4 : 1.1)}) saturate(${({ $dimmed }) => ($dimmed ? 1.15 : 1.1)});
    background-image: url('/images/background.avif');
    background-size: auto 100vh;
    background-position: center;
    background-repeat: no-repeat;
    z-index: -1;
    pointer-events: none;
    will-change: transform, filter;
    transition:
      filter 1.5s cubic-bezier(0.4, 0, 0.2, 1),
      background-size 1.5s cubic-bezier(0.4, 0, 0.2, 1),
      background-position 1.5s cubic-bezier(0.4, 0, 0.2, 1),
      transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    animation: ${({ $crtJumping }) =>
      $crtJumping
        ? css`
            ${crtJump} 0.32s steps(1, end)
          `
        : 'none'};
  }

  @media (max-width: 768px) {
    &::before {
      background-size: cover;
      background-position: center;
    }
  }
`
