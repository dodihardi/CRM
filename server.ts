import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and Images are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use('/uploads', express.static(uploadsDir));

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

      const permissionsResult = await db.query('SELECT menu_key FROM menu_permissions WHERE role = $1', [user.role]);
      const permissions = permissionsResult.rows.map(r => r.menu_key);

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          permissions
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const permissionsResult = await db.query('SELECT menu_key FROM menu_permissions WHERE role = $1', [req.user.role]);
      const permissions = permissionsResult.rows.map(r => r.menu_key);
      res.json({ ...req.user, permissions });
    } catch (err) {
      res.json(req.user);
    }
  });

  app.get('/api/menu-permissions', authenticateToken, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM menu_permissions');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch menu permissions' });
    }
  });

  app.post('/api/menu-permissions', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { role, menuKeys } = req.body;
    try {
      await db.query('BEGIN');
      await db.query('DELETE FROM menu_permissions WHERE role = $1', [role]);
      for (const menuKey of menuKeys) {
        await db.query('INSERT INTO menu_permissions (role, menu_key) VALUES ($1, $2)', [role, menuKey]);
      }
      await db.query('COMMIT');
      res.json({ message: 'Permissions updated successfully' });
    } catch (err) {
      await db.query('ROLLBACK');
      res.status(500).json({ error: 'Failed to update menu permissions' });
    }
  });

  app.get('/api/roles', authenticateToken, async (req, res) => {
    try {
      const result = await db.query('SELECT id, name FROM roles ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  });

  app.post('/api/roles', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name is required' });
    
    try {
      await db.query('INSERT INTO roles (name) VALUES ($1)', [name.toLowerCase()]);
      res.json({ message: 'Role added successfully' });
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Role name already exists' });
      }
      res.status(500).json({ error: 'Failed to add role' });
    }
  });

  app.put('/api/roles/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name is required' });

    try {
      await db.query('BEGIN');
      
      const oldRoleResult = await db.query('SELECT name FROM roles WHERE id = $1', [id]);
      if (oldRoleResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Role not found' });
      }
      const oldName = oldRoleResult.rows[0].name;
      const newName = name.toLowerCase();

      if (oldName === 'admin') {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot rename admin role' });
      }

      await db.query('UPDATE roles SET name = $1 WHERE id = $2', [newName, id]);
      await db.query('UPDATE users SET role = $1 WHERE role = $2', [newName, oldName]);
      await db.query('UPDATE menu_permissions SET role = $1 WHERE role = $2', [newName, oldName]);

      await db.query('COMMIT');
      res.json({ message: 'Role updated successfully' });
    } catch (err: any) {
      await db.query('ROLLBACK');
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Role name already exists' });
      }
      res.status(500).json({ error: 'Failed to update role' });
    }
  });

  app.delete('/api/roles/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('BEGIN');
      
      const roleResult = await db.query('SELECT name FROM roles WHERE id = $1', [id]);
      if (roleResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Role not found' });
      }
      const roleName = roleResult.rows[0].name;

      if (roleName === 'admin') {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot delete admin role' });
      }

      const usersResult = await db.query('SELECT COUNT(*) FROM users WHERE role = $1', [roleName]);
      if (parseInt(usersResult.rows[0].count) > 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot delete role that is assigned to users' });
      }

      await db.query('DELETE FROM menu_permissions WHERE role = $1', [roleName]);
      await db.query('DELETE FROM roles WHERE id = $1', [id]);

      await db.query('COMMIT');
      res.json({ message: 'Role deleted successfully' });
    } catch (err) {
      await db.query('ROLLBACK');
      res.status(500).json({ error: 'Failed to delete role' });
    }
  });

  app.get('/api/available-menus', authenticateToken, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM available_menus ORDER BY label ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch available menus' });
    }
  });

  app.post('/api/available-menus', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { menu_key, label } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO available_menus (menu_key, label) VALUES ($1, $2) RETURNING *',
        [menu_key, label]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add available menu' });
    }
  });

  app.delete('/api/available-menus/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('BEGIN');
      const menuResult = await db.query('SELECT menu_key FROM available_menus WHERE id = $1', [id]);
      if (menuResult.rows.length > 0) {
        const menuKey = menuResult.rows[0].menu_key;
        await db.query('DELETE FROM menu_permissions WHERE menu_key = $1', [menuKey]);
        await db.query('DELETE FROM available_menus WHERE id = $1', [id]);
      }
      await db.query('COMMIT');
      res.json({ message: 'Menu deleted successfully' });
    } catch (err) {
      await db.query('ROLLBACK');
      res.status(500).json({ error: 'Failed to delete available menu' });
    }
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

  const toNull = (val: any) => {
    if (val === undefined || val === null || val === '' || val === 'null' || val === 'undefined') {
      return null;
    }
    return val;
  };

  const mapActivity = (row: any) => ({
    id: row.id,
    type: row.type,
    sub_type: row.sub_type,
    content: row.content,
    timestamp: row.timestamp,
    lead_id: row.lead_id,
    customer_id: row.customer_id,
    auction_id: row.auction_id,
    project_id: row.project_id,
    sales_order_id: row.sales_order_id
  });

  const mapSalesOrder = (row: any) => ({
    id: row.id,
    customerId: row.customer_id,
    projectId: row.project_id,
    orderDate: row.order_date,
    status: row.status,
    totalAmount: Number(row.total_amount),
    notes: row.notes,
    approverId: row.approver_id,
    approvalStatus: row.approval_status,
    approvedAt: row.approved_at,
    createdAt: row.created_at
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

  app.get('/api/sales-orders', authenticateToken, async (req, res) => {
    const { customerId, projectId } = req.query;
    try {
      console.log('Fetching sales orders with filters:', { customerId, projectId });
      let query = 'SELECT * FROM sales_orders';
      const params = [];

      const cid = toNull(customerId);
      const pid = toNull(projectId);

      if (cid || pid) {
        query += ' WHERE ';
        if (cid) {
          params.push(cid);
          query += `customer_id = $${params.length}`;
        }
        if (pid) {
          if (cid) query += ' AND ';
          params.push(pid);
          query += `project_id = $${params.length}`;
        }
      }

      query += ' ORDER BY created_at DESC';
      const result = await db.query(query, params);
      const salesOrders = [];

      for (const row of result.rows) {
        try {
          const itemsResult = await db.query('SELECT * FROM sales_order_items WHERE sales_order_id = $1', [row.id]);
          salesOrders.push({
            ...mapSalesOrder(row),
            items: itemsResult.rows.map(i => ({
              id: i.id,
              description: i.description,
              quantity: i.quantity,
              unitPrice: Number(i.unit_price || 0),
              totalPrice: Number(i.total_price || 0)
            }))
          });
        } catch (itemErr) {
          console.error(`Failed to fetch items for sales order ${row.id}:`, itemErr);
          // Still push the order but without items or with empty items
          salesOrders.push({ ...mapSalesOrder(row), items: [] });
        }
      }
      res.json(salesOrders);
    } catch (err) {
      console.error('Failed to fetch sales orders:', err);
      res.status(500).json({ error: 'Failed to fetch sales orders', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/sales-orders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('SELECT * FROM sales_orders WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Sales order not found' });
      }
      const itemsResult = await db.query('SELECT * FROM sales_order_items WHERE sales_order_id = $1', [id]);
      res.json({
        ...mapSalesOrder(result.rows[0]),
        items: itemsResult.rows.map(i => ({
          id: i.id,
          description: i.description,
          quantity: i.quantity,
          unitPrice: Number(i.unit_price),
          totalPrice: Number(i.total_price)
        }))
      });
    } catch (err) {
      console.error('Failed to fetch sales order:', err);
      res.status(500).json({ error: 'Failed to fetch sales order', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/sales-orders', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { customerId, projectId, orderDate, status, totalAmount, notes, items, approverId } = req.body;
    try {
      const id = 'SO' + Date.now();
      await db.query('BEGIN');
      
      const result = await db.query(
        'INSERT INTO sales_orders (id, customer_id, project_id, order_date, status, total_amount, notes, approver_id, approval_status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [
          id, 
          toNull(customerId), 
          toNull(projectId), 
          orderDate || new Date().toISOString(), 
          status || 'draft', 
          totalAmount || 0, 
          notes || '', 
          toNull(approverId),
          'pending',
          new Date().toISOString()
        ]
      );

      if (items && Array.isArray(items)) {
        for (const item of items) {
          const itemId = 'SOI' + Date.now() + Math.random().toString(36).substr(2, 5);
          await db.query(
            'INSERT INTO sales_order_items (id, sales_order_id, description, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              itemId, 
              id, 
              item.description || '', 
              item.quantity || 1, 
              item.unitPrice || 0, 
              item.totalPrice || 0
            ]
          );
        }
      }

      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, customer_id, project_id, sales_order_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          activityId, 
          'sales_order', 
          'creation', 
          `Sales Order ${id} created`, 
          new Date().toISOString(), 
          toNull(customerId), 
          toNull(projectId),
          id
        ]
      );

      await db.query('COMMIT');
      res.status(201).json({ ...mapSalesOrder(result.rows[0]), items: items || [] });
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('Failed to create sales order:', err);
      res.status(500).json({ error: 'Failed to create sales order', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.put('/api/sales-orders/:id', authenticateToken, checkRole(['admin', 'staff']), async (req, res) => {
    const { id } = req.params;
    const { customerId, projectId, orderDate, status, totalAmount, notes, items, approverId, approvalStatus } = req.body;
    try {
      await db.query('BEGIN');
      
      const result = await db.query(
        'UPDATE sales_orders SET customer_id = $1, project_id = $2, order_date = $3, status = $4, total_amount = $5, notes = $6, approver_id = $7, approval_status = $8 WHERE id = $9 RETURNING *',
        [
          toNull(customerId), 
          toNull(projectId), 
          orderDate || new Date().toISOString(), 
          status || 'draft', 
          totalAmount || 0, 
          notes || '', 
          toNull(approverId),
          approvalStatus || 'pending',
          id
        ]
      );

      if (result.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Sales order not found' });
      }

      // Simple approach: delete existing items and re-insert
      await db.query('DELETE FROM sales_order_items WHERE sales_order_id = $1', [id]);
      
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const itemId = 'SOI' + Date.now() + Math.random().toString(36).substr(2, 5);
          await db.query(
            'INSERT INTO sales_order_items (id, sales_order_id, description, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              itemId, 
              id, 
              item.description || '', 
              item.quantity || 1, 
              item.unitPrice || 0, 
              item.totalPrice || 0
            ]
          );
        }
      }

      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, customer_id, project_id, sales_order_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          activityId, 
          'sales_order', 
          'update', 
          `Sales Order ${id} updated`, 
          new Date().toISOString(), 
          toNull(customerId), 
          toNull(projectId),
          id
        ]
      );

      await db.query('COMMIT');
      res.json({ ...mapSalesOrder(result.rows[0]), items: items || [] });
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('Failed to update sales order:', err);
      res.status(500).json({ error: 'Failed to update sales order', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/sales-orders/:id/approve', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const userId = (req as any).user.id;

    try {
      await db.query('BEGIN');
      
      const orderResult = await db.query('SELECT * FROM sales_orders WHERE id = $1', [id]);
      if (orderResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Sales order not found' });
      }

      const order = orderResult.rows[0];
      const userRole = (req as any).user.role;

      // Only assigned approver or admin can approve/reject
      if (order.approver_id !== userId && userRole !== 'admin') {
        await db.query('ROLLBACK');
        return res.status(403).json({ error: 'Not authorized to approve this order' });
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const finalStatus = action === 'approve' ? 'completed' : order.status;

      const result = await db.query(
        'UPDATE sales_orders SET approval_status = $1, status = $2, approved_at = $3 WHERE id = $4 RETURNING *',
        [newStatus, finalStatus, action === 'approve' ? new Date().toISOString() : null, id]
      );

      const activityId = 'ACT' + Date.now();
      await db.query(
        'INSERT INTO activities (id, type, sub_type, content, timestamp, customer_id, project_id, sales_order_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          activityId, 
          'sales_order', 
          'approval', 
          `Sales Order ${id} ${newStatus} by ${(req as any).user.name}`, 
          new Date().toISOString(), 
          toNull(order.customer_id), 
          toNull(order.project_id),
          id
        ]
      );

      await db.query('COMMIT');
      res.json(mapSalesOrder(result.rows[0]));
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('Failed to approve sales order:', err);
      res.status(500).json({ error: 'Failed to approve sales order' });
    }
  });

  app.delete('/api/sales-orders/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM sales_orders WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      console.error('Failed to delete sales order:', err);
      res.status(500).json({ error: 'Failed to delete sales order', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/activities', authenticateToken, async (req, res) => {
    const { customerId, projectId, salesOrderId } = req.query;
    try {
      let query = 'SELECT * FROM activities';
      const params = [];

      if (customerId || projectId || salesOrderId) {
        query += ' WHERE ';
        const conditions = [];
        if (customerId) {
          params.push(customerId);
          conditions.push(`customer_id = $${params.length}`);
        }
        if (projectId) {
          params.push(projectId);
          conditions.push(`project_id = $${params.length}`);
        }
        if (salesOrderId) {
          params.push(salesOrderId);
          conditions.push(`sales_order_id = $${params.length}`);
        }
        query += conditions.join(' AND ');
      }

      query += ' ORDER BY timestamp DESC';
      const result = await db.query(query, params);
      res.json(result.rows.map(mapActivity));
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      res.status(500).json({ error: 'Failed to fetch activities', details: err instanceof Error ? err.message : String(err) });
    }
  });

  // Document Routes
  app.post('/api/documents/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
    const { entityType, entityId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!entityType || !entityId) {
      return res.status(400).json({ error: 'Entity type and ID are required' });
    }

    const docId = 'DOC' + uuidv4().slice(0, 8).toUpperCase();
    const url = `/uploads/${file.filename}`;

    try {
      await db.query(
        'INSERT INTO documents (id, name, type, size, url, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [docId, file.originalname, file.mimetype, file.size, url, entityType, entityId]
      );

      res.status(201).json({
        id: docId,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        url,
        entityType,
        entityId,
        createdAt: new Date()
      });
    } catch (err) {
      console.error('Failed to save document metadata:', err);
      res.status(500).json({ error: 'Failed to save document metadata' });
    }
  });

  app.get('/api/documents/:entityType/:entityId', authenticateToken, async (req, res) => {
    const { entityType, entityId } = req.params;
    try {
      const result = await db.query(
        'SELECT * FROM documents WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
        [entityType, entityId]
      );
      res.json(result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        size: row.size,
        url: row.url,
        entityType: row.entity_type,
        entityId: row.entity_id,
        createdAt: row.created_at
      })));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      // First get the file path to delete it from disk
      const result = await db.query('SELECT url FROM documents WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        const url = result.rows[0].url;
        const filename = url.split('/').pop();
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      await db.query('DELETE FROM documents WHERE id = $1', [id]);
      res.json({ message: 'Document deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete document' });
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

  // Employees CRUD
  const mapEmployee = (row: any) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    position: row.position,
    department: row.department,
    departmentId: row.department_id,
    status: row.status,
    joinedAt: row.joined_at,
    managerId: row.manager_id,
    userId: row.user_id,
    createdAt: row.created_at
  });

  const mapDepartment = (row: any) => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    managerId: row.manager_id,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });

  app.get('/api/employees', authenticateToken, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM employees ORDER BY created_at DESC');
      res.json(result.rows.map(mapEmployee));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  });

  app.post('/api/employees', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { name, email, phone, position, department, departmentId, status, joinedAt, managerId, userId } = req.body;
    try {
      const id = 'E' + Date.now();
      const result = await db.query(
        'INSERT INTO employees (id, name, email, phone, position, department, department_id, status, joined_at, manager_id, user_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
        [id, name, email, phone, position, department, departmentId || null, status || 'active', joinedAt || new Date().toISOString().split('T')[0], managerId || null, userId || null, new Date().toISOString()]
      );
      res.status(201).json(mapEmployee(result.rows[0]));
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Failed to create employee' });
    }
  });

  app.put('/api/employees/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, position, department, departmentId, status, joinedAt, managerId, userId } = req.body;
    try {
      const result = await db.query(
        'UPDATE employees SET name = $1, email = $2, phone = $3, position = $4, department = $5, status = $6, joined_at = $7, manager_id = $8, user_id = $9, department_id = $10 WHERE id = $11 RETURNING *',
        [name, email, phone, position, department, status, joinedAt, managerId || null, userId || null, departmentId || null, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
      res.json(mapEmployee(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: 'Failed to update employee' });
    }
  });

  app.delete('/api/employees/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM employees WHERE id = $1', [id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete employee' });
    }
  });

  // Departments API
  app.get('/api/departments', authenticateToken, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM departments ORDER BY name ASC');
      res.json(result.rows.map(mapDepartment));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch departments' });
    }
  });

  app.post('/api/departments', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { name, parentId, managerId, description } = req.body;
    const id = 'DEPT' + uuidv4().substring(0, 8).toUpperCase();
    try {
      const result = await db.query(
        'INSERT INTO departments (id, name, parent_id, manager_id, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, name, parentId || null, managerId || null, description]
      );
      res.status(201).json(mapDepartment(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: 'Failed to create department' });
    }
  });

  app.put('/api/departments/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { name, parentId, managerId, description } = req.body;
    try {
      const result = await db.query(
        'UPDATE departments SET name = $1, parent_id = $2, manager_id = $3, description = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [name, parentId || null, managerId || null, description, req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }
      res.json(mapDepartment(result.rows[0]));
    } catch (err) {
      res.status(500).json({ error: 'Failed to update department' });
    }
  });

  app.delete('/api/departments/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
      // Check if there are sub-departments
      const subDepts = await db.query('SELECT id FROM departments WHERE parent_id = $1', [req.params.id]);
      if (subDepts.rows.length > 0) {
        return res.status(400).json({ error: 'Cannot delete department with sub-departments' });
      }
      // Check if there are employees
      const employees = await db.query('SELECT id FROM employees WHERE department_id = $1', [req.params.id]);
      if (employees.rows.length > 0) {
        return res.status(400).json({ error: 'Cannot delete department with assigned employees' });
      }

      await db.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete department' });
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
