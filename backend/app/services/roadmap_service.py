from typing import Dict, Any, List
import traceback

from ..core.llm_client import get_llm


def _fallback_roadmap(skills: Dict[str, Any], gap_report: Dict[str, Any], target_role: str) -> str:
    """
    Deterministic fallback roadmap used if the LLM call fails.
    """
    strengths: List[str] = gap_report.get("strengths", []) or []
    missing_core: List[str] = gap_report.get("missing_core", []) or []
    missing_nice: List[str] = gap_report.get("missing_nice_to_have", []) or []
    summary: str = gap_report.get("summary") or ""
    inferred_domains: List[str] = skills.get("inferred_domains", []) or []

    def fmt(items: List[str]) -> str:
        if not items:
            return "- (none)\n"
        return "".join(f"- {i}\n" for i in items)

    lines: List[str] = []
    lines.append("# Personalized Learning Roadmap\n")
    lines.append(f"Target role: **{target_role}**\n\n")

    if summary:
        lines.append("## Overview\n")
        lines.append(summary.strip() + "\n\n")

    if inferred_domains:
        lines.append("Detected domains you’re already active in:\n")
        lines.append(fmt(inferred_domains) + "\n")

    lines.append("## Phase 0 – Foundations (1–3 weeks)\n")
    lines.append(
        "Refresh core programming, data manipulation, and statistics skills. "
        "Standardize your workflow (Git, virtual envs, basic tests).\n\n"
    )

    lines.append("## Phase 1 – Close core gaps (4–8 weeks)\n")
    lines.append("Core gaps to address:\n")
    lines.append(fmt(missing_core) + "\n")

    lines.append("## Phase 2 – Nice-to-have & differentiators (3–6 weeks)\n")
    lines.append("Nice-to-have gaps:\n")
    lines.append(fmt(missing_nice) + "\n")

    lines.append("## Phase 3 – Portfolio & storytelling (2–4 weeks)\n")
    lines.append("Leverage your strengths:\n")
    lines.append(fmt(strengths) + "\n")

    lines.append("## Phase 4 – Continuous improvement (ongoing)\n")
    lines.append(
        "- Set a monthly learning goal (one small feature, tool, or paper).\n"
        "- Re-scan job descriptions every 3–6 months and update this roadmap.\n"
    )

    return "\n".join(lines)


def generate_roadmap(
    skills: Dict[str, Any],
    gap_report: Dict[str, Any],
    target_role: str,
) -> str:
    """
    Use an LLM to generate a Markdown roadmap.
    Falls back to a deterministic roadmap if LLM fails.
    """

    llm = get_llm()

    validated_skills = skills.get("validated_skills", []) or []
    inferred_domains = skills.get("inferred_domains", []) or []

    strengths: List[str] = gap_report.get("strengths", []) or []
    missing_core: List[str] = gap_report.get("missing_core", []) or []
    missing_nice: List[str] = gap_report.get("missing_nice_to_have", []) or []
    summary: str = gap_report.get("summary") or ""

    prompt = f"""
You are a senior career mentor for machine learning / data / AI roles.

The candidate is targeting the role:
- Target role: {target_role}

Here is their current profile:

- Validated skills: {validated_skills}
- Inferred domains: {inferred_domains}

Gap analysis for this role:

- Strengths: {strengths}
- Missing core skills: {missing_core}
- Missing nice-to-have skills: {missing_nice}
- Summary: {summary}

TASK:
Generate a **clear, structured learning roadmap** for this candidate in **Markdown**.

Requirements:
- Use headings like: "Phase 0 – Foundations", "Phase 1 – Close Core Gaps", "Phase 2 – Nice-to-have Skills", "Phase 3 – Portfolio", "Phase 4 – Continuous Improvement".
- For each phase, include:
  - 1–2 short sentences of goals
  - 3–6 bullet points of concrete actions or study topics
- Focus on the concrete skills listed above (do NOT invent random unrelated areas).
- Make it realistic for someone learning while studying/working (not full-time).

Respond with Markdown only, no extra explanations.
""".strip()

    try:
        # Support both LangChain-style and direct client usage
        if hasattr(llm, "invoke"):
            resp = llm.invoke(prompt)
            content = getattr(resp, "content", None) or str(resp)
        else:
            resp = llm(prompt)
            content = getattr(resp, "content", None) or str(resp)

        content = content.strip()
        if not content:
            raise ValueError("Empty LLM roadmap response")

        return content

    except Exception as e:
        print("ROADMAP_LLM_ERROR:", repr(e))
        traceback.print_exc()
        # Fallback deterministic roadmap
        return _fallback_roadmap(skills, gap_report, target_role)
