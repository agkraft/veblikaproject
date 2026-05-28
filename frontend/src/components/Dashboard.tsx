import DeploymentCard from './DeploymentCard'

interface DashboardProps {
  deploymentIds: string[]
}

export default function Dashboard({ deploymentIds }: DashboardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 28,
        minHeight: 300,
      }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            style={{
              background: '#34d39911',
              border: '1px solid #34d39933',
              borderRadius: 8,
              padding: '6px 8px',
              fontSize: 16,
            }}
          >
            📡
          </div>
          <div>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Live Deployment Status
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Auto-updates every 3 seconds
            </p>
          </div>
        </div>

        {/* Count badge */}
        {deploymentIds.length > 0 && (
          <span
            style={{
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              borderRadius: 20,
              padding: '3px 12px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {deploymentIds.length} active
          </span>
        )}
      </div>

      {/* Empty state */}
      {deploymentIds.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-4"
          style={{ padding: '60px 20px', color: 'var(--text-muted)' }}
        >
          {/* Grid background decoration */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            🛸
          </div>
          <div className="text-center">
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              No deployments yet
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Fill the form and click "Deploy Now" to start
            </p>
          </div>
        </div>
      ) : (
        /* Render a DeploymentCard for each deployment ID */
        <div className="flex flex-col gap-4">
          {deploymentIds.map(id => (
            <DeploymentCard key={id} deploymentId={id} />
          ))}
        </div>
      )}
    </div>
  )
}