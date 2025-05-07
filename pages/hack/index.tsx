// pages/hack.tsx
import React from 'react';
// Assuming you might have a global Header, but it's not strictly needed for this page's content.
// import Header from '@/components/ui/header';

// A reusable component for the resource links to keep the code DRY and clean.
const ResourceCard = ({ href, title, description }: { href: string; title: string; description: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="block p-6 border border-neutral-800 bg-neutral-900/50 rounded-lg hover:bg-neutral-800/60 transition-colors duration-200 group"
  >
    <h3 className="text-xl font-bold text-cyan-400 group-hover:text-cyan-300 break-word">{title}</h3>
    <p className="text-neutral-400 mt-2 break-word">{description}</p>
  </a>
);

export default function HackPage() {
  return (
    // Set a dark background for the whole page for a consistent theme
    <div className="text-white min-h-screen">
      {/* <Header /> */}

      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* === HERO SECTION === */}
          {/* This section grabs the user's attention immediately with the main call to action. */}
          <div className="text-center border-b border-neutral-800 pb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
              The <span className="text-red-500">FOOM</span> Heist Challenge
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-neutral-300 max-w-2xl mx-auto">
              We've built a ZK-proof lottery we believe is unbreakable.
              We're daring you to prove us wrong.
            </p>
            <div className="mt-8">
              <div className="inline-block bg-neutral-900 border border-red-500/50 rounded-lg px-6 py-3">
                <span className="text-neutral-400 mr-2">The Prize:</span>
                <span className="text-2xl font-bold text-white tracking-wider">~$500,000</span>
              </div>
            </div>
          </div>

          {/* === THE CORE DETAILS GRID === */}
          {/* This grid presents the most important information in a scannable, two-column layout. */}
          <div className="grid md:grid-cols-2 gap-12 mt-12">
            {/* Left Column: The Prize & Rules */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-white">The Prize</h2>
                <ul className="mt-4 space-y-3 text-neutral-300 list-disc list-inside">
                  <li>The prize is <strong className="text-white">~$500,000 in $FOOM tokens</strong>, live in the contract.</li>
                  <li>$FOOM has a <strong className="text-white">$5M liquidity pool on Ethereum</strong> for an easy swap to ETH.</li>
                  <li>The contract is deployed on the <strong className="text-white">Base L2 network</strong>.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">The Rules</h2>
                <ul className="mt-4 space-y-3 text-neutral-300 list-disc list-inside">
                  <li>There are no rules. <strong className="text-white">Code is law.</strong></li>
                  <li>If you can exploit the contract and drain the funds, they are yours.</li>
                  <li>All we ask is you <strong className="text-white">tell us how you did it</strong> after you succeed.</li>
                </ul>
              </div>
            </div>

            {/* Right Column: The "Why" - This adds context and credibility. */}
            <div className="bg-neutral-900/50 p-6 rounded-lg border border-neutral-800">
                <h2 className="text-2xl font-semibold text-white">Our Mission</h2>
                <p className="mt-4 text-neutral-300">
                  We're Foom, and our goal is to build the largest, fully anonymous, and decentralized lottery in history. Our protocol uses <strong className="text-white">ZK-proofs</strong> to ensure fairness and privacy.
                </p>
                <p className="mt-4 text-neutral-300">
                  Before we scale to secure tens of millions, we need to be certain our code is battle-hardened. That's where you come in. This challenge is the ultimate audit.
                </p>
            </div>
          </div>


          {/* === YOUR TOOLKIT SECTION === */}
          {/* This section uses the reusable ResourceCard component for a clean, modern look. */}
          <div className="mt-16 pt-12 border-t border-neutral-800">
            <h2 className="text-3xl font-bold text-center">Your Toolkit</h2>
            <p className="text-center mt-2 text-neutral-400">Everything you need to get started is public.</p>
            <div className="grid sm:grid-cols-2 gap-6 mt-8">
              <ResourceCard
                href="https://basescan.org/address/0xdb203504ba1fea79164af3ceffba88c59ee8aafd#code"
                title="View The Contract"
                description="The target contract on Basescan. Do your worst."
              />
              <ResourceCard
                href="https://github.com/Terrestrials/foomlottery"
                title="Audit The Code"
                description="The full open-source repository on GitHub."
              />
              <ResourceCard
                href="https://www.dextools.io/app/en/ether/pair-explorer/0x5cd0ad98ba6288ed7819246a1ebc0386c32c314b"
                title="Verify The Liquidity"
                description="Proof of the $5M+ LP on DEXTools. This is real."
              />
              <ResourceCard
                href="https://foom.club/bridge"
                title="The Bridge"
                description="The official bridge to move $FOOM between Base and Ethereum."
              />
            </div>
          </div>

          {/* === FINAL QUOTE SECTION === */}
          {/* A simple, clean closing statement. */}
          <div className="mt-16 text-center">
             <p className="text-lg italic">
               “Don’t screw users. Only the protocol. If you break it, take the funds, tell us how — you’re good.”
             </p>
          </div>

        </div>
      </main>
    </div>
  )
}
