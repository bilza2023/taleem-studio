# Architecture

How Taleem is put together, and how one request travels through it.
Read this first — every other doc assumes it.

---

## 1. One app

Taleem is a single SvelteKit monolith (merged Sept 2026 from the old
`taleem-studio` + `taleem-website`):

- one Node server, one database, one schema, one content folder, one `config.js`
- public pages and admin pages live in the same app
- the domain layer (`taleem-kernel`) lives inside the repo — it is no longer an npm package

| Layer      | Tech                                   |
|------------|----------------------------------------|
| Frontend   | SvelteKit, Svelte 5 (runes)            |
| Server     | SvelteKit `adapter-node` → `build/index.js` |
| Database   | SQLite via Prisma                      |
| Validation | zod                                    |
| Audio      | howler                                 |
| Math       | KaTeX                                  |
| Tests      | Vitest                                 |

---

## 2. Folder map

```
prisma/schema.prisma          the data model — see Database
src/routes/                   pages (public at root, admin under /admin)
src/routes/api/server/        the ONE RPC endpoint
src/lib/send.js               client side of the RPC
src/lib/server/backend/       dispatcher + backend modules (auth lives here)
src/lib/taleem-kernel/        domain layer: rules + Prisma access
src/lib/taleem-specs/         JSON specs (zod) — decks, enums
src/lib/taleemUI/             deck renderer (Scene, Background, TaleemUI)
src/lib/taleem-slides/        one component per slide type (TaleemSlide)
src/lib/components/playerShell/  PlayerShell + LoadingScreen
src/lib/utils/player-utils/   loadLesson, asset paths, preloading, timers
src/lib/mcq/                  MCQ engine
src/lib/docs/                 these docs
content/                      images + audio on disk (SVGs are in the DB)
```

---

## 3. How a request travels

Every data call — public or admin — goes through one seam:

```
page / component
   │  send(module, action, data, tokenType?)
   ▼
POST /api/server
   │
   ▼
dispatcher (backend index)          ← plain wiring map, zero logic
   │  backend[module][action](data, token)
   ▼
backend module                      ← AUTH: requireAdmin / requireSuperAdmin /
   │                                  requireAdminForCourse; identity from token
   ▼
taleem-kernel module                ← DOMAIN RULES + Prisma queries
   │
   ▼
SQLite
```

Example — the admin player loads a lesson:

```js
const item = await send("adminLibrary", "get", { slug });
```

### Why one seam
The old path had four hops and string-matched file-path contracts.
One dispatcher with explicit function calls **fails loud**: a wrong
module or action is an error, not a silent 404.

### `send()` and tokens
`send(module, action, data, tokenType = "admin")`

| tokenType | reads token        | used by          |
|-----------|--------------------|------------------|
| `"admin"` | `taleem-admin-token` | admin pages    |
| `"user"`  | `taleem-token`     | student pages    |

The server **never trusts identity from the request body** — it always
resolves the user/admin from the token.

---

## 4. Who does what

| Layer        | Owns                                   | Must NOT                      |
|--------------|----------------------------------------|-------------------------------|
| Route page   | get data, pass it to components        | business rules, auth          |
| Component    | display + user interaction             | call Prisma, decide permissions |
| Dispatcher   | map `module.action` → function         | contain logic                 |
| Backend      | auth checks, shaping input/output      | duplicate kernel rules        |
| Kernel       | domain rules, all DB access            | know about HTTP or tokens' transport |

Auth is **per handler**, not middleware. The kernel enforces domain
rules; the backend adds the admin/super-admin layer on top. No check is
written twice.

---

## 5. Public vs admin

| | Public | Admin |
|-|--------|-------|
| Routes | root: `/`, `/course`, `/player`, `/article`, `/signin`, `/signup`, `/hub`, `/communication`, `/mcq` | `/admin/**` |
| Library namespace | `library` — published only | `adminLibrary` — drafts too, full CRUD |
| Communication | `communication` | `adminCommunication` |
| Analytics | `analytics.track` | `adminAnalytics.summary` |

- The root `+layout.svelte` hides the public navbar on `/player` and `/admin`.
- `/player` logic is shared; admin and student pages differ only in which
  namespace they call (`adminLibrary` vs `library`) and `strict` mode.

### Roles
- **Admin** — works on the courses in `Admin.courseSlugs`.
- **Super admin** — manages admins and courses (`/admin/super/*`).
  Set by an out-of-band script, never through the UI.
- `isSuperAdmin` and `isAdmin` are separate: super admin does **not**
  automatically grant per-course access.

---

## 6. Content and assets

- Lesson content is JSON stored in `Library.body`
  (`type`: `PLAYER` deck · `ARTICLE` · `MCQ`). Narration text is a separate
  column (`Library.narration`), not part of the deck.
- **Images and audio** are files on disk under `content/`.
  **SVGs** are rows in the `Svg` table. Both are served with the same
  path convention.
- Asset slugs **include the extension** (`wood.jpg`, `box.svg`).
- JSON stores bare file names; they are resolved to full paths at load
  time (`resolveAssetPaths` / `mapDeckAssets` — the only code that knows
  where assets live inside a deck).
- Content URLs use `config.basePath` from `$lib/config`.

---

## 7. Rendering stack

```
route page ──► loadLesson()  (fetch + preload audio/images as blobs, timer)
                  │
                  ▼
              PlayerShell     (toolbar, play/pause/seek, sync)
                  │
                  ▼
              TaleemUI        (picks the slide for currentTime)
                  │
                  ▼
              Scene ► Background ► TaleemSlide   (draws ONE slide)
```

- TaleemUI only shows what it is given — fixes belong in the layer above.
- The MCQ engine reuses the bottom of this stack directly
  (`Scene ► Background ► TaleemSlide` via `src/lib/mcq/SlideFrame.svelte`),
  because it shows static slides chosen by the engine, not by time.

---

## 8. Structure vs content

- **Admin web app** = create content: lessons, narration, tags, publishing.
- **CLI app** = structure: courses, groups, sorting, move/copy, bulk ops,
  health checks, exports.

Do not add structure-editing back into the web admin.

---

## 9. Deployment

- DigitalOcean droplet (1 vCPU, 512 MB RAM), nginx (SSL) in front.
- pm2 process `taleem-website`, app at `/root/taleem-server`, runs `build/index.js`.
- Uploads over 512 KB need `BODY_SIZE_LIMIT` set **in pm2** (ecosystem file +
  `pm2 save`) — nginx `client_max_body_size` alone is not enough; both layers
  enforce limits independently.

---

## 10. Rules worth not relearning

- Schema changes go through `prisma db push` — the repo has no migration
  history, so `prisma migrate dev` reports drift and wants a reset.
- Untrack files with `git rm --cached`; `.gitignore` alone does not untrack.
- Non-submit buttons inside forms need `type="button"`.
- `onMount(async …)` never runs its cleanup — keep `onMount` sync.
- Analytics never breaks the app: `track()` is fire-and-forget and never throws.
- Analytics cleanup must never touch `mcq.*` events (student results).
- Dispatcher payload shapes vary per action
  (`adminLibrary.update` wants `{ slug, data }`, `adminLibrary.create` wants flat fields).