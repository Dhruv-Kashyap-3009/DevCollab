# DevCollab

A full-stack developer collaboration platform that brings together issue tracking, code snippets, documentation, and GitHub integration — all in one place for your dev team.

---

## Features

- **Authentication** — Register, login, JWT-based access with refresh token rotation
- **Project Management** — Create projects, invite team members via email, manage roles (Owner / Editor / Viewer)
- **Issue Tracker** — Create, assign, filter, and comment on issues with real-time updates
- **Code Snippets** — Save and share reusable code snippets across your team
- **Docs** — Write and auto-save project documentation with a built-in editor
- **GitHub Integration** — Connect a GitHub repository to view commits, pull requests, branches, and receive webhook events
- **Real-time Presence** — See which team members are online via WebSocket
- **Activity Feed** — Live feed of all project actions on the dashboard
- **Email Invites** — Invite members by email with a secure tokenized invite link

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 8 | Build tool and dev server |
| React Router v7 | Client-side routing |
| Zustand | Global state management |
| Axios | HTTP client with interceptors |
| React Hot Toast | Notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose 9 | Database and ODM |
| JSON Web Tokens | Auth (access + refresh tokens) |
| bcryptjs | Password hashing |
| WebSocket (ws) | Real-time communication |
| Nodemailer | Email delivery |
| Helmet + CORS | Security middleware |
| Express Validator | Request validation |
| Morgan | HTTP request logging |

---

## Project Structure

```
DevCollab/
├── backend/
│   └── src/
│       ├── app.js                  # Express app entry point
│       ├── config/
│       │   └── db.js               # MongoDB connection
│       ├── controllers/            # Route handlers
│       │   ├── authController.js
│       │   ├── projectController.js
│       │   ├── issueController.js
│       │   ├── snippetController.js
│       │   ├── docController.js
│       │   ├── githubController.js
│       │   └── activityController.js
│       ├── middleware/
│       │   ├── auth.js             # JWT auth + role guard
│       │   └── errorHandler.js
│       ├── models/                 # Mongoose schemas
│       │   ├── User.js
│       │   ├── Project.js
│       │   ├── Issue.js
│       │   ├── Snippet.js
│       │   ├── Doc.js
│       │   ├── Invite.js
│       │   ├── Activity.js
│       │   └── GithubIntegration.js
│       ├── routes/                 # Express routers
│       │   ├── auth.js
│       │   ├── projects.js
│       │   ├── issues.js
│       │   ├── snippets.js
│       │   ├── docs.js
│       │   ├── github.js
│       │   └── activity.js
│       ├── services/
│       │   └── activityService.js  # Activity logging
│       ├── utils/
│       │   └── sendEmail.js        # Nodemailer email utility
│       └── websocket/
│           └── wsServer.js         # WebSocket server
│
└── frontend/
    └── src/
        ├── App.jsx                 # Routes and layout
        ├── main.jsx
        ├── api/
        │   ├── client.js           # Axios instance + interceptors
        │   └── services.js         # API service functions
        ├── store/
        │   └── authStore.js        # Zustand auth store
        ├── hooks/
        │   └── useProjectSocket.js # WebSocket hook
        ├── pages/
        │   ├── AuthPages.jsx
        │   ├── DashboardPage.jsx
        │   ├── ProjectPage.jsx
        │   ├── IssuesPage.jsx
        │   ├── SnippetsPage.jsx
        │   ├── DocsPage.jsx
        │   ├── GitHubPage.jsx
        │   └── AcceptInvitePage.jsx
        └── components/
            ├── layout/             # AppLayout, Sidebar, TopBar
            ├── ui/                 # Button, Input, Modal, Badge, Avatar, etc.
            ├── issues/             # IssueList, IssueCard, IssueForm, IssueDetail
            ├── snippets/           # SnippetList, SnippetCard, SnippetForm
            ├── docs/               # DocList, DocEditor
            └── github/             # GitHubConnect, CommitList, PullRequestList, etc.
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local instance or MongoDB Atlas)
- A Gmail account (for email invites)

---

### 1. Clone the repository

```bash
git clone https://github.com/Dhruv-Kashyap-3009/devcollab.git
cd DevCollab
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```dotenv
PORT=3000
MONGO_URI=mongodb://localhost:27017/devcollab
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
CLIENT_URL=http://localhost:5173
ENCRYPTION_KEY=your_exactly_32_char_key_here!!
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
```

