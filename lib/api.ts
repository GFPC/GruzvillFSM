const API_BASE = "http://188.225.44.153:3000/api";
export const api = {
    getAvailableActions: (entity_type: string, entity_id: number, role: string) =>
        fetch(`${API_BASE}/ui-actions?entity_type=${entity_type}&entity_id=${entity_id}&role=${role}`).then(r => r.json()),

    performAction: (data: any) =>
        fetch(`${API_BASE}/fsm/perform`, {method: 'POST', headers: { 'Content-Type': 'application/json' },body: JSON.stringify(data)}).then(r => r.json())
};