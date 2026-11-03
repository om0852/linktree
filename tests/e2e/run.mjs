// Runs the end-to-end suites one after another against TEST_BASE_URL and
// exits non-zero if any check fails. Throwaway accounts are removed at the end.
//   TEST_BASE_URL=http://127.0.0.1:3000 MONGODB_URI=mongodb://... node tests/e2e/run.mjs
import { base, cleanupAccounts } from './helpers.mjs';
import * as mcpTools from './mcp_tools.e2e.mjs';
import * as mcpSecurity from './mcp_security.e2e.mjs';
import * as mcpPageTools from './mcp_page_tools.e2e.mjs';
import * as wallpaper from './wallpaper.e2e.mjs';

const suites = { mcpTools, mcpSecurity, mcpPageTools, wallpaper };
const usernames = [];
let failed = 0;

console.log(`End-to-end tests against ${base}`);
for (const [name, suite] of Object.entries(suites)) {
  try {
    const result = await suite.run();
    failed += result.failed;
    usernames.push(...result.usernames);
  } catch (error) {
    failed += 1;
    console.log(`FAIL [${name}] crashed — ${error.stack || error.message}`);
  }
}

try {
  await cleanupAccounts(usernames);
} catch (error) {
  console.log(`Cleanup failed: ${error.message}`);
}
console.log(failed ? `\n${failed} check(s) failed` : '\nAll end-to-end checks passed');
process.exitCode = failed ? 1 : 0;
