'use client'
import { useCurrentIndexer } from '@/hooks/useCurrentIndexer'
import { useDebounce } from '@/hooks/useDebounce'
import { useFoomPrice } from '@/hooks/useFoomPrice'
import { useLotteryPlaysQuery } from '@/hooks/useLotteryPlaysQuery'
import { getExplorer } from '@/lib/utils'
import { formatNumber } from '@/lib/utils/math'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useChainId } from 'wagmi'
import SpinnerText from '../shared/spinner-text'
import { PrayersInput } from './PlayLottery'
import { formatTimeAgo } from '@/components/general/YourTickets/utils/formatters'

const BetsListContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: start;
  justify-content: center;
  gap: 20px;
  width: 100%;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.3); /* ciemniejsze tło */

  h1 {
    margin-top: 20px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    padding: 0 8px;
  }
`

const ScrollableList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(125, 255, 207, 0.3);

  @media (max-width: 768px) {
    width: 100%;
    max-height: 60vh;
    border-radius: 4px;
    overflow-x: auto;
    overflow-y: auto;
  }
`

const WinnerItem = styled.div`
  padding: 12px 16px;
  margin-bottom: 2px;
  border-radius: 6px;
  font-size: 14px;
  color: #000;
  border: 1px solid rgba(125, 255, 207, 0.2);
  position: relative;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
  transition: all 0.2s ease;

  a {
    text-decoration: none;
    color: inherit;
  }

  &:hover {
    border-color: #7dffcf;
    background: linear-gradient(135deg, rgba(125, 255, 207, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(125, 255, 207, 0.2);
  }

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 12px;
    margin-bottom: 1px;
    min-width: 600px;
  }
`

const HeaderRow = styled.div`
  display: flex;
  font-size: 14px;
  width: 100%;
  font-weight: 500;

  @media (max-width: 768px) {
    min-width: 600px;
  }
`

const Column = styled.div<{ width?: string }>`
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: white;
  width: ${({ width }) => width || 'auto'};

  &:first-child {
    padding-left: 0;
  }

  &:last-child {
    padding-right: 0;
  }

  @media (max-width: 768px) {
    padding: 0 8px;
    font-size: 11px;
    flex-shrink: 0;

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }
  }
`

const exampleStatistics = {
  baseStats: {
    totalVolume: 4231834010889.55,
    totalVolUSD: 405351.719294637,
    foomPrice: 9.5786299333e-8,
    uniquePlayers: 6,
    lotteryLiquidityBase: '4213313400000.0',
    lotteryLiquidityBaseUSD: 403577.69851614,
    APR: 4.01758294162457,
    calculateVolFromLast7Days: 31770512708.3826,
    totalVolUSDFromLast7Days: 3043.17984024802,
    APR_from7DaysVol: 0.393183499121741,
  },
}

const NavContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid rgba(125, 255, 207, 0.3);
  position: sticky;
  top: 0;
  left: 0;
  z-index: 1;

  button {
    background: linear-gradient(135deg, rgba(125, 255, 207, 0.2) 0%, rgba(0, 255, 204, 0.1) 100%);
    border: 1px solid rgba(125, 255, 207, 0.3);
    color: #7dffcf;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba(125, 255, 207, 0.3) 0%, rgba(0, 255, 204, 0.2) 100%);
      border-color: #7dffcf;
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  span {
    margin: 0 12px;
    color: white;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    border-radius: 4px 4px 0 0;

    button {
      padding: 8px 12px;
      font-size: 11px;
    }

    span {
      margin: 0 8px;
      font-size: 11px;
    }
  }
`

const TableHeader = styled.div`
  background: linear-gradient(135deg, rgba(125, 255, 207, 0.15) 0%, rgba(0, 0, 0, 0.3) 100%);
  border-bottom: 2px solid rgba(125, 255, 207, 0.4);
  padding: 12px 16px;
  font-weight: 600;
  font-size: 13px;
  color: #7dffcf;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 85px;
  backdrop-filter: blur(8px);
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 10px;
    top: 146px;
    letter-spacing: 0.3px;
    min-width: 600px;
  }
`

const Stats = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 20%;
  font-size: 14px;
  margin-top: 16px;
  margin-right: 4px;
  row-gap: 16px;

  div {
    align-items: left;
    justify-content: left;
    width: 100%;

    span {
      font-weight: bold;
      font-size: 12px;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 20px;
    margin-top: 0px;
    padding-top: 0px;
  }
`

