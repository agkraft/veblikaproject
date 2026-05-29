import { Queue } from "bullmq";
import redisConfig from "../config/redis";
import type { IDeployJobData } from "../types/deployment";

export const QUEUE_NAME = "deployment-queue";

const deploymentQueue = new Queue<IDeployJobData>(QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      count: 50,
      age: 24 * 3600,
    },
    removeOnFail: {
      count: 100,
    },
  },
});

deploymentQueue.on("error", (error) => {
  console.error("❌ Queue error:", error.message);
});

console.log(`✅ BullMQ Queue "${QUEUE_NAME}" initialized`);

export default deploymentQueue;
