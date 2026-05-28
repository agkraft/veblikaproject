import { useState, useEffect, useRef } from 'react'
import type { Deployment } from '../types/deployment'
import { getDeploymentStatus } from '../api/deployapi'
import StatusBadge from './StatusBadge'

interface DeploymentCardProps {
  deploymentId: string
}

const POLL_INTERVAL = 3000

export default function DeploymentCard({ deploymentId }: DeploymentCardProps) {
  const [deployment, setDeployment] = useState<Deployment | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const [fetchError, setFetchError] = useState<string>('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [deployment?.logs])

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await getDeploymentStatus(deploymentId)

        if (res.success && res.deployment) {
          setDeployment(res.deployment)
          setFetchError('')

          if (res.deployment.status === 'completed' || res.deployment.status === 'failed') {
            setIsPolling(false)
            if (intervalRef.current) clearInterval(intervalRef.current)
          }
        }
      } catch (err) {
        setFetchError('Could not fetch status')
      }
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [deploymentId])

  if (!deployment) {
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        {fetchError ? (
          <span style={{ color: 'var(--error)' }}>⚠️ {fetchError}</span>
        ) : (
          <>
            <PulsingDot />
            Fetching deployment status...
          </>
        )}
      </div>
    )
  }

  const borderAccent = {
    pending:   'var(--warning)',
    running:   'var(--running)',
    completed: 'var(--success)',
    failed:    'var(--error)',
  }[deployment.status]

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${borderAccent}`,
        borderRadius: 12,
        padding: '18px 20px',
        transition: 'border-color 0.4s',
      }}
    >
      {/* ── Card Header ── */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex flex-col gap-1">
          <span
            style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}
          >
            {deployment.clientName}
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            🌐 {deployment.domain}
          </span>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={deployment.status} />
          {isPolling && (
            <span
              style={{ fontSize: 11, color: 'var(--running)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <PulsingDot /> live
            </span>
          )}
        </div>
      </div>

      {/* ── Meta info ── */}
      <div
        className="flex items-center gap-4 mb-3"
        style={{ fontSize: 12, color: 'var(--text-muted)' }}
      >
        <span style={{ fontFamily: 'var(--font-mono)' }}>🐳 {deployment.image}</span>
        <span>🕐 {new Date(deployment.createdAt).toLocaleTimeString()}</span>
      </div>

      {/* ── Error message (if failed) ── */}
      {deployment.errorMessage && (
        <div
          style={{
            background: '#f8717110',
            border: '1px solid #f8717130',
            borderRadius: 6,
            padding: '8px 12px',
            color: 'var(--error)',
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          ⚠️ {deployment.errorMessage}
        </div>
      )}

      {/* ── Deployment Logs ── */}
      <div
        style={{
          background: '#050810',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 14px',
          maxHeight: 160,
          overflowY: 'auto',
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
          }}
        >
          Deployment Logs
        </p>

        {deployment.logs.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Waiting for logs...
          </p>
        ) : (
          deployment.logs.map((log, i) => (
            <p
              key={i}
              className="font-mono"
              style={{
                fontSize: 11,
                lineHeight: 1.8,
                color: i === deployment.logs.length - 1
                  ? 'var(--text-secondary)'
                  : 'var(--text-muted)',
                wordBreak: 'break-all',
              }}
            >
              {log}
            </p>
          ))
        )}

        {/* Auto-scroll anchor */}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}

// ── Small pulsing dot indicator ───────────────────────────────
function PulsingDot() {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'var(--running)',
        display: 'inline-block',
        animation: 'pulse 1.5s infinite',
      }}
    />
  )
}