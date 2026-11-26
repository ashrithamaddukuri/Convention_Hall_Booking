# 🏛️ Convention Hall Booking System

A full-stack web application for booking convention halls, with JWT authentication, overlap-safe slot management, food menu selection, decoration packages, and automated billing.

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Spring Boot 3.2, Java 17          |
| Frontend   | React 18, Vite, React Router v6   |
| Database   | PostgreSQL (Neon) + Flyway        |
| Auth       | JWT (JJWT 0.11)                   |

## Project Structure

```
conventionhallbooking/
├── backend/          # Spring Boot REST API
├── frontend/         # React SPA
├── neon.ts           # Neon database config
└── README.md
```

## Features

- Browse convention halls with capacity, pricing, images
- 2-step booking: fill details → review quote → confirm
- Overlap detection — blocked at both app and database level
- Food menu picker (Starters, Mains, Desserts, Beverages — per plate)
- Decoration packages (4 options)
- Catering add-on
- Live cost preview with 18% GST
- JWT auth (register/login, USER/ADMIN roles)
- My Bookings with inline cancel and bill breakdown
- Admin dashboard — halls CRUD, all bookings with customer details, bills

---

## Deployment

### Database — Neon (already set up)

Your Neon database is already provisioned. The connection string is in `.env.local`.

---

### Backend — Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `mvn package -DskipTests`
   - **Start Command:** `java -jar target/booking-0.0.1-SNAPSHOT.jar`
   - **Runtime:** Java
5. Add these **Environment Variables:**

| Key | Value |
|-----|-------|
| `DB_JDBC_URL` | your Neon pooled JDBC URL (see below) |
| `DB_JDBC_URL_UNPOOLED` | your Neon direct JDBC URL (see below) |
| `DB_USERNAME` | your Neon username |
| `DB_PASSWORD` | your Neon password |
| `JWT_SECRET` | any random 32+ char string |

**Getting the JDBC URLs from your `.env.local`:**
- `DATABASE_URL` → replace `postgresql://` with `jdbc:postgresql://` → this is `DB_JDBC_URL`
- `DATABASE_URL_UNPOOLED` → same replacement → this is `DB_JDBC_URL_UNPOOLED`

6. Deploy. Copy the backend URL (e.g. `https://your-app.onrender.com`)

---

### Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. Set:
   - **Root Directory:** `frontend`
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add this **Environment Variable:**

| Key | Value |
|-----|-------|
| `VITE_API_URL` | your Render backend URL (e.g. `https://your-app.onrender.com`) |

4. Update `frontend/src/api/axios.js` — change `baseURL` from `'/api'` to use the env var:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
})
```

5. Deploy.

---

## Admin Access

Register a user normally, then run this SQL on your Neon database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

You can run this from the [Neon console](https://console.neon.tech) SQL editor.

---

## Local Development

**Requirements:** Java 17, Maven, Node.js 18+

**Backend:**
```bash
cd backend
# .env.local must exist with DB credentials
mvn spring-boot:run
# runs on http://localhost:8080
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# runs on http://localhost:3000
```
