import type {
  DeployFormData,
  DeployApiResponse,
  StatusApiResponse,
} from "../types/deployment";

const API_BASE = import.meta.env.VITE_API_URL;
console.log("API Base URL:", API_BASE);

// Deploy API
export async function startDeployment(
  data: DeployFormData,
): Promise<DeployApiResponse> {
  const res = await fetch(`${API_BASE}/deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Server error ${res.status}`);
  }

  return res.json();
}

// Deployment Status API
export async function getDeploymentStatus(
  id: string,
): Promise<StatusApiResponse> {
  const res = await fetch(`${API_BASE}/status/${id}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Status fetch failed ${res.status}`);
  }

  return res.json();
}
