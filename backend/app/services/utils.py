import json
import re

def safe_json_loads(text: str):
    """
    Handles cases where the model returns:
    - ```json ... ```
    - extra explanation before/after JSON
    - whitespace/noise
    """
    if not text:
        raise ValueError("Empty LLM response")

    s = text.strip()

    # strip code fences
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z0-9]*\n?", "", s)
        s = re.sub(r"\n?```$", "", s).strip()

    # try direct parse
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        # fallback: extract first JSON object/array
        match = re.search(r"(\{.*\}|\[.*\])", s, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise
