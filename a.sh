#!/bin/bash
# setup-fsm.sh — создаёт ВЕСЬ проект с БД, API, UI, без mock

echo "Создаём проект fsm-real-db..."

mkdir -p fsm-real-db/{api,db,lib,components,app,.next}
cd fsm-real-db

# 1. package.json
cat > package.json << 'EOF'
{
  "name": "fsm-real-db",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"node api/v0-proxy.js\" \"next dev\"",
    "api": "node api/v0-proxy.js",
    "ui": "next dev"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "cors": "^2.8.5",
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5"
  }
}
EOF

# 2. api/v0-proxy.js
mkdir -p api
cat > api/v0-proxy.js << 'EOF'
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
EOF

# 3. db/init.sql
mkdir -p db
cat > db/init.sql << 'EOF'
CREATE TABLE IF NOT EXISTS fsm_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE,
  label VARCHAR(100)
);

INSERT IGNORE INTO fsm_roles (name, label) VALUES
('client', 'Клиент'), ('operator', 'Оператор'), ('courier', 'Курьер');

CREATE TABLE IF NOT EXISTS fsm_action_role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_name VARCHAR(100),
  role_name VARCHAR(50),
  required_state VARCHAR(50),
  extra_condition JSON
);

INSERT IGNORE INTO fsm_action_role_permissions (action_name, role_name, required_state) VALUES
('create_order', 'client', NULL),
('assign_courier', 'operator', 'created'),
('put_in_cell', 'courier', 'assigned');

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'created',
  extra_data JSON
);

INSERT IGNORE INTO orders (id, status) VALUES (1, 'created');
EOF

# 4. lib/api.ts
mkdir -p lib
cat > lib/api.ts << 'EOF'
const API_BASE = "http://localhost:3000/api";

export const api = {
  getAvailableActions: async (entity_type: string, entity_id: number, role: string) => {
    const res = await fetch(`${API_BASE}/ui-actions?entity_type=${entity_type}&entity_id=${entity_id}&role=${role}`);
    return res.json();
  },
  performAction: async (data: any) => {
    const res = await fetch(`${API_BASE}/fsm/perform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
EOF

# 5. components/FSMEmulator.tsx
mkdir -p components
cat > components/FSMEmulator.tsx << 'EOF'
"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export default function FSMEmulator() {
  const [role, setRole] = useState("client");
  const [actions, setActions] = useState<any[]>([]);
  const entityId = 1;

  const load = async () => {
    const data = await api.getAvailableActions("order", entityId, role);
    setActions(data);
  };

  useEffect(() => { load(); }, [role]);

  const run = async (name: string) => {
    await api.performAction({ entity_type: "order", entity_id: entityId, action_name: name, user_id: 100 });
    load();
  };

  return (
    <div className="p-4 space-y-4">
      <select value={role} onChange={e => setRole(e.target.value)} className="p-2 border rounded">
        <option value="client">Клиент</option>
        <option value="operator">Оператор</option>
        <option value="courier">Курьер</option>
      </select>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Действие</TableHead>
            <TableHead className="text-right">Выполнить</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.length === 0 ? (
            <TableRow><TableCell colSpan={2} className="text-center text-gray-500">Нет действий</TableCell></TableRow>
          ) : (
            actions.map(a => (
              <TableRow key={a.action_name}>
                <TableCell><Badge variant="outline">{a.action_label}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => run(a.action_name)}>Выполнить</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
EOF

# 6. app/page.tsx
mkdir -p app
cat > app/page.tsx << 'EOF'
import FSMEmulator from "@/components/FSMEmulator";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">FSM Тестер с БД</h1>
      <div className="max-w-4xl mx-auto">
        <FSMEmulator />
      </div>
    </div>
  );
}
EOF

# 7. next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
EOF

# 8. tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

echo "Проект создан! Запуск:"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "Открой: http://localhost:3001"
echo "API:    http://localhost:3000/api/ui-actions?entity_type=order&entity_id=1&role=client"