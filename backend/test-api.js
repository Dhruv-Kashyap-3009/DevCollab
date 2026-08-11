// DevCollab backend integration test — drives the live API on :3000.
const BASE = 'http://localhost:3000';
let passed = 0, failed = 0;
const failures = [];

function ok(cond, label, extra) {
  if (cond) { passed++; console.log('  PASS  ' + label); }
  else { failed++; failures.push(label + (extra ? ' :: ' + extra : '')); console.log('  FAIL  ' + label + (extra ? '  [' + extra + ']' : '')); }
}
async function req(method, path, { body, token, headers } = {}) {
  const h = { 'Content-Type': 'application/json', ...(headers || {}) };
  if (token) h.Authorization = 'Bearer ' + token;
  const res = await fetch(BASE + path, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

const ts = Date.now().toString().slice(-8);
const emailA = 'testA_' + ts + '@devcollab.dev';
const emailB = 'testB_' + ts + '@devcollab.dev';

async function main() {
  // 1. health
  console.log('\n— health —');
  let r = await req('GET', '/health');
  ok(r.status === 200 && r.json.status === 'ok', 'GET /health returns ok');

  // 2. auth validation
  console.log('\n— auth validation —');
  r = await req('POST', '/api/auth/register', { body: { name: '', email: 'not-an-email', password: 'short' } });
  ok(r.status === 400, 'register with invalid fields returns 400', 'got ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 120));
  r = await req('POST', '/api/auth/login', { body: { email: emailA, password: 'wrongpass' } });
  ok(r.status === 401, 'login with wrong password returns 401');

  // 3. register two users
  console.log('\n— register —');
  r = await req('POST', '/api/auth/register', { body: { name: 'Test Alpha', email: emailA, password: 'password123' } });
  ok(r.status === 201 && r.json.accessToken, 'register user A (owner)', 'got ' + r.status);
  const tokensA = r.json;
  r = await req('POST', '/api/auth/register', { body: { name: 'Test Beta', email: emailB, password: 'password456' } });
  ok(r.status === 201 && r.json.accessToken, 'register user B (invitee)', 'got ' + r.status);
  const tokensB = r.json;
  r = await req('POST', '/api/auth/register', { body: { name: 'Dup', email: emailA, password: 'password123' } });
  ok(r.status === 400 || r.status === 409, 'duplicate email rejected', 'got ' + r.status);

  // 4. login + me + guards
  console.log('\n— auth core —');
  r = await req('POST', '/api/auth/login', { body: { email: emailA, password: 'password123' } });
  ok(r.status === 200 && r.json.accessToken, 'login A returns tokens');
  r = await req('GET', '/api/auth/me', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.user && r.json.user.email === emailA.toLowerCase(), 'GET /me returns the user', 'status=' + r.status + ' ' + JSON.stringify(r.json).slice(0, 120));
  r = await req('GET', '/api/projects');
  ok(r.status === 401, 'no token -> 401 on /api/projects');
  r = await req('GET', '/api/projects', { token: 'garbage.token.here' });
  ok(r.status === 401, 'garbage token -> 401');
  r = await req('POST', '/api/auth/refresh', { body: { refreshToken: tokensA.refreshToken } });
  ok(r.status === 200 && r.json.accessToken, 'refresh token rotates access token');
  const refreshedA = r.json.accessToken;
  r = await req('GET', '/api/auth/me', { token: refreshedA });
  ok(r.status === 200, 'refreshed access token works on /me');
  r = await req('POST', '/api/auth/refresh', { body: { refreshToken: 'bogus' } });
  ok(r.status === 401, 'bogus refresh token -> 401');

  // 5. projects
  console.log('\n— projects —');
  r = await req('POST', '/api/projects', { token: tokensA.accessToken, body: { name: '' } });
  ok(r.status === 400, 'create project with empty name -> 400');
  r = await req('POST', '/api/projects', { token: tokensA.accessToken, body: { name: 'Integration Project ' + ts, description: 'made by tests' } });
  ok(r.status === 201 && r.json.project._id, 'create project', 'got ' + r.status);
  const project = r.json.project;
  const pid = project._id;
  r = await req('GET', '/api/projects', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.projects.some(p => p._id === pid), 'list projects contains the new project');
  r = await req('GET', '/api/projects/' + pid, { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.project.name === 'Integration Project ' + ts, 'get project returns details');
  ok(r.json.stats && r.json.stats.memberCount === 1, 'get project carries stats (memberCount 1)', JSON.stringify(r.json.stats).slice(0, 80));

  // access control: user B is not a member
  r = await req('GET', '/api/projects/' + pid, { token: tokensB.accessToken });
  ok(r.status === 403, 'non-member GET project -> 403');
  r = await req('GET', '/api/projects/' + pid + '/issues', { token: tokensB.accessToken });
  ok(r.status === 403, 'non-member GET issues -> 403');

  // 6. issues
  console.log('\n— issues —');
  r = await req('POST', '/api/projects/' + pid + '/issues', { token: tokensA.accessToken, body: { title: '' } });
  ok(r.status === 400, 'create issue with empty title -> 400');
  r = await req('POST', '/api/projects/' + pid + '/issues', { token: tokensA.accessToken, body: { title: 'Fix login bug', description: 'Auth redirect loops', priority: 'high' } });
  ok(r.status === 201 && r.json.issue.number === 1 && r.json.issue.status === 'open', 'create issue #1 (open)', JSON.stringify(r.json).slice(0, 100));
  const issue1 = r.json.issue;
  r = await req('GET', '/api/projects/' + pid + '/issues', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.issues.length === 1, 'list issues returns 1');
  r = await req('GET', '/api/projects/' + pid + '/issues?status=open', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.issues.length === 1, 'filter status=open -> 1');
  r = await req('GET', '/api/projects/' + pid + '/issues?status=closed', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.issues.length === 0, 'filter status=closed -> 0');
  r = await req('GET', '/api/projects/' + pid + '/issues?priority=high', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.issues.length === 1, 'filter priority=high -> 1');
  r = await req('PATCH', '/api/projects/' + pid + '/issues/' + issue1._id, { token: tokensA.accessToken, body: { status: 'in_progress' } });
  ok(r.status === 200 && r.json.issue.status === 'in_progress', 'update issue status -> in_progress');
  r = await req('POST', '/api/projects/' + pid + '/issues/' + issue1._id + '/comments', { token: tokensA.accessToken, body: { body: 'Reproduced on staging' } });
  ok(r.status === 201 && r.json.comment, 'add comment to issue');
  r = await req('GET', '/api/projects/' + pid + '/issues/' + issue1._id, { token: tokensA.accessToken });
  ok(r.status === 200 && (r.json.issue.comments || []).length >= 1, 'issue detail includes the comment');
  r = await req('GET', '/api/projects/' + pid + '/issues/000000000000000000000000', { token: tokensA.accessToken });
  ok(r.status === 404, 'get unknown issue -> 404');

  // 7. snippets
  console.log('\n— snippets —');
  r = await req('POST', '/api/projects/' + pid + '/snippets', { token: tokensA.accessToken, body: { title: 'Fetch wrapper', code: '', language: 'js' } });
  ok(r.status === 400, 'create snippet without code -> 400');
  r = await req('POST', '/api/projects/' + pid + '/snippets', { token: tokensA.accessToken, body: { title: 'Fetch wrapper', code: 'const r = await fetch(url);', language: 'javascript' } });
  ok(r.status === 201 && r.json.snippet.title === 'Fetch wrapper', 'create snippet');
  const snippet = r.json.snippet;
  r = await req('GET', '/api/projects/' + pid + '/snippets', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.snippets.length === 1, 'list snippets -> 1');
  r = await req('PATCH', '/api/projects/' + pid + '/snippets/' + snippet._id, { token: tokensA.accessToken, body: { title: 'Fetch wrapper v2' } });
  ok(r.status === 200 && r.json.snippet.title === 'Fetch wrapper v2', 'update snippet');
  r = await req('DELETE', '/api/projects/' + pid + '/snippets/' + snippet._id, { token: tokensA.accessToken });
  ok(r.status === 200, 'delete snippet');
  r = await req('GET', '/api/projects/' + pid + '/snippets', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.snippets.length === 0, 'snippets list empty after delete');

  // 8. docs
  console.log('\n— docs —');
  r = await req('POST', '/api/projects/' + pid + '/docs', { token: tokensA.accessToken, body: { title: 'Setup guide', content: '# Setup\nRun `npm i`.' } });
  ok(r.status === 201 && r.json.doc.title === 'Setup guide', 'create doc');
  const doc = r.json.doc;
  r = await req('PATCH', '/api/projects/' + pid + '/docs/' + doc._id, { token: tokensA.accessToken, body: { content: '# Setup v2\nRun `npm i && npm run dev`.' } });
  ok(r.status === 200 && r.json.doc.content.includes('v2'), 'update doc content');
  r = await req('GET', '/api/projects/' + pid + '/docs', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.docs.length === 1, 'list docs -> 1');
  r = await req('GET', '/api/projects/' + pid + '/docs/' + doc._id, { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.doc.content.includes('v2'), 'get doc reflects update');

  // 9. activity feed
  console.log('\n— activity —');
  r = await req('GET', '/api/projects/' + pid + '/activity', { token: tokensA.accessToken });
  const types = (r.json.activities || []).map(a => a.type);
  ok(r.status === 200 && types.length >= 4, 'activity feed returns events', types.join(','));
  ok(types.includes('issue_created'), 'activity has issue_created');
  ok(types.includes('doc_created'), 'activity has doc_created');
  ok(types.includes('comment_added'), 'activity has comment_added');
  const created = r.json.activities.find(a => a.type === 'issue_created');
  ok(created && created.user_id && created.user_id.name === 'Test Alpha' && created.payload && created.payload.issueNumber === 1, 'issue_created carries actor + payload');

  // 10. invites + role-based access
  console.log('\n— invites & roles —');
  r = await req('POST', '/api/projects/' + pid + '/invite', { token: tokensA.accessToken, body: { email: emailB, role: 'viewer' } });
  ok((r.status === 200 || r.status === 201) && r.json.token, 'owner invites user B as viewer', 'got ' + r.status);
  const token = r.json.token;
  r = await req('POST', '/api/invite/' + token + '/accept', { token: tokensB.accessToken });
  ok(r.status === 200 && r.json.project_id === pid, 'user B accepts invite');
  r = await req('GET', '/api/projects/' + pid, { token: tokensB.accessToken });
  ok(r.status === 200, 'user B (viewer) can now read project');
  r = await req('PATCH', '/api/projects/' + pid, { token: tokensB.accessToken, body: { description: 'nope' } });
  ok(r.status === 403, 'viewer cannot edit project -> 403');
  r = await req('POST', '/api/projects/' + pid + '/issues', { token: tokensB.accessToken, body: { title: 'Viewer tries issue' } });
  ok(r.status === 403, 'viewer cannot create issue -> 403');
  r = await req('PATCH', '/api/projects/' + pid, { token: tokensA.accessToken, body: { description: 'edited by owner' } });
  ok(r.status === 200, 'owner can edit project');
  r = await req('POST', '/api/projects/' + pid + '/invite', { token: tokensB.accessToken, body: { email: 'x@y.dev', role: 'viewer' } });
  ok(r.status === 403, 'viewer cannot invite -> 403');

  // viewer write matrix — all content mutations must 403
  // (fresh snippet + doc owned by A so the viewer's PATCH/DELETE hit a real resource)
  r = await req('POST', '/api/projects/' + pid + '/snippets', { token: tokensA.accessToken, body: { title: 'Viewer target', code: 'x', language: 'javascript' } });
  const viewerSnippet = r.json.snippet;
  r = await req('PATCH', '/api/projects/' + pid + '/issues/' + issue1._id, { token: tokensB.accessToken, body: { status: 'closed' } });
  ok(r.status === 403, 'viewer cannot update issue -> 403', 'got ' + r.status);
  r = await req('DELETE', '/api/projects/' + pid + '/issues/' + issue1._id, { token: tokensB.accessToken });
  ok(r.status === 403, 'viewer cannot delete issue -> 403', 'got ' + r.status);
  r = await req('POST', '/api/projects/' + pid + '/issues/' + issue1._id + '/comments', { token: tokensB.accessToken, body: { body: 'sneaky' } });
  ok(r.status === 403, 'viewer cannot comment -> 403', 'got ' + r.status);
  r = await req('POST', '/api/projects/' + pid + '/snippets', { token: tokensB.accessToken, body: { title: 'v', code: 'x', language: 'javascript' } });
  ok(r.status === 403, 'viewer cannot create snippet -> 403', 'got ' + r.status);
  r = await req('PATCH', '/api/projects/' + pid + '/snippets/' + viewerSnippet._id, { token: tokensB.accessToken, body: { title: 'hax' } });
  ok(r.status === 403, 'viewer cannot update snippet -> 403', 'got ' + r.status);
  r = await req('DELETE', '/api/projects/' + pid + '/snippets/' + viewerSnippet._id, { token: tokensB.accessToken });
  ok(r.status === 403, 'viewer cannot delete snippet -> 403', 'got ' + r.status);
  r = await req('POST', '/api/projects/' + pid + '/docs', { token: tokensB.accessToken, body: { title: 'v', content: 'x' } });
  ok(r.status === 403, 'viewer cannot create doc -> 403', 'got ' + r.status);
  r = await req('PATCH', '/api/projects/' + pid + '/docs/' + doc._id, { token: tokensB.accessToken, body: { content: 'hax' } });
  ok(r.status === 403, 'viewer cannot update doc -> 403', 'got ' + r.status);
  r = await req('DELETE', '/api/projects/' + pid + '/docs/' + doc._id, { token: tokensB.accessToken });
  ok(r.status === 403, 'viewer cannot delete doc -> 403', 'got ' + r.status);
  r = await req('POST', '/api/projects/' + pid + '/github/connect', { token: tokensB.accessToken, body: { repo_owner: 'o', repo_name: 'r', access_token: 't' } });
  ok(r.status === 403, 'viewer cannot connect github -> 403', 'got ' + r.status);
  r = await req('GET', '/api/projects/' + pid + '/github/status', { token: tokensB.accessToken });
  ok(r.status === 200, 'viewer can still read github status');

  // editor role: full content access, no owner powers
  console.log('\n— editor role —');
  const emailC = 'testC_' + ts + '@devcollab.dev';
  r = await req('POST', '/api/auth/register', { body: { name: 'Test Gamma', email: emailC, password: 'password789' } });
  ok(r.status === 201 && r.json.accessToken, 'register user C (editor)', 'got ' + r.status);
  const tokensC = r.json;
  r = await req('POST', '/api/projects/' + pid + '/invite', { token: tokensA.accessToken, body: { email: emailC, role: 'editor' } });
  ok((r.status === 200 || r.status === 201) && r.json.token, 'owner invites user C as editor');
  r = await req('POST', '/api/invite/' + r.json.token + '/accept', { token: tokensC.accessToken });
  ok(r.status === 200, 'user C accepts editor invite');
  r = await req('GET', '/api/projects/' + pid, { token: tokensC.accessToken });
  ok(r.status === 200 && r.json.project.myRole === 'editor', 'project reports myRole=editor', JSON.stringify(r.json.project.myRole));
  r = await req('POST', '/api/projects/' + pid + '/issues', { token: tokensC.accessToken, body: { title: 'Editor issue', priority: 'medium' } });
  ok(r.status === 201, 'editor can create issue', 'got ' + r.status);
  const editorIssue = r.json.issue;
  r = await req('PATCH', '/api/projects/' + pid + '/issues/' + editorIssue._id, { token: tokensC.accessToken, body: { status: 'closed' } });
  ok(r.status === 200, 'editor can update issue');
  r = await req('POST', '/api/projects/' + pid + '/issues/' + editorIssue._id + '/comments', { token: tokensC.accessToken, body: { body: 'from editor' } });
  ok(r.status === 201, 'editor can comment');
  r = await req('DELETE', '/api/projects/' + pid + '/issues/' + editorIssue._id, { token: tokensC.accessToken });
  ok(r.status === 200, 'editor can delete issue');
  r = await req('POST', '/api/projects/' + pid + '/snippets', { token: tokensC.accessToken, body: { title: 'Editor snippet', code: 'x', language: 'python' } });
  ok(r.status === 201, 'editor can create snippet');
  r = await req('DELETE', '/api/projects/' + pid + '/snippets/' + r.json.snippet._id, { token: tokensC.accessToken });
  ok(r.status === 200, 'editor can delete snippet');
  r = await req('POST', '/api/projects/' + pid + '/docs', { token: tokensC.accessToken, body: { title: 'Editor doc', content: 'x' } });
  ok(r.status === 201, 'editor can create doc');
  r = await req('PATCH', '/api/projects/' + pid + '/docs/' + r.json.doc._id, { token: tokensC.accessToken, body: { content: 'y' } });
  ok(r.status === 200, 'editor can update doc');
  r = await req('PATCH', '/api/projects/' + pid, { token: tokensC.accessToken, body: { description: 'editor edit' } });
  ok(r.status === 200, 'editor can edit project settings');
  r = await req('POST', '/api/projects/' + pid + '/invite', { token: tokensC.accessToken, body: { email: 'x@y.dev', role: 'viewer' } });
  ok(r.status === 403, 'editor cannot invite -> 403');
  r = await req('DELETE', '/api/projects/' + pid, { token: tokensC.accessToken });
  ok(r.status === 403, 'editor cannot delete project -> 403');
  r = await req('POST', '/api/projects/' + pid + '/github/connect', { token: tokensC.accessToken, body: { repo_owner: 'o', repo_name: 'r', access_token: 't' } });
  ok(r.status === 403, 'editor cannot connect github -> 403');
  r = await req('DELETE', '/api/projects/' + pid + '/github/disconnect', { token: tokensC.accessToken });
  ok(r.status === 403, 'editor cannot disconnect github -> 403');

  // 11. github integration error paths
  console.log('\n— github —');
  r = await req('GET', '/api/projects/' + pid + '/github/status', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.connected === false, 'github status reports disconnected');
  r = await req('POST', '/api/projects/' + pid + '/github/connect', { token: tokensA.accessToken, body: { owner: 'octocat', repo: 'hello-world', token: 'ghp_invalid' } });
  ok(r.status >= 400 && r.status < 500, 'connect with invalid token fails gracefully', 'got ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 100));
  r = await req('POST', '/api/github/webhook/' + pid, { body: {} });
  ok(r.status === 400 || r.status === 404 || r.status === 200, 'webhook with no payload handled without crashing', 'got ' + r.status);
  r = await req('POST', '/api/github/webhook/000000000000000000000000', { body: {} });
  ok(r.status >= 400, 'webhook unknown project -> 4xx', 'got ' + r.status);

  // 12. delete project
  console.log('\n— delete —');
  r = await req('DELETE', '/api/projects/' + pid, { token: tokensB.accessToken });
  ok(r.status === 403, 'viewer cannot delete project -> 403');
  r = await req('DELETE', '/api/projects/' + pid, { token: tokensA.accessToken });
  ok(r.status === 200, 'owner deletes project');
  r = await req('GET', '/api/projects/' + pid, { token: tokensA.accessToken });
  ok(r.status === 404, 'deleted project -> 404');
  r = await req('GET', '/api/projects/' + pid + '/issues', { token: tokensA.accessToken });
  ok(r.status === 404, 'deleted project issues -> 404');

  console.log('\n=======================================');
  console.log('API integration: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) { console.log('Failures:\n - ' + failures.join('\n - ')); process.exitCode = 1; }
}

main().catch(e => { console.error('SCRIPT ERROR:', e); process.exitCode = 1; });
