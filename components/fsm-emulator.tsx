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