import mongoose, { Document, Schema } from "mongoose";
import type { DeploymentStatus } from "../types/deployment";

export interface IDeploymentDocument extends Document {
  clientName: string;
  domain: string;
  image: string;
  status: DeploymentStatus;
  logs: string[];
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema Definition ────────────────────────────────────────
const DeploymentSchema = new Schema<IDeploymentDocument>(
  {
    clientName: {
      type: String,
      required: [true, "Client name is required"], // Custom error message
      trim: true,
      maxlength: [100, "Client name too long"],
    },

    domain: {
      type: String,
      required: [true, "Domain is required"],
      trim: true,
      lowercase: true,
    },

    image: {
      type: String,
      required: [true, "Docker image name is required"],
      trim: true,
      default: "nginx:latest",
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "running", "completed", "failed"],
        message: "Invalid status value: {VALUE}",
      },
      default: "pending",
    },

    logs: {
      type: [String],
      default: [],
    },

    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
   
  },
);

// ── Model Export ─────────────────────────────────────────────
const Deployment = mongoose.model<IDeploymentDocument>(
  "Deployment",
  DeploymentSchema,
);

export default Deployment;
