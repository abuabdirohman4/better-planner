'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Document Picture-in-Picture: an always-on-top window holding real DOM.
 * Chrome/Brave/Edge desktop only — Safari and mobile have no implementation,
 * so callers must hide their entry point when `supported` is false.
 */

interface DocumentPiPWindow extends Window {
  documentPictureInPicture?: {
    requestWindow: (opts?: { width?: number; height?: number }) => Promise<Window>
    window: Window | null
  }
}

export function useDocumentPiP() {
  const [supported, setSupported] = useState(false)
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const openingRef = useRef(false)

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        'documentPictureInPicture' in window &&
        typeof (window as DocumentPiPWindow).documentPictureInPicture?.requestWindow === 'function'
    )
  }, [])

  const close = useCallback(() => {
    setPipWindow(prev => {
      prev?.close()
      return null
    })
  }, [])

  const open = useCallback(async (width = 300, height = 180) => {
    const api = (window as DocumentPiPWindow).documentPictureInPicture
    if (!api || openingRef.current) return
    openingRef.current = true
    try {
      const win = await api.requestWindow({ width, height })

      // The PiP document starts blank — copy the page's styles so the portal
      // content is not unstyled. Cross-origin sheets throw on cssRules; those
      // are re-linked by href instead.
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const css = Array.from(sheet.cssRules).map(r => r.cssText).join('')
          const style = win.document.createElement('style')
          style.textContent = css
          win.document.head.appendChild(style)
        } catch {
          if (sheet.href) {
            const link = win.document.createElement('link')
            link.rel = 'stylesheet'
            link.href = sheet.href
            win.document.head.appendChild(link)
          }
        }
      }

      // Carry the theme over so the floating window is not light-on-dark
      win.document.documentElement.className = document.documentElement.className

      win.addEventListener('pagehide', () => setPipWindow(null))
      setPipWindow(win)
    } catch (err) {
      console.error('[pip] failed to open', err)
    } finally {
      openingRef.current = false
    }
  }, [])

  // Closing the tab must not leave an orphan floating window
  useEffect(() => {
    return () => {
      pipWindow?.close()
    }
  }, [pipWindow])

  return { supported, pipWindow, open, close, isOpen: pipWindow !== null }
}
