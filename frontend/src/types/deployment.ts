export type DeploymentStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface Deployment {
  id: string
  clientName: string
  domain: string
  image: string
  status: DeploymentStatus
  logs: string[]
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface DeployFormData {
  clientName: string
  domain: string
  image: string
}

export interface DeployApiResponse {
  success: boolean
  message: string
  deploymentId?: string
}

export interface StatusApiResponse {
  success: boolean
  deployment?: Deployment
  message?: string
}