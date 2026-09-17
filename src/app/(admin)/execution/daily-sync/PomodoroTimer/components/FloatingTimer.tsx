'use client'

import { createPortal } from 'react-dom'
import { useTimerStore } from '@/stores/timerStore'
import { formatTime, getFocusDuration, getTotalSeconds, getProgress } from '@/lib/timerDisplay'

/**
 * Timer rendered into a Document Picture-in-Picture window so it stays above
 * other apps. Reads the same store as the main timer, so both always agree.
 */
export default function FloatingTimer({ pipWindow }: { pipWindow: Window }) {
  const timerState = useTimerStore(s => s.timerState)
  const secondsElapsed = useTimerStore(s => s.secondsElapsed)
  const activeTask = useTimerStore(s => s.activeTask)
  const lastActiveTask = useTimerStore(s => s.lastActiveTask)
  const breakType = useTimerStore(s => s.breakType)
  const pauseTimer = useTimerStore(s => s.pauseTimer)
  const resumeTimer = useTimerStore(s => s.resumeTimer)
  const stopTimer = useTimerStore(s => s.stopTimer)

  const focusDuration = getFocusDuration(activeTask, lastActiveTask)
  const totalSeconds = getTotalSeconds(timerState, breakType, focusDuration)
  const progress = getProgress(timerState, secondsElapsed, totalSeconds)
  const remaining = Math.max(0, totalSeconds - secondsElapsed)

  const isBreak = timerState === 'BREAK' || (timerState === 'PAUSED' && breakType !== null)
  const isPaused = timerState === 'PAUSED'
  const isRunning = timerState === 'FOCUSING' || timerState === 'BREAK'
  const accent = isBreak ? '#22c55e' : '#3b82f6'

  const label = isBreak ? 'Istirahat' : activeTask?.title || lastActiveTask?.title || 'Sesi fokus'

  return createPortal(
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: 10, fontFamily: 'system-ui, sans-serif',
        background: '#0b1220', color: '#f8fafc', padding: 12, boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 12, opacity: 0.7, maxWidth: '100%', textAlign: 'center',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
        title={label}
      >
        {label}
      </div>

      <div style={{ fontSize: 40, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {formatTime(remaining)}
      </div>

      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 999 }}>
        <div
          style={{
            width: `${progress * 100}%`, height: '100%', background: accent,
            borderRadius: 999, transition: 'width 1s linear',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {isRunning && (
          <button onClick={pauseTimer} style={btn(accent)}>Jeda</button>
        )}
        {isPaused && (
          <button onClick={resumeTimer} style={btn(accent)}>Lanjut</button>
        )}
        {(isRunning || isPaused) && (
          <button onClick={stopTimer} style={btn('transparent', true)}>Stop</button>
        )}
        {!isRunning && !isPaused && (
          <span style={{ fontSize: 11, opacity: 0.5 }}>Timer tidak berjalan</span>
        )}
      </div>
    </div>,
    pipWindow.document.body
  )
}

function btn(bg: string, outlined = false): React.CSSProperties {
  return {
    background: outlined ? 'transparent' : bg,
    color: '#f8fafc',
    border: outlined ? '1px solid rgba(255,255,255,0.3)' : 'none',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  }
}
