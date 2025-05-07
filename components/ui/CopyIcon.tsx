import React from 'react'

const CopyIcon: React.FC<{ color?: string; size?: number }> = ({ color = 'white', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="6"
      y="6"
      width="9"
      height="9"
      rx="2"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <rect
      x="3"
      y="3"
      width="9"
      height="9"
      rx="2"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
)

export default CopyIcon
