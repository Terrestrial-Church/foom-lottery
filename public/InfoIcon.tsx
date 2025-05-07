import React from 'react'

const InfoIcon = ({ style = {}, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ marginRight: 4, ...style }}
    {...props}
  >
    <circle
      cx="8"
      cy="8"
      r="7"
      stroke="#00ffcc"
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="7.25"
      y="4"
      width="1.5"
      height="1.5"
      rx="0.75"
      fill="#00ffcc"
    />
    <rect
      x="7.25"
      y="7"
      width="1.5"
      height="5"
      rx="0.75"
      fill="#00ffcc"
    />
  </svg>
)

export default InfoIcon
