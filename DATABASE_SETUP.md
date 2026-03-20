# Database Setup Manual

This application uses **PostgreSQL** for persistent data storage. The backend is configured to automatically initialize the database schema and seed initial data upon connection.

## 1. Prerequisites

You will need a PostgreSQL database instance. You can use:
- A local PostgreSQL installation.
- A managed service like **Supabase**, **Neon**, or **Google Cloud SQL**.
- Any PostgreSQL-compatible database provider.

## 2. Connection String Format

Your database connection string (URL) should follow this format:

```
postgresql://[user]:[password]@[host]:[port]/[database_name]
```

Example:
`postgresql://postgres:mypassword@db.example.com:5432/crm_auction_db`

## 3. Configuration in AI Studio

To connect the application to your database, you must provide the connection string as an environment variable (Secret).

1.  **Open Settings**: Click the **Settings** (⚙️ gear icon) in the top-right corner of the AI Studio interface.
2.  **Navigate to Secrets**: Select the **Secrets** tab.
3.  **Add Secret**:
    - **Name**: `DATABASE_URL`
    - **Value**: Paste your PostgreSQL connection string.
4.  **Save**: Press **Enter** to save the secret.

The application will automatically rebuild and attempt to connect to the database.

## 4. Automatic Initialization

Once connected, the application performs the following actions automatically:
- **Schema Creation**: Creates all necessary tables (`users`, `leads`, `customers`, `auctions`, `projects`, `activities`, etc.) if they do not already exist.
- **Data Seeding**: If the `users` table is empty, it populates it with default accounts (`admin`, `staff`, `viewer`). If the `leads` table is empty, it populates the database with initial sample data so you can test the application immediately.

## 5. Data Model

The database schema includes the following primary tables:

- **`users`**: Stores user credentials and roles (`admin`, `staff`, `viewer`).
- **`leads`**: Potential customers and their initial interest data.
- **`customers`**: Converted leads with detailed contact information.
- **`auctions`**: Auction events, including status and final results.
- **`auction_items`**: Individual items listed within an auction.
- **`auction_participants`**: Leads or customers registered for an auction.
- **`auction_schedule`**: The timeline of phases for each auction.
- **`auction_cost_planning`**: Budget and actual cost tracking for auctions.
- **`projects`**: Post-auction projects created for winners.
- **`project_tasks`**: Specific tasks, deadlines, and PICs for projects.
- **`activities`**: A global audit log of all significant system events.

## 6. Manual Schema Management (Optional)

The schema is defined in `db.ts`. If you need to modify the database structure:
1. Update the `initDb` function in `db.ts` with your new SQL commands.
2. The application will run these commands the next time it starts.

## 6. Troubleshooting

- **Connection Refused**: Ensure your database host allows connections from external IP addresses and that your firewall settings are correct.
- **Invalid URL**: Double-check the format of your `DATABASE_URL`. Ensure special characters in passwords are URL-encoded if necessary.
- **Missing Secret**: If the `DATABASE_URL` is not provided, the application will log a warning and may not function correctly as it relies on the database for all data operations.
