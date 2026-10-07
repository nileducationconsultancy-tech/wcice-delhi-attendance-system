# WECICE Delhi — Attendance & Payroll Management System

An enterprise-grade, full-stack attendance, document, and automated payroll management platform engineered for **WECICE Delhi**.

---

## 🌟 System Overview

- **Frontend (Web):** React 19 + Vite + Tailwind CSS + Lucide Icons + Axios
- **Backend (API):** Node.js + Express 5 + Mongoose + JWT + Nodemailer + PDFKit
- **Mobile (App):** React Native + Expo Router + SecureStore + Location
- **Database:** MongoDB
- **File & Document Storage:** Supabase Storage (with fallback to local storage)

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Database (Atlas cluster or local instance)
- npm / yarn / pnpm

### 2. Backend Installation & Run

```bash
cd Backend
npm install
npm run dev
```
Backend will start on `http://localhost:5000`.

### 3. Frontend (Web) Installation & Run

```bash
cd Frontend
npm install
npm run dev
```
Frontend web portal will start on `http://localhost:5173`.

### 4. Mobile (App) Installation & Run

```bash
cd mobile
npm install
npx expo start
```

---

## ⚙️ Environment Configuration

### Backend (`Backend/.env`)

Copy `Backend/.env.example` to `Backend/.env` and supply your credentials:

| Variable | Description |
| :--- | :--- |
| `PORT` | Server listening port (default: `5000`) |
| `NODE_ENV` | Environment mode (`development` / `production`) |
| `MONGODB_URI` | MongoDB connection string (e.g. `mongodb+srv://...`) |
| `JWT_SECRET` | Strong secret key for signing JWT authentication tokens |
| `SUPER_ADMIN_EMAIL` | Email for initial Super Admin bootstrap account |
| `SUPER_ADMIN_PASSWORD` | Password for initial Super Admin bootstrap account |
| `ADMIN_NAME` | Display name for Super Admin (default: `Administrator`) |
| `EMPLOYEE_ID_PREFIX` | Prefix for automatic employee ID generation (`WECICE-EMP-`) |
| `CLIENT_URL` | Frontend URL allowed for CORS requests (`http://localhost:5173`) |
| `FRONTEND_URL` | Deployed Frontend URL |
| `TIMEZONE` | Authoritative timezone (default: `Asia/Kolkata`) |
| `OFFICE_IPS` | Permitted IP whitelist for check-ins (comma separated) |
| `GMAIL_USER` | Gmail address for system emails & password resets |
| `GMAIL_APP_PASSWORD` | Gmail App Password (16 characters) |
| `GEOAPIFY_API_KEY` | Optional Geoapify API key for reverse geocoding |
| `SUPABASE_URL` | Optional Supabase project URL for cloud document storage |
| `SUPABASE_KEY` | Optional Supabase API key |
| `SUPABASE_BUCKET_NAME` | Supabase storage bucket (`employee-documents`) |

### Frontend (`Frontend/.env.production` / `.env`)

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Backend API base URL for production builds |

### Mobile (`mobile/.env`)

| Variable | Description |
| :--- | :--- |
| `EXPO_PUBLIC_API_URL` | Backend API URL accessible from mobile devices |

---

## 🔐 Super Admin Bootstrap

When the backend starts up, it checks if an administrator account matching `SUPER_ADMIN_EMAIL` exists in the database. If not, it automatically provisions the Super Admin account with `SUPER_ADMIN_PASSWORD` and `ADMIN` role.

To configure your Super Admin:
1. Set `SUPER_ADMIN_EMAIL=your-admin@wecice.com` in `Backend/.env`.
2. Set `SUPER_ADMIN_PASSWORD=your-secure-password` in `Backend/.env`.
3. Start the backend server.
4. Log into the portal using these credentials.

---

## 📧 Gmail / Email Service Setup

For automated password recovery and notification emails:
1. Enable 2-Step Verification on your Google account.
2. Generate an **App Password** under Google Account Security settings.
3. Add `GMAIL_USER` and `GMAIL_APP_PASSWORD` to `Backend/.env`.

---

## 📦 Production Deployment

### Backend Deployment (e.g. Vercel / Render / Railway)
- Set Environment Variables from `Backend/.env.example`.
- Set Root Directory to `Backend`.
- Set Build Command to `npm install` and Start Command to `npm start`.

### Frontend Deployment (e.g. Vercel / Netlify / Cloudflare Pages)
- Set Root Directory to `Frontend`.
- Set Build Command to `npm run build` and Output Directory to `dist`.
- Provide `VITE_API_URL` pointing to your deployed Backend API.

---

## 🛡️ License & Copyright

© 2026 WECICE Delhi. All rights reserved.
