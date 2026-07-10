# NancyMobile Clinic

Full-stack mobile accessories and repair shop application.

- **Frontend:** React 18 + Vite + React Router v6
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Deployment:** Railway

---

## Deploy to Railway

### 1. Create a Railway project

1. Go to [railway.app](https://railway.app) and create a new project
2. Click **"Deploy from GitHub repo"** and select this repository

### 2. Add a PostgreSQL database

1. In your Railway project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically inject `DATABASE_URL` into your service

### 3. Set environment variables

In your Railway service **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | *(any long random string, e.g. 32+ chars)* |
| `FRONTEND_URL` | *(your Railway app URL, e.g. `https://nancymobile.up.railway.app`)* |
| `DATABASE_URL` | *(auto-injected by Railway PostgreSQL plugin)* |

> `PORT` is automatically set by Railway — do not override it.

### 4. Deploy

Railway will automatically:
1. Run `npm install` for backend and frontend
2. Build the React frontend with `vite build`
3. Start the server with `node backend/src/server.js`
4. Run all database migrations and seed data on first boot

### 5. First-time setup

After deployment, visit:
```
https://your-app.up.railway.app/api/init
```
This seeds the database and creates the admin account:
- **Email:** `Namcy@gmail.com`
- **Password:** `admin@123`

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

1. Clone the repo
2. Copy `.env.example` to `backend/src/.env` and fill in your DB credentials
3. Install dependencies:
   ```bash
   npm install --prefix backend/src
   npm install --prefix frontend
   ```
4. Start backend:
   ```bash
   npm run dev --prefix backend/src
   ```
5. Start frontend:
   ```bash
   npm run dev --prefix frontend
   ```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:5000`.

---

## Project Structure

```
NMobileClinic/
├── backend/src/
│   ├── routes/          # All API route files
│   ├── middlewares/     # Auth + error middleware
│   ├── config/          # Database config
│   └── server.js        # Express entry point
├── frontend/
│   ├── src/
│   │   ├── pages/       # All page components (customer/admin/technician/delivery)
│   │   ├── components/  # Shared UI components
│   │   ├── context/     # React context (Auth, Cart, Language, Theme)
│   │   └── services/    # Axios API client
│   └── vite.config.js
├── database/
│   └── schema.sql       # Full database schema
├── nixpacks.toml        # Railway build config
└── railway.json         # Railway deployment config
```

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full access — users, orders, payments, repairs, inventory, delivery |
| `customer` | Browse products, cart, orders, repairs, payments |
| `technician` | Repair assignments, parts requests, earnings |
| `delivery_person` | Delivery tasks, job status updates |
