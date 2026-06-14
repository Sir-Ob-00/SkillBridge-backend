# SkillBridge Backend

Production-grade REST + WebSocket API for the SkillBridge campus artisan marketplace.

## Tech Stack

- Node.js (LTS) + Express.js + TypeScript (strict)
- PostgreSQL + Prisma ORM
- Socket.IO (real-time chat, booking, and admin events)
- JWT (access + refresh tokens), bcryptjs password hashing
- Zod validation, Helmet, CORS, Morgan, rate limiting

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A running PostgreSQL instance

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

At minimum, set `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.

### 4. Generate the Prisma client & run migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed sample data (optional but recommended)

```bash
npm run prisma:seed
```

This creates:
- Admin: `admin@skillbridge.dev` / `Admin123!`
- Student: `student@skillbridge.dev` / `Student123!`
- Artisan: `artisan@skillbridge.dev` / `Artisan123!` (pre-verified, with one service)

It also seeds the default category list.

### 6. Run the dev server

```bash
npm run dev
```

The API listens on `http://localhost:4000` (configurable via `PORT`).
All REST routes are mounted under `/api/v1`. Health check: `GET /health`.

### 7. Build for production

```bash
npm run build
npm start
```

---

## API Overview

Base URL: `/api/v1`

All responses follow the shape:
```json
{ "success": true, "data": ..., "message": "optional" }
```
Paginated responses:
```json
{ "success": true, "data": { "items": [...], "page": 1, "totalPages": 3, "totalItems": 42 } }
```

### Auth (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | – | Register (student/artisan/admin/super_admin) |
| POST | `/login` | – | Login, returns access + refresh tokens |
| POST | `/refresh` | – | Rotate refresh token, returns new pair |
| POST | `/logout` | – | Revoke a refresh token |
| POST | `/forgot-password` | – | Request a reset token (emailed in prod) |
| POST | `/reset-password` | – | Reset password with token |

### Users (`/users`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | user | Get own profile |
| PATCH | `/me` | user | Update own profile |
| GET | `/` | admin | List users (filter by role/search, paginated) |
| GET | `/:id` | admin | Get user by id |
| POST | `/:id/suspend` | admin | Suspend a user (revokes sessions) |
| POST | `/:id/unsuspend` | admin | Reinstate a user |
| DELETE | `/:id` | admin | Delete a user |

### Artisans (`/artisans`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me/profile` | artisan | Get own artisan profile |
| PATCH | `/me/profile` | artisan | Create/update artisan profile (bio, skills, categories, pricing, location, availability) |
| POST | `/me/portfolio` | artisan | Add a portfolio image |
| GET | `/` | – | List/search artisans (query, category, verification, pagination) |
| GET | `/:id` | – | Get artisan profile |
| GET | `/:id/services` | – | List an artisan's active services |
| GET | `/:id/availability` | – | Get availability slots |
| GET | `/:id/reviews` | – | List reviews for an artisan |
| DELETE | `/:id/portfolio/:itemId` | artisan | Remove a portfolio item |
| POST | `/:id/services` | artisan | Create a service |
| PATCH | `/:id/services/:serviceId` | artisan | Update a service |
| DELETE | `/:id/services/:serviceId` | artisan | Deactivate a service |
| PUT | `/:id/availability` | artisan | Replace availability slots |
| POST | `/:id/verify` | admin | Mark artisan verified |
| POST | `/:id/reject` | admin | Mark artisan rejected |
| POST | `/:id/suspend` | admin | Suspend artisan listing |
| POST | `/:id/unsuspend` | admin | Reinstate artisan listing |

### Students (`/students`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me/profile` | student | Profile + saved artisans |
| GET | `/me/saved-artisans` | student | List saved artisans |
| POST | `/me/saved-artisans` | student | Save an artisan (`{ artisanId }`) |
| DELETE | `/me/saved-artisans/:artisanId` | student | Unsave an artisan |
| GET | `/me/bookings` | student | Booking history |

### Bookings (`/bookings`) — core system
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | any | List bookings (scoped to caller's role) |
| POST | `/` | student | Create a booking (`artisanId` + `serviceId` OR `serviceTitle`+`price`, `scheduledTime`) |
| GET | `/:id` | participant/admin | Get booking detail |
| PATCH | `/:id/status` | participant/admin | Transition status (`pending → accepted/rejected/cancelled → in_progress → completed`) |

Status transition rules: students may only cancel; artisans may accept/reject/start/complete and cancel only while pending; admins can perform any valid transition.

### Reviews (`/reviews`, plus `/artisans/:id/reviews`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/reviews` | student | Review a completed booking (one per booking) |
| GET | `/artisans/:id/reviews` | – | List an artisan's reviews |
| DELETE | `/reviews/:id` | admin | Delete a review (also recomputes rating) |
| POST | `/reviews/:id/flag` | admin | Flag a review for moderation |

### Categories (`/categories`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | – | List categories (`?activeOnly=true`) |
| POST | `/` | admin | Create category |
| PATCH | `/:id` | admin | Update category (name/active) |
| DELETE | `/:id` | admin | Delete category |

Default categories are seeded automatically on first server start: Graphic Design, Photography, Barbering, Makeup, Tailoring, Laptop Repair, Phone Repair, Tutoring, Event Decoration.

### Reports (`/reports`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | user | File a report against a user |
| GET | `/` | admin | List reports (filter by status) |
| PATCH | `/:id/status` | admin | Update status (`open`/`resolved`/`escalated`) |

### Analytics (`/analytics`) — admin only
| Method | Path | Description |
|---|---|---|
| GET | `/overview` | Totals (users, students, artisans, bookings by status, revenue, avg rating) |
| GET | `/booking-trends?days=30` | Daily booking counts |
| GET | `/top-categories` | Most-listed service categories |
| GET | `/ratings` | Overall average + top-rated artisans |

### Chat (`/chats`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | user | List conversations with last message |
| GET | `/:chatId/messages` | participant | Paginated message history (oldest→newest per page) |
| POST | `/:chatId/read` | participant | Mark messages as read |

`chatId` is a deterministic pairing of the two participants' user ids: `[idA, idB].sort().join('_')`.

---

## Socket.IO

Connect with a JWT access token:

```js
const socket = io(API_URL, { auth: { token: accessToken } });
```

On connect, the server joins the socket to:
- `user:<userId>` — personal notification room
- `admins` — only if role is `admin`/`super_admin`

### Client → Server events
- `join_chat` `{ chatId }` — join a conversation room
- `leave_chat` `{ chatId }`
- `send_message` `{ chatId, text, receiverId? }` — persists and broadcasts the message
- `typing_indicator` `{ chatId, isTyping }`

### Server → Client events
- `receive_message` — new chat message
- `typing_indicator` `{ chatId, userId, isTyping }`
- `booking_created` / `booking_accepted` / `booking_completed` / `booking_cancelled`
- `artisan_verified` (to the artisan + admins room)
- `report_submitted` / `review_flagged` (to admins room)

---

## Roles

`student`, `artisan`, `admin`, `super_admin`. Registration defaults to `student`. Admin-only routes accept both `admin` and `super_admin` unless noted.

## Notes / Future Work

- Password reset currently returns the token directly in non-production responses (`devResetToken`) since no email provider is wired up yet.
- "Revenue" in analytics sums completed booking prices — ready for a payment integration but not connected to one yet.
