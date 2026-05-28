import { useState } from "react";
import DeployForm from "./components/DeployForm";
import "./index.css";
import Dashboard from "./components/Dashboard";

export default function App() {

  const [deploymentIds, setDeploymentIds] = useState<string[]>([]);

  function handleDeployStarted(id: string) {
    setDeploymentIds((prev) => [id, ...prev]);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* ── Header ── */}
      <header
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div
            style={{
              background: "var(--accent-glow)",
              border: "1px solid var(--accent)",
              borderRadius: 8,
              padding: "5px 8px",
              fontSize: 16,
            }}
          >
            ⚡
          </div>
          <div>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Veblika
            </span>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginLeft: 8,
              }}
            >
              Control Panel
            </span>
          </div>
        </div>

        {/* Live indicator */}
        <div
          className="flex items-center gap-2"
          style={{ fontSize: 12, color: "var(--text-muted)" }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--success)",
              display: "inline-block",
              animation: "pulse 2s infinite",
            }}
          />
          System Online
        </div>
      </header>

      {/* ── Main 2-column layout ── */}
      <main
        style={{
          display: "grid",
          // Left: form (fixed 400px), Right: dashboard (remaining space)
          gridTemplateColumns: "400px 1fr",
          gap: 24,
          padding: "28px 32px",
          maxWidth: 1300,
          margin: "0 auto",
          alignItems: "start",
        }}
      >
        {/* Left column — Onboarding Form */}
        <div>
          <DeployForm onDeployStarted={handleDeployStarted} />

          {/* Info card below form */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              marginTop: 16,
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.8,
            }}
          >
            <p
              style={{
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 8,
              }}
            >
              How it works
            </p>
            <ol
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {[
                "1. Form submit → API saves to MongoDB",
                "2. Job pushed to Redis queue",
                "3. Worker pulls Docker image on EC2",
                "4. Lambda triggered for post-setup",
                "5. Status updates live on dashboard",
              ].map((step, i) => (
                <li
                  key={i}
                  style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right column — Live Dashboard */}
        <Dashboard deploymentIds={deploymentIds} />
      </main>

      {/* Global keyframes for animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Responsive — mobile pe single column */
        @media (max-width: 768px) {
          main {
            grid-template-columns: 1fr !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
