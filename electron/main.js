const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { join } = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Get directory name using ESM pattern
// const __dirname = __dirname || require('path').dirname(require.main.filename);

// Altere o caminho do banco de dados para o compartilhamento de rede
// const dbPath = path.join(__dirname, 'userData', 'database.sqlite');
const dbPath = '\\\\192.168.1.2\\publica\\POS-VENDAS\\sistema\\banco de dados sistema novo\\sistema.db';

// Garante que o diretório existe antes de abrir o banco
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Cria as tabelas se não existirem
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS service_records (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  equipment TEXT NOT NULL,
  chassis_plate TEXT,
  client TEXT NOT NULL,
  manufacturing_date TEXT,
  call_opening_date TEXT NOT NULL,
  technician TEXT NOT NULL,
  assistance_type TEXT NOT NULL,
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
  supplier_warranty INTEGER DEFAULT 0,
  technical_solution TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  service_record_id TEXT REFERENCES service_records(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mimetype TEXT,
  size INTEGER,
  uploaded_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS service_record_history (
  id TEXT PRIMARY KEY,
  service_record_id TEXT REFERENCES service_records(id) ON DELETE CASCADE,
  changed_by TEXT REFERENCES users(id),
  change_type TEXT,
  change_data TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_service_records_client ON service_records(client);
CREATE INDEX IF NOT EXISTS idx_service_records_technician ON service_records(technician);
CREATE INDEX IF NOT EXISTS idx_attachments_service_record_id ON attachments(service_record_id);
`);

// Altere o diretório de anexos para o compartilhamento de rede
const attachmentsDir = '\\\\192.168.1.2\\publica\\POS-VENDAS\\sistema\\anexos';
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

// Global reference to main window
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: join(__dirname, '../src/assets/favicon.ico'), // Adiciona o ícone da empresa
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
    mainWindow.setMenu(null); // Remove o menu do Electron em produção
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // Só abre DevTools em dev
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const configFilePath = path.join(app.getPath('userData'), 'app-config.json');

function readConfigFile() {
  try {
    if (fs.existsSync(configFilePath)) {
      return JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
    }
    return {};
  } catch {
    return {};
  }
}

function writeConfigFile(config) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // IPC handlers para USERS
  ipcMain.handle('getUsers', () => {
    console.log('[IPC] getUsers chamado');
    return db.prepare('SELECT * FROM users').all();
  });

  ipcMain.handle('addUser', (event, user) => {
    console.log('[IPC] addUser chamado:', user);
    const id = uuidv4();
    // Remova o campo name do insert se não existir na tabela
    db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)')
      .run(id, user.username, user.password);
    const allUsers = db.prepare('SELECT * FROM users').all();
    console.log('[IPC] Usuários após insert:', allUsers);
    return { id, ...user };
  });

  // IPC handlers para SERVICE RECORDS
  ipcMain.handle('getServiceRecords', () => {
    return db.prepare('SELECT * FROM service_records').all();
  });

  ipcMain.handle('addServiceRecord', (event, record) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO service_records (
        id, order_number, equipment, chassis_plate, client, manufacturing_date, call_opening_date,
        technician, assistance_type, assistance_location, contact_person, phone, reported_issue,
        supplier, part, observations, service_date, responsible_technician, part_labor_cost,
        travel_freight_cost, part_return, supplier_warranty, technical_solution, created_by
      ) VALUES (
        @id, @order_number, @equipment, @chassis_plate, @client, @manufacturing_date, @call_opening_date,
        @technician, @assistance_type, @assistance_location, @contact_person, @phone, @reported_issue,
        @supplier, @part, @observations, @service_date, @responsible_technician, @part_labor_cost,
        @travel_freight_cost, @part_return, @supplier_warranty, @technical_solution, @created_by
      )
    `).run({ id, ...record });
    return { id, ...record };
  });

  ipcMain.handle('deleteServiceRecord', (event, id) => {
    db.prepare('DELETE FROM service_records WHERE id = ?').run(id);
    return true;
  });

  ipcMain.handle('updateServiceRecord', (event, id, updated) => {
    // Lista de campos válidos na tabela service_records
    const validFields = [
      'order_number', 'equipment', 'chassis_plate', 'client', 'manufacturing_date',
      'call_opening_date', 'technician', 'assistance_type', 'assistance_location',
      'contact_person', 'phone', 'reported_issue', 'supplier', 'part', 'observations',
      'service_date', 'responsible_technician', 'part_labor_cost', 'travel_freight_cost',
      'part_return', 'supplier_warranty', 'technical_solution', 'created_by',
      'created_at', 'updated_at'
    ];
    // Filtra apenas os campos válidos
    const fields = Object.keys(updated).filter(
      k => k !== 'id' && validFields.includes(k)
    );
    if (fields.length === 0) return false;
    const setClause = fields.map(field => `${field} = @${field}`).join(', ');
    const stmt = db.prepare(`UPDATE service_records SET ${setClause} WHERE id = @id`);
    stmt.run({ ...updated, id });
    return true;
  });

  // IPC handlers para ATTACHMENTS
  ipcMain.handle('getAttachments', (event, service_record_id) => {
    return db.prepare('SELECT * FROM attachments WHERE service_record_id = ?').all(service_record_id);
  });

  ipcMain.handle('addAttachment', (event, attachment) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO attachments (
        id, service_record_id, filename, url, mimetype, size, uploaded_by
      ) VALUES (
        @id, @service_record_id, @filename, @url, @mimetype, @size, @uploaded_by
      )
    `).run({ id, ...attachment });
    return { id, ...attachment };
  });

  ipcMain.handle('deleteAttachment', (event, id) => {
    db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
    return true;
  });

  ipcMain.handle('saveAttachmentFile', async (event, { buffer, filename }) => {
    const filePath = join(attachmentsDir, filename); // Corrigido para usar o import ES
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return filePath;
  });

  ipcMain.handle('openAttachmentFile', async (event, filePath) => {
    await shell.openPath(filePath);
    return true;
  });

  ipcMain.handle('getStoreValue', (event, key) => {
    const config = readConfigFile();
    return config[key] || null;
  });

  ipcMain.handle('setStoreValue', (event, key, value) => {
    const config = readConfigFile();
    config[key] = value;
    writeConfigFile(config);
    return true;
  });

  // Adicione outros handlers conforme necessário (update, delete, etc)
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});