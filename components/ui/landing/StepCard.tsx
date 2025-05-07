interface StepCardProps {
  title: string
  description: string
  className?: string
}

export function StepCard({ title, description, className }: StepCardProps) {
  return (
    <div className={`flex flex-col gap-4 ${className ?? ''}`}>
      <h3 className="text-[24px] font-bold text-accent">{title}</h3>
      <p className="text-[16px] text-[#C4C4C4] leading-relaxed">{description}</p>
    </div>
  )
}
