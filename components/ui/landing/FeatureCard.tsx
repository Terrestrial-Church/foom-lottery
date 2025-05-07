import { renderColoredText } from '@/lib/react-utils'

interface FeatureCardProps {
  image: string
  title: string
  content: string
}

export function FeatureCard({ image, title, content }: FeatureCardProps) {
  return (
    <div className="flex gap-6 p-6 rounded-lg items-start">
      <div className="flex-shrink-0 flex items-center">
        <img
          src={image}
          alt={title}
          className="max-w-[130px] max-sm:max-w-[64px] w-auto h-auto rounded-lg"
        />
      </div>
      <div className="flex flex-col gap-[20px] flex-1">
        <h3 className="text-[20px] font-bold text-accent">{title}</h3>
        <p className="text-[#ACACAC] text-[16px]">{renderColoredText(content, { bold: true })}</p>
      </div>
    </div>
  )
}