export default function BetsList() {
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [betsFilter, setBetsFilter] = useState('')
  const debouncedBetsFilter = useDebounce(betsFilter, 400)
  const [statistics, setStatistics] = useState<any>({})
  const [isMobile, setIsMobile] = useState(false)
  const chainId = useChainId()
  const { data: foomPrice } = useFoomPrice()

  const { data: plays, isLoading } = useLotteryPlaysQuery({
    page,
    limit,
    filter: debouncedBetsFilter,
  })
  const currentIndexer = useCurrentIndexer()

  const safePlays: any[] = Array.isArray(plays) ? plays : []
  const showSpinner = debouncedBetsFilter !== betsFilter || (isLoading && safePlays.length === 0)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: stats } = await currentIndexer.get('/blockchain/statistics')
        setStatistics(stats.baseStats)
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <BetsListContainer>
      <ScrollableList>
        <NavContainer>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span>Page {page}</span>
            <button onClick={() => setPage(prev => prev + 1)}>Next →</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PrayersInput
              type="text"
              placeholder="Search transactions..."
              value={betsFilter}
              onChange={e => {
                /** @dev reset page to first beforehand */
                setPage(1)
                setBetsFilter(e.target.value)
              }}
              style={{
                fontSize: '12px',
                minWidth: isMobile ? '150px' : '200px',
                padding: isMobile ? '6px 8px' : '8px 12px',
              }}
            />
          </div>
        </NavContainer>

        <TableHeader>
          <HeaderRow>
            <Column width={isMobile ? '80px' : '12%'}>Time</Column>
            <Column width={isMobile ? '100px' : '15%'}>User</Column>
            <Column width={isMobile ? '200px' : '42%'}>Prayer</Column>
            <Column
              width={isMobile ? '100px' : '15%'}
              className="text-end"
            >
              Amount
            </Column>
            <Column width={isMobile ? '120px' : '16%'}>Tx Hash</Column>
          </HeaderRow>
        </TableHeader>

        {showSpinner && (
          <div
            style={{
              display: 'flex',
              fontSize: '1.2em',
              fontWeight: 'bold',
              height: '120px',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              color: '#7DFFCF',
            }}
          >
            <SpinnerText loader="___" />
          </div>
        )}
        {!showSpinner && safePlays.length === 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '120px',
              color: '#7DFFCF',
              fontWeight: 'bold',
              fontSize: '1.2em',
            }}
          >
            No prayers found
          </div>
        )}
        {safePlays &&
          safePlays[0] &&
          safePlays.map((play: any, i) => (
            <WinnerItem key={play.txHash}>
              <a
                href={`${getExplorer(chainId)}/tx/${play.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <HeaderRow>
                  <Column width={isMobile ? '80px' : '12%'}>
                    <span
                      style={{
                        color: '#7DFFCF',
                        fontSize: isMobile ? '10px' : '12px',
                      }}
                    >
                      {formatTimeAgo(play.createdAt)}
                    </span>
                  </Column>
                  <Column width={isMobile ? '100px' : '15%'}>
                    <span
                      style={{
                        color: '#ffffff',
                        fontSize: isMobile ? '10px' : '12px',
                      }}
                    >
                      {isMobile
                        ? `${play.meta?.user?.slice(0, 4)}...${play.meta?.user?.slice(-3)}`
                        : `${play.meta?.user?.slice(0, 6)}...${play.meta?.user?.slice(-4)}`}
                    </span>
                  </Column>
                  <Column width={isMobile ? '200px' : '42%'}>
                    <span
                      style={{
                        color: '#ffffff',
                        fontSize: isMobile ? '10px' : '14px',
                      }}
                    >
                      {isMobile && play.meta?.prayer?.length > 40
                        ? `${play.meta?.prayer?.slice(0, 40)}...`
                        : play.meta?.prayer || '<no prayer>'}
                    </span>
                  </Column>
                  <Column
                    width={isMobile ? '100px' : '15%'}
                    className="text-end"
                  >
                    <span
                      style={{
                        color: '#7DFFCF',
                        fontWeight: '600',
                        fontSize: isMobile ? '10px' : '12px',
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                        textOverflow: 'unset',
                        textAlign: 'end',
                      }}
                    >
                      ${formatNumber((play.meta?.amount * foomPrice) / 10 ** 18)}
                    </span>
                  </Column>
                  <Column width={isMobile ? '120px' : '16%'}>
                    <span
                      style={{
                        color: '#ffffff',
                        fontSize: isMobile ? '9px' : '12px',
                      }}
                    >
                      {isMobile
                        ? `${play.txHash.slice(0, 6)}...${play.txHash.slice(-4)}`
                        : `${play.txHash.slice(0, 8)}...${play.txHash.slice(-6)}`}
                    </span>
                  </Column>
                </HeaderRow>
              </a>
            </WinnerItem>
          ))}
      </ScrollableList>

      {/* {statistics && statistics.lotteryLiquidityBase && (
        <Stats>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>STATS</div>
          <div>
            Unique Players (addresses): <span>{statistics.uniquePlayers}</span>
          </div>
          <div>
            Lottery Liquidity: <span>{Number(statistics.lotteryLiquidityBase).toFixed(0)} FOOM</span>
          </div>
          <div>
            APR: <span>{Number(statistics.APR).toFixed(2)}%</span>
          </div>
          <div>
            APR from last 3 days: <span>{Number(statistics.APR_from3DaysVol).toFixed(2)}%</span>
          </div>
          <div>
            Total Volumen: <span>{Number(statistics.totalVolUSD).toFixed(2)} $</span>
          </div>
          <div>
            Volume from last 3 days: <span>{Number(statistics.totalVolUSDFromLast3Days).toFixed(2)} $</span>
          </div>
        </Stats>
      )} */}
    </BetsListContainer>
  )
}
