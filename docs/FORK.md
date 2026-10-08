# Fork de Cognee

Fuente de verdad de las personalizaciones de `gtrafael/cognee:custom/main`.
El objetivo es mantener un fork mínimo y fácil de volver a basar sobre nuevas releases upstream.

## Base actual

- Upstream: Cognee **v1.6.3**
- Commit base: `0a2853d3a59d8cb6a4daadf78f2a5fac8a39d7f2`
- Rama desplegable: `custom/main`
- Estado anterior preservado: `archive/custom-v1.5.3-2026-10-08`

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
5. Ejecutar el fork-check y una selección amplia de la CI upstream.
6. Desplegar en dev/test y ejecutar smoke, integración LLM y evaluación lingüística.
7. Preservar la `custom/main` anterior si el cambio de base reescribe historia y solo entonces promover la nueva base.

## Despliegue

El despliegue se mantiene en `https://github.com/gtrafael/cognee-deployment`.
Consultar allí `README.md`, `docs/configuration.md` y `docs/testing.md`.
