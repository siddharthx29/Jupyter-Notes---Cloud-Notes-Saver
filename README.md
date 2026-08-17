# JupyterNotebook 🪐⚡

**JupyterNotebook** is a fast, temporary cloud notepad and code notebook designed for storing, retrieving, editing, and sharing plain text, Python code, symbols, emojis, and whitespace with **100% byte-for-byte exact preservation**.

---

## 1. Project Overview

JupyterNotebook provides a classic Jupyter-style interface combined with temporary cloud storage. Users can type or paste any text or code, pick an expiration time (e.g., 10 minutes to 30 days, or never), optionally lock it with a custom password or 4-digit PIN, choose custom 4-letter codes or generate 4-character random IDs, and instantly share retrieval links (`www.jupyternotebook.com/:code`).

### Core Principles
- **Exact Text & Code Preservation**: Zero whitespace trimming, zero tab conversions, zero auto-formatting, and zero character escaping.
- **Speed & Simplicity**: Fast UI load with CodeMirror 6, local client-side `.txt` downloads via Blob, and zero bloated frameworks.
- **GitHub & Production Security**: Complete secret protection, rate limiting, SQL injection defense, and automated vulnerability scanning.

---

## 2. Features

- **Exact Formatting Retention**: Preserves mixed tabs, spaces, empty lines, raw JSON/SQL/Python/HTML, unicode symbols (`₹`, `€`, `©`, `™`), and emojis (`🔥`, `✓`).
- **Configurable Auto-Expiration**: 10 minutes, 1 hour, 6 hours, 24 hours, 7 days, 30 days, or Never. Expired notes return **HTTP 410 Gone** and are automatically cleaned up.
- **Optional Password Protection**: Passwords securely hashed using bcrypt (10 rounds). Protected notes cannot be viewed, edited, or downloaded without unlocking.
- **Instant Client-Side Download**: Generates direct `.txt` files in the browser via `Blob` without waiting for server roundtrips.
- **Streaming Server Download & Raw Text**: Direct `GET /api/notes/:publicId/download` and `GET /api/notes/:publicId/raw` endpoints (ideal for `curl`).
- **Live Counters**: Real-time Character count, Word count, Line count, byte size, and cursor position.
- **Debounced Autosave**: Automatic save 1.5s after editing existing notes with clear status cues (`Saved`, `Saving...`, `Unsaved changes`).
- **Desktop Notepad Ergonomics**: Keyboard shortcuts (`Ctrl+S` to save, `Ctrl+N` for new note, `Ctrl+Z`/`Ctrl+Y` undo/redo), line numbers, and word wrap toggles.
- **Theme Modes**: Light, Dark (slate notepad theme), and System preference syncing.
- **"My Notes on This Device"**: Local browser history tracking your generated temporary links without storing note content on third-party servers.

---

## 3. Architecture

```
TempNote
├── Frontend (React + TypeScript + Vite + Tailwind CSS + CodeMirror 6)
│   ├── Client-Side Blob Downloader
│   ├── CodeMirror 6 Plain-Text Editor
│   └── Local History & Theme Manager
│
├── Backend (Node.js + TypeScript + Express + Prisma ORM)
│   ├── Note Controller & Service
│   ├── Expiration & Cleanup Engine
│   ├── Security Headers (Helmet, CORS, Rate Limiting)
│   └── Raw & Download Endpoints
│
└── Database (PostgreSQL)
    └── Table: notes (with indexes on publicId and expiresAt)
```

---

## 4. Database Schema

The application uses PostgreSQL with Prisma ORM:

```prisma
model Note {
  id            String    @id @default(uuid())
  publicId      String    @unique
  content       String    @db.Text
  passwordHash  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  expiresAt     DateTime?
  downloadCount Int       @default(0)
  viewCount     Int       @default(0)

  @@index([publicId])
  @@index([expiresAt])
}
```

- **`id`**: Internal UUID primary key.
- **`publicId`**: Cryptographically random base62 ID (10 characters).
- **`content`**: Full PostgreSQL `TEXT` data type (unlimited length).
- **`expiresAt`**: Timestamp with timezone, indexed for query filtering and background deletion.

---

## 5. Environment Variables

