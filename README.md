# DevCollab

A full-stack developer collaboration platform that brings together issue tracking, code snippets, documentation, and GitHub integration — all in one place for your dev team.

---

## Features

- **Authentication** — Register, login, JWT-based access with refresh token rotation
- **Project Management** — Create projects, invite team members via email, manage roles (Owner / Editor / Viewer)
- **Issue Tracker** — Create, assign, filter, and comment on issues with real-time updates
- **Code Snippets** — Save and share reusable code snippets with syntax highlighting across your team
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
| Create issues / snippets / docs | ✅ | ✅ | ✅ |
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