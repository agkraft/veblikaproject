export type DeploymentStatus = 'pending' | 'running' | 'completed' | 'failed'


export interface IDeployment {
  _id: string
  clientName: string
  domain: string
  image: string
  status: DeploymentStatus
  logs: string[]
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}


export interface IDeployRequestBody {
  clientName: string
  domain: string
  image: string
}

export interface IDeploymentResponse {
  success: boolean
  message?: string
  deploymentId?: string
  deployment?: Partial<IDeployment>
  deployments?: Partial<IDeployment>[]
  error?: string
}

export interface IDeployJobData {
  deploymentId: string
  clientName: string
  domain: string
  image: string
}

// ── AWS Service Types ────────────────────────────────────────

export interface ISSMResult {
  commandId: string
  status: string
  message: string
}

export interface ILambdaResult {
  statusCode: number
  body: Record<string, unknown>
}