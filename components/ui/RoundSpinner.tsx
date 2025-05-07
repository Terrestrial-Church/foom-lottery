import React from 'react'

export function RoundSpinner() {
  return (
    <span style={{ display: 'inline-block', width: 20, height: 20 }}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 50 50"
        style={{ display: 'block' }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </span>
  )
}
