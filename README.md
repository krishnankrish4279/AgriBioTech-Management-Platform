# AgriBioTech Management & Farmer Advisory Platform

A modern full-stack web application for agricultural biotechnology enterprises, agronomists, biotech researchers, and farmers powered by **MongoDB & Mongoose**, **Express.js**, **React 18 & TypeScript**.

---

## 🗄️ Database Information
- **Database Engine**: MongoDB (Mongoose ODM)
- **Database Name**: `agribiotech`
- **Default URI**: `mongodb://localhost:27017/agribiotech` *(Compatible with MongoDB Atlas)*
- **Collections**:
  1. `users` — Admin, Agronomist, Biotech Expert, and Farmer accounts with bcrypt password hashes
  2. `farmers` — Farmer profiles, farm size, language preferences, contact info
  3. `farms` — Monitored agricultural plots with GPS coordinates, soil types, and irrigation systems
  4. `cropvarieties` — Genetically stacked cultivars (yield, maturity days, biotech & resistance traits)
  5. `diseasereports` — Geo-referenced crop disease outbreak cases with severity and containment statuses
  6. `fieldobservations` — Agronomist field visit logs with plant health scores (1–10) and notes
  7. `biotechnologyrecommendations` — AI automated and expert-prescribed biotech solutions
  8. `farmeradvisories` — Targeted 2-way advisory messages with priority levels (Urgent/Important/Routine)
  9. `notifications` — Real-time alerts and outbreak dispatch notices
  10. `activitylogs` — Audit log of platform operations
  11. `diseases` — Comprehensive disease knowledge catalog

---

## 🏃 Running Commands

### 1. Start MongoDB
```powershell
# If running MongoDB as a local Windows service:
net start MongoDB

# Or running mongod directly:
mongod --dbpath "C:\data\db"
```

### 2. Seed Demo Data into MongoDB
```powershell
# In project root:
npm run seed
```

### 3. Start Backend API Server
```powershell
# In project root:
npm run dev:backend
# (Runs on http://localhost:5000)
```

### 4. Start Frontend Web Application
```powershell
# In project root:
npm run dev:frontend
# (Runs on http://localhost:5173)
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| **ADMIN** | `admin@agribiotech.demo` | `Admin@123` |
| **AGRONOMIST** | `agronomist@agribiotech.demo` | `Agronomist@123` |
| **BIOTECH SCIENTIST** | `scientist@agribiotech.demo` | `Scientist@123` |
| **FARMER** | `farmer@agribiotech.demo` | `Farmer@123` |

---

## 🛡️ Authentication & Logout Features
- **JWT Authentication** with bcrypt password hashing.
- **Protected Routes**: Unauthenticated access automatically redirects to `/login`.
- **Fixed Logout**: Clicking **Logout** in the profile dropdown or sidebar immediately revokes tokens, clears authentication cache, and redirects to `/login`. Browser refresh or Back button preserves the logged-out state.
