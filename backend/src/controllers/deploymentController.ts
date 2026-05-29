import { Request, Response } from "express";
import Deployment from "../models/Deployment";
import deploymentQueue from "../queue/deploymentQueue";
import type {
  IDeployRequestBody,
  IDeploymentResponse,
  IDeployJobData,
} from "../types/deployment";

export const createDeployment = async (
  req: Request<{}, IDeploymentResponse, IDeployRequestBody>,
  res: Response<IDeploymentResponse>,
): Promise<void> => {
  try {
    const { clientName, domain, image } = req.body;

    // ── Validation ────────────────────────────────────────
    if (!clientName || !domain || !image) {
      res.status(400).json({
        success: false,
        message: "clientName, domain, and image are required",
      } as IDeploymentResponse);
      return;
    }

    if (!clientName.trim() || !domain.trim() || !image.trim()) {
      res.status(400).json({
        success: false,
        message: "Fields cannot be empty or only whitespace",
      } as IDeploymentResponse);
      return;
    }

    const deployment = await Deployment.create({
      clientName: clientName.trim(),
      domain: domain.trim().toLowerCase(),
      image: image.trim(),
      status: "pending",
      logs: [
        `[${new Date().toISOString()}] Deployment request received for client: ${clientName}`,
      ],
    });

    console.log(`📝 Deployment created: ${deployment._id} for "${clientName}"`);

    const jobData: IDeployJobData = {
      deploymentId: deployment._id.toString(),
      clientName: deployment.clientName,
      domain: deployment.domain,
      image: deployment.image,
    };

    const job = await deploymentQueue.add("deploy-client", jobData);

    console.log(
      `📤 Job queued. Job ID: ${job.id} | Deployment ID: ${deployment._id}`,
    );

    res.status(200).json({
      success: true,
      message:
        "Deployment queued successfully. Worker will process it in background.",
      deploymentId: deployment._id.toString(),
      data: {
        clientName: deployment.clientName,
        domain: deployment.domain,
        image: deployment.image,
        status: deployment.status,
        logs: deployment.logs,
      },
    } as IDeploymentResponse);
  } catch (error) {
    console.error("❌ createDeployment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    } as IDeploymentResponse);
  }
};

export const getDeploymentStatus = async (
  req: Request<{ id: string }>,
  res: Response<IDeploymentResponse>,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      res.status(400).json({
        success: false,
        message: "Invalid deployment ID format",
      } as IDeploymentResponse);
      return;
    }

    const deployment = await Deployment.findById(id);

    if (!deployment) {
      res.status(404).json({
        success: false,
        message: `Deployment not found with ID: ${id}`,
      } as IDeploymentResponse);
      return;
    }

    res.status(200).json({
      success: true,
      deployment: {
        _id: deployment._id.toString(),
        clientName: deployment.clientName,
        domain: deployment.domain,
        image: deployment.image,
        status: deployment.status,
        logs: deployment.logs,
        errorMessage: deployment.errorMessage,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
      },
    } as IDeploymentResponse);
  } catch (error) {
    console.error("❌ getDeploymentStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as IDeploymentResponse);
  }
};

// ── 3. GET /api/deployments ──────────────────────────────────
export const getAllDeployments = async (
  _req: Request,
  res: Response<IDeploymentResponse>,
): Promise<void> => {
  try {
    const deployments = await Deployment.find()
      .sort({ createdAt: -1 })
      .limit(20); // Max 20

    res.status(200).json({
      success: true,
      deployments: deployments.map((d) => ({
        _id: d._id.toString(),
        clientName: d.clientName,
        domain: d.domain,
        image: d.image,
        status: d.status,
        logs: d.logs,
        errorMessage: d.errorMessage,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
    } as IDeploymentResponse);
  } catch (error) {
    console.error("❌ getAllDeployments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    } as IDeploymentResponse);
  }
};
