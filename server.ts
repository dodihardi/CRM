import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Authentication Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

  // Role-based Access Control Middleware
  const checkRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    };
  };

  // Initialize Database
  if (process.env.DATABASE_URL) {
    try {
      await db.initDb();
      console.log('PostgreSQL database connected and initialized');
    } catch (err) {
      console.error('Failed to initialize PostgreSQL database:', err);
    }
  } else {
    console.warn('DATABASE_URL not found. Application may not function correctly without a database.');
  }

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const user = result.rows[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // Helper to map DB rows to frontend format (snake_case to camelCase where needed)
  const mapLead = (row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    address: row.address,
    status: row.status,
    value: Number(row.value),
    source: row.source,
    notes: row.notes,
    createdAt: row.created_at
  });

  const mapCustomer = (row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    address: row.address,
    leadId: row.lead_id,
    notes: row.notes,
    createdAt: row.created_at
  });

  const mapActivity = (row: any) => ({
    id: row.id,
    type: row.type,
    subType: row.sub_type,
    content: row.content,
    timestamp: row.timestamp,
    leadId: row.lead_id,
    customerId: row.customer_id,
    auctionId: row.auction_id,
    projectId: row.project_id
  });

  // API Routes (Protected)
  app.get('/api/leads', authenticateToken, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM leads ORDER BY created_at DESC');
      res.json(result.rows.map(mapLead));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  app.get('/api/customers', authenticateToken, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
      res.json(result.rows.map(mapCustomer));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  });

  app.get('/api/auctions', authenticateToken, async (req, res) => {
    try {
      const auctionsResult = await db.query('SELECT * FROM auctions ORDER BY created_at DESC');
      const auctions = [];

      for (const row of auctionsResult.rows) {
        const itemsResult = await db.query('SELECT * FROM auction_items WHERE auction_id = $1', [row.id]);
        const participantsResult = await db.query('SELECT * FROM auction_participants WHERE auction_id = $1', [row.id]);
        const scheduleResult = await db.query('SELECT * FROM auction_schedule WHERE auction_id = $1 ORDER BY start_date ASC', [row.id]);
        const costResult = await db.query('SELECT * FROM auction_cost_planning WHERE auction_id = $1', [row.id]);

        auctions.push({
          id: row.id,
          title: row.title,
          status: row.status,
          winnerId: row.winner_id,
          finalPrice: row.final_price ? Number(row.final_price) : null,
          createdAt: row.created_at,
          items: itemsResult.rows.map(i => ({
            id: i.id,
            name: i.name,
            description: i.description,
            startingPrice: Number(i.starting_price)
          })),
          participants: participantsResult.rows.map(p => ({
            id: p.participant_id,
            type: p.participant_type,
            name: p.name
          })),
          schedule: scheduleResult.rows.map(s => ({
            id: s.id,
            name: s.name,
            startDate: s.start_date,
            endDate: s.end_date,
            status: s.status
          })),
          costPlanning: costResult.rows.map(c => ({
            id: c.id,
            item: c.item,
            estimatedCost: Number(c.estimated_cost),
            actualCost: Number(c.actual_cost),
            status: c.status
          }))
        });
      }
      res.json(auctions);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch auctions' });
    }
  });

  app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
      const projectsResult = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
      const projects = [];

      for (const row of projectsResult.rows) {
        const tasksResult = await db.query('SELECT * FROM project_tasks WHERE project_id = $1 ORDER BY begin_date ASC', [row.id]);
        projects.push({
          id: row.id,
          title: row.title,
          customerId: row.customer_id,
          auctionId: row.auction_id,
          status: row.status,
          plannedCost: Number(row.planned_cost),
          actualCost: Number(row.actual_cost),
          createdAt: row.created_at,
          tasks: tasksResult.rows.map(t => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
            beginDate: t.begin_date,
            endDate: t.end_date,
            pic: t.pic
          }))
        });
      }
      res.json(projects);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.get('/api/activities', authenticateToken, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM activities ORDER BY timestamp DESC');
      res.json(result.rows.map(mapActivity));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  });

  app.post('/api/leads/convert', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { leadId } = req.body;
    try {
      const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
      if (leadResult.rows.length === 0) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      const lead = leadResult.rows[0];
      const customerId = 'C' + Date.now();

      await db.query('BEGIN');
      
      await db.query('UPDATE leads SET status = $1 WHERE id = $2', ['converted', leadId]);
      
      const newCustomer = {
        id: customerId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        address: lead.address,
        lead_id: lead.id,
        notes: lead.notes,
        created_at: new Date().toISOString()
      };

      await db.query(
        'INSERT INTO customers (id, name, email, phone, company, address, lead_id, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newCustomer.id, newCustomer.name, newCustomer.email, newCustomer.phone, newCustomer.company, newCustomer.address, newCustomer.lead_id, newCustomer.notes, newCustomer.created_at]
      );

      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, customer_id, lead_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [activityId, 'customer', 'conversion', `Lead ${lead.name} converted to Customer`, new Date().toISOString(), customerId, leadId]
      );

      await db.query('COMMIT');
      res.json(mapCustomer(newCustomer));
    } catch (err) {
      await db.query('ROLLBACK');
      res.status(500).json({ error: 'Failed to convert lead' });
    }
  });

  app.post('/api/projects/:id/costs', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { planned, actual } = req.body;
    try {
      const result = await db.query(
        'UPDATE projects SET planned_cost = $1, actual_cost = $2 WHERE id = $3 RETURNING *',
        [planned, actual, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const project = result.rows[0];
      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, project_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [activityId, 'project', 'cost_update', `Costs updated for project ${project.title}`, new Date().toISOString(), id]
      );

      res.json({
        id: project.id,
        title: project.title,
        customerId: project.customer_id,
        auctionId: project.auction_id,
        status: project.status,
        plannedCost: Number(project.planned_cost),
        actualCost: Number(project.actual_cost),
        createdAt: project.created_at
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update project costs' });
    }
  });

  app.post('/api/auctions/:id/schedule', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { date } = req.body;
    try {
      const auctionResult = await db.query('SELECT * FROM auctions WHERE id = $1', [id]);
      if (auctionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Auction not found' });
      }
      const auction = auctionResult.rows[0];

      await db.query('BEGIN');
      await db.query('UPDATE auctions SET status = $1 WHERE id = $2', ['scheduled', id]);
      
      const baseDate = new Date(date);
      const phases = [
        { id: 'P1_' + id, name: 'Registration', start: baseDate, end: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000) },
        { id: 'P2_' + id, name: 'Submit Document', start: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000), end: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000) },
        { id: 'P3_' + id, name: 'Submit Offering', start: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000), end: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000) },
        { id: 'P4_' + id, name: 'Auction Event', start: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000), end: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000) }
      ];

      for (const p of phases) {
        await db.query(
          'INSERT INTO auction_schedule (id, auction_id, name, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.id, id, p.name, p.start.toISOString(), p.end.toISOString(), 'pending']
        );
      }

      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, auction_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [activityId, 'auction', 'scheduled', `Auction ${auction.title} scheduled starting ${new Date(date).toLocaleString()}`, new Date().toISOString(), id]
      );

      await db.query('COMMIT');
      res.json({ id, status: 'scheduled' });
    } catch (err) {
      await db.query('ROLLBACK');
      res.status(500).json({ error: 'Failed to schedule auction' });
    }
  });

  app.post('/api/auctions/:id/start', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    try {
      const auctionResult = await db.query('SELECT * FROM auctions WHERE id = $1', [id]);
      if (auctionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Auction not found' });
      }
      const auction = auctionResult.rows[0];

      await db.query('BEGIN');
      await db.query('UPDATE auctions SET status = $1 WHERE id = $2', ['active', id]);
      await db.query('UPDATE auction_schedule SET status = $1 WHERE auction_id = $2 AND name = $3', ['ongoing', id, 'Registration']);

      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, auction_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [activityId, 'auction', 'started', `Auction ${auction.title} has started`, new Date().toISOString(), id]
      );

      await db.query('COMMIT');
      res.json({ id, status: 'active' });
    } catch (err) {
      await db.query('ROLLBACK');
      res.status(500).json({ error: 'Failed to start auction' });
    }
  });

  app.post('/api/auctions/:id/complete', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { winnerId, finalPrice } = req.body;
    try {
      const auctionResult = await db.query('SELECT * FROM auctions WHERE id = $1', [id]);
      if (auctionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Auction not found' });
      }
      const auction = auctionResult.rows[0];

      await db.query('BEGIN');
      
      // Handle potential lead conversion if winner is a lead
      let finalCustomerId = winnerId;
      const participantResult = await db.query('SELECT * FROM auction_participants WHERE auction_id = $1 AND participant_id = $2', [id, winnerId]);
      if (participantResult.rows.length > 0 && participantResult.rows[0].participant_type === 'lead') {
        const leadId = winnerId;
        const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        if (leadResult.rows.length > 0) {
          const lead = leadResult.rows[0];
          finalCustomerId = 'C' + Date.now();
          await db.query('UPDATE leads SET status = $1 WHERE id = $2', ['converted', leadId]);
          await db.query(
            'INSERT INTO customers (id, name, email, phone, company, address, lead_id, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [finalCustomerId, lead.name, lead.email, lead.phone, lead.company, lead.address, lead.id, lead.notes, new Date().toISOString()]
          );
        }
      }

      await db.query('UPDATE auctions SET status = $1, winner_id = $2, final_price = $3 WHERE id = $4', ['completed', finalCustomerId, finalPrice, id]);

      const projectId = 'P' + Date.now();
      await db.query(
        'INSERT INTO projects (id, title, customer_id, auction_id, status, planned_cost, actual_cost, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [projectId, `Project: ${auction.title}`, finalCustomerId, id, 'planned', finalPrice, 0, new Date().toISOString()]
      );

      const tasks = [
        { id: 'T1_' + projectId, title: 'Initial Consultation', start: new Date(), end: new Date(Date.now() + 86400000) },
        { id: 'T2_' + projectId, title: 'Delivery Planning', start: new Date(Date.now() + 86400000), end: new Date(Date.now() + 172800000) }
      ];

      for (const t of tasks) {
        await db.query(
          'INSERT INTO project_tasks (id, project_id, title, completed, begin_date, end_date, pic) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [t.id, projectId, t.title, false, t.start.toISOString(), t.end.toISOString(), 'Unassigned']
        );
      }

      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, project_id, auction_id, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [activityId, 'project', 'creation', `Project created for ${auction.title}`, new Date().toISOString(), projectId, id, finalCustomerId]
      );

      await db.query('COMMIT');
      res.json({ id, status: 'completed', projectId });
    } catch (err) {
      await db.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'Failed to complete auction' });
    }
  });

  // Leads CRUD
  app.post('/api/leads', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { name, email, phone, company, address, status, value, source, notes } = req.body;
    try {
      const id = 'L' + Date.now();
      const result = await db.query(
        'INSERT INTO leads (id, name, email, phone, company, address, status, value, source, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [id, name, email, phone, company, address, status || 'new', value || 0, source, notes, new Date().toISOString()]
      );
      
      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, lead_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [activityId, 'lead', 'creation', `Lead ${name} created`, new Date().toISOString(), id]
      );

      res.status(201).json(mapLead(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: 'Failed to create lead' });
    }
  });

  app.put('/api/leads/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, company, address, status, value, source, notes } = req.body;
    try {
      const result = await db.query(
        'UPDATE leads SET name = $1, email = $2, phone = $3, company = $4, address = $5, status = $6, value = $7, source = $8, notes = $9 WHERE id = $10 RETURNING *',
        [name, email, phone, company, address, status, value, source, notes, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });
      res.json(mapLead(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: 'Failed to update lead' });
    }
  });

  app.delete('/api/leads/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM leads WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete lead' });
    }
  });

  // Customers CRUD
  app.post('/api/customers', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { name, email, phone, company, address, notes } = req.body;
    try {
      const id = 'C' + Date.now();
      const result = await db.query(
        'INSERT INTO customers (id, name, email, phone, company, address, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [id, name, email, phone, company, address, notes, new Date().toISOString()]
      );
      
      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, customer_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [activityId, 'customer', 'creation', `Customer ${name} created`, new Date().toISOString(), id]
      );

      res.status(201).json(mapCustomer(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: 'Failed to create customer' });
    }
  });

  app.put('/api/customers/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, company, address, notes } = req.body;
    try {
      const result = await db.query(
        'UPDATE customers SET name = $1, email = $2, phone = $3, company = $4, address = $5, notes = $6 WHERE id = $7 RETURNING *',
        [name, email, phone, company, address, notes, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
      res.json(mapCustomer(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: 'Failed to update customer' });
    }
  });

  app.delete('/api/customers/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM customers WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  });

  // Auctions CRUD
  app.post('/api/auctions', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { title, status, items } = req.body;
    try {
      const id = 'A' + Date.now();
      await db.query('BEGIN');
      
      const result = await db.query(
        'INSERT INTO auctions (id, title, status, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, title, status || 'draft', new Date().toISOString()]
      );

      if (items && Array.isArray(items)) {
        for (const item of items) {
          const itemId = 'I' + Date.now() + Math.random().toString(36).substr(2, 5);
          await db.query(
            'INSERT INTO auction_items (id, auction_id, name, description, starting_price) VALUES ($1, $2, $3, $4, $5)',
            [itemId, id, item.name, item.description, item.startingPrice]
          );
        }
      }

      await db.query('COMMIT');
      res.status(201).json({ id, title, status: status || 'draft', items: items || [] });
    } catch (err) {
      await db.query('ROLLBACK');
      res.status(500).json({ error: 'Failed to create auction' });
    }
  });

  app.put('/api/auctions/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { title, status } = req.body;
    try {
      const result = await db.query(
        'UPDATE auctions SET title = $1, status = $2 WHERE id = $3 RETURNING *',
        [title, status, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Auction not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update auction' });
    }
  });

  app.delete('/api/auctions/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM auctions WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete auction' });
    }
  });

  // Auction Items
  app.post('/api/auctions/:id/items', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { name, description, startingPrice } = req.body;
    try {
      const itemId = 'I' + Date.now();
      const result = await db.query(
        'INSERT INTO auction_items (id, auction_id, name, description, starting_price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [itemId, id, name, description, startingPrice]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add auction item' });
    }
  });

  app.delete('/api/auction-items/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM auction_items WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete auction item' });
    }
  });

  // Auction Participants
  app.post('/api/auctions/:id/participants', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { participantId, participantType, name } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO auction_participants (auction_id, participant_id, participant_type, name) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, participantId, participantType, name]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add participant' });
    }
  });

  app.delete('/api/auction-participants/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM auction_participants WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to remove participant' });
    }
  });

  // Auction Schedule
  app.post('/api/auctions/:id/schedule', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate, status } = req.body;
    try {
      const phaseId = 'PH' + Date.now();
      const result = await db.query(
        'INSERT INTO auction_schedule (id, auction_id, name, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [phaseId, id, name, startDate, endDate, status || 'pending']
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add schedule phase' });
    }
  });

  app.put('/api/auction-schedule/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate, status } = req.body;
    try {
      const result = await db.query(
        'UPDATE auction_schedule SET name = $1, start_date = $2, end_date = $3, status = $4 WHERE id = $5 RETURNING *',
        [name, startDate, endDate, status, id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update schedule phase' });
    }
  });

  app.delete('/api/auction-schedule/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM auction_schedule WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete schedule phase' });
    }
  });

  // Auction Cost Planning
  app.post('/api/auctions/:id/cost-planning', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { item, estimatedCost, actualCost, status } = req.body;
    try {
      const cpId = 'CP' + Date.now();
      const result = await db.query(
        'INSERT INTO auction_cost_planning (id, auction_id, item, estimated_cost, actual_cost, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [cpId, id, item, estimatedCost, actualCost || 0, status || 'planned']
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add cost planning item' });
    }
  });

  app.put('/api/auction-cost-planning/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { item, estimatedCost, actualCost, status } = req.body;
    try {
      const result = await db.query(
        'UPDATE auction_cost_planning SET item = $1, estimated_cost = $2, actual_cost = $3, status = $4 WHERE id = $5 RETURNING *',
        [item, estimatedCost, actualCost, status, id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update cost planning item' });
    }
  });

  app.delete('/api/auction-cost-planning/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM auction_cost_planning WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete cost planning item' });
    }
  });

  // Projects CRUD
  app.post('/api/projects', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { title, customerId, auctionId, status, plannedCost, actualCost } = req.body;
    try {
      const id = 'P' + Date.now();
      const result = await db.query(
        'INSERT INTO projects (id, title, customer_id, auction_id, status, planned_cost, actual_cost, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [id, title, customerId, auctionId, status || 'planned', plannedCost || 0, actualCost || 0, new Date().toISOString()]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  app.put('/api/projects/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { title, status, plannedCost, actualCost } = req.body;
    try {
      const result = await db.query(
        'UPDATE projects SET title = $1, status = $2, planned_cost = $3, actual_cost = $4 WHERE id = $5 RETURNING *',
        [title, status, plannedCost, actualCost, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  app.delete('/api/projects/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM projects WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  // Project Tasks
  app.post('/api/projects/:id/tasks', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { title, completed, beginDate, endDate, pic } = req.body;
    try {
      const taskId = 'T' + Date.now();
      const result = await db.query(
        'INSERT INTO project_tasks (id, project_id, title, completed, begin_date, end_date, pic) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [taskId, id, title, completed || false, beginDate, endDate, pic]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add task' });
    }
  });

  app.put('/api/project-tasks/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { title, completed, beginDate, endDate, pic } = req.body;
    try {
      const result = await db.query(
        'UPDATE project_tasks SET title = $1, completed = $2, begin_date = $3, end_date = $4, pic = $5 WHERE id = $6 RETURNING *',
        [title, completed, beginDate, endDate, pic, id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  app.delete('/api/project-tasks/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM project_tasks WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // User Management Routes (Admin Only)
  const mapUser = (row: any) => ({
    id: row.id,
    username: row.username,
    role: row.role,
    name: row.name,
    createdAt: row.created_at
  });

  app.get('/api/users', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
      res.json(result.rows.map(mapUser));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { username, password, role, name } = req.body;
    try {
      const id = 'U' + Date.now();
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (id, username, password, role, name, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, username, hashedPassword, role, name, new Date().toISOString()]
      );
      res.status(201).json({ id, username, role, name });
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.put('/api/users/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { username, password, role, name } = req.body;
    try {
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
          'UPDATE users SET username = $1, password = $2, role = $3, name = $4 WHERE id = $5',
          [username, hashedPassword, role, name, id]
        );
      } else {
        await db.query(
          'UPDATE users SET username = $1, role = $2, name = $3 WHERE id = $4',
          [username, role, name, id]
        );
      }
      res.json({ id, username, role, name });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.delete('/api/users/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      // Prevent deleting self
      if (id === (req as any).user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      await db.query('DELETE FROM users WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
