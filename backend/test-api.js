// DevCollab backend integration test — drives the live API on :3000.
// Load the same .env the server uses so the test process shares its secrets
// (ENCRYPTION_KEY for encrypted tokens, MONGO_URI, etc.).
require('dotenv').config();
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

  // logout revocation: after logout, every previously-issued refresh token dies
  console.log('\n— logout revocation —');
  const emailE = 'testE_' + ts + '@devcollab.dev';
  r = await req('POST', '/api/auth/register', { body: { name: 'Test Echo', email: emailE, password: 'password111' } });
  ok(r.status === 201 && r.json.accessToken, 'register user E (logout test)');
  const tokensE = r.json;
  r = await req('POST', '/api/auth/refresh', { body: { refreshToken: tokensE.refreshToken } });
  ok(r.status === 200 && r.json.refreshToken, 'refresh works before logout');
  const rotatedE = r.json.refreshToken;
  r = await req('POST', '/api/auth/logout', { token: tokensE.accessToken });
  ok(r.status === 200, 'logout succeeds');
  r = await req('POST', '/api/auth/refresh', { body: { refreshToken: tokensE.refreshToken } });
  ok(r.status === 401, 'refresh token issued before logout is revoked -> 401', 'got ' + r.status);
  r = await req('POST', '/api/auth/refresh', { body: { refreshToken: rotatedE } });
  ok(r.status === 401, 'rotated refresh token also revoked after logout -> 401', 'got ' + r.status);

  // 5. projects
  console.log('\n— projects —');
  r = await req('POST', '/api/projects', { token: tokensA.accessToken, body: { name: '' } });
  ok(r.status === 400, 'create project with empty name -> 400');
  r = await req('POST', '/api/projects', { token: tokensA.accessToken, body: { name: 'Integration Project ' + ts, description: 'made by tests' } });
  ok(r.status === 201 && r.json.project._id, 'create project', 'got ' + r.status);
  const project = r.json.project;
  const pid = project._id;
  r = await req('PATCH', '/api/projects/' + pid, { token: tokensA.accessToken, body: { name: '   ' } });
  ok(r.status === 400, 'update project with blank name -> 400 (not silently ignored)', 'got ' + r.status);
  r = await req('PATCH', '/api/projects/' + pid, { token: tokensA.accessToken, body: { name: '  Renamed  ' } });
  ok(r.status === 200 && r.json.project.name === 'Renamed', 'update project trims name');
  r = await req('PATCH', '/api/projects/' + pid, { token: tokensA.accessToken, body: { name: 'Integration Project ' + ts } });
  ok(r.status === 200, 'update project restores original name');
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
  r = await req('GET', '/api/projects/' + pid + '/issues?label=nope', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.issues.length === 0, 'filter by unknown label -> 0');
  r = await req('GET', '/api/projects/' + pid + '/issues?page=1&limit=1', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.total >= 1 && r.json.pages >= 1 && r.json.issues.length === 1, 'issues pagination returns total/page/pages metadata', JSON.stringify({ total: r.json.total, pages: r.json.pages, got: r.json.issues.length }));
  r = await req('PATCH', '/api/projects/' + pid + '/issues/' + issue1._id, { token: tokensA.accessToken, body: { status: 'in_progress' } });
  ok(r.status === 200 && r.json.issue.status === 'in_progress', 'update issue status -> in_progress');
  r = await req('POST', '/api/projects/' + pid + '/issues/' + issue1._id + '/comments', { token: tokensA.accessToken, body: { body: 'Reproduced on staging' } });
  ok(r.status === 201 && r.json.comment, 'add comment to issue');
  r = await req('GET', '/api/projects/' + pid + '/issues/' + issue1._id, { token: tokensA.accessToken });
  ok(r.status === 200 && (r.json.issue.comments || []).length >= 1, 'issue detail includes the comment');
  // The update path must keep comment authors populated — previously updateIssue
  // returned raw ObjectIds, so the UI rendered every comment author as "Unknown"
  // after closing/reopening an issue.
  r = await req('PATCH', '/api/projects/' + pid + '/issues/' + issue1._id, { token: tokensA.accessToken, body: { status: 'closed' } });
  const updComment = (r.json.issue.comments || [])[0];
  ok(updComment && typeof updComment.author_id === 'object' && updComment.author_id.name, 'updated issue keeps comment authors populated', JSON.stringify(updComment && updComment.author_id));
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
  ok(r.json.doc.last_edited_by && r.json.doc.last_edited_by.name === 'Test Alpha', 'doc records last_edited_by', JSON.stringify(r.json.doc.last_edited_by && r.json.doc.last_edited_by.name));
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
  r = await req('POST', '/api/projects/' + pid + '/github/connect', { token: tokensB.accessToken, body: { repo: 'o/r' } });
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
  r = await req('POST', '/api/projects/' + pid + '/github/connect', { token: tokensC.accessToken, body: { repo: 'o/r' } });
  ok(r.status === 403, 'editor cannot connect github -> 403');
  r = await req('DELETE', '/api/projects/' + pid + '/github/disconnect', { token: tokensC.accessToken });
  ok(r.status === 403, 'editor cannot disconnect github -> 403');

  // 10b. websocket authorization
  console.log('\n— websocket authorization —');
  const WebSocket = require('ws');
  const wsConn = (token) => new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    const timer = setTimeout(() => resolve({ timedout: true }), 4000);
    ws.on('open', () => ws.send(JSON.stringify({ type: 'AUTH', token, projectId: pid })));
    ws.on('message', (d) => { clearTimeout(timer); resolve({ msg: JSON.parse(d.toString()) }); ws.close(); });
    ws.on('close', (code, reason) => { clearTimeout(timer); resolve({ code, reason: reason.toString() }); });
    ws.on('error', () => {});
  });
  // Collects messages until it sees the given type (or a close / timeout).
  const wsUntil = (token, wantType) => new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    const seen = [];
    const timer = setTimeout(() => { try { ws.close(); } catch {} resolve({ timedout: true, seen }); }, 4000);
    ws.on('open', () => ws.send(JSON.stringify({ type: 'AUTH', token, projectId: pid })));
    ws.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      seen.push(msg);
      if (msg.type === wantType) { clearTimeout(timer); try { ws.close(); } catch {} resolve({ msg, seen }); }
    });
    ws.on('close', (code, reason) => { clearTimeout(timer); resolve({ code, reason: reason.toString(), seen }); });
    ws.on('error', () => {});
  });
  r = await req('POST', '/api/auth/register', { body: { name: 'Test Delta', email: 'testD_' + ts + '@devcollab.dev', password: 'password000' } });
  ok(r.status === 201 && r.json.accessToken, 'register user D (non-member)');
  const tokensD = r.json;
  let wsRes = await wsConn(tokensD.accessToken);
  ok(wsRes.code === 4001, 'non-member socket rejected with 4001', JSON.stringify(wsRes).slice(0, 80));
  wsRes = await wsConn(tokensB.accessToken);
  ok(wsRes.msg && wsRes.msg.type === 'CONNECTED', 'member socket receives CONNECTED', JSON.stringify(wsRes).slice(0, 80));
  wsRes = await wsConn(tokensD.accessToken);
  ok(wsRes.code === 4001, 'non-member socket still rejected after member connects', JSON.stringify(wsRes).slice(0, 80));

  // a client that connects and immediately closes must leave no presence trace
  // (regression: the async connection handler could attach the close listener
  // too late and strand a dead socket in the room forever)
  const quickWs = new WebSocket('ws://localhost:3000/ws');
  quickWs.on('error', () => {}); // closing a still-connecting socket emits an error
  try { quickWs.close(); } catch {}
  await new Promise(r => setTimeout(r, 800));
  const roomAfterQuickClose = await wsUntil(tokensC.accessToken, 'PRESENCE_SNAPSHOT');
  ok(Array.isArray(roomAfterQuickClose.msg && roomAfterQuickClose.msg.members) &&
    !roomAfterQuickClose.msg.members.some(m => m.userId === (tokensB.user && tokensB.user._id)),
    'quick connect+close leaves no presence trace', JSON.stringify(roomAfterQuickClose.msg && roomAfterQuickClose.msg.members).slice(0, 80));

  // presence snapshot: the joining member is told who's already online (excluding self)
  // Keep B connected while C joins so the snapshot has someone to list.
  const bWs = new WebSocket('ws://localhost:3000/ws');
  // Wait until B is fully authenticated and joined (CONNECTED) so C's snapshot
  // is guaranteed to list B — auth is now async after the open handshake.
  await new Promise((resolve) => {
    bWs.on('open', () => bWs.send(JSON.stringify({ type: 'AUTH', token: tokensB.accessToken, projectId: pid })));
    bWs.on('message', (d) => { if (JSON.parse(d.toString()).type === 'CONNECTED') resolve(); });
    bWs.on('error', resolve);
    setTimeout(resolve, 4000);
  });
  const snap = await wsUntil(tokensC.accessToken, 'PRESENCE_SNAPSHOT');
  try { bWs.close(); } catch {}
  ok(snap.msg && Array.isArray(snap.msg.members), 'member receives PRESENCE_SNAPSHOT with a members array', JSON.stringify(snap.msg || snap).slice(0, 80));
  ok(snap.msg.members.some(m => m.userId && m.userName), 'snapshot lists the already-connected member (B)', JSON.stringify(snap.msg.members).slice(0, 100));
  ok(!snap.msg.members.some(m => m.userId === (tokensC.user && tokensC.user._id)), 'snapshot excludes the joining member themselves', 'self=' + (tokensC.user && tokensC.user._id) + ' listed=' + JSON.stringify(snap.msg.members));

  // 10b1. invite edge cases: email binding, re-share link, validation
  console.log('\n— invite edge cases —');
  const emailX = 'edgeX_' + ts + '@devcollab.dev';
  const emailY = 'edgeY_' + ts + '@devcollab.dev';
  r = await req('POST', '/api/auth/register', { body: { name: 'Edge X', email: emailX, password: 'password123' } });
  ok(r.status === 201 && r.json.accessToken, 'register edge user X', 'got ' + r.status);
  const tokensX = r.json;
  r = await req('POST', '/api/auth/register', { body: { name: 'Edge Y', email: emailY, password: 'password123' } });
  ok(r.status === 201 && r.json.accessToken, 'register edge user Y', 'got ' + r.status);
  const tokensY = r.json;
  // separate project so the main flow's member counts stay intact
  r = await req('POST', '/api/projects', { token: tokensA.accessToken, body: { name: 'Edge Project ' + ts } });
  const edgePid = r.json.project._id;
  r = await req('POST', '/api/projects/' + edgePid + '/invite', { token: tokensA.accessToken, body: { email: 'not-an-email', role: 'viewer' } });
  ok(r.status === 400 && /email/i.test(r.json.message), 'invite with malformed email -> 400', r.status + ' ' + JSON.stringify(r.json).slice(0, 80));
  r = await req('POST', '/api/projects/' + edgePid + '/invite', { token: tokensA.accessToken, body: { email: emailX, role: 'editor' } });
  ok((r.status === 200 || r.status === 201) && r.json.token && r.json.inviteUrl, 'invite created with a shareable inviteUrl', 'got ' + r.status);
  const edgeToken = r.json.token;
  const edgeUrl = r.json.inviteUrl;
  ok(edgeUrl.indexOf('/invite/' + edgeToken + '/accept') !== -1, 'inviteUrl links to the accept page');
  r = await req('POST', '/api/projects/' + edgePid + '/invite', { token: tokensA.accessToken, body: { email: emailX, role: 'viewer' } });
  ok(r.status === 409 && r.json.inviteUrl === edgeUrl, 're-invite -> 409 carrying the same inviteUrl', r.status + ' ' + JSON.stringify(r.json).slice(0, 100));
  r = await req('POST', '/api/invite/' + edgeToken + '/accept', { token: tokensY.accessToken });
  ok(r.status === 403, 'accept with a different email -> 403', r.status + ' ' + JSON.stringify(r.json).slice(0, 100));
  r = await req('POST', '/api/invite/' + edgeToken + '/accept', { token: tokensX.accessToken });
  ok(r.status === 200 && r.json.project_id === edgePid, 'correct email accepts after the 403', r.status + ' ' + JSON.stringify(r.json).slice(0, 100));
  r = await req('POST', '/api/invite/' + edgeToken + '/accept', { token: tokensX.accessToken });
  ok(r.status === 200 && /already/i.test(r.json.message), 're-clicking a used invite -> already a member', r.status + ' ' + JSON.stringify(r.json).slice(0, 100));
  r = await req('DELETE', '/api/projects/' + edgePid, { token: tokensA.accessToken });
  ok(r.status === 200, 'edge project cleaned up');

  // heartbeat: an authed member's PING is answered with a PONG
  const hbWs = await new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    const t = setTimeout(() => { try { ws.close(); } catch {} resolve({ timedout: true }); }, 4000);
    ws.on('open', () => ws.send(JSON.stringify({ type: 'AUTH', token: tokensB.accessToken, projectId: pid })));
    ws.on('message', (d) => {
      const m = JSON.parse(d.toString());
      if (m.type === 'CONNECTED') { ws.send(JSON.stringify({ type: 'PING' })); return; }
      if (m.type === 'PONG') { clearTimeout(t); try { ws.close(); } catch {} resolve({ pong: true }); }
    });
    ws.on('error', () => {});
  });
  ok(hbWs.pong === true, 'authed member PING -> PONG heartbeat', JSON.stringify(hbWs).slice(0, 80));

  // 10b2. accepting an invite broadcasts MEMBER_ADDED to the project room
  console.log('\n— MEMBER_ADDED broadcast —');
  const emailM = 'testM_' + ts + '@devcollab.dev';
  const regM = await req('POST', '/api/auth/register', { body: { name: 'Member M', email: emailM, password: 'password123' } });
  ok(regM.status === 201, 'fresh user M registers for the MEMBER_ADDED test');
  const tokensM = regM.json;
  const memberWs = await new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    const t = setTimeout(() => reject(new Error('ws timeout')), 5000);
    ws.on('message', (d) => {
      const m = JSON.parse(d);
      if (m.type === 'MEMBER_ADDED') { clearTimeout(t); resolve(m); try { ws.close(); } catch {} }
    });
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'AUTH', token: tokensB.accessToken, projectId: pid }));
      setTimeout(async () => {
        const inv = await req('POST', '/api/projects/' + pid + '/invite', { token: tokensA.accessToken, body: { email: emailM, role: 'viewer' } });
        const acc = await req('POST', '/api/invite/' + inv.json.token + '/accept', { token: tokensM.accessToken });
        if (acc.status !== 200) { clearTimeout(t); reject(new Error('accept failed ' + acc.status)); }
      }, 300);
    });
    ws.on('error', () => {});
  });
  ok(memberWs && memberWs.type === 'MEMBER_ADDED', 'accepting an invite broadcasts MEMBER_ADDED to the room', JSON.stringify(memberWs).slice(0, 100));
  ok(memberWs.member && memberWs.member.user_id && memberWs.member.user_id.name === 'Member M', 'MEMBER_ADDED carries the new member name/role', JSON.stringify(memberWs.member || memberWs).slice(0, 120));

  // 10c. concurrent issue creation must not collide on issue numbers
  console.log('\n— concurrent issue creation —');
  const parallelCreates = await Promise.all(Array.from({ length: 8 }, (_, i) =>
    req('POST', '/api/projects/' + pid + '/issues', { token: tokensA.accessToken, body: { title: 'Parallel ' + i } })
  ));
  ok(parallelCreates.every(x => x.status === 201), '8 concurrent issue creates all succeed', parallelCreates.map(x => x.status).join(','));
  const parallelNums = parallelCreates.map(x => x.json.issue && x.json.issue.number).sort((a, b) => a - b);
  ok(new Set(parallelNums).size === 8, 'concurrent creates get unique numbers', 'nums=' + parallelNums.join(','));

  // 10d. issue deletion broadcasts to other clients
  const deleteTarget = parallelCreates[0].json.issue;
  const delWs = await new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    const t = setTimeout(() => reject(new Error('ws timeout')), 4000);
    ws.on('message', (d) => {
      const m = JSON.parse(d);
      if (m.type === 'ISSUE_DELETED' && m.issueId === deleteTarget._id) { clearTimeout(t); resolve(m); try { ws.close(); } catch {} }
    });
    ws.on('open', () => { ws.send(JSON.stringify({ type: 'AUTH', token: tokensB.accessToken, projectId: pid })); setTimeout(() => {
      req('DELETE', '/api/projects/' + pid + '/issues/' + deleteTarget._id, { token: tokensA.accessToken }).then(r => {
        if (r.status !== 200) { clearTimeout(t); reject(new Error('delete failed ' + r.status)); }
      });
    }, 300); });
  });
  ok(delWs && delWs.type === 'ISSUE_DELETED', 'deleting an issue broadcasts ISSUE_DELETED to other members');

  // 10e. signed GitHub webhooks: push / PR / issues (regression for the null-author bug)
  console.log('\n— signed github webhooks —');
  const crypto = require('crypto');
  const mongoose = require('mongoose');
  const GithubIntegration = require('./src/models/GithubIntegration');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devcollab');
  const ghSecret = crypto.randomBytes(24).toString('hex');
  await GithubIntegration.create({
    project_id: pid, repo_owner: 'octocat', repo_name: 'hello-world',
    access_token_encrypted: GithubIntegration.encryptToken('ghp_fake'),
    webhook_secret: ghSecret, connected_at: new Date(), connected_by: tokensA.user._id,
  });
  const sign = (body) => 'sha256=' + crypto.createHmac('sha256', ghSecret).update(JSON.stringify(body)).digest('hex');
  const webhook = (body, event, sig) => fetch(BASE + '/api/github/webhook/' + pid, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-GitHub-Event': event, ...(sig ? { 'X-Hub-Signature-256': sig } : {}), 'X-GitHub-Delivery': 'del-' + Date.now() },
    body: JSON.stringify(body),
  });
  const pushPayload = { ref: 'refs/heads/main', pusher: { name: 'octocat' }, commits: [{ id: 'abc123', message: 'Fix', author: { name: 'octo' }, url: 'https://x' }] };
  r = await webhook(pushPayload, 'push', sign(pushPayload));
  ok(r.status === 200, 'signed push webhook accepted');
  const prPayload = { action: 'opened', number: 9, pull_request: { number: 9, title: 'PR', html_url: 'https://x/9', state: 'open', user: { login: 'octo' }, merged_at: null } };
  r = await webhook(prPayload, 'pull_request', sign(prPayload));
  ok(r.status === 200, 'signed PR webhook accepted');
  const openPayload = { action: 'opened', issue: { number: 77, title: 'GH Issue', body: 'b', labels: [], state: 'open' } };
  r = await webhook(openPayload, 'issues', sign(openPayload));
  ok(r.status === 200, 'signed issues-opened webhook accepted (no 500)');
  await new Promise(res => setTimeout(res, 400));
  r = await req('GET', '/api/projects/' + pid + '/issues', { token: tokensA.accessToken });
  ok((r.json.issues || []).some(i => i.github_issue_number === 77 && i.title.includes('[GH#77]')), 'webhook issue created with [GH#77] title and no author crash');
  const closePayload = { action: 'closed', issue: { number: 77, title: 'GH Issue', body: 'b', labels: [], state: 'closed' } };
  r = await webhook(closePayload, 'issues', sign(closePayload));
  ok(r.status === 200, 'signed issues-closed webhook accepted');
  await new Promise(res => setTimeout(res, 400));
  r = await req('GET', '/api/projects/' + pid + '/issues', { token: tokensA.accessToken });
  ok((r.json.issues || []).find(i => i.github_issue_number === 77)?.status === 'closed', 'webhook-closed issue synced to closed');
  r = await webhook(pushPayload, 'push');
  ok(r.status === 400, 'unsigned webhook -> 400');
  r = await webhook(pushPayload, 'push', 'sha256=' + '0'.repeat(64));
  ok(r.status === 401, 'bad-signature webhook -> 401');
  // restore disconnected state for the next section
  await GithubIntegration.deleteOne({ project_id: pid });
  await mongoose.disconnect();

  // 11. github integration error paths + user-level token
  console.log('\n— github —');
  // user-level token endpoints
  r = await req('GET', '/api/user/github-token', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.hasToken === false, 'token status reports not saved');
  r = await req('PUT', '/api/user/github-token', { token: tokensA.accessToken, body: { token: '' } });
  ok(r.status === 400, 'saving empty token -> 400');
  r = await req('PUT', '/api/user/github-token', { token: tokensA.accessToken, body: { token: 'ghp_invalid' } });
  ok(r.status === 400, 'saving invalid token rejected by GitHub -> 400', 'got ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 120));
  r = await req('GET', '/api/projects/' + pid + '/github/status', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.connected === false, 'github status reports disconnected');
  r = await req('POST', '/api/projects/' + pid + '/github/connect', { token: tokensA.accessToken, body: { repo: 'octocat/hello-world' } });
  ok(r.status === 400 && r.json.code === 'NO_TOKEN', 'connect without a token -> 400 NO_TOKEN', 'got ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 100));
  r = await req('GET', '/api/user/github/repos', { token: tokensA.accessToken });
  ok(r.status === 400 && r.json.code === 'NO_TOKEN', 'repos without a token -> 400 NO_TOKEN');
  r = await req('GET', '/api/auth/me', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.user.has_github_token === false && !('github_token' in r.json.user), 'me reports has_github_token without leaking the field');
  // Simulate a token that was valid when saved but later died (bypasses the
  // save-time validation, which rejects dead tokens by design).
  const ghMongoose = require('mongoose');
  const encryption = require('./src/utils/encryption');
  await ghMongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devcollab');
  const UserModel = require('./src/models/User');
  await UserModel.findByIdAndUpdate(tokensA.user._id, { github_token: encryption.encrypt('ghp_dead_token'), has_github_token: true, github_token_updated_at: new Date() });
  r = await req('GET', '/api/user/github-token', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.hasToken === true, 'token status reports saved after injection');
  r = await req('GET', '/api/user/github/repos', { token: tokensA.accessToken });
  ok(r.status === 401, 'repos with dead token -> 401', 'got ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 120));
  r = await req('POST', '/api/projects/' + pid + '/github/connect', { token: tokensA.accessToken, body: { repo: 'octocat/hello-world' } });
  ok(r.status === 401, 'connect with dead token fails gracefully', 'got ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 120));
  // Disconnecting a project must not touch the user-level token.
  r = await req('DELETE', '/api/projects/' + pid + '/github/disconnect', { token: tokensA.accessToken });
  ok(r.status === 200, 'owner can disconnect even with a dead token');
  r = await req('GET', '/api/user/github-token', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.hasToken === true, 'disconnecting a project keeps the user token');
  r = await req('GET', '/api/auth/me', { token: tokensA.accessToken });
  ok(r.status === 200 && !JSON.stringify(r.json).includes('ghp_dead_token'), 'saved token never serialized in /me');
  r = await req('GET', '/api/user/github-token', { token: tokensA.accessToken });
  ok(r.status === 200 && !JSON.stringify(r.json).includes('ghp_dead_token'), 'saved token never serialized in token status');
  r = await req('DELETE', '/api/user/github-token', { token: tokensA.accessToken });
  ok(r.status === 200 && r.json.hasToken === false, 'delete token -> hasToken false');
  r = await req('POST', '/api/projects/' + pid + '/github/connect', { token: tokensA.accessToken, body: { repo: 'octocat/hello-world' } });
  ok(r.status === 400 && r.json.code === 'NO_TOKEN', 'connect after removing token -> 400 NO_TOKEN');
  // Push-snippet-to-github must resolve the user-level token (regression: it
  // used to read only the per-project token, which new connects no longer store).
  r = await req('POST', '/api/projects/' + pid + '/snippets', { token: tokensA.accessToken, body: { title: 'Push regression', code: 'x', language: 'javascript' } });
  ok(r.status === 201, 'create snippet for push regression');
  const pushSnippetId = r.json.snippet._id;
  await GithubIntegration.create({ project_id: pid, repo_owner: 'octocat', repo_name: 'hello-world', webhook_secret: 'x', connected_at: new Date(), connected_by: tokensA.user._id });
  r = await req('POST', '/api/projects/' + pid + '/snippets/' + pushSnippetId + '/push-to-github', { token: tokensA.accessToken, body: {} });
  ok(r.status === 400 && r.json.code === 'NO_TOKEN', 'push-to-github without user token -> 400 NO_TOKEN', 'got ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 80));
  await UserModel.findByIdAndUpdate(tokensA.user._id, { github_token: encryption.encrypt('ghp_reg_token'), has_github_token: true, github_token_updated_at: new Date() });
  r = await req('POST', '/api/projects/' + pid + '/snippets/' + pushSnippetId + '/push-to-github', { token: tokensA.accessToken, body: { path: '../evil.js' } });
  ok(r.status === 400 && r.json.message === 'Invalid file path', 'push-to-github rejects path traversal');
  r = await req('POST', '/api/projects/' + pid + '/snippets/' + pushSnippetId + '/push-to-github', { token: tokensA.accessToken, body: {} });
  ok(r.status === 401, 'push-to-github reaches GitHub with the user token', 'got ' + r.status + ' ' + JSON.stringify(r.json).slice(0, 80));
  await GithubIntegration.deleteMany({ project_id: pid });
  await UserModel.findByIdAndUpdate(tokensA.user._id, { $set: { github_token: null, has_github_token: false, github_token_updated_at: null } });
  await ghMongoose.disconnect();
  r = await req('POST', '/api/github/webhook/' + pid, { body: {} });
  ok(r.status === 400 || r.status === 404 || r.status === 200, 'webhook with no payload handled without crashing', 'got ' + r.status);
  r = await req('POST', '/api/github/webhook/000000000000000000000000', { body: {} });
  ok(r.status >= 400, 'webhook unknown project -> 4xx', 'got ' + r.status);

  // 12. delete project
  console.log('\n— delete —');
  r = await req('DELETE', '/api/projects/' + pid, { token: tokensB.accessToken });
  ok(r.status === 403, 'viewer cannot delete project -> 403');
  // Seed leftovers the cascade must also clean: a GitHub integration, an invite,
  // plus whatever issues/snippets/docs/activity the earlier sections created.
  const delMongoose = require('mongoose');
  const ActivityModel = require('./src/models/Activity');
  const InviteModel = require('./src/models/Invite');
  const SnippetModel = require('./src/models/Snippet');
  const DocModel = require('./src/models/Doc');
  const IssueModel = require('./src/models/Issue');
  await delMongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devcollab');
  await GithubIntegration.create({ project_id: pid, repo_owner: 'octocat', repo_name: 'hello-world', webhook_secret: 'x', connected_at: new Date(), connected_by: tokensA.user._id });
  await InviteModel.create({ project_id: pid, email: 'never@test.dev', token: 'delcascade' + Date.now(), role: 'viewer', invited_by: tokensA.user._id, expires_at: new Date(Date.now() + 86400000) });
  const seeded = {
    issues: await IssueModel.countDocuments({ project_id: pid }),
    snippets: await SnippetModel.countDocuments({ project_id: pid }),
    docs: await DocModel.countDocuments({ project_id: pid }),
    activity: await ActivityModel.countDocuments({ project_id: pid }),
    integration: await GithubIntegration.countDocuments({ project_id: pid }),
    invites: await InviteModel.countDocuments({ project_id: pid }),
  };
  await delMongoose.disconnect();
  r = await req('DELETE', '/api/projects/' + pid, { token: tokensA.accessToken });
  ok(r.status === 200, 'owner deletes project');
  r = await req('GET', '/api/projects/' + pid, { token: tokensA.accessToken });
  ok(r.status === 404, 'deleted project -> 404');
  r = await req('GET', '/api/projects/' + pid + '/issues', { token: tokensA.accessToken });
  ok(r.status === 404, 'deleted project issues -> 404');
  // cascade: nothing referencing the project may survive the delete
  await delMongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devcollab');
  const remaining = {
    issues: await IssueModel.countDocuments({ project_id: pid }),
    snippets: await SnippetModel.countDocuments({ project_id: pid }),
    docs: await DocModel.countDocuments({ project_id: pid }),
    activity: await ActivityModel.countDocuments({ project_id: pid }),
    integration: await GithubIntegration.countDocuments({ project_id: pid }),
    invites: await InviteModel.countDocuments({ project_id: pid }),
  };
  await delMongoose.disconnect();
  ok(seeded.issues > 0 && seeded.activity > 0 && seeded.integration > 0 && seeded.invites > 0,
    'cascade had seeded data to clean: ' + JSON.stringify(seeded));
  ok(Object.values(remaining).every(n => n === 0), 'cascade removed all project data: ' + JSON.stringify(remaining));

  console.log('\n=======================================');
  console.log('API integration: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) { console.log('Failures:\n - ' + failures.join('\n - ')); process.exitCode = 1; }
}

main().catch(e => { console.error('SCRIPT ERROR:', e); process.exitCode = 1; });
