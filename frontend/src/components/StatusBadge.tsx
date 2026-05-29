import type { DeploymentStatus } from '../types/deployment'

interface StatusBadgeProps {
  status: DeploymentStatus
}

const STATUS_CONFIG: Record<
  DeploymentStatus,
  { label: string; icon: string; color: string; dot: string }
> = {
  pending: {
    label: 'Pending',
    icon: '⏳',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    dot: 'bg-amber-400',
  },
  running: {
    label: 'Running',
    icon: '⚡',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    dot: 'bg-blue-400 animate-pulse',
  },
  completed: {
    label: 'Completed',
    icon: '✓',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    dot: 'bg-emerald-400',
  },
  failed: {
    label: 'Failed',
    icon: '✕',
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    dot: 'bg-red-400',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full
        border text-xs font-semibold tracking-wide
        ${config.color}
      `}
    >
      {/* Animated dot for running state */}
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.icon} {config.label}
    </span>
  )
}