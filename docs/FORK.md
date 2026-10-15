# Fork de Cognee

Fuente de verdad de las personalizaciones de `gtrafael/cognee:custom/main`.
El objetivo es mantener un fork mínimo y fácil de volver a basar sobre nuevas releases upstream.

## Base actual

- Upstream: Cognee **v1.6.4**
- Commit base: `f154b32a9e544dac73e7ddf2010327cf9988edcd`
- Rama desplegable: `custom/main`
- Estado anterior preservado: `archive/custom-v1.6.4-pre-workflow-policy-2026-10-15`
- Referencia de `main` antes de sanear workflows upstream: `archive/main-pre-fork-workflow-policy-2026-10-15`

La actualización v1.6.4 no solapa archivos personalizados del fork; sus cambios upstream se concentran en LanceDB/PGVector, Turso y el harness de workers. La validación de esta actualización se ejecuta contra la base oficial v1.6.4 antes de promover `custom/main`.

## Personalizaciones activas

### Salida semántica en castellano

Los archivos upstream `generate_graph_prompt.txt` y `summarize_content.txt` se mantienen sin modificar.
El fork añade una instrucción común desde
`cognee/infrastructure/llm/prompts/language_policy.py`.

Contrato buscado:

- fuente en castellano → contenido semántico en castellano;
- fuente en catalán → contenido semántico traducido al castellano;
- nombres propios, códigos e identificadores → preservar cuando formen parte de la identidad o evidencia;
- identificadores estructurales exigidos por Cognee → conservar.

La política se aplica al prompt por defecto de extracción y resumen. Un `custom_prompt` de extracción
sustituye deliberadamente al prompt por defecto y no recibe esta política.

La obediencia real del LLM debe verificarse con el corpus manual descrito en el repositorio
`cognee-deployment`. Si el modelo local no normaliza el catalán de forma fiable, se reevaluará una
traducción completa del prompt a partir de resultados.

### Reconstrucción completa desde la UI

El botón de reconstrucción por cambio de configuración limpia únicamente memoria derivada mediante
`forget(memoryOnly=true)`, conserva los documentos y vuelve a ejecutar `cognify`.
El reintento tras un fallo sigue siendo incremental.

### Errores HTTP de cognify

El frontend conserva el error HTTP real del backend antes de intentar decodificar la respuesta JSON.

### Política GitHub Actions del fork

Este fork **no hereda la gobernanza, publicación ni automatización operativa de Topoteretes**. La
rama desplegable es `custom/main` y su único control automático propio es
`.github/workflows/fork_check.yml`.

Se conservan los workflows `workflow_call` de upstream como biblioteca reutilizable para pruebas
puntuales durante una actualización de release, pero no se ejecutan automáticamente.

No forman parte del fork y no deben reintroducirse al actualizar upstream:

- nightlies, benchmarks programados y validación periódica de imágenes publicadas;
- publicación a Docker Hub, PyPI/canary, GitHub Releases, Discord o Mintlify;
- mirroring de imágenes y Scorecard programado;
- políticas organizativas de upstream: Linear, DCO, core-team labels, PR lint/release-drafter;
- automatizaciones de comunidad, stale PRs, contributors y documentación de la rama `dev`;
- la suite general `test_suites.yml` como trigger automático de `main/dev`;
- CI específica de Helm/catalogo que no forma parte de nuestro deployment.

La prueba `test_deployment_mcp.yml` se conserva únicamente como ejecución manual
(`workflow_dispatch`). No hay workflows con `schedule` en el fork.

La rama `main` existe como referencia técnica/default branch de GitHub, pero está saneada de estas
automatizaciones porque GitHub ejecuta los schedules desde la rama por defecto. No debe considerarse
una réplica operativa exacta de la gobernanza upstream.

No se deben copiar secretos privados de Topoteretes (AWS/S3, Docker Hub, Slack, PyPI, Mintlify,
Cognee Cloud, runners privados, etc.) a este fork para intentar hacer funcionar sus pipelines.

`fork_check.yml` comprueba esta política antes de ejecutar los tests del fork. Una actualización que
reintroduzca cualquiera de los workflows prohibidos o un nuevo `schedule` debe fallar hasta que se
adapte conscientemente al fork.

## Personalizaciones retiradas

No reintroducir salvo nueva evidencia:

- resolución del host local de la API: absorbida por upstream;
- null guards antiguos de estados/pipelines: absorbidos por upstream;
- parche MCP para `X-Api-Key`: upstream ya ofrece `COGNEE_API_AUTH_SCHEME=x-api-key`;
- implementación antigua de “procesar pendientes”: cubierta por la carga incremental upstream;
- copia del prompt de extracción dentro del frontend: retirada para no congelar comportamiento viejo.

## Tests del fork

`.github/workflows/fork_check.yml` se ejecuta en PR cuyo destino es `custom/main` y también puede
lanzarse manualmente. Es deliberadamente pequeño: tests Python específicos del fork, Jest específico
del frontend y build de producción del frontend.

La suite completa upstream no se ejecuta en cada cambio local. Debe hacerse una validación más amplia
al actualizar la base upstream, seguida de la prueba E2E del despliegue real.

## Actualización a una nueva release upstream

1. Crear una rama temporal desde la nueva release upstream.
2. Revisar estas personalizaciones una por una; no portar código antiguo mecánicamente.
3. Reaplicar solo las que sigan siendo necesarias.
4. Mantener los prompts upstream intactos mientras la política lingüística separada funcione.
5. Reaplicar la política GitHub Actions del fork: retirar automatizaciones/publicaciones upstream y mantener solo workflows reutilizables/manuales admitidos.
6. Ejecutar el fork-check. Si se necesita más cobertura, invocar selectivamente workflows reutilizables de upstream que no dependan de secretos privados.
7. Desplegar en dev/test y ejecutar smoke, integración LLM y evaluación lingüística.
8. Preservar la `custom/main` anterior si el cambio de base reescribe historia y solo entonces promover la nueva base.

## Despliegue

El despliegue se mantiene en `https://github.com/gtrafael/cognee-deployment`.
Consultar allí `README.md`, `docs/configuration.md` y `docs/testing.md`.
