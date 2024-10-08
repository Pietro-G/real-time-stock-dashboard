# tb-stock-dashboard

A full stack project that mocks data handling using cron jobs and polling mechanisms.

## Prerequisites

Before you begin, ensure you have the following tools installed:

- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [PostgreSQL](https://www.postgresql.org/) (through supabase)
- [Supabase](https://supabase.io/) (for production database setup)
- [Git](https://git-scm.com/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

---

## Project Structure

```
.
├── backend/       # Node.js backend
├── frontend/      # React frontend
├── supabase/      # PostgreSQL with open source wrapper (supabase)
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Pietro-G/real-time-stock-dashboard
cd stock-dashboard
```

### 2. Set Up Environment Variables

Copy the `.env.example` to `.env` for all directories that contain one:

```bash
cp .env.example .env
```

Fill in the appropriate values in the `.env` file for your local environment (e.g., PostgreSQL connection string).

---

## Backend Setup

### 1. Install Dependencies

Navigate to the `backend` directory and install the necessary dependencies:

```bash
cd backend
npm install
```

### 2. Set Up the Database

You can set up the PostgreSQL database for local development using a Makefile task:

```bash
make seed  # Seeds initial data with table
```

This command uses the `seed.sql` file to initialize the database using .env credentials

Ensure you have the connection strings properly set in your `.env` file.

### 3. Running the Backend

Start the backend development server:

```bash
npm run dev
```

The backend should now be running on `http://localhost:5000/` (or the port specified in your `.env` file).

---

## Frontend Setup

### 1. Install Dependencies

Navigate to the `frontend` directory and install the necessary dependencies:

```bash
cd ../frontend
npm install  # or yarn install
```

### 2. Running the Frontend

Start the frontend development server:

```bash
npm start  # or yarn start
```

The frontend should now be running on `http://localhost:3000/` (or another available port).

---

## Running the Project

1. Seed the postgres database
2. Ensure the backend server is running at `http://localhost:5000/`.
2. Ensure the frontend server is running at `http://localhost:3000/`.

You can now open the frontend in your browser at `http://localhost:3000/` and the backend should handle API requests at `http://localhost:5000/`.

---

## Available Makefile Commands

| Command             | Description                                                   |
|---------------------|---------------------------------------------------------------|
| `make seed`         | Set up the local PostgreSQL database with initial schema      |
---

## Additional Notes

- The backend is set up to use a PostgreSQL database (both locally and in production).
- The frontend is a React app that fetches data from the backend API (cors enabled).
- Ensure your `.env` file is correctly configured before starting the project.

---

## License

MIT License. See `LICENSE` for more details.
