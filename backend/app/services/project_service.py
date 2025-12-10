from typing import Dict, Any, List
import json
import traceback

from ..core.llm_client import get_llm


def _fallback_projects(
    skills: Dict[str, Any],
    gap_report: Dict[str, Any],
    target_role: str,
) -> List[Dict[str, Any]]:
    #Fallback deterministic project suggestions based on gaps and skills.
    strengths: List[str] = gap_report.get("strengths", []) or []
    missing_core: List[str] = gap_report.get("missing_core", []) or []
    missing_nice: List[str] = gap_report.get("missing_nice_to_have", []) or []
    validated_skills: List[str] = skills.get("validated_skills", []) or []

    def has_skill(name: str) -> bool:
        name_low = name.lower()
        return any(name_low in s.lower() for s in validated_skills)

    def gap_in(name: str) -> bool:
        name_low = name.lower()
        return any(name_low in g.lower() for g in (missing_core + missing_nice))

    projects: List[Dict[str, Any]] = []

    # Project 1 – End-to-end ML pipeline
    if has_skill("python") and (has_skill("machine learning") or gap_in("machine learning")):
        projects.append(
            {
                "id": "ml_pipeline",
                "title": "End-to-End Machine Learning Pipeline on Real Dataset",
                "description": (
                    "Use a real-world dataset to build a complete ML pipeline: "
                    "data cleaning, feature engineering, model training, evaluation, and reporting."
                ),
                "skills": ["Python", "Pandas", "NumPy", "Scikit-learn", "Model Evaluation"],
                "difficulty": "intermediate",
                "estimated_duration_weeks": 3,
            }
        )

    # Project 2 – MLOps / deployment
    if has_skill("docker") or gap_in("docker") or gap_in("deployment"):
        projects.append(
            {
                "id": "mlops_service",
                "title": "Containerized ML API Service with Basic Monitoring",
                "description": (
                    "Expose a trained model via FastAPI or Flask, containerize it with Docker, and "
                    "add basic logging/monitoring for requests and latency."
                ),
                "skills": ["Python", "FastAPI", "Docker", "REST API"],
                "difficulty": "intermediate",
                "estimated_duration_weeks": 3,
            }
        )

    # Project 3 – Analytics / SQL / dashboard
    if has_skill("sql") or gap_in("sql") or gap_in("data visualization"):
        projects.append(
            {
                "id": "analytics_dashboard",
                "title": "Data Analytics Dashboard for a Business Question",
                "description": (
                    "Define a simple business question (e.g., sales trends, churn), answer it with SQL queries, "
                    "and build a small dashboard or report to visualize key metrics."
                ),
                "skills": ["SQL", "Data Visualization", "ETL"],
                "difficulty": "beginner–intermediate",
                "estimated_duration_weeks": 2,
            }
        )

    # Project 4 – GenAI / LLM
    if has_skill("llm") or has_skill("genai") or gap_in("llm") or gap_in("genai"):
        projects.append(
            {
                "id": "genai_app",
                "title": "LLM-Powered Assistant for a Narrow Use Case",
                "description": (
                    "Build a small GenAI app (e.g., resume analyzer or Q&A assistant) using an LLM API. "
                    "Focus on prompt design, validation, and logging."
                ),
                "skills": ["Python", "LLM", "Prompt Engineering", "APIs"],
                "difficulty": "intermediate",
                "estimated_duration_weeks": 3,
            }
        )

    if not projects:
        projects.append(
            {
                "id": "generic_portfolio",
                "title": "Core Skills Portfolio Project",
                "description": (
                    "Design a project around your main strengths (e.g., analysis, ML model, or automation). "
                    "Keep it well-documented and easy to present in interviews."
                ),
                "skills": strengths or validated_skills,
                "difficulty": "beginner–intermediate",
                "estimated_duration_weeks": 2,
            }
        )

    return projects

