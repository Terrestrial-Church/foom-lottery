import Link from 'next/link'
import type { IStatParams } from '@/components/ui/landing/Stats'

const Stat = ({ title, subtitle, icon, link }: IStatParams) => {
  const content = (
    <div className="flex gap-4 items-center justify-between px-[28px] pt-[38px] pb-[28px] bg-[#00000080] border border-[#7DFFCF33] rounded-[22px]">
      <div className="flex flex-col gap-2">
        <h3 className="text-[24px] text-[#C5FFDD] font-bold text-start">{title}</h3>
        <p className="text-[16px] text-accent text-start">{subtitle}</p>
      </div>
      <img
        src={icon}
        alt=""
        className="size-8"
      />
    </div>
  )

  if (link) {
    return (
      <Link
        href={link}
        className="cursor-pointer hover:brightness-200 active:brightness-150 transition-filter max-sm:w-full"
        style={{ transition: 'filter 0.3s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {content}
      </Link>
    )
  }

  return content
}

export default Stat