> **Note on `ENCRYPTION_KEY`:** Must be exactly 32 characters — used for AES-256 encryption of GitHub tokens.

> **Note on `EMAIL_PASS`:** Do not use your Gmail password. Generate an **App Password** from Google Account → Security → App Passwords.

Start the backend:

```bash
npm run dev
```

You should see:
```
MongoDB Connected: localhost
DevCollab API running on port 3000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Backend server port | ✅ |
| `MONGO_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret for signing access tokens | ✅ |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | ✅ |
| `CLIENT_URL` | Frontend URL (for invite links) | ✅ |
| `ENCRYPTION_KEY` | 32-char key for GitHub token encryption | ✅ |
| `EMAIL_USER` | Gmail address for sending invites | ✅ |
| `EMAIL_PASS` | Gmail App Password | ✅ |

---

## Run with Docker

Run the whole stack (React SPA on nginx, Express API, MongoDB) with one command — no local Node or MongoDB install required.

### Prerequisites

- **Docker Desktop for Windows** (WSL 2 backend recommended) with Docker Compose v2
- Free ports: `80` (frontend), `3000` (backend), `27017` (dev only)
- Verify: `docker --version` and `docker compose version`

### 1. Create the environment file

```powershell
Copy-Item .env.example .env
```

Then edit `.env` and replace the placeholders. `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` (must be **exactly 32 characters**) and the four `MONGO_*` values are mandatory. Email settings are only needed for invites — signup and login work without them.

> In Docker, the backend connects to the compose service `mongo`, never `localhost`. Compose builds `MONGO_URI` from `MONGO_APP_USER` / `MONGO_APP_PASSWORD` — you do not edit it. Keep the app password **URL-safe** (letters, digits, `-`, `_`) because it is embedded in a `mongodb://` URI.

### 2. Start the stack

```powershell
docker compose up -d --build
```

Open **http://localhost**. The API is also reachable directly at http://localhost:3000/health.

### Common commands (PowerShell / CMD)

| Task | Command |
|---|---|
| Start (build if needed) | `docker compose up -d --build` |
| Start without rebuilding | `docker compose up -d` |
| Follow all logs | `docker compose logs -f` |
| Logs for one service | `docker compose logs -f backend` |
| Show container health | `docker compose ps` |
| Rebuild one service | `docker compose build backend` then `docker compose up -d backend` |
| Rebuild everything from scratch | `docker compose build --no-cache` |
| Restart the API | `docker compose restart backend` |
| Open a shell in the API | `docker compose exec backend sh` |
| Stop containers (keeps data) | `docker compose down` |
| Stop and delete the Mongo volume | `docker compose down -v` |

### Development with hot reload

```powershell
docker compose -f docker-compose.dev.yml up --build
```

- Frontend: http://localhost:5173 (Vite HMR, source bind-mounted)
- Backend: http://localhost:3000 (nodemon, source bind-mounted)
- MongoDB: `localhost:27017` (also usable from a local `npm run dev`)

Set `CLIENT_URL=http://localhost:5173` in `.env` for invite links during development. Stop it with `docker compose -f docker-compose.dev.yml down`.

Both dev and production stacks can coexist, but only one at a time can bind port 3000.

### MongoDB authentication

Mongo in this stack is **not** open: the `mongo` image creates a root user from `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD`, and `mongo/init/01-app-user.js` creates a separate least-privilege user (`readWrite` on `devcollab` only) that the backend logs in with. The backend never sees the root credentials.

MongoDB runs init scripts **only on the first start of an empty data volume**. If your volume predates authentication, the backend will fail to connect until you either create the user manually or recreate the volume:

```powershell
docker compose down -v   # deletes all local Docker data in this stack
docker compose up -d --build
```

Connect with the CLI as the app user:

```powershell
docker compose exec mongo mongosh "mongodb://devcollab:YOUR_APP_PASSWORD@localhost:27017/devcollab?authSource=devcollab"
```

Use the root user only for administration (`--authenticationDatabase admin`). Changing the passwords in `.env` afterwards does not update users inside an existing volume.

### HTTPS with Caddy