def _extract_json_array_from_text(text: str) -> str:
    """
    Try to extract a JSON array substring from an LLM response.

    Handles cases like:
    - raw JSON
    - text with explanation + JSON
    - ```json ... ``` fences
    """
    cleaned = text.strip()

    # Remove Markdown fences if present
    if cleaned.startswith("```"):
        # strip first line (``` or ```json)
        cleaned = "\n".join(cleaned.splitlines()[1:])
    if cleaned.endswith("```"):
        cleaned = "\n".join(cleaned.splitlines()[:-1])

    start = cleaned.find("[")
    end = cleaned.rfind("]")

    if start == -1 or end == -1 or end <= start:
        raise ValueError("Could not find JSON array in LLM response")

    return cleaned[start : end + 1].strip()


def recommend_projects(
    skills: Dict[str, Any],
    gap_report: Dict[str, Any],
    target_role: str,
) -> List[Dict[str, Any]]:
    """
    Use an LLM to propose project ideas, but enforce a strict JSON schema.
    Falls back to deterministic suggestions on any error.

    [
      {
        "title": "...",
        "description": "...",
        "skills": ["...", "..."],
        "difficulty": "beginner|intermediate|advanced",
        "estimated_duration_weeks": 2
      },
      ...
    ]
    """

    llm = get_llm()

    validated_skills = skills.get("validated_skills", []) or []
    strengths: List[str] = gap_report.get("strengths", []) or []
    missing_core: List[str] = gap_report.get("missing_core", []) or []
    missing_nice: List[str] = gap_report.get("missing_nice_to_have", []) or []

    # Build prompt in two parts to avoid { } issues in f-strings
    prompt_header = f"""
You are an AI career mentor for ML / Data / AI roles.

The candidate is targeting:
- Target role: {target_role}

Current profile:
- Validated skills: {validated_skills}

Gap analysis:
- Strengths: {strengths}
- Missing core skills: {missing_core}
- Missing nice-to-have skills: {missing_nice}

TASK:
Design 3–5 concrete portfolio projects that help this candidate:
- show their strengths
- close some of the core gaps
- optionally touch some nice-to-have skills

Constraints:
- Each project should be realistic for an individual to complete in 2–6 weeks.
- Focus on this candidate profile; avoid generic “hello world” projects.
""".strip()

    prompt_format = """
IMPORTANT OUTPUT FORMAT:
Return only a valid JSON array, nothing else. Example shape:

[
  {
    "title": "End-to-End ML Pipeline on E-commerce Data",
    "description": "Short description...",
    "skills": ["Python", "Pandas", "Scikit-learn"],
    "difficulty": "intermediate",
    "estimated_duration_weeks": 4
  }
]

No extra keys, no comments, no markdown, no explanations. Only pure JSON.
""".strip()

    prompt = prompt_header + "\n\n" + prompt_format

    try:
        if hasattr(llm, "invoke"):
            resp = llm.invoke(prompt)
            text = getattr(resp, "content", None) or str(resp)
        else:
            resp = llm(prompt)
            text = getattr(resp, "content", None) or str(resp)

        text = text.strip()
        if not text:
            raise ValueError("Empty LLM project response")

        json_str = _extract_json_array_from_text(text)
        raw = json.loads(json_str)

        if not isinstance(raw, list):
            raise ValueError("Projects JSON is not a list")

        normalized: List[Dict[str, Any]] = []
        for idx, item in enumerate(raw):
            if not isinstance(item, dict):
                continue
            title = item.get("title")
            if not title:
                continue
            normalized.append(
                {
                    "id": item.get("id") or f"llm_project_{idx+1}",
                    "title": title,
                    "description": item.get("description"),
                    "skills": item.get("skills") or [],
                    "difficulty": item.get("difficulty"),
                    "estimated_duration_weeks": item.get("estimated_duration_weeks"),
                }
            )

        if not normalized:
            raise ValueError("No valid project items after normalization")

        return normalized

    except Exception as e:
        print("PROJECTS_LLM_ERROR:", repr(e))
        traceback.print_exc()
        return _fallback_projects(skills, gap_report, target_role)
    