from typing import List, Dict, Any
from ..core.role_intel import load_skills_taxonomy, normalize_skill


def deterministic_skill_match(text: str, taxonomy: Dict[str, Dict[str, Any]]) -> List[str]:
    """
    Deterministically match skills from the taxonomy against the CV text.
    Normalize to canonical skill names via normalize_skill().
    """
    text_low = text.lower()
    matched: set[str] = set()

    for key, meta in taxonomy.items():
        if not isinstance(meta, dict):
            continue

        canonical = meta.get("canonical") or key
        aliases = meta.get("aliases", []) or []

        candidates = [canonical] + list(aliases)
        for cand in candidates:
            cand_clean = (cand or "").strip()
            if not cand_clean:
                continue

            if cand_clean.lower() in text_low:
                normalized = normalize_skill(canonical)
                if normalized:
                    matched.add(normalized)
                break

    return sorted(matched)


def extract_skills_pipeline(text: str) -> Dict[str, Any]:
    
    taxonomy = load_skills_taxonomy()  # dict from skills_taxonomy.json

    validated = deterministic_skill_match(text, taxonomy)

    # For now, raw_skills == validated_skills
    raw_skills = list(validated)

    # Infer simple domains from taxonomy categories
    inferred_domains: set[str] = set()
    for key, meta in taxonomy.items():
        if not isinstance(meta, dict):
            continue

        canonical = meta.get("canonical") or key
        category = meta.get("category")
        if canonical in validated and category:
            inferred_domains.add(category)

    return {
        "raw_skills": raw_skills,
        "validated_skills": validated,
        "inferred_domains": sorted(inferred_domains),
    }
