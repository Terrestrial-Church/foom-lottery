import Link from 'next/link'
import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { _log } from '@/lib/utils/ts'

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  padding: 16px 32px;
  background-color: #1e1e1e;
  color: white;
  background: linear-gradient(to bottom, #050f0c, rgba(0, 0, 0, 0));
  z-index: 10;

  @media (max-width: 768px) {
    padding: 8px 12px;
  }
`

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  user-select: none;

  // img {
  //   animation: jump 2s steps(1, end) infinite;
  // }

  img:hover {
    transform: scale(1.1);
    cursor: pointer;
  }

  @media (max-width: 768px) {
    img:hover {
      transform: none;
      cursor: pointer;
    }
  }

  @keyframes jump {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
`

const Nav = styled.nav`
  display: flex;
  min-width: 0;
  gap: 32px;
  z-index: 1;
  // transform: scaleX(1.1);

  @media (max-width: 768px) {
    display: none;
  }
`

const NavItem = styled.div<{ align?: string }>`
  flex: 1 1 0;
  min-width: 0;
  text-align: ${({ align }) => align || 'left'};
  display: flex;
  align-items: center;
  justify-content: ${({ align }) => (align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start')};
`

const Burger = styled.div`
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  z-index: 1;
  margin-right: 12px;

  span {
    width: 25px;
    height: 3px;
    background: white;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    display: flex;
  }
`

const MobileMenu = styled.div<{ open: boolean }>`
  display: ${({ open }) => (open ? 'flex' : 'none')};
  flex-direction: column;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.95);
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 1rem;

  @media (min-width: 769px) {
    display: none;
  }
`

const NavLink = styled(Link)<{ $active?: boolean }>`
  font-size: 12px;
  font-weight: 700;
  position: relative;
  width: 100%;
  display: block;
  text-align: inherit;

  &::after {
    content: '';
    display: block;
    position: absolute;
    left: -2px;
    transform: scaleX(1.1);
    right: 0;
    bottom: -13px;
    height: 4px;
    background: ${({ $active }) => ($active ? 'var(--primary)' : 'transparent')};
    @media (max-width: 768px) {
      bottom: -5px;
      left: 1px;
      width: 32px;
    }
  }
`

const MobileMenus = styled.div<any>`
  display: ${({ open }: any) => (open ? 'flex' : 'none')};
  flex-direction: column;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.95);
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 1rem;
  border: 1px solid gray;

  @media (min-width: 769px) {
    display: none;
  }
`

const WalletConnect = styled.div`
  background-color: --primary;
  border-radius: 0px;
  font-size: 0.9rem;
  border-color: var(--primary);
  font-weight: 400 !important;
`

const NavSpacer = () => <div className="size-1.5 shrink-0 bg-[--primary] place-self-center" />

const Header = () => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        burgerRef.current &&
        !burgerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  useEffect(() => {
    const handleRouteChange = () => setMenuOpen(false)
    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router])

  return (
    <HeaderContainer className="z-10 sm:gap-4">
      <div className="flex flex-1 justify-start">
        <Logo className="z-10">
          <Link
            href="/"
            passHref
          >
            <img
              src="/images/logo.avif"
              alt="FOOM.Cash"
              className="w-[160px] !h-auto"
            />
          </Link>
        </Logo>
      </div>

      <div className="flex flex-1 center max-sm:hidden">
        <Nav>
          <NavLink
            href="/game"
            $active={router.pathname === '/game'}
          >
            Lottery
          </NavLink>
          <NavSpacer />
          <NavLink
            href="/rules"
            $active={router.pathname === '/rules'}
          >
            Rules
          </NavLink>
          <NavSpacer />
          <NavLink
            href="/invest"
            $active={router.pathname === '/invest'}
          >
            Invest
          </NavLink>
          <NavSpacer />
          <NavLink
            href="/hack"
            $active={router.pathname === '/hack'}
          >
            Hack
          </NavLink>
        </Nav>
      </div>

      {mounted && (
        <MobileMenus
          ref={menuRef}
          open={isMenuOpen}
        >
          <NavLink
            href="/game"
            $active={router.pathname === '/game'}
          >
            Lottery
          </NavLink>
          <NavLink
            href="/rules"
            $active={router.pathname === '/rules'}
          >
            Rules
          </NavLink>
          <NavLink
            href="/invest"
            $active={router.pathname === '/invest'}
          >
            Invest
          </NavLink>
          <NavLink
            href="/hack"
            $active={router.pathname === '/hack'}
          >
            Hack
          </NavLink>
        </MobileMenus>
      )}

      <div className="flex flex-1 justify-end">
        <div className="flex gap-4 center flex-nowrap">
          <WalletConnect>
            <appkit-button />
          </WalletConnect>
          <Burger
            ref={burgerRef}
            onClick={() => setMenuOpen(!isMenuOpen)}
          >
            <span />
            <span />
            <span />
          </Burger>
        </div>
      </div>
    </HeaderContainer>
  )
}

export default Header
