import { Router } from 'express'
import {
  createDeployment,
  getDeploymentStatus,
  getAllDeployments,
} from '../controllers/deploymentController'

const router = Router()

router.post('/deploy', createDeployment)

router.get('/status/:id', getDeploymentStatus)

router.get('/deployments', getAllDeployments)

export default router