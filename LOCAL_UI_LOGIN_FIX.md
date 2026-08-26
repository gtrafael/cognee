# Local UI login works from every browser host

[Leer en español](LOCAL_UI_LOGIN_FIX_es.md)

This branch applies the fix from [issue #4582](https://github.com/topoteretes/cognee/issues/4582) and [PR #4627](https://github.com/topoteretes/cognee/pull/4627) to Cognee v1.5.3. The local UI now sends API requests to the same hostname used to open the UI, so authentication works through `localhost`, `127.0.0.1`, and LAN hostnames or addresses.

## What failed and why

Before this fix, the frontend defaulted to `http://localhost:8000`. Opening `http://127.0.0.1:3000` or a LAN URL therefore mixed browser hosts: login was posted to `localhost`, while subsequent navigation used a different origin. Browser cookies are host-scoped, so `/api/v1/users/me` did not receive the login cookie, returned `401`, and redirected back to `/local-login`.

`http://localhost:3000` worked because both the UI and API requests used `localhost`, allowing the browser to send the cookie.

## What changed

The local login, tenant provider, and local fetch client now share `getLocalApiUrl()`. By default it builds the API URL from `window.location.protocol`, `window.location.hostname`, and port `8000`. An explicit `NEXT_PUBLIC_LOCAL_API_URL` still takes precedence.

> **Required for automatic host resolution:** leave `NEXT_PUBLIC_LOCAL_API_URL` unset when building and running the frontend. Do not set `NEXT_PUBLIC_BACKEND_API_URL` as a substitute.

The API must listen on an interface reachable from the browser, and `CORS_ALLOWED_ORIGINS` must include the exact UI origins being used.

## Evidence

| Browser URL | Before | After applying PR #4627 |
| --- | --- | --- |
| `http://localhost:3000` | Login worked | Login worked; `/users/me` returned `200` |
| `http://127.0.0.1:3000` | Login returned `200`, then `/users/me` returned `401` | Login worked; `/users/me` returned `200` |
| `http://192.168.10.250:3000` | Host mismatch prevented a stable session | Login worked; `/users/me` returned `200` |

These results were verified with Playwright against the patched local deployment. The LAN address is test evidence only, not a configuration default.

## Verification

1. Ensure `NEXT_PUBLIC_LOCAL_API_URL` is unset and rebuild the frontend.
2. Configure the API bind address and `CORS_ALLOWED_ORIGINS` for each intended UI origin.
3. Open the UI through `localhost`, `127.0.0.1`, and the target LAN hostname or address.
4. Sign in with the local account and confirm `/api/v1/users/me` returns `200` in browser network tools.
5. Run the focused helper test from `cognee-frontend`:

   ```bash
   npx jest src/modules/users/__tests__/getLocalApiUrl.test.ts --runInBand
   ```

## Scope and retirement

This branch only corrects local frontend API-host selection. It does not change authentication policy, API binding, CORS policy, TLS, firewall rules, or the fixed API port.

After a Cognee release includes PR #4627, update the deployment to that release, verify the same login matrix, and replace this branch with the upstream tag. Preserve persistent volumes during the upgrade; do not delete them merely to retire the fork.
