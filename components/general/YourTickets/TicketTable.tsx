import React, { useMemo } from 'react'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { MdOutlineDeleteOutline } from 'react-icons/md'
import { toSecretPower } from '@/lib/lottery'
import { formatTimeAgo } from './utils/formatters'
import { SecretCell } from './SecretCell'
import { RewardCell } from './RewardCell'
import { ResultCell } from './ResultCell'
import { ClaimButton } from './ClaimButton'

interface TicketTableProps {
  data: any[]
  claiming: Record<string, boolean>
  onClaim: (secret: bigint, power: number, index: number) => void
  onDelete: (ticket: string, index: number) => void
  showMask: boolean
  breakout: boolean
  scrollRef: React.RefObject<HTMLDivElement | null>
}

export function TicketTable({ data, claiming, onClaim, onDelete, showMask, breakout, scrollRef }: TicketTableProps) {
  const columns = useMemo<ColumnDef<any, any>[]>(() => {
    const baseColumns: ColumnDef<any, any>[] = [
      {
        header: 'Time',
        accessorKey: 'time',
        cell: ({ row }) => <p>{formatTimeAgo(row.original.time)}</p>,
      },
      {
        header: 'Secret',
        accessorKey: 'secret',
        cell: ({ row }) => (
          <SecretCell
            secret={row.original.secret}
            power={row.original.power}
            index={row.original.index}
          />
        ),
      },
      {
        header: 'Price',
        accessorKey: 'price',
        cell: ({ row }) => <p className="whitespace-nowrap">{row.original.price}</p>,
      },
      {
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={
              row.original.status === 'Pending'
                ? 'font-bold text-nowrap animate-blink text-yellow-400'
                : row.original.status === 'Jackpot!'
                  ? 'font-bold text-nowrap animate-blink-jackpot'
                  : 'font-bold text-nowrap'
            }
            style={
              row.original.status === 'Jackpot!'
                ? {
                    color: '#00ffd0',
                    textShadow: '0 0 8px #00ffd0, 0 0 16px #00ffd0',
                    fontWeight: 600,
                    background: 'rgba(0,255,208,0.07)',
                    borderRadius: 4,
                    display: 'inline',
                    letterSpacing: '0',
                  }
                : undefined
            }
          >
            {row.original.status}
          </span>
        ),
      },
      {
        id: 'reward',
        header: () => (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
            Reward
            <img
              src="/icon.svg"
              alt="Foom"
              className="rounded-full ring-[0.5px] ring-[#22d3eee6] -translate-x-4 size-[20px]"
              style={{ marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}
            />
          </span>
        ),
        accessorKey: 'reward',
        cell: ({ row }) => (
          <RewardCell
            reward={row.original.reward}
            chain={row.original.chain}
          />
        ),
      },
      {
        header: 'Result',
        cell: ({ row }) => (
          <ResultCell
            reward={row.original.reward}
            status={row.original.status}
            bet={row.original.index}
          />
        ),
      },
      {
        header: 'Claim',
        cell: ({ row }) => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              position: 'relative',
              whiteSpace: 'nowrap',
              width: '100%',
              minWidth: 0,
            }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <ClaimButton
                ticket={toSecretPower(row.original.secret, row.original.power)}
                onClaim={() => onClaim(row.original.secret, row.original.power, row.original.index)}
                isLoading={!!claiming[toSecretPower(row.original.secret, row.original.power)]}
                isLost={row.original.status === 'Lost!'}
                isPending={row.original.status === 'Pending'}
                disabled={row.original.status !== 'Jackpot!' && row.original.status !== 'Lost!'}
              />
              <button
                className="p-1 border !bg-black border-white/30 rounded hover:bg-white/10 transition-colors opacity-60 hover:opacity-100 focus:opacity-100"
                onClick={() => onDelete(toSecretPower(row.original.secret, row.original.power), row.original.index)}
                title="Delete ticket"
                aria-label="Delete ticket"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none' }}
              >
                <MdOutlineDeleteOutline
                  color="white"
                  size={16}
                />
              </button>
            </div>
          </div>
        ),
      },
    ]
    return baseColumns
  }, [claiming, onClaim, onDelete])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div
      className={`overflow-y-hidden overflow-x-auto${breakout ? ' breakout-x' : ''}`}
      ref={scrollRef}
      style={
        breakout
          ? {
              ...(showMask
                ? {
                    WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
                  }
                : {
                    WebkitMaskImage: 'none',
                    maskImage: 'none',
                  }),
              width: '100vw',
              maxWidth: '100vw',
              marginLeft: '50%',
              transform: 'translateX(-50%)',
              background: 'inherit',
              zIndex: 1,
              paddingLeft: '1rem',
              paddingRight: '1rem',
            }
          : showMask
            ? {
                WebkitMaskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
                maskImage: 'linear-gradient(to right, black 90%, transparent 100%)',
              }
            : undefined
      }
    >
      <table className="w-full min-w-[700px] border border-neutral-800 text-xs max-sm:text-xs text-white">
        <thead className="bg-neutral-900/70 text-cyan-400">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const numericHeaders = ['Price', 'Reward', 'Result']
                const alignClass = numericHeaders.includes(String(header.column.columnDef.header))
                  ? 'text-right'
                  : 'text-left'
                const isResult = String(header.column.columnDef.header).toLowerCase().includes('result')
                const widthStyle = isResult ? {} : { minWidth: 0, maxWidth: '1%', width: '1%' }
                return (
                  <th
                    key={header.id}
                    className={`border border-neutral-800 px-2 py-2 whitespace-nowrap font-semibold text-xs sm:text-sm ${alignClass}`}
                    style={widthStyle}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, idx) => (
            <tr
              key={row.id}
              className={idx % 2 === 1 ? 'even:bg-neutral-900/40' : ''}
            >
              {row.getVisibleCells().map(cell => {
                const numericHeaders = ['Price', 'Reward', 'Result']
                const alignClass = numericHeaders.includes(String(cell.column.columnDef.header))
                  ? 'text-right'
                  : 'text-left'
                const isResult = String(cell.column.columnDef.header).toLowerCase().includes('result')
                const widthStyle = isResult ? {} : { minWidth: 0, maxWidth: '1%', width: '1%' }
                return (
                  <td
                    key={cell.id}
                    className={`border border-neutral-800 px-2 py-2 whitespace-nowrap align-middle ${alignClass}`}
                    style={widthStyle}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
