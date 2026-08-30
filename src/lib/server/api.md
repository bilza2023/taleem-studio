# Taleem Studio — API Reference

All calls go through a single RPC endpoint: `POST /api/server`

Request body: `{ module, method, data }`
Response: the handler's return value directly, or `{ error }` on failure (non-2xx).

Called from the frontend via `send(module, method, data)` — see `src/lib/send/index.js`.

Dispatch path: `+server.js` → `server.js` (`request()`) → `backend.js` → per-module server file (`src/lib/server/*.js`) → `taleem-kernel`.

Auth: currently **not enforced** in the studio server modules (dropped pending redesign). `backend.js` still passes `token` through to each handler as a second argument, but the module functions ignore it. Treat all endpoints below as open until auth is reinstated.

---

## course

Backed by `src/lib/server/course.js` → `kernel.course`.

| method   | data shape           | notes                                                        |
|----------|----------------------|---------------------------------------------------------------|
| `list`   | `filters`             | passthrough to `kernel.course.list(filters)`                 |
| `get`    | `{ slug }`             | returns course or `null`                                     |
| `create` | full course fields     | `{ slug, title, access, ... }`                                |
| `update` | `{ slug, data }`       | 404s if `slug` not found before updating                     |
| `delete` | `{ slug }`             | 404s if `slug` not found before deleting                     |

`access` is one of `OPEN` / `MEMBERS` / `SUBSCRIPTION` (kernel-side tiering).

Not yet exposed via `backend.js`: `authorizeCourse(userId, courseSlug)` exists in `course.js` but has no wired route — needs a resolved `userId`, not a raw token, so it can't be called directly from `send()` as-is.

---

## group

Backed by `src/lib/server/group.js` → `kernel.group`.

Groups are scoped under a course — identified by the **compound key** `(courseSlug, groupSlug)`, not a single global slug. This is the one module whose shape differs from `course`/`library`.

| method   | data shape                          | notes                                                  |
|----------|--------------------------------------|---------------------------------------------------------|
| `list`   | `{ courseSlug }`                      | wired as `listGroups(data.courseSlug)`                 |
| `get`    | `{ courseSlug, groupSlug }`           |                                                          |
| `create` | full group fields                     | `{ courseSlug, slug, title, ... }`                      |
| `update` | `{ courseSlug, groupSlug, data }`     | 404s if group not found before updating                |
| `delete` | `{ courseSlug, groupSlug }`           | 404s if group not found before deleting                |

Function name in `group.js` is `listGroups` (renamed from `getGroups` for naming consistency with `listCourses`/`listLibrary`).

---

## library

Backed by `src/lib/server/library.js` → `kernel.library`.

Represents content items (`ARTICLE` or `PLAYER`), scoped to a `courseSlug` + `groupSlug`, identified by their own unique `slug`.

| method        | data shape                        | notes                                                        |
|---------------|-------------------------------------|-----------------------------------------------------------------|
| `get`         | `{ slug }`                           | returns item or `null`                                          |
| `list`        | `filters`                            | passthrough to `kernel.library.list(filters)`                   |
| `create`      | full library fields                  | `{ slug, courseSlug, groupSlug, type, title, status, ... }`; `type` validated against `["ARTICLE","PLAYER"]`, 400s otherwise |
| `update`      | `{ slug, data }`                     | 404s if `slug` not found before updating                        |
| `delete`      | `{ slug }`                           | 404s if `slug` not found before deleting                        |
| `listByGroup` | `{ courseSlug, groupSlug }`          | wired as `listLibraryByGroup(data.courseSlug, data.groupSlug)`  |

`status` is `DRAFT` / `PUBLISHED` / `ARCHIVED` (kernel-side). Note: `getLibrary`/`listLibrary` currently do **not** expose kernel's `includeUnpublished` option upward — gap to revisit.

---

## Open questions / known gaps (as of this doc)

- Auth (`requireAdminForCourse`) removed from all three modules above; needs a redesigned reinstatement plan.
- `backend.js` still threads `token` through every handler even though it's currently unused downstream — dead weight until auth returns.
- `course.authorize` has no route yet.
- `library` has no `includeUnpublished` passthrough for admin preview of drafts.

---

*(Remaining modules — `admin`, `pending`, `svg`, `image`, `audio`, `assets` — to be documented next.)*