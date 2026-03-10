import dotenv from 'dotenv';
dotenv.config();
import express, { json } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
app.use(cors());
app.use(json());

// PostgreSQL Connection Pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- User Routes ---
app.get('/api/user/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
        rows.length ? res.json(rows[0]) : res.status(404).send('User not found');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM products ORDER BY id');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/purchase', async (req, res) => {
    const { userId, productId } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Lock rows for update to prevent race conditions
        const userRes = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
        const prodRes = await client.query('SELECT price, stock FROM products WHERE id = $1 FOR UPDATE', [productId]);

        if (userRes.rowCount === 0 || prodRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Invalid user or product');
        }

        const user = userRes.rows[0];
        const product = prodRes.rows[0];

        if (product.stock <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Out of stock' });
        }
        
        // Parse strings to floats for accurate numeric comparison
        if (parseFloat(user.balance) < parseFloat(product.price)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const newBalance = parseFloat(user.balance) - parseFloat(product.price);
        const newStock = product.stock - 1;

        await client.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);
        await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, productId]);

        await client.query('COMMIT');
        res.json({ success: true, balance: newBalance, stock: newStock });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- Admin Routes ---
app.post('/api/admin/products', async (req, res) => {
    const { id, name, price, stock } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO products (id, name, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, name, price, stock]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/products/:id/stock', async (req, res) => {
    const { stock } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE products SET stock = $1 WHERE id = $2 RETURNING *',
            [stock, req.params.id]
        );
        rows.length ? res.json(rows[0]) : res.status(404).send('Product not found');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/users/:id/balance', async (req, res) => {
    const { balance } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE users SET balance = $1 WHERE id = $2 RETURNING *',
            [balance, req.params.id]
        );
        rows.length ? res.json(rows[0]) : res.status(404).send('User not found');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Authentication Routes ---
app.post('/api/login', async (req, res) => {
    const { id, password } = req.body;
    try {
        // Note: In a production environment, use bcrypt to compare hashed passwords.
        const { rows } = await pool.query(
            'SELECT id, name, balance, role FROM users WHERE id = $1 AND password = $2', 
            [id, password]
        );
        
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));