"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type GapReport = {
  strengths: string[];
  missing_core: string[];
  missing_nice_to_have: string[];
  summary?: string;
};

type AnalysisRun = {
  id: number;
  target_role: string;
  skills: {
    validated_skills: string[];
    inferred_domains?: string[];
  };
  gap_report?: GapReport;
  roadmap_md: string;
  projects?: any[];
};

type SkillChartDatum = {
  label: string;
  count: number;
};

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function ResultsPage() {
  const [runId, setRunId] = useState<number | null>(null);
  const [data, setData] = useState<AnalysisRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Read & validate run_id from URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const runIdStr = params.get("run_id");

      if (!runIdStr || runIdStr === "undefined" || runIdStr === "null") {
        setError("No valid run_id in URL. Please re-run the analysis.");
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
      setError(e?.message || "Failed to read run_id from URL.");
      setLoading(false);
    }
  }, []);

  // 2) Fetch from backend
  useEffect(() => {
    if (runId == null) return;

    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${PUBLIC_API_BASE}/analysis/${runId}`);
        if (!res.ok) {
          let detail = `Failed to load analysis (status ${res.status}).`;
          try {
            const body = (await res.json()) as any;
            if (body?.detail) detail = body.detail;
          } catch {
            // ignore
          }
          throw new Error(detail);
        }

        const json = (await res.json()) as AnalysisRun;
        setData(json);
      } catch (e: any) {
        console.error("FetchAnalysis error:", e);
        setError(e?.message || "Failed to load analysis.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [runId]);

  if (loading) {
    return (
      <main className="results-page">
        <section className="card-compact" style={{ textAlign: "center" }}>
          <p>Loading analysis…</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="results-page">
        <section className="card-compact">
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "0.4rem",
            }}
          >
            Could not load analysis
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#fca5a5" }}>{error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="results-page">
        <section className="card-compact">
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            No analysis data found.
          </p>
        </section>
      </main>
    );
  }

  const { target_role, gap_report, skills, projects } = data;
  const strengths = gap_report?.strengths || [];
  const missingCore = gap_report?.missing_core || [];
  const missingNice = gap_report?.missing_nice_to_have || [];
  const validatedSkills = skills?.validated_skills || [];

  const strengthsCount = strengths.length;
  const coreGapsCount = missingCore.length;
  const niceGapsCount = missingNice.length;

  const totalRelevant = strengthsCount + coreGapsCount + niceGapsCount;
  const matchPercent =
    totalRelevant > 0 ? Math.round((strengthsCount / totalRelevant) * 100) : 0;

  const chartData: SkillChartDatum[] = [
    { label: "Strengths", count: strengthsCount },
    { label: "Core gaps", count: coreGapsCount },
    { label: "Nice-to-have gaps", count: niceGapsCount },
  ];

  return (
    <main className="results-page">
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
                  background: "rgba(56,189,248,0.14)",
                  color: "#e0f2fe",
                  border: "1px solid rgba(56,189,248,0.7)",
                }}
              >
                CV Skill Analysis
              </span>
              <span
                style={{
                  padding: "0.15rem 0.5rem",
                  borderRadius: "999px",
                  background: "rgba(148,163,184,0.12)",
                  color: "#e5e7eb",
                  border: "1px solid rgba(148,163,184,0.5)",
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
              Readiness for{" "}
              <span style={{ color: "#38bdf8" }}>{target_role}</span>
            </h1>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#cbd5f5",
                maxWidth: "40rem",
              }}
            >
              Below is your match against a curated skill profile for this role.
              You&apos;ll see strengths, missing core skills, and nice-to-have
              areas, plus suggested portfolio projects.
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
              href="/upload"
              style={{
                fontSize: "0.8rem",
                padding: "0.35rem 0.8rem",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.6)",
                color: "#e5e7eb",
                textDecoration: "none",
              }}
            >
              Analyze another CV
            </a>
            <a
              href={`/roadmap?run_id=${data.id}`}
              style={{
                fontSize: "0.8rem",
                padding: "0.35rem 0.8rem",
                borderRadius: "999px",
                border: "1px solid #38bdf8",
                background: "rgba(56,189,248,0.12)",
                color: "#e0f2fe",
                textDecoration: "none",
              }}
            >
              View learning roadmap
            </a>
          </div>
        </div>
      </section>

      {/* TOP GRID: SUMMARY + READINESS BAR */}
      <section
        className="card-compact"
        style={{ marginBottom: "1rem", paddingBottom: "0.9rem" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.3fr) minmax(0, 1.2fr)",
            gap: "1.2rem",
            alignItems: "stretch",
          }}
        >
          {/* Summary text */}
          <div>
            <h2
              style={{
                fontSize: "0.95rem",
                fontWeight: 500,
                marginBottom: "0.4rem",
              }}
            >
              Summary
            </h2>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#e5e7eb",
                lineHeight: 1.5,
              }}
            >
              {gap_report?.summary ||
                "This analysis compares your validated skills against a reference profile for the target role and highlights strengths and learning gaps."}
            </p>
            {validatedSkills.length > 0 && (
              <p
                style={{
                  marginTop: "0.4rem",
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                }}
              >
                Detected skills in your CV:{" "}
                <span style={{ color: "#e5e7eb" }}>
                  {validatedSkills.slice(0, 12).join(", ")}
                  {validatedSkills.length > 12 ? "…" : ""}
                </span>
              </p>
            )}
          </div>

          {/* Readiness card */}
          <div
            style={{
              borderRadius: "0.9rem",
              border: "1px solid rgba(148,163,184,0.5)",
              background:
                "radial-gradient(circle at top left, rgba(56,189,248,0.24), rgba(15,23,42,0.9))",
              padding: "0.8rem 0.9rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.35rem",
                fontSize: "0.8rem",
              }}
            >
              <span style={{ color: "#e5e7eb" }}>Overall skill match</span>
              <span style={{ color: "#bae6fd", fontWeight: 600 }}>
                {matchPercent}%
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: "0.65rem",
                borderRadius: "999px",
                background: "rgba(15,23,42,0.9)",
                overflow: "hidden",
                marginBottom: "0.45rem",
              }}
            >
              <div
                style={{
                  width: `${matchPercent}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background:
                    "linear-gradient(90deg, rgba(34,197,94,0.2), rgba(56,189,248,0.9))",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.75rem",
                color: "#9ca3af",
              }}
            >
              <span>{strengthsCount} matched skills</span>
              <span>{coreGapsCount + niceGapsCount} gaps identified</span>
            </div>
          </div>
        </div>
      </section>

      {/* SKILL MATCH CHART */}
      <section className="card-compact" style={{ marginBottom: "1rem" }}>
        <h2
          style={{
            fontSize: "0.95rem",
            fontWeight: 500,
            marginBottom: "0.6rem",
          }}
        >
          Skill match overview
        </h2>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#9ca3af",
            marginBottom: "0.5rem",
          }}
        >
          This chart shows how many of the role&apos;s reference skills you
          already cover, versus how many are missing in your current profile.
        </p>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" stroke="#9ca3af" />
              <YAxis allowDecimals={false} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #4b5563",
                  fontSize: "0.8rem",
                  color: "#e5e7eb",
                }}
              />
              <Bar
                dataKey="count"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* LOWER GRID: SKILL LISTS + PROJECTS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.6fr)",
          gap: "1rem",
        }}
      >
        {/* LEFT: Strengths + Gaps */}
        <section className="card-compact">
          <h2
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
            }}
          >
            Skill breakdown
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "0.8rem",
              fontSize: "0.8rem",
            }}
          >
            {/* Strengths */}
            <div>
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: "0.3rem",
                  color: "#bbf7d0",
                }}
              >
                Strengths ({strengthsCount})
              </div>
              <div
                style={{
                  maxHeight: "9rem",
                  overflow: "auto",
                  paddingRight: "0.2rem",
                }}
              >
                {strengthsCount ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.1rem",
                    }}
                  >
                    {strengths.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: "0.15rem" }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#9ca3af" }}>
                    No clear strengths detected yet.
                  </p>
                )}
              </div>
            </div>

            {/* Core gaps + Nice-to-have gaps */}
            <div>
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: "0.3rem",
                  color: "#fecaca",
                }}
              >
                Core gaps ({coreGapsCount})
              </div>
              <div
                style={{
                  maxHeight: "4.3rem",
                  overflow: "auto",
                  paddingRight: "0.2rem",
                  marginBottom: "0.4rem",
                }}
              >
                {coreGapsCount ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.1rem",
                    }}
                  >
                    {missingCore.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: "0.15rem" }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#9ca3af" }}>No core gaps identified.</p>
                )}
              </div>

              <div
                style={{
                  fontWeight: 500,
                  marginBottom: "0.3rem",
                  color: "#fed7aa",
                }}
              >
                Nice-to-have gaps ({niceGapsCount})
              </div>
              <div
                style={{
                  maxHeight: "4.3rem",
                  overflow: "auto",
                  paddingRight: "0.2rem",
                }}
              >
                {niceGapsCount ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "1.1rem",
                    }}
                  >
                    {missingNice.map((s, idx) => (
                      <li key={idx} style={{ marginBottom: "0.15rem" }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#9ca3af" }}>
                    No nice-to-have gaps identified.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: Projects */}
        <section className="card-compact">
          <h2
            style={{
              fontSize: "0.95rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
            }}
          >
            Suggested portfolio projects
          </h2>
          {projects && projects.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "0.6rem",
              }}
            >
              {projects.slice(0, 6).map((p: any, idx: number) => (
                <article
                  key={idx}
                  style={{
                    borderRadius: "0.9rem",
                    border: "1px solid rgba(55,65,81,0.9)",
                    background:
                      "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(17,24,39,0.95))",
                    padding: "0.65rem 0.7rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    {p.title || p.name || `Project ${idx + 1}`}
                  </h3>
                  {p.description && (
                    <p
                      style={{
                        marginBottom: "0.25rem",
                        color: "#9ca3af",
                        lineHeight: 1.35,
                      }}
                    >
                      {p.description}
                    </p>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.25rem",
                      marginTop: "0.15rem",
                    }}
                  >
                    {(p.skills || []).slice(0, 5).map((s: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          padding: "0.12rem 0.4rem",
                          borderRadius: "999px",
                          border: "1px solid rgba(75,85,99,0.9)",
                          fontSize: "0.7rem",
                          color: "#e5e7eb",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {p.difficulty && (
                      <span
                        style={{
                          marginLeft: "auto",
                          padding: "0.12rem 0.4rem",
                          borderRadius: "999px",
                          border: "1px solid rgba(56,189,248,0.7)",
                          fontSize: "0.7rem",
                          color: "#e0f2fe",
                        }}
                      >
                        {p.difficulty}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              No project suggestions found for this run. Try a more specific
              target role like &quot;Data Scientist&quot; or &quot;ML
              Engineer&quot;.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
