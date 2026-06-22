# SmartReach Media Platform

SmartReach is a smart digital signage and advertising management platform that enables centralized content distribution, real-time campaign management, analytics, and emergency alert broadcasting across a network of connected smartboards.

This repository contains both the frontend React client and the Node.js backend server.

---

## Technical Stack
- **Frontend**: React, Vite, Tailwind CSS, Axios, Lucide React, React Router
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, BcryptJS

---

## Folder Structure
```
SmartReach/
├─ server/               # Node.js + Express backend
│  ├─ config/            # DB configuration
│  ├─ controllers/       # Auth & Board API controllers
│  ├─ middleware/        # JWT & Role authorization
│  ├─ models/            # Mongoose Schemas (User, Board)
│  ├─ routes/            # Express routers
│  └─ services/          # Seeding & helper scripts
├─ src/                  # React + Vite frontend source code
│  ├─ assets/            # Static assets
│  ├─ components/        # Reusable React components (guards, modals)
│  ├─ context/           # Global Auth state context
│  ├─ layouts/           # Sidebar & navigation layouts
│  ├─ pages/             # Dashboard and Board CRUD pages
│  └─ services/          # Axios HTTP client config
├─ package.json          # Root Vite + React configuration
├─ tailwind.config.js    # Tailwind theme and colors
└─ postcss.config.js     # PostCSS setup
```

---

## Setup & Running Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017` (or provide a remote connection string)

### 1. Database Configuration
By default, the server expects MongoDB to be running at `mongodb://127.0.0.1:27017/smartreach`. If your MongoDB URI is different:
1. Open the file `server/.env`.
2. Modify the `MONGO_URI` variable to match your database connection string.

### 2. Backend Server Setup
From the project root directory, install the server dependencies and run the seeding script:

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Run the database seed script (Populates Admin accounts & sample Smartboards)
npm run seed

# Start the Express server in development mode
npm run dev
```

The backend server will run on `http://localhost:5000`.

### 3. Frontend Client Setup
From the project root directory (in a separate terminal window):

```bash
# Install frontend client dependencies
npm install

# Start the Vite React development server
npm run dev
```

The frontend React client will run on `http://localhost:5173`. 
All API requests starting with `/api` are automatically proxied to the backend server at `http://localhost:5000`.

---

## Demo Accounts
The database seed script initializes two administrative user accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@smartreach.com` | `admin123` |
| **Admin** | `admin@smartreach.com` | `admin123` |

---

## API Documentation

### Authentication APIs
- `POST /api/auth/register` - Register a new administrator
- `POST /api/auth/login` - Authenticate credentials and receive JWT
- `GET /api/auth/profile` - Retrieve authenticated user profile details

### Smartboard APIs (All require authentication)
- `GET /api/boards` - Search, filter, paginate and retrieve board records
- `GET /api/boards/:id` - Fetch metadata for a specific board
- `POST /api/boards` - Register a new smartboard (generates board ID)
- `PUT /api/boards/:id` - Update smartboard details
- `DELETE /api/boards/:id` - Delete a smartboard from the database
