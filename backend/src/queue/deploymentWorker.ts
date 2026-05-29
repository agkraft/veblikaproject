import "dotenv/config";
import { Worker, Job } from "bullmq";
import mongoose from "mongoose";
import connectDatabase from "../config/database";
import Deployment from "../models/Deployment";
import { deployDockerOnEC2 } from "../services/awsSSMService";
import { invokePostDeployLambda } from "../services/lambdaService";
import redisConfig from "../config/redis";
import { QUEUE_NAME } from "./deploymentQueue";
import type { IDeployJobData } from "../types/deployment";

const createLogger = (deploymentId: string) => {
  return async (message: string): Promise<void> => {
    const logEntry = `[${new Date().toISOString()}] ${message}`;
    console.log(`  ↳ ${message}`);
    await Deployment.findByIdAndUpdate(deploymentId, {
      $push: { logs: logEntry },
    });
  };
};

// BullMQ Worker
const worker = new Worker<IDeployJobData>(
  QUEUE_NAME,

  async (job: Job<IDeployJobData>) => {
    const { deploymentId, clientName, domain, image } = job.data;
    console.log(
      `\n🔄 Job ${job.id} | Client: ${clientName} | Domain: ${domain}`,
    );

    const log = createLogger(deploymentId);

    // Status: running
    await Deployment.findByIdAndUpdate(deploymentId, { status: "running" });
    await log("Worker picked up job. Starting deployment pipeline...");

    // Step 1: EC2 pe Docker deploy
    await log("--- Step 1/2: Docker Deployment via AWS SSM ---");
    await deployDockerOnEC2(clientName, domain, image, log);

    // Step 2: Lambda invoke
    await log("--- Step 2/2: Post-deployment via AWS Lambda ---");
    await invokePostDeployLambda(deploymentId, clientName, domain, image, log);

    // Status: completed
    await Deployment.findByIdAndUpdate(deploymentId, {
      status: "completed",
      $push: {
        logs: `[${new Date().toISOString()}] ✅ Deployment completed successfully!`,
      },
    });

    console.log(`✅ Job ${job.id} completed\n`);
  },

  {
    connection: redisConfig,
    concurrency: 3,
  },
);

// Worker Events
worker.on("failed", async (job, error) => {
  console.error(`❌ Job ${job?.id} failed: ${error.message}`);
  if (job?.data?.deploymentId) {
    await Deployment.findByIdAndUpdate(job.data.deploymentId, {
      status: "failed",
      errorMessage: error.message,
      $push: {
        logs: `[${new Date().toISOString()}] ❌ Failed: ${error.message}`,
      },
    }).catch(console.error);
  }
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

// MongoDB connect + worker start
const startWorker = async () => {
  await connectDatabase();
  console.log("");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║    ⚙️  Veblika Deployment Worker          ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Queue   : ${QUEUE_NAME}             ║`);
  console.log("║  Status  : Listening for jobs...         ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");
};

startWorker();

// Graceful shutdown
process.on("SIGTERM", async () => {
  await worker.close();
  await mongoose.connection.close();
  process.exit(0);
});
