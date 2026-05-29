# ⚡ Veblika Control Panel — Full Stack Deployment System

A full-stack hosting control panel that automates Docker container deployments on AWS EC2, built as a technical assignment for Veblika.

---

## 🎯 Project Overview

When an admin onboards a new client, the system:
1. Accepts client details via a React form
2. Saves the request to MongoDB with status `pending`
3. Pushes a job to a **Redis + BullMQ** background queue
4. A **worker process** picks up the job and:
   - Deploys a Docker container on EC2 via **AWS SSM SendCommand**
   - Invokes an **AWS Lambda** function for post-deployment setup
5. Frontend **polls every 3 seconds** and shows live status updates

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| Queue | Redis + BullMQ |
| Cloud | AWS EC2 (via SSM), AWS Lambda (SDK v3) |

---

## 📁 Project Structure

```
veblikaassignment/
├── frontend/
│   └── src/
│       ├── api/deployApi.ts          # All backend fetch calls
│       ├── types/deployment.ts       # TypeScript interfaces
│       ├── components/
│       │   ├── DeployForm.tsx        # Onboarding form
│       │   ├── Dashboard.tsx         # Live status panel
│       │   ├── DeploymentCard.tsx    # Per-deployment card with logs
│       │   └── StatusBadge.tsx       # Colored status pill
│       └── App.tsx                   # Root component
│
└── backend/
    └── src/
        ├── config/
        │   ├── database.ts           # MongoDB connection
        │   └── redis.ts              # Redis connection config
        ├── models/Deployment.ts      # Mongoose schema + model
        ├── types/deployment.ts       # TypeScript interfaces
        ├── controllers/
        │   └── deploymentController.ts  # Business logic
        ├── routes/
        │   └── deploymentRoutes.ts   # API route definitions
        ├── services/
        │   ├── awsSSMService.ts      # EC2 Docker deploy via SSM
        │   └── lambdaService.ts      # Lambda invocation
        ├── queue/
        │   ├── deploymentQueue.ts    # BullMQ queue setup
        │   └── deploymentWorker.ts   # Background job processor
        └── server.ts                 # Express app entry point
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- Docker Desktop

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/veblikaassignment.git
cd veblikaassignment
```

### 2. Start MongoDB and Redis

```bash
docker run -d --name mongo  -p 27017:27017 mongo:7
docker run -d --name redis  -p 6379:6379   redis:7-alpine
```

### 3. Backend setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/veblika
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=ap-south-1
EC2_INSTANCE_ID=i-0abc12345
LAMBDA_FUNCTION_NAME=veblika-post-deploy-setup
```

**Terminal 1 — API Server:**
```bash
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Background Worker:**
```bash
npm run dev:worker
```

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔌 API Reference

### POST `/api/deploy`
Queues a new deployment.

**Request Body:**
```json
{
  "clientName": "Acme Corp",
  "domain": "acme.ourplatform.com",
  "image": "nginx:latest"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deployment queued successfully",
  "deploymentId": "665f1234abcd5678ef901234"
}
```

---

### GET `/api/status/:id`
Returns current deployment status (polled every 3s by frontend).

**Response:**
```json
{
  "success": true,
  "deployment": {
    "_id": "665f1234abcd5678ef901234",
    "clientName": "Acme Corp",
    "domain": "acme.ourplatform.com",
    "image": "nginx:latest",
    "status": "completed",
    "logs": ["[2026-05-28T10:00:00Z] Deployment started...", "..."],
    "errorMessage": null,
    "createdAt": "2026-05-28T10:00:00.000Z"
  }
}
```

---

### GET `/api/deployments`
Returns last 20 deployments (used for dashboard history).

---

## 🔄 System Flow

```
Admin fills form → POST /api/deploy
                         ↓
                   Express validates
                         ↓
                   MongoDB save (status: pending)
                         ↓
                   BullMQ queue (stored in Redis)
                         ↓
                   200 OK → frontend starts polling
                         ↓
              [Background Worker picks job]
                         ↓
              AWS SSM → EC2 → docker run <image>
                         ↓
              AWS Lambda → InvokeCommand (post-setup)
                         ↓
              MongoDB update (status: completed/failed)
                         ↓
              React polls GET /api/status/:id → UI updates
```

---

## 🌐 Live Demo

- **Frontend:** [https://veblika-frontend.vercel.app](https://veblika-frontend.vercel.app)
- **Backend API:** [https://veblika-backend.railway.app](https://veblika-backend.railway.app)

---

## 👤 Author

**Kunal Verma**  
[LinkedIn Profile](https://linkedin.com/in/YOUR_LINKEDIN)

---

## 📝 Notes

- AWS SSM requires SSM Agent on EC2 (pre-installed on Amazon Linux 2)
- Worker runs as a separate process — must be started with `npm run dev:worker`
- In development without real AWS credentials, the worker simulates SSM and Lambda responses