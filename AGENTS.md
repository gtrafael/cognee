## Repository Guidelines

This document summarizes how to work with the cognee repository: how it’s organized, how to build, test, lint, and contribute. It mirrors our actual tooling and CI while providing quick commands for local development.

## Project Structure & Module Organization

- `cognee/`: Core Python library and API.
  - `api/`: FastAPI application and versioned routers (add, cognify, memify, search, delete, users, datasets, responses, visualize, settings, sync, update, checks).
  - `cli/`: CLI entry points and subcommands invoked via `cognee` / `cognee-cli`.
  - `infrastructure/`: Databases, LLM providers, embeddings, loaders, and storage adapters.
  - `modules/`: Domain logic (graph, retrieval, ontology, users, processing, observability, etc.).
  - `tasks/`: Reusable tasks (e.g., code graph, web scraping, storage). Extend with new tasks here.
  - `eval_framework/`: Evaluation utilities and adapters.
  - `shared/`: Cross-cutting helpers (logging, settings, utils).
  - `tests/`: Unit, integration, CLI, and end-to-end tests organized by feature.
  - `__main__.py`: Entrypoint to route to CLI.
- `cognee-mcp/`: Model Context Protocol server exposing cognee as MCP tools (SSE/HTTP/stdio). Contains its own README and Dockerfile.
- `cognee-frontend/`: Next.js UI for local development and demos.
- `distributed/deploy/`: One-click deployment templates (Modal, Fly.io, Railway, Render, Daytona).
- `examples/`: Example scripts demonstrating the public APIs and features (graph, code graph, multimodal, permissions, etc.).
- `notebooks/`: Jupyter notebooks for demos and tutorials.
- `alembic/`: Database migrations for relational backends.

Notes:
- Co-locate feature-specific helpers under their respective package (`modules/`, `infrastructure/`, or `tasks/`).
- Extend the system by adding new tasks, loaders, or retrievers rather than modifying core pipeline mechanisms.

## Build, Test, and Development Commands

Python (root) – requires Python >= 3.10 and < 3.14. We recommend `uv` for speed and reproducibility.

- Create/refresh env and install dev deps:
```bash
uv sync --dev --all-extras --reinstall
```

- Run the CLI (examples):
```bash
uv run cognee-cli add "Cognee turns documents into AI memory."
uv run cognee-cli cognify
uv run cognee-cli search "What does cognee do?"
uv run cognee-cli -ui   # Launches UI, backend API, and MCP server together
```

- Start the FastAPI server directly:
```bash
uv run python -m cognee.api.client
```

- Run tests (CI mirrors these commands):
```bash
uv run pytest cognee/tests/unit/ -v
uv run pytest cognee/tests/integration/ -v
```

- Lint and format (ruff):
```bash
uv run ruff check .
uv run ruff format .
```

- Optional static type checks (ty):
```bash
uv run ty check .
```

MCP Server (`cognee-mcp/`):

- Install and run locally:
```bash
cd cognee-mcp
uv sync --dev --all-extras --reinstall
uv run python src/server.py               # stdio (default)
uv run python src/server.py --transport sse
uv run python src/server.py --transport http --host 127.0.0.1 --port 8000 --path /mcp
```

- API Mode (connect to a running Cognee API):
```bash
uv run python src/server.py --transport sse --api-url http://localhost:8000 --api-token YOUR_TOKEN
```

- Docker quickstart (examples): see `cognee-mcp/README.md` for full details
```bash
docker run -e TRANSPORT_MODE=http --env-file ./.env -p 8000:8000 --rm -it cognee/cognee-mcp:main
```

Frontend (`cognee-frontend/`):
```bash
cd cognee-frontend
npm install
npm run dev     # Next.js dev server
npm run lint    # ESLint
npm run build && npm start
```

## Runtime Flags Worth Knowing

Three env flags trade memory features for speed; know what each disables before flipping it:

- `CACHING` (default `true`) — master switch for the session-memory layer. When `false`,
  `remember(session_id=...)` raises, `recall()` loses session history, `agent_memory`
  session options error out, and `AUTO_FEEDBACK` is implicitly disabled. Never benchmark
  cognee with this off — that measures cognee with its memory layer removed.
- `AUTO_FEEDBACK` (default `true`) — one structured-output LLM call per answered turn
  that detects implicit feedback and lets memory self-tune. Disable for low-latency,
  lower-cost reads; session store/recall itself keeps working.
- `DATASET_QUEUE_ENABLED` (default `true`) — per-process cap on concurrent datasets
  (`DATASET_QUEUE_MAX_CONCURRENT`, default 6); also tears down subprocess DB engines on
  scope exit and pins in-use engines against cache eviction. Disable only for
  single-dataset scripts — under parallel multi-dataset load, turning it off risks
  file-lock leaks and unbounded embedded engines.

## Multi-Tenancy Support by Backend

With `ENABLE_BACKEND_ACCESS_CONTROL=true` (the default) each user+dataset gets isolated
graph and vector databases. Backend support (source of truth:
`cognee/infrastructure/databases/dataset_database_handler/supported_dataset_database_handlers.py`):

- Graph — supported: Ladybug/Kuzu (default), Neo4j (needs multi-database, i.e.
  Enterprise/Aura), Postgres (demo), Turso. Unsupported: Neptune, ladybug-remote.
- Vector — supported: LanceDB (default), PGVector, Turso. Unsupported: Neptune
  Analytics and community adapters (unless they register a handler via
  `use_dataset_database_handler()`).
- Relational (SQLite/Postgres) is always a single shared DB (users, ACLs, registry).

