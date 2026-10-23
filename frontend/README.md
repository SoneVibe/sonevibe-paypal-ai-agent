# SoneVibe services frontend

Quote and PayPal **sandbox** checkout for SoneVibe team services (research, security, marketing). Test payments only. No real money is charged. The browser never sends prices or amounts.

This package is the frontend. The backend lives in `backend/` and is owned separately. Shared request and response schemas are in `shared/`.

## Prerequisites

- Node.js 22
- npm 10

## Install

From the repository root:

```bash
npm install
```

## Mock mode (no backend)

Mock mode lets the screens run from `shared/fixtures` through [MSW](https://mswjs.io/). It does not call PayPal or a model. Do not use it for the demo video or judging.

```bash
cp frontend/.env.example frontend/.env
```

`frontend/.env.example` lists names only. In `frontend/.env` set:

```bash
VITE_USE_MOCK=true
VITE_API_BASE=http://localhost:8787/api
```

`.env` is gitignored.

```bash
npm run dev
```

Open http://localhost:5173 . The dev server listens on port 5173.

While `VITE_USE_MOCK=true`, or when `GET /api/health` returns `"mock": true`, a **MOCK MODE** banner is shown and the PayPal JS SDK is not loaded. Checkout uses an **Approve (mock)** button that calls `POST /quotes/:id/paypal-order` and then `POST /quotes/:id/capture`.

### Scenario triggers

Put one of these in the chat message, or in the local part of a sandbox invoice email:

| Trigger | What the mock does |
|---|---|
| `#declined` | The next capture returns 422 `INSTRUMENT_DECLINED`. The quote stays `ordered`. |
| `#pending` | The next capture returns `PENDING`. The next `GET /quotes/:id` returns `captured`. |
| `#capturefail` | The next capture returns `DECLINED` and the quote becomes `failed` (retryable). |
| `#llm429` | The next chat call returns 429 `LLM_RATE_LIMITED` with `Retry-After`. |
| `#paypaldown` | The next `paypal-order` returns 502 `PAYPAL_UNAVAILABLE`. |
| `#placeholder` | The quote uses the null-priced `svc_placeholder_mock` service. Accept returns `PRICING_NOT_CONFIGURED`. |

The mock agent is keyword-driven: `research`, `security`, or `marketing` drafts that service. The word `two` or `2` sets quantity 2. Anything else gets a clarifying question. Placeholder catalog rows show `[PLACEHOLDER]`. A null price shows `TBD`. The UI does not invent prices.

## With the backend

Leave `VITE_USE_MOCK` empty. Set `VITE_API_BASE` to the API base, including the `/api` prefix (local default `http://localhost:8787/api`).

The app stays on the **NOT_SANDBOX** screen unless `GET /api/health` reports `environment` equal to `sandbox`. The PayPal sandbox client id is read from `GET /api/config`. The client secret and the model key stay on the server. They are not in this package.

If the host is asleep, the page shows "Waking up the demo server…" and retries `GET /api/health`.

Checkout loads the PayPal JS SDK v6 from `https://www.sandbox.paypal.com/web-sdk/v6/core`. `createOrder` returns `{ orderId }` from the backend and is passed to `session.start` without being awaited first, so the buyer tap still counts as the user gesture.

A receipt is rendered only when `GET /quotes/:id` returns `status` `captured`. Cancelling inside PayPal leaves the quote `ordered` and the pay button usable again.

## Scripts

Run these from `frontend/`, or from the repo root (the root scripts delegate here):

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck and production build |
| `npm run lint` | ESLint on `frontend/src` and `shared/src` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest component and flow tests |

## Accessibility

The layout is designed at 360px first. One `h1` per screen, visible focus, keyboard use on every control, 44px targets, and text that does not rely on color alone. Chat messages sit in a polite live region. Errors use `role="alert"`. `prefers-reduced-motion` turns off animation.

A fixed banner stays on every screen, including errors: "SANDBOX - test payments only. No real money is charged." It cannot be dismissed.

## Session

The browser stores a UUID v4 in `localStorage` under `sonevibe.sessionId`. Chat sends it as `sessionId`. Every `/quotes/*` call sends it as `X-Session-Id`.
