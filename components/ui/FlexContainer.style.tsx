import { styled } from 'styled-components'

const FlexContainer = styled.div<{ $isBelow: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  width: ${({ $isBelow }) => ($isBelow ? '100%' : '100vh')};
`

export default FlexContainer