Both graph and vector must be supported, or cognee raises `EnvironmentError` — an
unsupported backend with the flag on is a hard error, not a fallback to shared DBs;
set `ENABLE_BACKEND_ACCESS_CONTROL=false` to run such backends single-tenant.

## Coding Style & Naming Conventions

Python:
- 4-space indentation, modules and functions in `snake_case`, classes in `PascalCase`.
- Public APIs should be type-annotated where practical. Make sure type defined in API signature will be properly displayed in Swagger UI docs. For example this definition: content_type: Optional[str] = Form(default=None) maps to "string" as the default in Swagger docs for content_type, but it should be None/null instead.
- Use `ruff format` before committing; `ruff check` enforces import hygiene and style (line-length 100 configured in `pyproject.toml`).
- Prefer explicit, structured error handling. Use shared logging utilities in `cognee.shared.logging_utils`.

MCP server and Frontend:
- Follow the local `README.md` and ESLint/TypeScript configuration in `cognee-frontend/`.

## Testing Guidelines

- Place Python tests under `cognee/tests/`.
  - Unit tests: `cognee/tests/unit/`
  - Integration tests: `cognee/tests/integration/`
  - CLI tests: `cognee/tests/cli_tests/`
- Name test files `test_*.py`. Use `pytest.mark.asyncio` for async tests.
- Avoid external state; rely on test fixtures and the CI-provided env vars when LLM/embedding providers are required. See CI workflows under `.github/workflows/` for expected environment variables.
- When adding public APIs, provide/update targeted examples under `examples/python/`.

## Commit & Pull Request Guidelines

- Use clear, imperative subjects (≤ 72 chars) and conventional commit styling in PR titles. Our CI validates semantic PR titles (see `.github/workflows/pr_lint`). Examples:
  - `feat(graph): add temporal edge weighting`
  - `fix(api): handle missing auth cookie`
  - `docs: update installation instructions`
- Reference related issues/discussions in the PR body and provide brief context.
- PRs should describe scope, list local test commands run, and mention any impacts on MCP server or UI if applicable.
- Sign commits and affirm the DCO (see `CONTRIBUTING.md`).

## CI Mirrors Local Commands

Our GitHub Actions run the same ruff checks and pytest suites shown above (`.github/workflows/basic_tests.yml` and related workflows). Use the commands in this document locally to minimize CI surprises.

## Fork Management Policy (gtrafael/cognee)

This section defines the required repository policy. It does not assert that the named branches, remotes, tags, or deployment revision currently exist; inspect the repository before acting. The external canonical recovery copy of this policy is the sibling `cognee-deployment/AGENTS.md`.

### Branch roles and normal development

| Branch | Required role |
| --- | --- |
| Fork `main` | Clean mirror of `upstream/main`; never add custom modifications. |
| `custom/main` | Permanent personalized branch and source of deployable revisions. |
| Feature/fix branches | Short-lived branches created from `custom/main`; normally delete after the validated merge is pushed. |
| `update/upstream-*` | Temporary branches used to evaluate upstream updates; normally delete after the approved merge is pushed. |

Feature and fix branches start from `custom/main` and merge back only after validation. After validating and pushing the merge, normally delete the merged branch locally and remotely. Normal integration uses merges, not cherry-pick. Cherry-pick is exceptional and is appropriate only when deliberately selecting a specific commit.

Future upstream evaluation depends on the commits and merge history preserved in `custom/main`, not on retaining stale branch names. A merged branch name is only a movable reference; deleting it does not delete commits that remain reachable from `custom/main`. Keep a feature or fix branch only while it is active, intentionally maintained as a release line, or needed for an open pull request—not merely for historical evaluation. `custom/main` is permanent and must never be deleted.

Never put fork-specific changes to this `AGENTS.md` on mirror `main` unless upstream itself carries them.

Read-only state checks:

```bash
git remote -v
git branch --all --list main custom/main 'update/upstream-*'
git log --oneline --decorate --graph --all -20
```

### Evaluating upstream updates

1. Synchronize fork `main` so it exactly mirrors the latest `upstream/main`.
2. From `custom/main`, create a temporary `update/upstream-<version-or-date>` branch.
3. Merge the updated `main` into the temporary branch.
4. Evaluate every customization against upstream, resolving conflicts deliberately.
5. Run the relevant Cognee tests and test the deployment from `cognee-deployment`.
6. Obtain approval, then merge the temporary branch into `custom/main`.
7. Validate and push the merge, then normally delete the local and remote temporary update branch.

During every evaluation, verify that this policy remains present in `AGENTS.md` on the candidate `custom/main` history. If the upstream merge removes it or conflicts with it, restore or adapt it on the temporary update branch before approval. Use `cognee-deployment/AGENTS.md` as the external canonical recovery copy.

### Deployment revisions

The sibling `cognee-deployment` repository deploys `custom/main` during active development. For controlled deployments, prefer an immutable tag pointing to an approved commit on `custom/main`. Tags identify exact deployed commits; GitHub Releases are optional metadata and are not required.

Verify rather than infer the selected revision:

```bash
git branch --show-current
git describe --tags --exact-match 2>/dev/null || true
git rev-parse HEAD
```

### Related repository

- `gtrafael/cognee-deployment` — Docker Compose stack, deployment validation, and the canonical recovery copy of this fork-management policy.

### Deployment configuration

- `LLM_INSTRUCTOR_MODE=json_schema_mode` — grammar-constrained JSON via llama.cpp (prevents invalid structured output).
- `ENABLE_BACKEND_ACCESS_CONTROL=true` — per-user/dataset isolation; requires creating an initial user via `/api/v1/auth/register`.