`docker-compose.yml` alone serves plain HTTP on port 80. To get automatic TLS, add the override — Caddy takes over ports 80/443 and nginx is only reachable inside the compose network:

```powershell
docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d --build
```

- **Real domain:** point DNS at the host, set `DOMAIN=devcollab.example.com` in `.env`, and also set `CLIENT_URL=https://devcollab.example.com` and `API_URL=https://devcollab.example.com`. Caddy obtains and renews the certificate automatically. Ports 80 and 443 must be reachable from the internet.
- **localhost:** `DOMAIN=localhost` (the default) uses Caddy's internal CA. Browsers warn until you trust it:

  ```powershell
  docker compose -f docker-compose.yml -f docker-compose.tls.yml exec caddy caddy trust
  ```

Certificates live in the `caddy_data` named volume — removing it forces re-issuance (and can hit Let's Encrypt rate limits). WebSocket upgrades need no extra configuration: Caddy handles them, and nginx still proxies `/ws` to the backend.

To switch back to plain HTTP: `docker compose -f docker-compose.yml -f docker-compose.tls.yml down` and then `docker compose up -d`.

### Continuous integration

`.github/workflows/ci.yml` runs on every push to `main`, every pull request, and manually:

| Job | What it does |
|---|---|
| `frontend` | `npm ci` + `vite build` with npm caching |
| `backend` | `npm ci` + `node --check` on every file in `backend/src` |
| `docker` | Builds both production images with GitHub Actions layer cache |
| `smoke` | Generates a throwaway `.env`, starts the full stack, waits for `/health`, checks the SPA and deep links, registers and logs in through nginx, asserts the user exists in Mongo, then tears everything down |

To publish the frontend build artifacts or add image pushes, extend the `docker` job. For branch protection, enable **Require status checks to pass before merging** and select the four jobs above.

### How the services fit together

```
Browser ──▶ caddy :443 (optional, TLS)  ──▶ frontend (nginx :80)
                                              ├── static SPA (index.html fallback for deep links)
                                              ├── /api  ──▶ backend:3000
                                              └── /ws   ──▶ backend:3000 (WebSocket upgrade)
                                                           └──▶ mongo:27017 (authenticated)
```

Only the edge ports are published (Caddy's 80/443 when the TLS override is used, otherwise nginx's 80, plus the backend's 3000); MongoDB is reachable only on the internal `devcollab` network in production.

### Troubleshooting

- **`JWT_SECRET is required`** — `docker compose` cannot find `.env`; run it from the repo root and confirm the file is named exactly `.env`.
- **Port 80 already in use** — stop IIS/another web server, or change `"80:80"` to e.g. `"8080:80"` and open http://localhost:8080.
- **Backend restarts with `MongoDB connection error: Authentication failed`** — the data volume predates MongoDB authentication, so `mongo/init/01-app-user.js` never ran. Run `docker compose down -v` (deletes data) and start again, or create the user manually in `mongosh`.
- **Backend restarts with `MongoDB connection error`** — the backend only starts after Mongo is healthy; check `docker compose logs mongo`. If the volume was created by an older Mongo major version, run `docker compose down -v` (deletes data) or pin the old image tag.
- **Caddy serves a certificate warning** — expected for `DOMAIN=localhost` (internal CA): run `caddy trust` as above. For a real domain, verify DNS resolves to this host and ports 80/443 are open.
- **Frontend shows 502 on `/api`** — backend is not healthy yet: `docker compose ps` and `docker compose logs backend`.
- **Deep links return 404 after a refresh** — confirm `frontend/nginx.conf` is the one baked into the image (`docker compose build frontend`).
- **Emails are not sent** — SMTP failures do not block invites from being created; verify `EMAIL_USER`/`EMAIL_PASS` (Gmail App Password), or set `EMAIL_API_KEY` for Resend.
- **Stale code after editing** — production images are immutable: `docker compose up -d --build`. Use the dev compose file for live editing.
- **Windows line-ending noise in Git** — Docker files are plain text; if you see `\r` issues, add a `.gitattributes` entry with `* text=auto eol=lf`.

---

## Deployment

DevCollab is designed to run as **one server**: the backend serves the API, the WebSocket, **and** the built frontend from the same origin, so no CORS or proxy configuration is needed.

### 1. Build the frontend

```bash
cd frontend
npm install
npm run build
```

This creates `frontend/dist`.

### 2. Configure production environment

In `backend/.env`, set the real values:

```dotenv
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<long random string, 32+ chars>
JWT_REFRESH_SECRET=<different long random string, 32+ chars>
CLIENT_URL=https://your-domain.com
ENCRYPTION_KEY=<exactly 32 characters>
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
```

> Generate the secrets with `openssl rand -base64 48` (for JWT) and `openssl rand -hex 16` (for the 32-char `ENCRYPTION_KEY`).

### 3. Start the server

```bash
cd backend
npm install
npm start
```

That's it — `https://your-domain.com` now serves the app, the API (under `/api`), and the WebSocket (under `/ws`) together. The backend detects `frontend/dist` and serves it automatically, including deep-link fallback (e.g. `/projects/xyz` refreshes correctly).

### Behind a reverse proxy (nginx / Caddy)

- Forward `/` (static + SPA fallback), `/api` (HTTP), and `/ws` with `Upgrade` headers (WebSocket).
- Example nginx location for the socket:

```nginx
location /ws {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

> **Hosting separately?** If you deploy the frontend on a static host (Vercel/Netlify), keep the API and WebSocket on the same domain as the frontend (e.g. via a subdomain or proxy) — the app uses relative `/api` and same-origin WebSocket by design, and `CLIENT_URL` must match the frontend origin for invite links.

---

## API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/:id` | Get project details |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/invite` | Send invite to a member |
| POST | `/api/invite/:token/accept` | Accept an invite |

### Issues
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/issues` | List issues |
| POST | `/api/projects/:id/issues` | Create issue |
| PATCH | `/api/projects/:id/issues/:issueId` | Update issue |
| DELETE | `/api/projects/:id/issues/:issueId` | Delete issue |
| POST | `/api/projects/:id/issues/:issueId/comments` | Add comment |

### Snippets
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/snippets` | List snippets |
| POST | `/api/projects/:id/snippets` | Create snippet |
| PATCH | `/api/projects/:id/snippets/:snippetId` | Update snippet |
| DELETE | `/api/projects/:id/snippets/:snippetId` | Delete snippet |

### Docs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/docs` | List docs |
| POST | `/api/projects/:id/docs` | Create doc |
| PATCH | `/api/projects/:id/docs/:docId` | Update doc |
| DELETE | `/api/projects/:id/docs/:docId` | Delete doc |

### GitHub
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/projects/:id/github/connect` | Connect GitHub repo |
| DELETE | `/api/projects/:id/github/disconnect` | Disconnect GitHub |
| GET | `/api/projects/:id/github/status` | Get connection status |
| GET | `/api/projects/:id/github/commits` | List commits |
| GET | `/api/projects/:id/github/pulls` | List pull requests |
| GET | `/api/projects/:id/github/branches` | List branches |
| POST | `/api/github/webhook/:projectId` | GitHub webhook receiver |

---

## WebSocket Events

The backend broadcasts real-time events to all connected project members:

| Event | Trigger |
|---|---|
| `ISSUE_CREATED` | New issue created |
| `ISSUE_UPDATED` | Issue status/details changed |
| `COMMENT_ADDED` | Comment added to an issue |
| `DOC_UPDATED` | Document edited |
| `GITHUB_PUSH` | Push event received from GitHub webhook |
| `GITHUB_PR` | Pull request event from GitHub webhook |
| `USER_ONLINE` | Member joined the project room |
| `USER_OFFLINE` | Member left the project room |

---

## Role-Based Access

| Action | Owner | Editor | Viewer |
|---|---|---|---|
| View project | ✅ | ✅ | ✅ |
| Create issues / snippets / docs | ✅ | ✅ | ❌ |
| Update issues / snippets / docs | ✅ | ✅ | ❌ |
| Delete issues / snippets / docs | ✅ | ✅ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Connect GitHub | ✅ | ❌ | ❌ |
| Delete project | ✅ | ❌ | ❌ |

---

## Author

**Dhruv Kashyap**
B.Tech CSE (Data Science) — NIET, Greater Noida
GitHub: [@Dhruv-Kashyap-3009](https://github.com/Dhruv-Kashyap-3009)

---

## License

This project is open source and available under the [MIT License](LICENSE).