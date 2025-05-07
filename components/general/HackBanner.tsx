import React, { useState } from 'react'
import styled from 'styled-components'
import Link from 'next/link'

const HackBannerContainer = styled.div`
  width: 100%;
  height: 100%;
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    // margin-top: 0;
    width: 100%;
  }

  .hack-link {
    display: block;
    width: 50%;
    @media (max-width: 768px) {
      width: 100%;
    }
  }

  img {
    margin: auto;
    width: 100%;
    display: block;
  }
`

const HackBanner = () => {
  return (
    <HackBannerContainer>
      <Link
        href="/hack"
        className="hack-link"
      >
        <img
          src="/images/hackBanner.avif"
          alt="Hack Banner"
        />
      </Link>
    </HackBannerContainer>
  )
}

export default HackBanner
