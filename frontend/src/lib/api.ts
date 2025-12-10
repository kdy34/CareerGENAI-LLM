const isServer = typeof window === "undefined";

const API_BASE = isServer
  ? process.env.INTERNAL_API_BASE || "http://backend:8000"      //inside container
  : process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"; //Browser

//Upload CV and request analysis
export async function analyzeCV(file: File, targetRole: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("target_role", targetRole);

  const res = await fetch(`${API_BASE}/mentor/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let message = `Failed to analyze CV (status ${res.status}).`;
    try {
      const errData = await res.json();
      console.error("analyzeCv backend error:", errData);
      if (errData?.detail) {
        message =
          typeof errData.detail === "string"
            ? errData.detail
            : JSON.stringify(errData.detail);
      }
    } catch (e) {
      console.error("analyzeCv error JSON parse failed:", e);
    }
    throw new Error(message);
  }

  const data = await res.json();
  console.log("analyzeCv backend response:", data);

  const runId =
    data.run_id ??
    data.id ??
    data.runId ??
    data.analysis_id ??
    data.analysisId;

  if (!runId) {
    throw new Error(
      `Analysis did not return a run_id. Raw response: ${JSON.stringify(data)}`
    );
  }

  return { run_id: runId };
}


//Fetch a previously analyzed run from Postgres (using run_id)
export async function fetchAnalysis(runId: number | string) {
  const res = await fetch(`${API_BASE}/analysis/${runId}`);

  if (!res.ok) {
    const text = await res.text();
    console.error("FetchAnalysis error:", text);
    throw new Error(`Failed to fetch analysis: ${text}`);
  }

  return res.json();
}
