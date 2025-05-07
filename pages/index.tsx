import { Heading } from '@/components/ui/landing/Heading'
import { Stats } from '@/components/ui/landing/Stats'
import { StepCards } from '@/components/ui/landing/StepCards'
import { FeatureCards } from '@/components/ui/landing/FeatureCards'
import { FAQ } from '@/components/ui/landing/FAQ'
import { renderColoredText } from '@/lib/react-utils'
import '@reown/appkit-wallet-button/react'
import Link from 'next/link'
import { DefilamaLogo } from '@/components/shared/icons/defiLamaLogo'

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-[180px] max-sm:gap-16 mb-[128px] max-sm:mb-4">
      <div className="mb-[54px] flex flex-col gap-16 center leading-[140%]">
        <Heading
          title="The {Anonymous Lottery.}\nYour Private Path {to Winning.}"
          subtitle="Break the on-chain link. Play with advanced zk-snarks\ncryptography for three simultaneous prizes."
        />
        <Link
          href="https://defillama.com/protocol/treasury/foom"
          target="_blank"
          className="whitespace-pre-wrap center flex flex-col gap-2 text-[18px] text-[#C4C4C4] hover:underline active:underline transition-colors duration-200 hover:text-accent active:text-accent"
        >
          <span className="inline-block items-center gap-2 relative w-auto">
            {renderColoredText('{Backed} by {~32,000} ETH treasury')}
            <div className="absolute right-0 translate-x-full top-1/2 -translate-y-1/2">
              <DefilamaLogo />
            </div>
          </span>
          <span>{renderColoredText("{True privacy} is not a feature; it's {the foundation}")}</span>
        </Link>
        <div>
          <Link
            href="/game"
            className="select-none flex flex-nowrap center py-[18px] px-9 gap-[18px] border-2 rounded-lg border-accent font-bold text-accent text-[24px] bg-[#0E1D16] transition-shadow duration-200 hover:shadow-[0_0_16px_4px_rgba(0,255,200,0.5)] focus:shadow-[0_0_16px_4px_rgba(0,255,200,0.7)]"
          >
            <img src="/icons/landing/cash.svg" />
            <span>Enter anonymously</span>
          </Link>
          <p className="text-[#C0C0C0] text-[14px] mt-3">Available on Ethereum Mainnet & Base</p>
        </div>

        <div className="sm:mt-[70px]">
          <Stats />
        </div>
      </div>
      <div>
        <Heading
          title="Your {4 Steps} to {Private Winnings}"
          subtitle="Our process is designed for maximum security and simplicity."
        />
        <div className="mt-[76px]">
          <StepCards />
        </div>
      </div>
      <div className="mb-[54px]">
        <Heading
          title="The {Unbreakable} Lottery: {Decentralized} and {Encrypted}"
          subtitle="We believe privacy is a fundamental right, for humans and future AI alike."
        />
        <div className="flex flex-col gap-x-8 gap-y-[86px] mt-[120px] max-sm:mt-4">
          <FeatureCards />
        </div>
      </div>
      <div className="max-sm:mb-24">
        <Heading title="{F}requently {A}sked {Q}uestions" />
        <FAQ />
      </div>
    </div>
  )
}
