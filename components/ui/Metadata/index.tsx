import { LOTTERY } from '@/lib/utils/constants/addresses'
import React from 'react'
import { base, mainnet } from 'viem/chains'

const BASESCAN_URL = `https://basescan.org/address/${LOTTERY[base.id]}`
const ETHERSCAN_URL = `https://etherscan.io/address/${LOTTERY[mainnet.id]}`
const GITHUB_URL = 'https://github.com/Terrestrials/foomlottery'

export default function Metadata() {
  return (
    <div className="flex flex-col gap-0 flex-grow center text-sm">
      Sources:
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[--accent] underline hover:text-cyan-300"
      >
        See Lottery source code on GitHub
      </a>
      <a
        href={BASESCAN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[--accent] underline hover:text-cyan-300"
      >
        See FoomLottery contract on BaseScan
      </a>
      <a
        href={ETHERSCAN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[--accent] underline hover:text-cyan-300"
      >
        See FoomLottery contract on Etherscan
      </a>
    </div>
  )
}
