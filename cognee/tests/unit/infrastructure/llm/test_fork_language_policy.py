import importlib
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from pydantic import BaseModel

from cognee.infrastructure.llm.prompts.language_policy import (
    SPANISH_OUTPUT_POLICY,
    apply_spanish_output_policy,
)


class _GraphResult(BaseModel):
    name: str


def test_spanish_policy_is_explicit_for_spanish_and_catalan():
    assert "source is already in Spanish" in SPANISH_OUTPUT_POLICY
    assert "source is in Catalan" in SPANISH_OUTPUT_POLICY
    assert "proper names" in SPANISH_OUTPUT_POLICY
    assert "structural schema/type/relationship identifiers" in SPANISH_OUTPUT_POLICY


def test_policy_appends_without_rewriting_base_prompt():
    base = "UPSTREAM PROMPT"
    effective = apply_spanish_output_policy(base)

    assert effective.startswith(base)
    assert effective != base
    assert effective.endswith(SPANISH_OUTPUT_POLICY + "\n")


@pytest.mark.asyncio
async def test_default_graph_prompt_gets_language_policy_but_custom_prompt_does_not():
    module = importlib.import_module(
        "cognee.infrastructure.llm.extraction.knowledge_graph.extract_content_graph"
    )
    gateway = AsyncMock(return_value=_GraphResult(name="ok"))

    with (
        patch.object(module, "get_llm_config", return_value=SimpleNamespace(graph_prompt_path="x")),
        patch.object(module, "render_prompt", return_value="UPSTREAM GRAPH PROMPT"),
        patch.object(module.LLMGateway, "acreate_structured_output", gateway),
    ):
        await module.extract_content_graph("contingut", _GraphResult)
        default_system_prompt = gateway.await_args.args[1]

        await module.extract_content_graph(
            "contingut", _GraphResult, custom_prompt="MY CUSTOM PROMPT"
        )
        custom_system_prompt = gateway.await_args.args[1]

    assert default_system_prompt.startswith("UPSTREAM GRAPH PROMPT")
    assert SPANISH_OUTPUT_POLICY in default_system_prompt
    assert custom_system_prompt == "MY CUSTOM PROMPT"


@pytest.mark.asyncio
async def test_summary_prompt_gets_language_policy():
    module = importlib.import_module("cognee.infrastructure.llm.extraction.extract_summary")
    gateway = AsyncMock(return_value=_GraphResult(name="ok"))

    with (
        patch.object(module, "read_query_prompt", return_value="UPSTREAM SUMMARY PROMPT"),
        patch.object(module.LLMGateway, "acreate_structured_output", gateway),
    ):
        await module.extract_summary("texto", _GraphResult)

    system_prompt = gateway.await_args.args[1]
    assert system_prompt.startswith("UPSTREAM SUMMARY PROMPT")
    assert SPANISH_OUTPUT_POLICY in system_prompt
