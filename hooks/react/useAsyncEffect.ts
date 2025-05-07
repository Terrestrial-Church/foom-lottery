import { useEffect } from 'react'

const useAsyncEffect = (reflected: (...p: any) => Promise<any>, dependencies: React.DependencyList) => {
  useEffect(() => void reflected(), dependencies)
}

export default useAsyncEffect
