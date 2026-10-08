from pathlib import Path

from cognee.shared.data_models import Edge as KGEdge


def test_kg_edge_accepts_missing_description():
    edge = KGEdge(source_node_id="Alice", target_node_id="Acme", relationship_name="works_at")

    assert edge.description is None
    assert "description" in edge.model_dump()


def test_kg_edge_preserves_description():
    edge = KGEdge(
        source_node_id="Alice",
        target_node_id="Acme",
        relationship_name="works_at",
        description="Alice works at Acme.",
    )

    assert edge.description == "Alice works at Acme."
    assert edge.model_dump()["description"] == "Alice works at Acme."


def test_generate_graph_prompt_requests_concrete_edge_descriptions():
    prompt_path = Path(__file__).parents[3] / "infrastructure/llm/prompts/generate_graph_prompt.txt"
    prompt = prompt_path.read_text()

    assert "Every edge should include a description" in prompt
    assert "stay dry and efficient" in prompt
    assert "Alice works at Acme as a platform engineer on the search team." in prompt
    assert "Do not add outside knowledge." in prompt
    assert "This edge describes an employment relationship." in prompt


def test_default_prompts_preserve_temporal_semantics_and_normalize_language():
    prompts_dir = Path(__file__).parents[3] / "infrastructure/llm/prompts"
    graph_prompt = (prompts_dir / "generate_graph_prompt.txt").read_text()
    summary_prompt = (prompts_dir / "summarize_content.txt").read_text()

    assert "# 2. Timestamps" in graph_prompt
    assert "TEMPORAL_NORMALIZATION_HINTS" in graph_prompt
    assert "If the source text is in Catalan" in graph_prompt
    assert "Timestamp" in graph_prompt
    assert "{verb}_at" in graph_prompt
    assert "Escribe la salida en castellano." in summary_prompt
    assert "Si el texto de origen está en catalán" in summary_prompt
