import { StepCard } from './StepCard'

const steps = [
  {
    title: 'Generate Secret',
    description: 'Create a secure secret number, known only to you.',
    image: '/images/landing/step-1.avif',
  },
  {
    title: 'Set Your Power',
    description: 'Decide your bet amount and optionally run a game simulation.',
    image: '/images/landing/step-2.avif',
  },
  {
    title: 'Enter the Draw',
    description: 'Submit your transaction to enter the next draw.',
    image: '/images/landing/step-3.avif',
  },
  {
    title: 'Withdraw Anonymously',
    description: 'Use your secret with a relayer to move your ticket to a fresh wallet for privacy.',
    image: '/images/landing/step-4.avif',
  },
]

export function StepCards() {
  return (
    <div className="flex flex-wrap justify-center gap-y-6 gap-x-1 mt-8">
      {steps.map((step, index) => (
        <div
          key={index}
          className="flex flex-col justify-start text-center"
        >
          <img
            className="w-auto h-[130px] max-h-[193px] max-w-[395px] mb-4 object-contain"
            src={step.image}
            alt={step.title}
          />
          <StepCard
            title={step.title}
            description={step.description}
            className="flex flex-col items-center text-center max-w-[200px]"
          />
        </div>
      ))}
    </div>
  )
}
