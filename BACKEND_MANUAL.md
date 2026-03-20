# Backend Manual: Running the Full-Stack API Service

This application is built as a **Full-Stack** application using **Express.js** for the backend and **Vue.js** for the frontend, integrated via **Vite**, with **PostgreSQL** for data persistence.

## Prerequisites

- **Node.js**: Ensure you have Node.js (v20 or higher) installed.
- **npm**: Standard Node Package Manager.
- **PostgreSQL**: A running PostgreSQL instance (local or hosted).

## Installation

Before running the application for the first time, install all necessary dependencies:

```bash
npm install
```

## Configuration

The application requires a PostgreSQL connection string and a JWT secret. Create a `.env` file in the root directory (using `.env.example` as a template) or set the following environment variables in your hosting platform:

- `DATABASE_URL`: `postgresql://user:password@host:port/dbname`
- `JWT_SECRET`: A strong, random string used to sign authentication tokens.

For detailed database setup instructions, see [DATABASE_SETUP.md](./DATABASE_SETUP.md).

## Running in Development Mode

To start the application in development mode (with hot-reloading for the frontend and automatic server integration):

```bash
npm run dev
```

- **Backend API**: Accessible at `http://localhost:3000/api/*`
- **Frontend UI**: Accessible at `http://localhost:3000/`
- **Port**: The application is hardcoded to run on port **3000**.

## Running in Production Mode

To prepare the application for production and run it:

1. **Build the Frontend**:
   ```bash
   npm run build
   ```
   This generates the static frontend files in the `dist/` directory.

2. **Start the Server**:
   ```bash
   npm run start
   ```
   In production mode, the Express server serves the static files from the `dist/` directory and provides the API endpoints.

## Deployment Checklist

When deploying to a production environment (e.g., Google Cloud Run, Heroku, AWS):

1.  **Environment Variables**: Ensure `DATABASE_URL` and `JWT_SECRET` are set in your platform's environment configuration.
2.  **Build Step**: Your platform should run `npm install` and `npm run build`.
3.  **Start Command**: The start command should be `npm run start`.
4.  **Database Access**: Ensure your hosting platform's IP addresses are allowed to connect to your PostgreSQL instance.
5.  **SSL/TLS**: The application is configured to run on HTTP (port 3000). Ensure your hosting provider handles SSL termination (HTTPS).

## API Endpoints

The backend provides the following RESTful API endpoints. Most endpoints require an `Authorization: Bearer <token>` header.

### Authentication
- **POST `/api/auth/login`**: Authenticate a user and receive a JWT.
  - Body: `{ "username": "admin", "password": "admin123" }`
- **GET `/api/auth/me`**: Get the current authenticated user's profile.

### Leads
- **GET `/api/leads`**: Fetch all leads.
- **POST `/api/leads/convert`**: Convert a lead to a customer. (Requires `admin` or `staff` role)
  - Body: `{ "leadId": "L1" }`

### Customers
- **GET `/api/customers`**: Fetch all customers.

### Auctions
- **GET `/api/auctions`**: Fetch all auctions.
- **POST `/api/auctions/:id/schedule`**: Schedule an auction. (Requires `admin` or `staff` role)
  - Body: `{ "date": "2024-04-01T10:00:00Z" }`
- **POST `/api/auctions/:id/start`**: Start an auction. (Requires `admin` or `staff` role)
- **POST `/api/auctions/:id/complete`**: Finalize an auction with a winner. (Requires `admin` role)
  - Body: `{ "winnerId": "L1", "finalPrice": 55000 }`

### Projects
- **GET `/api/projects`**: Fetch all projects.
- **POST `/api/projects/:id/costs`**: Update project cost realization. (Requires `admin` role)
  - Body: `{ "planned": 50000, "actual": 45000 }`

### Activities
- **GET `/api/activities`**: Fetch all global activities.

## Role-Based Access Control (RBAC)

The application enforces three user roles:
1. **admin**: Full access to all features and data.
2. **staff**: Can manage leads, customers, and schedule/start auctions. Cannot finalize auctions or update project costs.
3. **viewer**: Read-only access to all data.

Initial demo accounts are seeded automatically:
- `admin` / `admin123`
- `staff` / `staff123`
- `viewer` / `viewer123`

## Project Structure

- `server.ts`: The main entry point for the Express server and Vite middleware integration.
- `db.ts`: Database connection and schema initialization logic.
- `src/stores/app.ts`: The Pinia store that communicates with the API.
- `package.json`: Contains scripts and dependencies for both frontend and backend.
- `DATABASE_SETUP.md`: Detailed instructions for setting up the PostgreSQL database.
