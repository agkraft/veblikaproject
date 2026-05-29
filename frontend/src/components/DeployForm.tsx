import { useState } from "react";
import type { DeployFormData } from "../types/deployment";
import { startDeployment } from "../api/deployapi";

interface DeployFormProps {
  onDeployStarted: (deploymentId: string) => void;
}

// Initial/empty state for the form
const EMPTY_FORM: DeployFormData = {
  clientName: "",
  domain: "",
  image: "nginx:latest",
};

export default function DeployForm({ onDeployStarted }: DeployFormProps) {
  const [form, setForm] = useState<DeployFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.clientName.trim()) return setError("Client name is required");
    if (!form.domain.trim()) return setError("Domain is required");
    if (!form.image.trim()) return setError("Docker image is required");

    setLoading(true);
    try {
      const response = await startDeployment(form);

      if (response.success && response.deploymentId) {
        onDeployStarted(response.deploymentId);
        setForm(EMPTY_FORM);
      } else {
        setError(response.message || "Deployment request failed");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to backend. Is the server running?",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 28,
      }}
    >
      {/* Panel title */}
      <div className="flex items-center gap-3 mb-6">
        <div
          style={{
            background: "var(--accent-glow)",
            border: "1px solid var(--accent)",
            borderRadius: 8,
            padding: "6px 8px",
            fontSize: 16,
          }}
        >
          🚀
        </div>
        <div>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Onboard New Client
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Fill details to start a new deployment
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* ── Client Name ── */}
        <FormField
          label="Client Name"
          name="clientName"
          value={form.clientName}
          onChange={handleChange}
          placeholder="e.g. Acme Corp"
          disabled={loading}
          hint="Company or client identifier"
        />

        {/* ── Domain ── */}
        <FormField
          label="Domain"
          name="domain"
          value={form.domain}
          onChange={handleChange}
          placeholder="e.g. acme.ourplatform.com"
          disabled={loading}
          hint="The subdomain to map this container to"
        />

        {/* ── Docker Image ── */}
        <FormField
          label="Docker Image"
          name="image"
          value={form.image}
          onChange={handleChange}
          placeholder="e.g. nginx:latest"
          disabled={loading}
          hint="Public Docker Hub image name with tag"
          mono
        />

        {/* Error message */}
        {error && (
          <div
            style={{
              background: "#f8717111",
              border: "1px solid #f8717133",
              borderRadius: 8,
              padding: "10px 14px",
              color: "var(--error)",
              fontSize: 13,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Deploy button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2"
          style={{
            background: loading ? "#1e2540" : "var(--accent)",
            color: loading ? "var(--text-muted)" : "#fff",
            border: "none",
            borderRadius: 10,
            padding: "13px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "var(--font-display)",
            transition: "all 0.2s",
            marginTop: 4,
          }}
        >
          {loading ? (
            <>
              <Spinner />
              Queuing Deployment...
            </>
          ) : (
            "⚡ Deploy Now"
          )}
        </button>
      </form>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  mono?: boolean;
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  hint,
  mono,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: "var(--bg-input)",
          border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 8,
          color: "var(--text-primary)",
          fontSize: 13,
          padding: "10px 14px",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-display)",
          outline: "none",
          transition: "border-color 0.15s",
          opacity: disabled ? 0.5 : 1,
          width: "100%",
        }}
      />

      {hint && (
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{hint}</p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        border: "2px solid #ffffff33",
        borderTopColor: "#fff",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}
