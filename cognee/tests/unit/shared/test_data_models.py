from pathlib import Path

import pytest

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

    assert "Cada arista debe incluir una descripción" in prompt
    assert "ser concisa y eficiente" in prompt
    assert "Alice trabaja en Acme como ingeniera de plataforma en el equipo de búsqueda." in prompt
    assert "No añadas conocimiento externo." in prompt
    assert "Esta arista describe una relación laboral." in prompt


@pytest.mark.parametrize("prompt_name", ["generate_graph_prompt.txt", "summarize_content.txt"])
def test_prompts_normalize_catalan_source_text_to_spanish(prompt_name):
    prompt_path = Path(__file__).parents[3] / "infrastructure/llm/prompts" / prompt_name

    assert (
        "Si el texto de origen está en catalán, realiza toda la extracción en castellano."
        in prompt_path.read_text()
    )
