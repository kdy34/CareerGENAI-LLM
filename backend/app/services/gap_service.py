from typing import Any, Dict, List, Set

#It might be improved in the future by loading role profiles from a config file or database.

ROLE_PROFILES = {
    "data scientist": {
        "core": [
            "python",
            "pandas",
            "numpy",
            "sql",
            "statistics",
            "probability",
            "machine learning",
            "supervised learning",
            "unsupervised learning",
            "scikit-learn",
        ],
        "nice": [
            "deep learning",
            "tensorflow",
            "pytorch",
            "natural language processing",
            "nlp",
            "time series",
            "mlops",
            "docker",
            "kubernetes",
            "aws",
            "azure",
            "gcp",
            "power bi",
            "tableau",
            "mlflow",
        ],
    },
    "ml engineer": {
        "core": [
            "python",
            "tensorflow",
            "pytorch",
            "deep learning",
            "mlops",
            "docker",
            "kubernetes",
            "ci/cd",
            "rest api",
            "fastapi",
            "flask",
            "git",
            "linux",
            "cloud",
        ],
        "nice": [
            "feature store",
            "kafka",
            "spark",
            "airflow",
            "aws",
            "azure",
            "gcp",
            "monitoring",
            "ml observability",
        ],
    },
    "backend engineer": {
        "core": [
            "java",
            "python",
            "rest api",
            "sql",
            "postgresql",
            "mysql",
            "git",
            "docker",
            "clean code",
            "design patterns",
        ],
        "nice": [
            "spring boot",
            "fastapi",
            "microservices",
            "kubernetes",
            "aws",
            "azure",
            "gcp",
            "redis",
            "rabbitmq",
        ],
    },
    "cloud engineer": {
        "core": [
            "cloud",
            "aws",
            "azure",
            "gcp",
            "networking",
            "linux",
            "terraform",
            "infrastructure as code",
            "docker",
            "kubernetes",
            "security",
        ],
        "nice": [
            "ansible",
            "lambda",
            "cloudwatch",
            "devops",
            "ci/cd",
            "jenkins",
            "monitoring",
        ],
    },
}


def _normalize(text: str) -> str:
    return text.strip().lower()


def _choose_role_profile(target_role: str) -> Dict[str, List[str]] | None:
    if not target_role:
        return None

    tr = target_role.lower()

    # 1) Full Matching
    for key in ROLE_PROFILES:
        if tr == key:
            return ROLE_PROFILES[key]

    # 2) Substitute string Matching
    for key in ROLE_PROFILES:
        if key in tr:
            return ROLE_PROFILES[key]

    # 3) Keyword: fallback
    if "data" in tr and "scientist" in tr:
        return ROLE_PROFILES["data scientist"]
    if "ml" in tr or "machine learning" in tr:
        return ROLE_PROFILES["ml engineer"]
    if "backend" in tr:
        return ROLE_PROFILES["backend engineer"]
    if "cloud" in tr:
        return ROLE_PROFILES["cloud engineer"]

    return None


def compute_gap_report(skills: Dict[str, Any], target_role: str) -> Dict[str, Any]:
    """
    Extracted skills + target_role
    skills: extract_skills_pipeline
      """
    if not isinstance(skills, dict):
        skills = {}

    validated_raw = skills.get("validated_skills", []) or []
    if not isinstance(validated_raw, list):
        validated_raw = []

    user_skills: Set[str] = {_normalize(s) for s in validated_raw if isinstance(s, str)}

    role_profile = _choose_role_profile(target_role)
    if not role_profile:
        strengths = sorted(user_skills)
        summary = (
            f"For the target role '{target_role}', no specific role profile was found. "
            "All detected skills are treated as strengths. You can still use the roadmap "
            "and project suggestions, but consider refining the target role name (e.g. "
            "'Data Scientist', 'ML Engineer', 'Backend Engineer', 'Cloud Engineer')."
        )
        return {
            "strengths": strengths,
            "missing_core": [],
            "missing_nice_to_have": [],
            "summary": summary,
        }

    core_required = {_normalize(s) for s in role_profile.get("core", [])}
    nice_required = {_normalize(s) for s in role_profile.get("nice", [])}

    strengths_core = sorted(user_skills.intersection(core_required))
    strengths_nice = sorted(user_skills.intersection(nice_required))

    missing_core = sorted(core_required - user_skills)
    missing_nice = sorted(nice_required - user_skills)

    strengths = sorted(set(strengths_core + strengths_nice))

    summary_parts: List[str] = []
    summary_parts.append(
        f"For the target role '{target_role}', {len(strengths_core)} core skills "
        f"and {len(strengths_nice)} nice-to-have skills were matched from your CV."
    )

    if missing_core:
        summary_parts.append(
            f"There are {len(missing_core)} important core skills currently missing "
            f"from your profile (e.g., {', '.join(missing_core[:5])})."
        )
    else:
        summary_parts.append(
            "You already cover most of the core skills for this role, which is a strong signal."
        )

    if missing_nice:
        summary_parts.append(
            f"In addition, {len(missing_nice)} nice-to-have skills are missing. "
            "These are not mandatory but would significantly strengthen your profile."
        )

    summary_parts.append(
        "Use the learning roadmap and suggested projects to close these gaps over the next weeks."
    )

    summary = " ".join(summary_parts)

    return {
        "strengths": strengths,
        "missing_core": missing_core,
        "missing_nice_to_have": missing_nice,
        "summary": summary,
    }
