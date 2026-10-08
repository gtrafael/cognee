"""Fork-specific output-language policy.

Upstream prompt files stay unchanged. This suffix is applied only to Cognee's default
graph-extraction and summarization prompts. A user-supplied custom graph prompt remains
fully custom and is not modified by the fork.
"""

SPANISH_OUTPUT_POLICY = """
OUTPUT LANGUAGE POLICY:
Write all human-readable semantic output in Spanish.
- If the source is already in Spanish, keep the semantic content in Spanish.
- If the source is in Catalan, translate the semantic content into natural Spanish.
- This includes descriptions, summaries, free-text properties, and translatable common
  concept or generic entity names.
- Preserve proper names, codes, identifiers, and quoted strings when translation would
  change their identity or evidential meaning.
- Preserve structural schema/type/relationship identifiers required by the base prompt.
""".strip()


def apply_spanish_output_policy(system_prompt: str) -> str:
    """Append the fork language policy to an upstream default prompt."""
    return f"{system_prompt.rstrip()}\n\n{SPANISH_OUTPUT_POLICY}\n"
