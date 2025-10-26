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