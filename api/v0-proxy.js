const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const db = mysql.createPool({
    host: '89.223.68.250',
    user: 'fsm_parcel',
    password: 'kQhbb!h.pSXC4LQJ',
    database: 'fsm_parcel'
});

async function initDB() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../db/init.sql'), 'utf8');
        const queries = sql.split(';').filter(q => q.trim());
        for (const q of queries) await db.query(q);
        console.log('БД инициализирована');
    } catch (e) { console.log('БД уже существует'); }
}

app.get('/api/ui-actions', async (req, res) => {
    const { entity_type, entity_id, role } = req.query;
    const tables = { order: 'orders' };
    const table = tables[entity_type];
    if (!table) return res.status(400).json({ error: 'Invalid type' });

    try {
        const [rows] = await db.query(`
      SELECT a.name AS action_name, a.label AS action_label
      FROM ?? e
      JOIN fsm_action_role_permissions p ON p.role_name = ?
        AND (p.required_state IS NULL OR p.required_state = e.status)
      JOIN fsm_actions a ON a.name = p.action_name
      WHERE e.id = ?
    `, [table, role, entity_id]);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app["post"]('/api/fsm/perform', async (req, res) => {
    const { entity_type, entity_id, action_name, user_id = 100, extra_id = {} } = req.body;
    try {
        const [result] = await db.query(
            `CALL fsm_perform_action(?, ?, ?, ?, ?)`,
            [entity_type, entity_id, action_name, user_id, JSON.stringify(extra_id)]
        );
        res.json({ success: true, result: result[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

(async () => {
    await initDB();
    app.listen(3000, () => {
        console.log('API: http://localhost:3000');
        console.log('UI: http://localhost:3001');
    });
})();