Create `.env` in the `backend/` directory or root:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend server HTTP port | `3001` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `MAX_NOTE_SIZE` | Maximum permitted payload size in bytes | `5242880` (5MB) |
| `DEFAULT_EXPIRATION` | Default lifespan for new notes | `24h` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `BASE_URL` | Base public URL for generating note links | `http://localhost:5173` |
| `CRON_SECRET` | Bearer token to trigger `/api/cron/cleanup` | Required in production |

---

## 6. Local Installation & Setup

### Prerequisites
- Node.js 18+ or 20+
- PostgreSQL database (Local, Supabase, Neon, Railway, or Docker)

### Step 1: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Database & Run Migrations
In `backend/.env`, set your `DATABASE_URL`:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tempnote?schema=public"
```

Push schema to PostgreSQL:
```bash
cd backend
npx prisma db push
```

### Step 3: Run in Development Mode
You can start backend and frontend in separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Running on http://localhost:3001
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## 7. Running with Docker Compose

To launch the complete stack (PostgreSQL + Backend + Nginx Frontend) with one command:

```bash
docker-compose -f docker/docker-compose.yml up --build
```

- Frontend: `http://localhost`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

---

## 8. API Documentation

### Create Note
- **POST** `/api/notes`
- **Body**:
  ```json
  {
    "content": "function example() {\n    return true;\n}",
    "expiration": "24h",
    "password": "optionalPassword"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "publicId": "k8Xp2mN9Qa",
    "url": "http://localhost:5173/n/k8Xp2mN9Qa",
    "expiresAt": "2026-08-18T10:15:00.000Z",
    "hasPassword": false,
    "createdAt": "2026-08-17T10:15:00.000Z"
  }
  ```

### Retrieve Note
- **GET** `/api/notes/:publicId`
- **Headers (Optional)**: `x-note-password: <password>`
- **Response** (`200 OK`):
  ```json
  {
    "publicId": "k8Xp2mN9Qa",
    "content": "function example() {\n    return true;\n}",
    "hasPassword": false,
    "requiresPassword": false,
    "createdAt": "2026-08-17T10:15:00.000Z",
    "updatedAt": "2026-08-17T10:15:00.000Z",
    "expiresAt": "2026-08-18T10:15:00.000Z",
    "downloadCount": 0,
    "viewCount": 1
  }
  ```
- **Expired Note Response** (`410 Gone`):
  ```json
  {
    "error": "NOTE_EXPIRED",
    "message": "This note has expired"
  }
  ```

### Update Note
- **PATCH** `/api/notes/:publicId`
- **Body**:
  ```json
  {
    "content": "new updated text"
  }
  ```

### Delete Note
- **DELETE** `/api/notes/:publicId`
- **Headers (Optional)**: `x-note-password: <password>`

### Download Attachment (.txt)
- **GET** `/api/notes/:publicId/download`
- **Headers**:
  - `Content-Type: text/plain; charset=utf-8`
  - `Content-Disposition: attachment; filename="tempnote-k8Xp2mN9Qa.txt"`

### Raw Text Endpoint
- **GET** `/api/notes/:publicId/raw`
- **Usage**:
  ```bash
  curl -s http://localhost:3001/api/notes/k8Xp2mN9Qa/raw
  ```

### Trigger Cleanup Cron
- **ALL** `/api/cron/cleanup`
- **Headers**: `Authorization: Bearer <CRON_SECRET>`

---

## 9. Security Considerations

1. **Untrusted Plain Text**: All stored notes are treated strictly as text. No HTML parsing, sanitization that alters whitespace, or `dangerouslySetInnerHTML` is used.
2. **Rate Limiting**: Configured with `express-rate-limit` for note creation and queries.
3. **Payload Clamping**: Configured with `MAX_NOTE_SIZE` (default 5MB) to avoid memory exhaust attacks.
4. **Password Hashing**: Passwords stored as one-way salted hashes with bcrypt.
5. **No ID Enumeration**: Cryptographically random 10-character base62 IDs prevent sequence guessing.

---

## 10. Automated Testing

Run the Vitest integration suite:

```bash
cd backend
npm run test
```

Verifies:
- Byte-for-byte exact character preservation (Unicode, emojis, tabs, quotes).
- Expiration detection and HTTP 410 returns.
- Password encryption and authentication checks.
- Updates and deletions.
- Raw and download file streams.
- Cron cleanup mechanics.
