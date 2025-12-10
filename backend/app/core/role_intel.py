import json
import os
from functools import lru_cache
from typing import Optional, Dict, Any

DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
)
ROLES_PATH = os.path.join(DATA_DIR, "roles_map.json")
TAXONOMY_PATH = os.path.join(DATA_DIR, "skills_taxonomy.json")


@lru_cache
def load_roles_map() -> Dict[str, Dict[str, Any]]:
    with open(ROLES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    # if someone accidentally puts a list here, just ignore
    if not isinstance(data, dict):
        return {}
    return {k.lower(): v for k, v in data.items()}


@lru_cache
def load_skills_taxonomy() -> Dict[str, Dict[str, Any]]:
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    # must be dict; otherwise return empty so we don't crash
    if not isinstance(data, dict):
        return {}
    return {k.lower(): v for k, v in data.items()}


def normalize_skill(skill: str) -> Optional[str]:
    """
    Normalize a skill string using the taxonomy.
    If taxonomy is missing/bad, we just return a cleaned version of the skill.
    """
    skill_norm = skill.strip().lower()
    if not skill_norm:
        return None

    taxonomy = load_skills_taxonomy()

    if not taxonomy:
        # fallback: no taxonomy loaded
        return skill.strip()

    # direct key match
    if skill_norm in taxonomy:
        meta = taxonomy.get(skill_norm)
        if isinstance(meta, dict):
            return meta.get("canonical", skill.strip())
        return skill.strip()

    # alias match
    for key, meta in taxonomy.items():
        if not isinstance(meta, dict):
            continue
        aliases = meta.get("aliases", []) or []
        if skill_norm in [a.lower() for a in aliases]:
            return meta.get("canonical", skill.strip())

    # fallback: simple title case (to keep something)
    return skill.strip()


def get_role_profile(target_role: str) -> Optional[Dict[str, Any]]:
    roles_map = load_roles_map()
    role_norm = target_role.strip().lower()

    if not role_norm or not roles_map:
        return None

    # exact key
    if role_norm in roles_map:
        return roles_map[role_norm]

    # contains-based match
    for key, profile in roles_map.items():
        if key in role_norm or role_norm in key:
            return profile

    return None
