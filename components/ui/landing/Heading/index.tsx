import { renderColoredText } from '../../../../lib/react-utils'

interface IParams {
  title: string
  subtitle?: string
}

export const Heading = ({ title, subtitle }: IParams) => {
  return (
    <div className="flex flex-col gap-6 max-sm:gap-2 center">
      <h1 className="whitespace-pre-wrap text-[48px] max-sm:text-[36px] font-bold leading-[140%]">{renderColoredText(title)}</h1>
      {!!subtitle && (
        <h2 className="whitespace-pre-wrap text-[24px] max-sm:text-[18px] leading-[140%] text-[#C4C4C4]">
          {renderColoredText(subtitle)}
        </h2>
      )}
    </div>
  )
}
