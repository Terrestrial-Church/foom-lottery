import Link from 'next/link'

export default function Page() {
  return (
    <div className="flex flex-col w-full justify-center items-center min-h-[50vh] center">
      <div className="flex-grow items-end text-lg inline-block">
        Please go&nbsp;
        <Link
          href="/"
          className="link underline"
        >
          Home
        </Link>
        . There is nothing here
      </div>
    </div>
  )
}
