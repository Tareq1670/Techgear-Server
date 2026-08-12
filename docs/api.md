# TechGear REST API Documentation

Base URL (dev): `http://localhost:5000`

## Conventions

### Response envelope

Every response uses the envelope `{ success, message, data }`.

| Field | Type | Description |
|---|---|---|
| `success` | boolean | `true` for 2xx, `false` for 4xx/5xx |
| `message` | string | Human-readable result message |
| `data` | any | Payload (object, array, or `null`) |

### Authentication

- Most authenticated endpoints require `Authorization: Bearer <JWT>`.
- The backend **verifies** JWTs issued by Better-Auth on the Next.js client against `{CLIENT_URL}/api/auth/jwks` — it never signs tokens, and there is no `JWT_SECRET`.
- `verifyToken` → 401 if the token is missing, malformed, expired, tampered, or fails remote verification.
- `authorizeAdmin` (admin-only routes) → 403 unless the verified `role` claim is `ADMIN`.

**Dev/test only (`NODE_ENV !== 'production'`):** remote verification can be bypassed with either:

- an `x-dev-user` JSON header, e.g. `x-dev-user: {"sub":"u1","role":"ADMIN"}` (checked before the missing-token 401, so no `Authorization` header is needed), or
- `Authorization: Bearer dev-token` (`DEV_MOCK_TOKEN`, default `dev-token`), which resolves to the configured `DEV_MOCK_*` identity (default role `ADMIN`).

### Errors

| Status | Message | When |
|---|---|---|
| 400 | `Validation failed` (`data.errors`: `["field: message", ...]`) | zod body validation via `validate` middleware |
| 400 | `Invalid query parameters` | product list query params invalid |
| 401 | `Unauthorized access` | missing/invalid token |
| 403 | `Forbidden: Admin access required` | non-admin on admin route |
| 404 | `Route not found` | unknown route |
| 500 | `Internal server error` | unhandled error |

