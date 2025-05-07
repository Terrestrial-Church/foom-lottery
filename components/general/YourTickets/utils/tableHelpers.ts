export function injectTableStyles() {
  if (typeof window !== 'undefined') {
    const styleId = 'your-tickets-blink-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.innerHTML = `
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-blink {
          animation: blink 1s step-start 0s infinite;
        }
        @keyframes blink-jackpot {
          0%, 30% { opacity: 0.5; }
          30.0001%, 100% { opacity: 1; }
        }
        .animate-blink-jackpot {
          animation: blink-jackpot 1s step-start 0s infinite;
        }
        .breakout-x {
          position: relative;
          left: 50%;
          right: 50%;
          width: 100vw !important;
          max-width: 100vw !important;
          transform: translateX(-50%);
          margin-left: 0 !important;
          margin-right: 0 !important;
          background: inherit;
          z-index: 1;
        }
      `
      document.head.appendChild(style)
    }
  }
}

export function getChainIcon(chain: string) {
  const chainIconMap: Record<string, { src: string; alt: string; title: string }> = {
    '8453': { src: '/icons/base.webp', alt: 'Base', title: 'Base chain' },
    '1': { src: '/icons/eth.webp', alt: 'Ethereum', title: 'Ethereum mainnet' },
  }
  return chainIconMap[chain]
}
