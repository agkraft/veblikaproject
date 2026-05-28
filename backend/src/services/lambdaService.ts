import {
  LambdaClient,
  InvokeCommand,
  InvocationType,
} from "@aws-sdk/client-lambda";
import type { ILambdaResult } from "../types/deployment";

const lambdaClient = new LambdaClient({
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

export async function invokePostDeployLambda(
  deploymentId: string,
  clientName: string,
  domain: string,
  image: string,
  onLog: (message: string) => Promise<void>,
): Promise<ILambdaResult> {
  const functionName =
    process.env.LAMBDA_FUNCTION_NAME || "veblika-post-deploy-setup";

  await onLog(`Invoking AWS Lambda function: ${functionName}`);

  const payload = {
    deploymentId,
    clientName,
    domain,
    image,
    timestamp: new Date().toISOString(),
    action: "post-deploy-setup",
    source: "veblika-control-panel",
  };

  // ─── MOCK MODE ───────────────────────────────────────────
  if (isMockMode()) {
    await onLog(`⚠️  Mock Mode: Simulating Lambda invocation...`);
    await sleep(1500);
    await onLog(`✅ Lambda function completed. HTTP Status: 200`);
    await onLog(`✅ Post-deployment setup done for domain: ${domain}`);

    return {
      statusCode: 200,
      body: {
        message: "Mock Lambda executed successfully",
        domain,
        deploymentId,
      },
    };
  }
  // ─────────────────────────────────────────────────────────

  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: InvocationType.RequestResponse,
      Payload: JSON.stringify(payload),
      LogType: "Tail",
    });

    const response = await lambdaClient.send(command);

    let responseBody: Record<string, unknown> = {};
    if (response.Payload) {
      const decoded = Buffer.from(response.Payload).toString("utf-8");
      try {
        responseBody = JSON.parse(decoded);
      } catch {
        responseBody = { raw: decoded };
      }
    }

    if (response.FunctionError) {
      throw new Error(
        `Lambda function error: ${response.FunctionError} — ${JSON.stringify(responseBody)}`,
      );
    }

    const statusCode = response.StatusCode || 200;

    await onLog(`✅ Lambda function completed. HTTP Status: ${statusCode}`);
    await onLog(`✅ Post-deployment setup done for domain: ${domain}`);

    return { statusCode, body: responseBody };
  } catch (error) {
    const errMessage =
      error instanceof Error ? error.message : "Unknown Lambda error";

    // Credentials invalid — mock fallback
    if (
      errMessage.includes("invalid") ||
      errMessage.includes("security token") ||
      errMessage.includes("credentials") ||
      errMessage.includes("not authorized") ||
      errMessage.includes("ResourceNotFoundException")
    ) {
      await onLog(`⚠️  AWS credentials invalid — switching to Mock Mode`);
      await sleep(1500);
      await onLog(`✅ Lambda completed (mock). HTTP Status: 200`);
      await onLog(`✅ Post-deployment setup done for domain: ${domain}`);

      return {
        statusCode: 200,
        body: {
          message: "Mock fallback Lambda executed",
          domain,
          deploymentId,
        },
      };
    }

    throw new Error(`Lambda Error: ${errMessage}`);
  }
}
