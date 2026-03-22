'use client'

import { useEffect, useRef } from 'react'

type TwintButtonProps = {
  solutionId: string
  solutionType?: string
}

export function TwintButton({ solutionId, solutionType = 'pay' }: TwintButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const el = containerRef.current
    const id = `rnw-paylink-button-${solutionId}`
    el.id = id

    const script = document.createElement('script')
    script.type = 'module'
    script.textContent = `
      import {TwintButton} from "https://unpkg.com/@raisenow/paylink-button@2/dist/TwintButton.js"
      TwintButton.render("#${id}", {
        "solution-id": "${solutionId}",
        "solution-type": "${solutionType}",
        "language": "it",
        "size": "large",
        "width": "fixed",
        "color-scheme": "dark",
      })
    `
    el.appendChild(script)

    return () => {
      // Cleanup: remove the script and any rendered button
      while (el.firstChild) el.removeChild(el.firstChild)
    }
  }, [solutionId, solutionType])

  return <div ref={containerRef} />
}
