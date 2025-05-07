import { FeatureCard } from './FeatureCard'

const features = [
  {
    image: '/images/landing/anonymity.avif',
    title: 'True On-Chain Anonymity',
    content:
      'Our protocol uses {advanced zk-snarks cryptography} allowing you to withdraw your ticket to a brand new, empty wallet via a relayer. {When you win, the funds arrive in a wallet with no history}, breaking the link to your identity forever.',
  },
  {
    image: '/images/landing/triple.avif',
    title: 'Triple Your Chances',
    content:
      'Why play for one prize when you can play for three? Every ticket {automatically enters you into three separate prize pools!}',
  },
  {
    image: '/images/landing/control.avif',
    title: 'You Control the Odds',
    content:
      'Adjust your strategy with Ticket Power. Use our "{Game Simulation}" to test your secret number\'s luck across 30 simulated rounds. {Play smarter, not just harder.}',
  },
  {
    image: '/images/landing/security.avif',
    title: 'Fort Knox Security',
    content:
      'Our code is fully {open-source}, professionally audited, and continuously tested by a live $500,000 bug bounty. {Your funds are secure.}',
  },
  {
    image: '/images/landing/odds.avif',
    title: 'Your Funds, Your Control',
    content:
      'Our architecture is built on the principle of {self-custody and transparency.} The smart contracts are fully open-source for public verification. More importantly, an emergency pause triggers a user-first withdrawal mode, {guaranteeing you can always access your funds with your secret}. This system ensures you are always in control, no matter what.',
  },
  {
    image: '/images/landing/community.avif',
    title: 'Community Owned & Funded',
    content:
      'A {5% fee} on the prize pool is split to ensure longevity. {4% rewards} treasury investors (and anyone can invest!), while the remaining {1% is dedicated} to the foom.cash platform for continuous security audits and development.',
  },
]

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 [@media(min-width:1096px)]:grid-cols-2 gap-6">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          {...feature}
        />
      ))}
    </div>
  )
}
