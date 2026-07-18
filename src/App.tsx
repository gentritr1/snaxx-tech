import { useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import Home from './pages/Home'
import LegalPage from './pages/LegalPage'
import NotFound from './pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    const isRouteChange = previousPathname.current !== pathname
    previousPathname.current = pathname

    window.scrollTo(0, 0)

    if (!isRouteChange) return

    const focusFrame = window.requestAnimationFrame(() => {
      const routeTarget = document.querySelector<HTMLElement>('[data-route-focus], main, h1')
      if (!routeTarget) return

      if (!routeTarget.hasAttribute('tabindex')) {
        routeTarget.setAttribute('tabindex', '-1')
      }
      routeTarget.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy/:appSlug" element={<LegalPage kind="privacy" />} />
        <Route path="/terms/:appSlug" element={<LegalPage kind="terms" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
