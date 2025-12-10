"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type AnalysisRun = {
  id: number;
  target_role: string;
  skills: {
    validated_skills: string[];
    inferred_domains?: string[];
  };
  gap_report?: {
    strengths: string[];
    missing_core: string[];
    missing_nice_to_have: string[];
    summary?: string;
  };
  roadmap_md: string;
};

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Render roadmap markdown-like text as headings + lists + paragraphs
 */
function renderRoadmap(md: string): ReactNode {
  const lines = md.split("\n").map((l) => l.trim());
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];
  let keyCounter = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const localKey = keyCounter++;
    blocks.push(
      <ul
        key={`list-${localKey}`}
        style={{
          margin: "0.3rem 0 0.3rem 1.1rem",
          paddingLeft: "0.7rem",
        }}
      >
        {listBuffer.map((item, idx) => (
          <li
            key={`li-${localKey}-${idx}`}
            style={{ marginBottom: "0.15rem", lineHeight: 1.4 }}
          >
            {item}
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  const isHeading = (line: string) =>
    line.startsWith("### ") ||
    line.startsWith("## ") ||
    line.startsWith("# ") ||
    /^phase\s+\d+/i.test(line) ||
    /^step\s+\d+/i.test(line) ||
    /^sprint\s+\d+/i.test(line);

  const cleanHeading = (line: string) =>
    line.replace(/^#+\s*/, "").replace(/^\s*(Phase|Step|Sprint)/i, (m) => m);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }

    const isBullet =
      line.startsWith("- ") ||
      line.startsWith("* ") ||
      line.startsWith("• ");

    if (isHeading(line)) {
      flushList();
      const title = cleanHeading(line);
      const localKey = keyCounter++;
      blocks.push(
        <h3
          key={`h-${localKey}`}
          style={{
            marginTop: "0.8rem",
            marginBottom: "0.3rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#bae6fd",
            borderLeft: "2px solid rgba(56,189,248,0.7)",
            paddingLeft: "0.5rem",
          }}
        >
          {title}
        </h3>
      );
      continue;
    }

    if (isBullet) {
      const text = line.replace(/^[-*•]\s*/, "");
      listBuffer.push(text);
      continue;
    }

    flushList();
    const localKey = keyCounter++;
    blocks.push(
      <p
        key={`p-${localKey}`}
        style={{
          marginTop: "0.25rem",
          marginBottom: "0.1rem",
          lineHeight: 1.5,
        }}
      >
        {line}
      </p>
    );
  }

  flushList();

  if (blocks.length === 0) {
    return (
      <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
        No roadmap content available.
      </p>
    );
  }

  return <>{blocks}</>;
}

export default function RoadmapPage() {
  const [runId, setRunId] = useState<number | null>(null);
  const [data, setData] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read run_id from URL as number
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const runIdStr = params.get("run_id");

      if (!runIdStr || runIdStr === "undefined" || runIdStr === "null") {
        setError("No valid run_id in URL. Please open roadmap from results page.");
        setLoading(false);
        return;
      }

      const id = Number(runIdStr);
      if (!Number.isInteger(id) || id <= 0) {
        setError("Invalid run_id in URL.");
        setLoading(false);
        return;
      }

      setRunId(id);
    } catch (e: any) {
      setError(e?.message || "Failed to read URL.");
      setLoading(false);
    }
  }, []);

  // Fetch roadmap
  useEffect(() => {
    if (runId == null) return;

    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${PUBLIC_API_BASE}/analysis/${runId}`);
        if (!res.ok) {
          let detail = `Failed to load roadmap (status ${res.status}).`;
          try {
            const body = (await res.json()) as any;
            if (body?.detail) detail = body.detail;
          } catch {
            /* ignore */
          }
          throw new Error(detail);
        }

        const json = (await res.json()) as AnalysisRun;
        setData(json);
      } catch (e: any) {
        console.error("Roadmap fetch error:", e);
        setError(e?.message || "Failed to load roadmap.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [runId]);

  const handleDownload = () => {
    if (runId == null) return;
    window.open(`${PUBLIC_API_BASE}/analysis/${runId}/report`, "_blank");
  };

  if (loading) {
    return (
      <main className="roadmap-page">
        <section className="card-compact" style={{ textAlign: "center" }}>
          <p>Loading roadmap…</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="roadmap-page">
        <section className="card-compact">
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "0.4rem",
            }}
          >
            Could not load roadmap
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#fca5a5" }}>{error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="roadmap-page">
        <section className="card-compact">
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            No roadmap data found for this run.
          </p>
        </section>
      </main>
    );
  }

  const { target_role, gap_report, roadmap_md } = data;
  const strengthsCount = gap_report?.strengths?.length ?? 0;
  const coreGapsCount = gap_report?.missing_core?.length ?? 0;
  const niceGapsCount = gap_report?.missing_nice_to_have?.length ?? 0;

  return (
    <main className="roadmap-page">
      {/* HEADER */}
      <section className="card-compact" style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "0.4rem",
                fontSize: "0.75rem",
              }}
            >
              <span
                style={{
                  padding: "0.15rem 0.5rem",
                  borderRadius: "999px",
                  background: "rgba(96,165,250,0.15)",
                  color: "#bfdbfe",
                  border: "1px solid rgba(59,130,246,0.6)",
                }}
              >
                Learning roadmap
              </span>
              <span
                style={{
                  padding: "0.15rem 0.5rem",
                  borderRadius: "999px",
                  background: "rgba(148,163,184,0.12)",
                  color: "#e5e7eb",
                  border: "1px solid rgba(148,163,184,0.4)",
                }}
              >
                Run #{data.id}
              </span>
            </div>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 600,
                marginBottom: "0.3rem",
              }}
            >
              Roadmap for{" "}
              <span style={{ color: "#38bdf8" }}>{target_role}</span>
            </h1>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#cbd5f5",
                maxWidth: "40rem",
              }}
            >
              This is your detailed skill development roadmap, generated from
              your CV and the target role requirements.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              minWidth: "9rem",
              alignItems: "flex-end",
            }}
          >
            <a
              href={`/results?run_id=${data.id}`}
              style={{
                fontSize: "0.8rem",
                padding: "0.35rem 0.8rem",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.6)",
                color: "#e5e7eb",
                textDecoration: "none",
              }}
            >
              Back to results
            </a>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                fontSize: "0.8rem",
                padding: "0.35rem 0.8rem",
                borderRadius: "999px",
                border: "1px solid #38bdf8",
                background: "rgba(56,189,248,0.12)",
                color: "#e0f2fe",
                cursor: "pointer",
              }}
            >
              Download full report
            </button>
          </div>
        </div>
      </section>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 2fr)",
          gap: "1rem",
        }}
      >
        {/* LEFT: SNAPSHOT */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <section className="card-compact">
            <h2
              style={{
                fontSize: "0.95rem",
                fontWeight: 500,
                marginBottom: "0.4rem",
              }}
            >
              Snapshot
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "0.6rem",
                fontSize: "0.8rem",
              }}
            >
              <div
                style={{
                  padding: "0.45rem 0.55rem",
                  borderRadius: "0.75rem",
                  background: "rgba(22,163,74,0.12)",
                  border: "1px solid rgba(34,197,94,0.5)",
                }}
              >
                <div style={{ color: "#6ee7b7", fontSize: "0.75rem" }}>
                  Strengths
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 600 }}>
                  {strengthsCount}
                </div>
              </div>
              <div
                style={{
                  padding: "0.45rem 0.55rem",
                  borderRadius: "0.75rem",
                  background: "rgba(185,28,28,0.14)",
                  border: "1px solid rgba(248,113,113,0.6)",
                }}
              >
                <div style={{ color: "#fecaca", fontSize: "0.75rem" }}>
                  Core gaps
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 600 }}>
                  {coreGapsCount}
                </div>
              </div>
              <div
                style={{
                  padding: "0.45rem 0.55rem",
                  borderRadius: "0.75rem",
                  background: "rgba(217,119,6,0.12)",
                  border: "1px solid rgba(245,158,11,0.6)",
                }}
              >
                <div style={{ color: "#fed7aa", fontSize: "0.75rem" }}>
                  Nice-to-have
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 600 }}>
                  {niceGapsCount}
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* RIGHT: ROADMAP BODY */}
        <section className="card-compact">
          <h2
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              marginBottom: "0.4rem",
            }}
          >
            Detailed roadmap
          </h2>
          <div
            style={{
              marginTop: "0.3rem",
              padding: "0.7rem 0.6rem",
              borderRadius: "0.8rem",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(31,41,55,0.9)",
              fontSize: "0.85rem",
              maxHeight: "70vh",
              overflow: "auto",
            }}
          >
            {renderRoadmap(roadmap_md)}
          </div>
        </section>
      </div>
    </main>
  );
}
