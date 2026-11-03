# Test suite notes

GitHub Actions (`.github/workflows/ci.yml`) runs everything below on every push to `main` and every pull request, against a throwaway MongoDB service. No production data or secrets are used.

| Command | Needs | What it covers |
| --- | --- | --- |
| `npm run lint` | nothing | ESLint |
| `npm run test:unit` | nothing | Pure logic: themes and contrast, photo wallpapers, stickers, templates, security helpers |
| `npm run test:cli` | nothing | CLI and MCP helpers |
| `npm run test:integration` | running server + test database | API access control, bookings, leads, connectors, feature checks |
| `npm run test:e2e` | running server + test database | MCP tools, MCP security (master key, prompt injection, confirm, undo, expiry, rate limits), page tools and deletion budget, photo uploads |

## Running the server tests locally

Start a production build against a dedicated test database (its name must end in `_ci` for the seed script), then:

```bash
export MONGODB_URI=mongodb://127.0.0.1:27017/treeinbio_ci
export TEST_BASE_URL=http://127.0.0.1:3000
export TEST_JWT_SECRET=<the server's JWT_SECRET>
node tests/e2e/seed-ci.mjs
npm run test:integration
npm run test:e2e
```

API tests intentionally fail when the server is unavailable; they must not report a pass when no route ran. The end-to-end suites create `tib-e2e-xxxxxx` accounts and delete them when they finish. Use a disposable secret and database, never production credentials or production data.
