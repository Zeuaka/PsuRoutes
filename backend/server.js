// backend/server.js

// --- 1. Подключаем все необходимые инструменты ---
require('dotenv').config(); // Загружаем настройки из .env файла
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // Импортируем Pool для подключения к БД

const app = express(); // Создаём само приложение
const port = process.env.PORT || 5000; // Порт, на котором будет висеть сервер

// --- 2. Настраиваем middleware (прослойки) ---
app.use(cors()); // Разрешаем запросы с фронтенда
app.use(express.json()); // Учим сервер понимать JSON в запросах

// --- 3. Настраиваем подключение к вашей базе данных ---
// Здесь используются переменные, которые мы пропишем в следующем шаге
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// --- 4. Создаём конечные точки (endpoints) - то самое API ---
// Это функции, которые будут обрабатывать запросы от вашего фронтенда

// Условный "пинг", чтобы проверить, жив ли сервер
app.get('/api/ping', (req, res) => {
  res.send('pong');
});

// Эндпоинт для получения этажей по ID здания
app.get('/api/buildings/:id/floors', async (req, res) => {
  const { id } = req.params; // Забираем ID здания из адреса запроса
  try {
    // Делаем SQL-запрос к базе
    const result = await pool.query(
      'SELECT * FROM floors WHERE building_id = $1 ORDER BY floor_number',
      [id]
    );
    res.json(result.rows); // Отправляем результат обратно на фронтенд
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Эндпоинт для получения точек по ID здания
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

// Эндпоинт для получения связей (рёбер) по ID здания
app.get('/api/buildings/:id/edges', async (req, res) => {
  const { id } = req.params;
  try {
    // Подзапрос для получения всех рёбер, у которых from_point_id входит в список id точек этого здания
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
// Обновление координат точки
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
// --- 5. Запускаем сервер ---
app.listen(port, () => {
  console.log(`🚀 Сервер готов и работает на http://localhost:${port}`);
});
