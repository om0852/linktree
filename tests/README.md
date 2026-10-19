# Test suite notes

`npm test` includes API integration tests. Start TreeInBio against a dedicated test database before running them. API tests intentionally fail when the configured server is unavailable; they must not report a pass when no route ran.

Set `TEST_BASE_URL` to the running test server URL. Authenticated integration cases also require `TEST_JWT_SECRET` to match the test server's `JWT_SECRET`. Use a disposable secret and database, never production credentials or production data.

Pure unit tests such as `node --test tests/security_helpers.test.mjs` do not need a running server or database.
