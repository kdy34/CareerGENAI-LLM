"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeCV } from "../../lib/api";

const TARGET_ROLES = [
  "Machine Learning Engineer",
  "Data Scientist",
  "AI Engineer",
  "MLOps Engineer",
  "Data Analyst",
];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please upload your CV (PDF or DOCX).");
      return;
    }

    if (!targetRole.trim()) {
      setError("Please select or type a target role.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await analyzeCV(file, targetRole.trim());
      const runId = result.run_id;
      router.push(`/results?run_id=${runId}`);
    } catch (err: any) {
      console.error("UPLOAD_ANALYZE_ERROR:", err);
      setError(
        err?.message || "Something went wrong while analyzing your CV."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <section className="split-layout">
        {/* Left: explanation */}
        <div className="split-col">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            <span>Step 1 · Upload your CV and choose a target role</span>
          </div>

          <h1 className="hero-title" style={{ marginTop: "0.7rem" }}>
            Upload your CV and{" "}
            <span className="hero-highlight">let the AI mentor read it.</span>
          </h1>

          <p className="hero-subtitle">
            The engine extracts your skills, maps them to a role-specific
            taxonomy, runs gap analysis, and generates both a learning roadmap
            and project suggestions. You keep full control over how you use the
            insights.
          </p>

          <div className="subgrid-metrics">
            <div className="subgrid-card">
              <div className="subgrid-title" style={{ color: "#6ee7b7" }}>
                Skill map
              </div>
              <p className="subgrid-text">
                Visualize which skills you already have vs. what is expected for
                your target role.
              </p>
            </div>
            <div className="subgrid-card">
              <div className="subgrid-title" style={{ color: "#38bdf8" }}>
                Roadmap phases
              </div>
              <p className="subgrid-text">
                Phased plan with concrete topics, tools, and milestones you can
                track.
              </p>
            </div>
            <div className="subgrid-card">
              <div className="subgrid-title" style={{ color: "#e879f9" }}>
                Portfolio
              </div>
              <p className="subgrid-text">
                Project ideas aligned to your gaps, not random “hello world”
                tasks.
              </p>
            </div>
            <div className="subgrid-card">
              <div className="subgrid-title" style={{ color: "#fbbf24" }}>
                Export
              </div>
              <p className="subgrid-text">
                Exportable report you can use for planning or as a talking point
                in interviews.
              </p>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="split-col">
          <div className="form-card">
            <div style={{ marginBottom: "0.7rem" }}>
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Upload your CV
              </h2>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "#9ca3af",
                  marginTop: "0.25rem",
                }}
              >
                Supported formats: PDF, DOC, DOCX. Your file is processed on the
                backend and only used to generate this analysis.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* file */}
              <div className="form-group">
                <label className="form-label">CV / Resume file</label>
                <label className="file-drop">
                  {file ? (
                    <span className="file-name">{file.name}</span>
                  ) : (
                    <>
                      <span className="file-name">Click to upload</span>&nbsp;or
                      drag &amp; drop your CV here
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* target role */}
              <div className="form-group">
                <label className="form-label">Target role</label>
                <p className="form-help">
                  Choose a common role or type your exact target (e.g.{" "}
                  <em>Senior ML Engineer</em>, <em>GenAI Engineer</em>).
                </p>
                <div className="select-row">
                  <select
                    className="select"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  >
                    <option value="">Select a common role</option>
                    {TARGET_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="input"
                    placeholder="Or type a custom target role..."
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}

              <div className="form-footer">
                <p>
                  We do not permanently store your CV; this is for demo and
                  learning purposes.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? "Analyzing…" : "Analyze my CV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