## Index

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/` | GET | — | Server info |
| `/health` | GET | — | Health check |
| `/api` | GET | — | API info |
| `/api/example` | GET | token | Example protected route |
| `/api/example/admin` | GET | admin | Example admin-only route |
| `/api/auth/me` | GET | token | Current user |
| `/api/users` | GET | admin | List users |
| `/api/users/:id` | GET | token | Get user (self or admin) |
| `/api/users/:id` | PATCH | token | Update own profile |
| `/api/users/:id` | DELETE | token | Delete user (self or admin) |
| `/api/categories` | GET | — | List categories |
| `/api/categories/:id` | GET | — | Get category |
| `/api/categories` | POST | admin | Create category |
| `/api/categories/:id` | PATCH | admin | Update category |
| `/api/categories/:id` | DELETE | admin | Delete category |
| `/api/products` | GET | — | List/search products |
| `/api/products/:id` | GET | — | Get product |
| `/api/products` | POST | admin | Create product |
| `/api/products/:id` | PATCH | admin | Update product |
| `/api/products/:id` | DELETE | admin | Delete product |
| `/api/reviews/product/:productId` | GET | — | Reviews for a product |
| `/api/reviews` | POST | token | Create review |
| `/api/reviews/:id` | PATCH | token | Update review (owner/admin) |
| `/api/reviews/:id` | DELETE | token | Delete review (owner/admin) |
| `/api/orders` | POST | token | Create order |
| `/api/orders/my-orders` | GET | token | Current user's orders |
| `/api/orders` | GET | admin | List all orders |
| `/api/orders/:id/status` | PATCH | admin | Update order status |
| `/api/orders/:id` | DELETE | admin | Delete order |

---

## App root

### `GET /`

Server banner. Registered directly on the app, not under `/api`.

Response `200`:

```json
{ "success": true, "message": "TechGear API is running", "data": null }
```

### `GET /health`

Health check for load balancers / Render. Registered directly on the app, not under `/api`.

Response `200`:

```json
{ "success": true, "message": "Server is healthy", "data": null }
```

---

## API root

### `GET /api`

API banner.

Response `200`:

```json
{ "success": true, "message": "TechGear API is running", "data": null }
```

### `GET /api/example`

**Auth:** `verifyToken`

Example protected route — echoes the verified token payload.

Response `200`:

```json
{ "success": true, "message": "Protected route accessed", "data": { "user": { "sub": "…", "email": "…", "role": "USER" } } }
```

### `GET /api/example/admin`

**Auth:** `verifyToken, authorizeAdmin`

Example admin-only route.

Response `200`:

```json
{ "success": true, "message": "Admin-only route accessed", "data": null }
```

---

## Auth

### `GET /api/auth/me`

**Auth:** `verifyToken`

Returns the current user. First tries a DB lookup by `sub` (skipping deleted users); if the user is missing or the DB lookup fails, falls back to the token payload.

Response `200` (from DB):

```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": { "user": { "id": "…", "email": "…", "name": "…", "role": "USER", "createdAt": "…", "updatedAt": "…" } }
}
```

Response `200` (token fallback — `name` is always `null`):

```json
{
  "success": true,
  "message": "User fetched from token",
  "data": { "user": { "id": "<sub>", "email": "<payload email or null>", "name": null, "role": "USER" } }
}
```

---

## Users

User shape (selected fields):

```json
{
  "id": "uuid",
  "email": "string",
  "name": "string|null",
  "role": "USER|ADMIN",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

`isDeleted` and `password` are never exposed.

### `GET /api/users`

**Auth:** `verifyToken, authorizeAdmin`

Lists all non-deleted users.

Response `200`:

```json
{ "success": true, "message": "Users fetched successfully", "data": { "users": [ { …user } ] } }
```

### `GET /api/users/:id`

**Auth:** `verifyToken`

Returns a single user. Non-admins may only fetch themselves.

| Status | Condition |
|---|---|
| 200 | Found (self or admin) |
| 403 | Not self and not admin |
| 404 | Unknown or deleted user |

### `PATCH /api/users/:id`

**Auth:** `verifyToken`

Updates the caller's own profile only (403 for any other user, including admin).

Request body (at least one required):

```json
{ "name": "string (trim, non-empty)", "email": "string (valid email)" }
```

| Status | Condition |
|---|---|
| 200 | Updated |
| 400 | `Validation failed` |
| 403 | Trying to update another user |
| 404 | Unknown or deleted user |
| 409 | Email already in use (`Email already in use`) |

### `DELETE /api/users/:id`

**Auth:** `verifyToken`

Soft-deletes a user (`isDeleted = true`). Admin may delete anyone; non-admins may only delete themselves.

| Status | Condition |
|---|---|
| 200 | Deleted (`data: null`) |
| 403 | Not self and not admin |
| 404 | Unknown or deleted user |

---

## Categories

Category shape:

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string|null",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

The `slug` is auto-generated from `name` (lowercased, non-alphanumerics → `-`) and regenerated on rename.

### `GET /api/categories`

**Public.** Lists all non-deleted categories.

Response `200`:

```json
{ "success": true, "message": "Categories fetched successfully", "data": { "categories": [ { …category } ] } }
```

### `GET /api/categories/:id`

**Public.** Returns a single category.

| Status | Condition |
|---|---|
| 200 | Found |
| 404 | Unknown or deleted category |

### `POST /api/categories`

**Auth:** `verifyToken, authorizeAdmin`

Request body:

```json
{ "name": "string (trim, non-empty, required)", "description": "string (optional)" }
```

| Status | Condition |
|---|---|
| 201 | Created |
| 400 | `Validation failed` |
| 401 | Unauthenticated |
| 403 | Non-admin |
| 409 | Name or slug already exists |

### `PATCH /api/categories/:id`

**Auth:** `verifyToken, authorizeAdmin`

Request body (at least one required):

```json
{ "name": "string", "description": "string|null" }
```

| Status | Condition |
|---|---|
| 200 | Updated |
| 400 | `Validation failed` |
| 401 | Unauthenticated |
| 403 | Non-admin |
| 404 | Unknown or deleted category |
| 409 | Name or slug already exists |

### `DELETE /api/categories/:id`

**Auth:** `verifyToken, authorizeAdmin`

Soft-deletes a category (`isDeleted = true`).

| Status | Condition |
|---|---|
| 200 | Deleted (`data: null`) |
| 401 | Unauthenticated |
| 403 | Non-admin |
| 404 | Unknown or deleted category |

---

## Products

Product shape:

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "price": "number",
  "stock": "integer",
  "imageUrl": "string|null",
  "categoryId": "uuid",
  "category": { "id": "uuid", "name": "string", "slug": "string" },
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### `GET /api/products`

**Public.** Lists non-deleted products with filters, sorting, and pagination.

Query parameters:

| Param | Type | Default | Notes |
|---|---|---|---|
| `categoryId` | uuid | — | Filter by category |
| `search` | string | — | Case-insensitive `contains` on name/description |
| `sort` | `newest` \| `price_asc` \| `price_desc` | `newest` | `newest` = createdAt desc |
| `page` | integer > 0 | `1` | Coerced from string |
| `limit` | integer 1–100 | `12` | Coerced from string |

Response `200`:

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": {
    "products": [ { …product } ],
    "pagination": { "page": 1, "limit": 12, "total": 50, "totalPages": 5 }
  }
}
```

| Status | Condition |
|---|---|
| 200 | Success |
| 400 | Invalid query parameters (e.g. bad uuid, out-of-range limit) |

### `GET /api/products/:id`

**Public.** Returns a single product.

| Status | Condition |
|---|---|
| 200 | Found |
| 404 | Unknown or deleted product |

### `POST /api/products`

**Auth:** `verifyToken, authorizeAdmin`

Request body:

```json
{
  "name": "string (trim, non-empty, required)",
  "description": "string (trim, non-empty, required)",
  "price": "number > 0 (required)",
  "stock": "integer >= 0 (optional, default 0)",
  "imageUrl": "string (valid URL, optional)",
  "categoryId": "uuid (required)"
}
```

`price` is rounded to 2 decimal places on write.

| Status | Condition |
|---|---|
| 201 | Created |
| 400 | `Validation failed`, or category missing/deleted (`Category not found`) |
| 401 | Unauthenticated |
| 403 | Non-admin |

### `PATCH /api/products/:id`

**Auth:** `verifyToken, authorizeAdmin`

Request body (at least one field required; `imageUrl` may be `null` to clear):

```json
{
  "name": "string",
  "description": "string",
  "price": "number > 0",
  "stock": "integer >= 0",
  "imageUrl": "string|null",
  "categoryId": "uuid"
}
```

A provided `categoryId` is validated against a non-deleted category (400 if missing/deleted), so a deleted category can't be attached.

| Status | Condition |
|---|---|
| 200 | Updated |
| 400 | `Validation failed`, or new category missing/deleted |
| 401 | Unauthenticated |
| 403 | Non-admin |
| 404 | Unknown or deleted product |

### `DELETE /api/products/:id`

**Auth:** `verifyToken, authorizeAdmin`

Soft-deletes a product (`isDeleted = true`).

| Status | Condition |
|---|---|
| 200 | Deleted (`data: null`) |
| 401 | Unauthenticated |
| 403 | Non-admin |
| 404 | Unknown or deleted product |

---

## Reviews

Review shape:

```json
{
  "id": "uuid",
  "rating": "integer 1–5",
  "comment": "string",
  "productId": "uuid",
  "userId": "uuid",
  "user": { "id": "uuid", "name": "string|null" },
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### `GET /api/reviews/product/:productId`

**Public.** Lists non-deleted reviews for a product, newest first. Deleted reviews, deleted products, and deleted users are excluded.

Response `200`:

```json
{ "success": true, "message": "Reviews fetched successfully", "data": { "reviews": [ { …review } ] } }
```

### `POST /api/reviews`

**Auth:** `verifyToken`

`userId` is taken from `req.auth.sub`, never from the body.

Request body:

```json
{ "rating": "integer 1–5 (required)", "comment": "string (trim, non-empty, required)", "productId": "uuid (required)" }
```

| Status | Condition |
|---|---|
| 201 | Created |
| 400 | `Validation failed`, or product missing/deleted (`Product not found`) |
| 401 | Unauthenticated |

### `PATCH /api/reviews/:id`

**Auth:** `verifyToken`

Owner or admin may update; anyone else gets 403.

Request body (at least one required):

```json
{ "rating": "integer 1–5", "comment": "string" }
```

| Status | Condition |
|---|---|
| 200 | Updated |
| 400 | `Validation failed` |
| 401 | Unauthenticated |
| 403 | Not the owner and not admin |
| 404 | Unknown or deleted review |

### `DELETE /api/reviews/:id`

**Auth:** `verifyToken`

Owner or admin may delete (soft delete); anyone else gets 403.

| Status | Condition |
|---|---|
| 200 | Deleted (`data: null`) |
| 401 | Unauthenticated |
| 403 | Not the owner and not admin |
| 404 | Unknown or deleted review |

---

## Orders

Order shape (user view):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "totalAmount": "number (2 dp)",
  "status": "PENDING|PROCESSING|SHIPPED|DELIVERED|CANCELLED",
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "quantity": "integer",
      "price": "number",
      "product": { "id": "uuid", "name": "string", "imageUrl": "string|null" }
    }
  ]
}
```

Admin list responses additionally include `"user": { "id", "email", "name" }` on the order.

### `POST /api/orders`

**Auth:** `verifyToken`

Creates an order and its items in a single `prisma.$transaction`. `userId` is taken from `req.auth.sub`, never from the body.

Request body:

```json
{ "items": [ { "productId": "uuid", "quantity": "integer > 0" } ] }
```

- At least one item is required.
- Duplicate `productId` entries are merged (quantities summed).
- Stock is validated against live DB prices and deducted race-safely (`updateMany` with a `stock >= quantity` guard).
- `totalAmount` is computed from DB prices and rounded to 2 decimal places.
- `status` defaults to `PENDING`.

| Status | Condition |
|---|---|
| 201 | Created |
| 400 | `Validation failed`, product missing/deleted (`Product not found`), or insufficient stock (`Insufficient stock for "<name>"`) |
| 401 | Unauthenticated |

### `GET /api/orders/my-orders`

**Auth:** `verifyToken`

Returns the current user's non-deleted orders, newest first. Registered before the admin `GET /`.

Response `200`:

```json
{ "success": true, "message": "Orders fetched successfully", "data": { "orders": [ { …order } ] } }
```

### `GET /api/orders`

**Auth:** `verifyToken, authorizeAdmin`

Lists all non-deleted orders (admin view, includes user email/name), newest first.

Response `200`:

```json
{ "success": true, "message": "Orders fetched successfully", "data": { "orders": [ { …order, "user": { "id": "…", "email": "…", "name": "…" } } ] } }
```

### `PATCH /api/orders/:id/status`

**Auth:** `verifyToken, authorizeAdmin`

Request body:

```json
{ "status": "PENDING|PROCESSING|SHIPPED|DELIVERED|CANCELLED" }
```

| Status | Condition |
|---|---|
| 200 | Updated |
| 400 | `Validation failed` (invalid status) |
| 401 | Unauthenticated |
| 403 | Non-admin |
| 404 | Unknown or deleted order |

### `DELETE /api/orders/:id`

**Auth:** `verifyToken, authorizeAdmin`

Soft-deletes an order (`isDeleted = true`). Items are preserved.

| Status | Condition |
|---|---|
| 200 | Deleted (`data: null`) |
| 401 | Unauthenticated |
| 403 | Non-admin |
| 404 | Unknown or deleted order |
