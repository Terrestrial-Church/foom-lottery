import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQItemProps {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
  isLast?: boolean
}

function FAQItemComponent({ item, isOpen, onToggle, isLast = false }: FAQItemProps) {
  return (
    <div className={`${!isLast ? 'border-b border-[#A6A6A630]' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full py-6 px-0 text-left flex justify-between items-center transition-colors duration-200"
      >
        <span className="text-[18px] font-bold text-accent">{item.question}</span>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6 mb-12 max-sm:mb-6' : 'max-h-0'}`}
      >
        <p className="text-[#A6A6A6] text-[16px] pr-8 whitespace-pre-wrap">{item.answer}</p>
      </div>
    </div>
  )
}

export function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 mt-8 sm:mt-[76px]">
      <div className="order-2 lg:order-1">
        <div className="w-auto">
          {faqData.map((item, index) => (
            <FAQItemComponent
              key={index}
              item={item}
              isOpen={openItems.has(index)}
              onToggle={() => toggleItem(index)}
              isLast={index === faqData.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="order-1 center lg:order-2 flex flex-row lg:flex-col gap-4 lg:gap-8 justify-center lg:justify-start">
        <img
          src="/images/landing/faq-text.avif"
          alt="FAQ Text"
          className="w-1/2 lg:w-full h-min rounded-lg max-w-[150px] lg:max-w-none"
        />
        <img
          src="/images/landing/faq-graphic.avif"
          alt="FAQ Graphic"
          className="w-1/2 lg:w-full h-auto rounded-lg max-w-[150px] lg:max-w-none"
        />
      </div>
    </div>
  )
}

const faqData: FAQItem[] = [
  {
    question: 'What is foom.cash?',
    answer:
      "foom.cash is a fully anonymous, decentralized lottery built on Ethereum and Base. It uses advanced zk-SNARKs cryptography to allow users to play for three simultaneous prizes while protecting their privacy. Its core feature is the ability to break the on-chain link between a player's original wallet and their winnings.",
  },
  {
    question: 'How is it truly anonymous?',
    answer:
      'Anonymity is achieved through a three-part process:\n\n1. Secret Generation: You generate a secret known only to you, which acts as proof of ownership for your ticket.\n\n2. zk-SNARKs Cryptography: We use zk-SNARKs, a privacy technology that lets you prove you own a deposit without revealing which one is yours. Think of it like proving you know a secret password without ever saying the password itself. When you play, you generate a cryptographic proof that you own a valid ticket. The contract verifies this proof and releases your funds, but since the proof contains zero knowledge about your original deposit, the transaction is completely anonymous.\n\n3. Relayer Withdrawal: You can use a relayer to send a transaction that transfers ownership of your ticket to a new, empty wallet. Because the relayer pays the gas fee, your original wallet never has to interact with the new one, leaving no on-chain trail between them.',
  },
  {
    question: 'How can I trust the draw is fair?',
    answer:
      'The entire process is governed by an open-source smart contract. The winning number is generated using a verifiable, on-chain random future number source, ensuring that neither the developers nor any single user can manipulate the outcome. Anyone can audit the code and verify the results on the blockchain.',
  },
  {
    question: 'Who controls the foom.cash contract?',
    answer:
      "The foom.cash smart contract is designed with a transparent 'principled guardian' model for ultimate user protection. There is one admin address with permission to pause the lottery contracts in a critical emergency (e.g., a major external threat is discovered). This action does not lock user funds. Instead, it triggers an emergency withdrawal mode, allowing every single player to safely withdraw their deposited funds using their private secret. Simultaneously, a 2-year time-lock is activated on all protocol-owned assets (like the treasury and accumulated fees), which the admin cannot access. This mechanism ensures the admin can protect the ecosystem from threats without ever holding user funds hostage.",
  },
  {
    question: 'What are the fees?',
    answer:
      'The protocol is designed to be self-sustaining and reward its community. From the total prize pool of each round, a 5% fee is applied:\n\n- 4% is distributed to the lottery treasury investors. Any user can invest in the treasury to earn a share of these rewards.\n\n- 1% is directed to the foom.cash platform treasury to fund ongoing development and security.',
  },
  {
    question: 'Is it secure? Have the contracts been audited?',
    answer:
      'Yes. Security is our top priority. The smart contracts have undergone a comprehensive third-party audit to ensure they are secure and function as intended. To demonstrate our confidence, we have an active and ongoing $500,000 USD bug bounty for any hacker who can find a critical vulnerability.',
  },
  {
    question: 'What is the FOOM ecosystem?',
    answer:
      'foom.cash is part of the broader FOOM ecosystem, a forward-thinking project focused on building a new, anonymous internet layer for a future where Artificial General Intelligence (AGI) and humans coexist. The ecosystem is backed by a substantial treasury, including ~32,000 ETH, ensuring long-term development, stability, and growth.',
  },
  {
    question: 'What are the risks?',
    answer:
      'While we have taken every measure to secure the protocol, all smart contracts carry inherent risks of bugs or exploits. We mitigate this with audits, a large bug bounty, and a transparent control structure. Additionally, foom.cash is a game of chance. Please play responsibly and never bet more than you are willing to lose.',
  },
]
