# El inicio de sesión de la interfaz local funciona desde cualquier host del navegador

[Read in English](LOCAL_UI_LOGIN_FIX.md)

Esta rama aplica a Cognee v1.5.3 la corrección de la [incidencia #4582](https://github.com/topoteretes/cognee/issues/4582) y el [PR #4627](https://github.com/topoteretes/cognee/pull/4627). Ahora la interfaz local envía las solicitudes de la API al mismo nombre de host utilizado para abrir la interfaz, por lo que la autenticación funciona mediante `localhost`, `127.0.0.1` y nombres de host o direcciones de la LAN.

## Qué fallaba y por qué

Antes de esta corrección, el frontend utilizaba `http://localhost:8000` de forma predeterminada. Por tanto, abrir `http://127.0.0.1:3000` o una URL de la LAN mezclaba hosts en el navegador: el inicio de sesión se enviaba a `localhost`, mientras que la navegación posterior usaba un origen diferente. Las cookies del navegador están limitadas al host, por lo que `/api/v1/users/me` no recibía la cookie de inicio de sesión, devolvía `401` y redirigía de nuevo a `/local-login`.

`http://localhost:3000` funcionaba porque tanto la interfaz como las solicitudes de la API usaban `localhost`, lo que permitía al navegador enviar la cookie.

## Qué cambió

El inicio de sesión local, el proveedor de tenants y el cliente fetch local ahora comparten `getLocalApiUrl()`. De forma predeterminada, esta función construye la URL de la API a partir de `window.location.protocol`, `window.location.hostname` y el puerto `8000`. Un valor explícito de `NEXT_PUBLIC_LOCAL_API_URL` sigue teniendo prioridad.

> **Requisito para la resolución automática del host:** deje `NEXT_PUBLIC_LOCAL_API_URL` sin definir al compilar y ejecutar el frontend. No defina `NEXT_PUBLIC_BACKEND_API_URL` como sustituto.

La API debe escuchar en una interfaz accesible desde el navegador, y `CORS_ALLOWED_ORIGINS` debe incluir los orígenes exactos de la interfaz que se utilicen.

## Evidencia

| URL del navegador | Antes | Después de aplicar el PR #4627 |
| --- | --- | --- |
| `http://localhost:3000` | El inicio de sesión funcionaba | El inicio de sesión funcionó; `/users/me` devolvió `200` |
| `http://127.0.0.1:3000` | El inicio de sesión devolvía `200`, después `/users/me` devolvía `401` | El inicio de sesión funcionó; `/users/me` devolvió `200` |
| `http://192.168.10.250:3000` | La discrepancia de host impedía una sesión estable | El inicio de sesión funcionó; `/users/me` devolvió `200` |

Estos resultados se verificaron con Playwright en el despliegue local corregido. La dirección de la LAN solo constituye evidencia de prueba; no es un valor predeterminado de configuración.

## Verificación

1. Compruebe que `NEXT_PUBLIC_LOCAL_API_URL` no esté definida y vuelva a compilar el frontend.
2. Configure la dirección de escucha de la API y `CORS_ALLOWED_ORIGINS` para cada origen previsto de la interfaz.
3. Abra la interfaz mediante `localhost`, `127.0.0.1` y el nombre de host o la dirección de destino de la LAN.
4. Inicie sesión con la cuenta local y confirme en las herramientas de red del navegador que `/api/v1/users/me` devuelve `200`.
5. Ejecute la prueba específica de la función auxiliar desde `cognee-frontend`:

   ```bash
   npx jest src/modules/users/__tests__/getLocalApiUrl.test.ts --runInBand
   ```

## Alcance y retirada

Esta rama solo corrige la selección del host de la API por parte del frontend local. No cambia la política de autenticación, la dirección de escucha de la API, la política de CORS, TLS, las reglas del firewall ni el puerto fijo de la API.

Cuando una versión de Cognee incluya el PR #4627, actualice el despliegue a esa versión, verifique la misma matriz de inicio de sesión y sustituya esta rama por la etiqueta upstream. Conserve los volúmenes persistentes durante la actualización; no los elimine únicamente para retirar el fork.
