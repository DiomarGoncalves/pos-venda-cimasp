-- Usuários do sistema
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- UUID como string
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Atendimentos técnicos
CREATE TABLE IF NOT EXISTS service_records (
  id TEXT PRIMARY KEY, -- UUID como string
  order_number TEXT NOT NULL,
  equipment TEXT NOT NULL,
  chassis_plate TEXT,
  client TEXT NOT NULL,
  manufacturing_date TEXT,
  call_opening_date TEXT NOT NULL,
  technician TEXT NOT NULL,
  assistance_type TEXT NOT NULL, -- 'CORTESIA', 'ASSISTENCIA', 'NÃO PROCEDE'
  assistance_location TEXT,
  contact_person TEXT,
  phone TEXT,
  reported_issue TEXT NOT NULL,
  supplier TEXT,
  part TEXT,
  observations TEXT,
  service_date TEXT,
  responsible_technician TEXT,
  part_labor_cost REAL DEFAULT 0,
  travel_freight_cost REAL DEFAULT 0,
  part_return TEXT,
  supplier_warranty INTEGER DEFAULT 0, -- boolean como 0/1
  technical_solution TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Anexos dos atendimentos
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY, -- UUID como string
  service_record_id TEXT REFERENCES service_records(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mimetype TEXT,
  size INTEGER,
  uploaded_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Histórico de alterações dos atendimentos (opcional)
CREATE TABLE IF NOT EXISTS service_record_history (
  id TEXT PRIMARY KEY, -- UUID como string
  service_record_id TEXT REFERENCES service_records(id) ON DELETE CASCADE,
  changed_by TEXT REFERENCES users(id),
  change_type TEXT, -- 'create', 'update', 'delete'
  change_data TEXT, -- JSON como string
  created_at TEXT DEFAULT (datetime('now'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_service_records_client ON service_records(client);
CREATE INDEX IF NOT EXISTS idx_service_records_technician ON service_records(technician);
CREATE INDEX IF NOT EXISTS idx_attachments_service_record_id ON attachments(service_record_id);