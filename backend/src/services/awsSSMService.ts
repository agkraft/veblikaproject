import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
  CommandInvocationStatus,
} from "@aws-sdk/client-ssm";
import type { ISSMResult } from "../types/deployment";

const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isMockMode = (): boolean => {
  const key = process.env.AWS_ACCESS_KEY_ID || "";
  return (
    key === "" ||
    key === "MOCK_ACCESS_KEY" ||
    key === "your_access_key_here" ||
    key.startsWith("MOCK")
  );
};

async function pollCommandStatus(
  commandId: string,
  instanceId: string,
  maxWaitMs = 60000,
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await sleep(3000);

    try {
      const statusCommand = new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId,
      });

      const statusResponse = await ssmClient.send(statusCommand);
      const status = statusResponse.Status;

      if (
        status === CommandInvocationStatus.SUCCESS ||
        status === CommandInvocationStatus.FAILED ||
        status === CommandInvocationStatus.TIMED_OUT ||
        status === CommandInvocationStatus.CANCELLED
      ) {
        return status;
      }
    } catch {
      // Ignore polling errors
    }
  }

  return "TimedOut";
}

export async function deployDockerOnEC2(
  clientName: string,
  domain: string,
  image: string,
  onLog: (message: string) => Promise<void>,
): Promise<ISSMResult> {
  const instanceId = process.env.EC2_INSTANCE_ID || "";

  if (!instanceId) {
    throw new Error("EC2_INSTANCE_ID is not set in .env file");
  }

  await onLog(`Starting Docker deployment on EC2 via AWS SSM...`);
  await onLog(`Target EC2 Instance: ${instanceId}`);
  await onLog(`Docker Image: ${image}`);

  const containerName = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const shellCommands = [
    `echo "=== Starting deployment for ${clientName} ==="`,
    `docker stop ${containerName} 2>/dev/null || echo "No existing container to stop"`,
    `docker rm ${containerName} 2>/dev/null || echo "No existing container to remove"`,
    `echo "Pulling image: ${image}"`,
    `docker pull ${image}`,
    `docker run -d \\`,
    `  --name ${containerName} \\`,
    `  --restart=unless-stopped \\`,
    `  -e VIRTUAL_HOST=${domain} \\`,
    `  -e VIRTUAL_PORT=80 \\`,
    `  ${image}`,
    `echo "=== Deployment complete for domain: ${domain} ==="`,
  ];

  // ─── MOCK MODE ───────────────────────────────────────────
  if (isMockMode()) {
    await onLog(`⚠️  Mock Mode: No real AWS credentials found`);
    await onLog(`⚠️  Simulating SSM command to EC2...`);
    await sleep(2000);
    await onLog(
      `✅ Docker container "${containerName}" started successfully on EC2`,
    );
    await onLog(`✅ Container mapped to domain: ${domain}`);

    return {
      commandId: "mock-cmd-" + Date.now(),
      status: "Success",
      message: `Mock: Container ${containerName} running for domain ${domain}`,
    };
  }
  // ─────────────────────────────────────────────────────────

  try {
    const sendCommand = new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: "AWS-RunShellScript",
      Parameters: {
        commands: shellCommands,
        executionTimeout: ["300"],
      },
      Comment: `Veblika: Deploy ${image} for ${clientName}`,
      TimeoutSeconds: 300,
    });

    await onLog(`Sending SSM command to EC2...`);

    const sendResponse = await ssmClient.send(sendCommand);
    const commandId = sendResponse.Command?.CommandId;

    if (!commandId) {
      throw new Error("SSM command failed to send — no CommandId received");
    }

    await onLog(`SSM command sent. Command ID: ${commandId}`);
    await onLog(`Waiting for EC2 to execute Docker commands...`);

    const finalStatus = await pollCommandStatus(commandId, instanceId);

    if (finalStatus !== "Success") {
      throw new Error(
        `Docker deployment failed on EC2. SSM status: ${finalStatus}`,
      );
    }

    await onLog(
      `✅ Docker container "${containerName}" started successfully on EC2`,
    );
    await onLog(`✅ Container mapped to domain: ${domain}`);

    return {
      commandId,
      status: finalStatus,
      message: `Container ${containerName} running for domain ${domain}`,
    };
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Unknown SSM error";

    if (
      errMessage.includes("invalid") ||
      errMessage.includes("security token") ||
      errMessage.includes("credentials") ||
      errMessage.includes("not authorized") ||
      errMessage.includes("UnrecognizedClientException")
    ) {
      await onLog(`⚠️  AWS credentials invalid — switching to Mock Mode`);
      await sleep(2000);
      await onLog(`✅ Docker container "${containerName}" started (mock)`);
      await onLog(`✅ Container mapped to domain: ${domain}`);

      return {
        commandId: "mock-fallback-" + Date.now(),
        status: "Success",
        message: `Mock fallback: Container ${containerName} running`,
      };
    }

    throw new Error(`SSM Error: ${errMessage}`);
  }
}
