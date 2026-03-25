import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL, -- 'admin', 'staff', 'viewer'
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Leads Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        address TEXT,
        status TEXT DEFAULT 'new',
        value NUMERIC DEFAULT 0,
        source TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Customers Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        address TEXT,
        lead_id TEXT REFERENCES leads(id),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Auctions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS auctions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        winner_id TEXT REFERENCES customers(id),
        final_price NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Auction Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS auction_items (
        id TEXT PRIMARY KEY,
        auction_id TEXT REFERENCES auctions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        starting_price NUMERIC NOT NULL
      )
    `);

    // Auction Participants Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS auction_participants (
        id SERIAL PRIMARY KEY,
        auction_id TEXT REFERENCES auctions(id) ON DELETE CASCADE,
        participant_id TEXT NOT NULL,
        participant_type TEXT NOT NULL, -- 'lead' or 'customer'
        name TEXT NOT NULL
      )
    `);

    // Auction Schedule Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS auction_schedule (
        id TEXT PRIMARY KEY,
        auction_id TEXT REFERENCES auctions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT DEFAULT 'pending'
      )
    `);

    // Auction Cost Planning Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS auction_cost_planning (
        id TEXT PRIMARY KEY,
        auction_id TEXT REFERENCES auctions(id) ON DELETE CASCADE,
        item TEXT NOT NULL,
        estimated_cost NUMERIC NOT NULL,
        actual_cost NUMERIC DEFAULT 0,
        status TEXT DEFAULT 'planned'
      )
    `);

    // Projects Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        customer_id TEXT REFERENCES customers(id),
        auction_id TEXT REFERENCES auctions(id),
        status TEXT DEFAULT 'planned',
        planned_cost NUMERIC DEFAULT 0,
        actual_cost NUMERIC DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Project Tasks Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        begin_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        pic TEXT
      )
    `);

    // Activities Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'lead', 'customer', 'auction', 'project', 'sales_order'
        sub_type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        lead_id TEXT,
        customer_id TEXT,
        auction_id TEXT,
        project_id TEXT,
        sales_order_id TEXT
      )
    `);

    // Sales Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT REFERENCES customers(id),
        project_id TEXT REFERENCES projects(id),
        order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'draft',
        total_amount NUMERIC DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sales Order Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_order_items (
        id TEXT PRIMARY KEY,
        sales_order_id TEXT REFERENCES sales_orders(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price NUMERIC NOT NULL DEFAULT 0,
        total_price NUMERIC NOT NULL DEFAULT 0
      )
    `);

    // Documents Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        url TEXT NOT NULL,
        entity_type TEXT NOT NULL, -- 'lead', 'customer', 'auction', 'project', 'sales_order'
        entity_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query('COMMIT');
    console.log('Database initialized successfully');

    // Seed initial users if table is empty
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCount.rows[0].count) === 0) {
      console.log('Seeding initial users...');
      const adminPass = await bcrypt.hash('admin123', 10);
      const staffPass = await bcrypt.hash('staff123', 10);
      const viewerPass = await bcrypt.hash('viewer123', 10);

      await client.query(
        'INSERT INTO users (id, username, password, role, name) VALUES ($1, $2, $3, $4, $5)',
        ['U1', 'admin', adminPass, 'admin', 'System Administrator']
      );
      await client.query(
        'INSERT INTO users (id, username, password, role, name) VALUES ($1, $2, $3, $4, $5)',
        ['U2', 'staff', staffPass, 'staff', 'Sales Staff']
      );
      await client.query(
        'INSERT INTO users (id, username, password, role, name) VALUES ($1, $2, $3, $4, $5)',
        ['U3', 'viewer', viewerPass, 'viewer', 'Guest Viewer']
      );
    }

    // Seed initial data if tables are empty
    const leadsCount = await client.query('SELECT COUNT(*) FROM leads');
    if (parseInt(leadsCount.rows[0].count) === 0) {
      console.log('Seeding initial data...');
      await client.query('BEGIN');
      
      const initialLeads = [
        ['L1', 'Alice Johnson', 'alice@example.com', '+1 (555) 123-4567', 'TechCorp', '123 Tech Lane, Silicon Valley, CA', 'new', 5000, 'Website Form', 'Interested in industrial excavators for a new construction project.'],
        ['L2', 'Bob Smith', 'bob@example.com', '+1 (555) 987-6543', 'BuildIt', '456 Construction Way, Austin, TX', 'qualified', 12000, 'Referral', 'Previous customer at another firm. Looking for fleet upgrades.']
      ];

      for (const lead of initialLeads) {
        await client.query(
          'INSERT INTO leads (id, name, email, phone, company, address, status, value, source, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          lead
        );
      }

      const initialCustomers = [
        ['C1', 'Charlie Brown', 'charlie@peanuts.com', '+1 (555) 555-0100', 'Peanuts Inc', '789 Comic Strip Blvd, Minneapolis, MN', 'Long-term partner. Prefers email communication.']
      ];

      for (const customer of initialCustomers) {
        await client.query(
          'INSERT INTO customers (id, name, email, phone, company, address, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          customer
        );
      }

      const initialAuctions = [
        ['A1', 'Spring Equipment Auction', 'active']
      ];

      for (const auction of initialAuctions) {
        await client.query(
          'INSERT INTO auctions (id, title, status) VALUES ($1, $2, $3)',
          auction
        );
      }

      await client.query(
        "INSERT INTO auction_items (id, auction_id, name, description, starting_price) VALUES ('I1', 'A1', 'Excavator X200', 'Heavy duty excavator', 50000)"
      );

      await client.query(
        "INSERT INTO auction_participants (auction_id, participant_id, participant_type, name) VALUES ('A1', 'L2', 'lead', 'Bob Smith'), ('A1', 'C1', 'customer', 'Charlie Brown')"
      );

      const schedule = [
        ['P1', 'A1', 'Registration', '2024-03-15T08:00:00Z', '2024-03-17T17:00:00Z', 'completed'],
        ['P2', 'A1', 'Submit Document', '2024-03-18T08:00:00Z', '2024-03-20T17:00:00Z', 'completed'],
        ['P3', 'A1', 'Submit Offering', '2024-03-21T08:00:00Z', '2024-03-22T17:00:00Z', 'ongoing'],
        ['P4', 'A1', 'Auction Event', '2024-03-23T09:00:00Z', '2024-03-23T15:00:00Z', 'pending']
      ];

      for (const s of schedule) {
        await client.query(
          'INSERT INTO auction_schedule (id, auction_id, name, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6)',
          s
        );
      }

      const costPlanning = [
        ['CP1', 'A1', 'Venue Rental', 2000, 1800, 'paid'],
        ['CP2', 'A1', 'Marketing & Ads', 5000, 4500, 'paid'],
        ['CP3', 'A1', 'Auctioneer Fee', 3000, 0, 'planned'],
        ['CP4', 'A1', 'Logistics & Setup', 1500, 0, 'planned']
      ];

      for (const cp of costPlanning) {
        await client.query(
          'INSERT INTO auction_cost_planning (id, auction_id, item, estimated_cost, actual_cost, status) VALUES ($1, $2, $3, $4, $5, $6)',
          cp
        );
      }

      await client.query(
        "INSERT INTO projects (id, title, customer_id, auction_id, status, planned_cost, actual_cost) VALUES ('P1', 'Project: Spring Equipment Auction', 'C1', 'A1', 'ongoing', 50000, 15000)"
      );

      const tasks = [
        ['T1', 'P1', 'Initial Consultation', true, '2024-03-16T10:00:00Z', '2024-03-16T12:00:00Z', 'Alice Johnson'],
        ['T2', 'P1', 'Delivery Planning', true, '2024-03-17T09:00:00Z', '2024-03-17T11:00:00Z', 'Bob Smith'],
        ['T3', 'P1', 'Equipment Inspection', false, '2024-03-18T10:00:00Z', '2024-03-18T15:00:00Z', 'Charlie Brown'],
        ['T4', 'P1', 'Final Handover', false, '2024-03-20T09:00:00Z', '2024-03-20T12:00:00Z', 'Alice Johnson']
      ];

      for (const t of tasks) {
        await client.query(
          'INSERT INTO project_tasks (id, project_id, title, completed, begin_date, end_date, pic) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          t
        );
      }

      const activities = [
        ['ACT1', 'lead', 'creation', 'Lead Alice Johnson created', '2024-03-10T10:00:00Z', 'L1', null, null, null],
        ['ACT2', 'lead', 'status_change', 'Lead Bob Smith status changed to Qualified', '2024-03-12T15:00:00Z', 'L2', null, null, null],
        ['ACT3', 'project', 'creation', 'Project created for Spring Equipment Auction', '2024-03-16T10:00:00Z', null, 'C1', 'A1', 'P1'],
        ['ACT4', 'project', 'task_update', 'Task "Initial Consultation" completed', '2024-03-17T09:00:00Z', null, null, null, 'P1'],
        ['ACT5', 'project', 'task_update', 'Task "Delivery Planning" completed', '2024-03-18T14:00:00Z', null, null, null, 'P1']
      ];

      for (const act of activities) {
        await client.query(
          'INSERT INTO activities (id, type, sub_type, content, timestamp, lead_id, customer_id, auction_id, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          act
        );
      }

      await client.query('COMMIT');
      console.log('Seeding completed successfully');
    }
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', e);
    throw e;
  } finally {
    client.release();
  }
};
