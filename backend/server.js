// backend/server.js

// --- 1. Подключаем все необходимые инструменты ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

// --- 2. Настраиваем middleware ---
app.use(cors());
app.use(express.json());

// --- 3. Настраиваем подключение к базе данных ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// --- 4. Эндпоинт для входа (без шифрования) ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Введите username и пароль' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- 5. Остальные ваши эндпоинты (без изменений) ---

app.get('/api/ping', (req, res) => {
  res.send('pong');
});

app.get('/api/buildings/:id/floors', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM floors WHERE building_id = $1 ORDER BY floor_number',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/buildings/:id/points', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM points WHERE building_id = $1 AND is_active = true',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/buildings/:id/edges', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT DISTINCT e.* FROM edges e
       WHERE e.from_point_id IN (SELECT id FROM points WHERE building_id = $1)
          OR e.to_point_id IN (SELECT id FROM points WHERE building_id = $1)`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/buildings/:id/panoramas', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.* FROM panoramas p
       JOIN points pt ON p.point_id = pt.id
       WHERE pt.building_id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/panoramas/by-point/:pointId', async (req, res) => {
  const { pointId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM panoramas WHERE point_id = $1',
      [pointId]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend for PsuRoutes is running. Use /api endpoints.');
});

app.get('/api/buildings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM buildings WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/all-points', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, b.name as building_name, b.id as building_id 
      FROM points p
      JOIN buildings b ON p.building_id = b.id
      WHERE p.is_active = true
      ORDER BY b.name, p.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/points/:id', async (req, res) => {
  const { id } = req.params;
  const { x_coord, y_coord } = req.body;
  try {
    const result = await pool.query(
      'UPDATE points SET x_coord = $1, y_coord = $2 WHERE id = $3 RETURNING *',
      [x_coord, y_coord, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Точка не найдена' });
    }
    res.json({ success: true, point: result.rows[0] });
  } catch (err) {
    console.error('Ошибка обновления точки:', err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

app.get('/api/buildings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buildings ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- 6. Запускаем сервер ---
app.listen(port, () => {
  console.log(`🚀 Сервер готов и работает на http://localhost:${port}`);
});