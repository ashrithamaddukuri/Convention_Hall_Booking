<div align="center">

# 🏛️ Convention Hall Booking

**A full-stack web app for booking convention halls, with JWT authentication, overlap-safe slot management, food and decoration selection, and automated GST billing.**

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F)
![React](https://img.shields.io/badge/React-18-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791)

</div>

---


## Features

### For customers
- Browse convention halls with capacity, pricing and images
- **Two-step booking:** fill in details, review the quote, then confirm
- **Food menu picker:** starters, mains, desserts and beverages, priced per plate
- **Decoration packages:** 4 options, plus an optional catering add-on
- **Live cost preview** with 18% GST
- **My Bookings:** view bills with a full breakdown and cancel inline

### For admins
- Halls CRUD (create, update, delete)
- View all bookings with customer details and bills

### Reliability and security
- **Overlap detection** enforced at both the application and database level, so the same slot cannot be double-booked
- **JWT authentication** with register and login, and `USER` / `ADMIN` roles
- **Flyway** migrations for versioned, repeatable database schema changes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.2, Java 17 |
| Frontend | React 18, Vite, React Router v6 |
| Database | PostgreSQL (Neon) with Flyway migrations |
| Auth | JWT (JJWT 0.11) |

---

## Design Notes

<!-- TODO: fill these in with 1-2 lines each, based on your actual code. Recruiters read this section. -->

- **Overlap prevention:** _Describe how a booking conflict is detected in the service layer and how the database stops concurrent requests from double-booking (for example, a constraint or transaction)._
- **Authentication flow:** _Describe how login issues a JWT, how requests are validated, and how roles protect admin routes._
- **Billing:** _Describe how the quote is calculated (hall + food + decoration + catering + 18% GST) and when it is saved._

---

## Project Structure

```
Convention_Hall_Booking/
├── backend/      # Spring Boot REST API
├── frontend/     # React SPA (Vite)
└── README.md
```

---

## Getting Started

### Prerequisites
- Java 17
- Maven
- Node.js 18+
- A PostgreSQL database (for example, a free [Neon](https://neon.tech/) project)

### 1. Clone the repository
```bash
git clone https://github.com/ashrithamaddukuri/Convention_Hall_Booking.git
cd Convention_Hall_Booking
```

### 2. Configure environment variables
Copy the example file and fill in your own values:
```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DB_JDBC_URL` | JDBC URL of your PostgreSQL database, e.g. `jdbc:postgresql://<host>/<db>` |
| `DB_JDBC_URL_UNPOOLED` | Direct (non-pooled) JDBC URL, used for Flyway migrations |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Random string of 32+ characters used to sign tokens |

> Never commit `.env.local`. It should be listed in `.gitignore`.

### 3. Run the backend
```bash
cd backend
mvn spring-boot:run
```
The API runs at http://localhost:8080. Flyway applies the migrations on first start.

### 4. Run the frontend
```bash
cd frontend
npm install
npm run dev
```
The app runs at http://localhost:3000.

### 5. Create an admin user
Register a normal account in the app, then run this in your database's SQL editor:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```
Log in again to see the admin dashboard.

---

## Deployment

Not deployed yet. The planned setup is the backend on Render, the frontend on Vercel, and the database on Neon.

---

## Roadmap
- [ ] Deploy the backend and frontend
- [ ] Add JUnit tests for the overlap detection and billing logic
- [ ] Add Docker support for one-command local setup

---

## Author

**Ashritha Maddukuri**
B.Tech Computer Science, VRSEC, Vijayawada
[GitHub](https://github.com/ashrithamaddukuri)
