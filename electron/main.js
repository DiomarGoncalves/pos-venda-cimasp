const { app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const isDev = !app.isPackaged;
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

function getDatabaseUrl() {
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL;
  const config = readConfigFile();
  if (config.NEON_DATABASE_URL) return config.NEON_DATABASE_URL;
  return 'postgresql://postgres:cimasp%402020@overview-calendars.gl.at.ply.gg:50285/sysposvendas?sslmode=disable';
}

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Conexão com banco de dados estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com banco de dados:', error);
    return false;
  }
}

async function ensureTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        additional_costs TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        service_record_id TEXT REFERENCES service_records(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        mimetype TEXT,
        size INTEGER,
        file_data BYTEA,
        uploaded_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_service_records_client ON service_records(client);
      CREATE INDEX IF NOT EXISTS idx_service_records_technician ON service_records(technician);
      CREATE INDEX IF NOT EXISTS idx_service_records_created_at ON service_records(created_at);
      CREATE INDEX IF NOT EXISTS idx_attachments_service_record_id ON attachments(service_record_id);
    `);
    console.log('✅ Tabelas do banco de dados verificadas/criadas');
  } catch (error) {
    console.error('❌ Erro ao criar/verificar tabelas:', error);
    throw error;
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: join(__dirname, '../src/assets/favicon.ico'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
    mainWindow.setMenu(null);
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function writeConfigFile(config) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
}

app.whenReady().then(async () => {
  console.log('🚀 Aplicação iniciando...');

  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Não foi possível conectar ao banco de dados');
  } else {
    await ensureTables();
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // USERS
  ipcMain.handle('getUsers', async () => {
    try {
      const { rows } = await pool.query('SELECT id, username, created_at FROM users');
      return rows;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  });

  ipcMain.handle('addUser', async (event, user) => {
    try {
      const id = uuidv4();
      console.log('📝 Criando novo usuário:', { username: user.username });

      await pool.query(
        'INSERT INTO users (id, username, password) VALUES ($1, $2, $3)',
        [id, user.username, user.password]
      );

      const createdUser = {
        id,
        username: user.username,
        created_at: new Date().toISOString()
      };

      console.log('✅ Usuário criado com sucesso:', createdUser);
      return createdUser;
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário:', error);
      throw error;
    }
  });

  ipcMain.handle('validateUser', async (event, username, password) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, username, password, created_at FROM users WHERE username = $1',
        [username]
      );

      if (rows.length === 0) {
        return null;
      }

      const user = rows[0];

      // Valida a senha
      if (user.password !== password) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Erro ao validar usuário:', error);
      return null;
    }
  });

  // SERVICE RECORDS
  ipcMain.handle('getServiceRecords', async (event, page = 1, limit = 50, search = '') => {
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM service_records';
      let countQuery = 'SELECT COUNT(*) FROM service_records';
      let params = [];

      if (search) {
        const searchCondition = ` WHERE 
          order_number ILIKE $1 OR 
          client ILIKE $1 OR 
          equipment ILIKE $1 OR 
          chassis_plate ILIKE $1`;
        query += searchCondition;
        countQuery += searchCondition;
        params.push(`%${search}%`);
      }

      // Adiciona ordenação e paginação
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const { rows } = await pool.query(query, params);

      // Busca total para paginação
      const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
      const total = parseInt(countResult.rows[0].count);

      return {
        records: rows.map(row => ({
          ...row,
          additional_costs: row.additional_costs ? JSON.parse(row.additional_costs) : []
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
      return { records: [], total: 0, page: 1, totalPages: 0 };
    }
  });

  ipcMain.handle('addServiceRecord', async (event, record) => {
    try {
      const id = uuidv4();
      const additionalCosts = record.additional_costs ? JSON.stringify(record.additional_costs) : '[]';
      let supplierWarranty = record.supplier_warranty === true || record.supplier_warranty === 1 ? 1 : 0;

      await pool.query(`
        INSERT INTO service_records (
          id, order_number, equipment, chassis_plate, client, manufacturing_date, call_opening_date,
          technician, assistance_type, assistance_location, contact_person, phone, reported_issue,
          supplier, part, observations, service_date, responsible_technician, part_labor_cost,
          travel_freight_cost, part_return, supplier_warranty, technical_solution, additional_costs, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
        )
      `, [
        id, record.order_number, record.equipment, record.chassis_plate, record.client, record.manufacturing_date,
        record.call_opening_date, record.technician, record.assistance_type, record.assistance_location,
        record.contact_person, record.phone, record.reported_issue, record.supplier, record.part,
        record.observations, record.service_date, record.responsible_technician, record.part_labor_cost,
        record.travel_freight_cost, record.part_return, supplierWarranty, record.technical_solution,
        additionalCosts, record.created_by || null
      ]);
      return { id, ...record, supplier_warranty: supplierWarranty, additional_costs: record.additional_costs || [] };
    } catch (error) {
      console.error('Erro ao adicionar registro:', error);
      throw error;
    }
  });

  ipcMain.handle('updateServiceRecord', async (event, id, updated) => {
    try {
      if ('supplier_warranty' in updated) {
        updated.supplier_warranty = updated.supplier_warranty === true || updated.supplier_warranty === 1 ? 1 : 0;
      }
      if (updated.additional_costs) {
        updated.additional_costs = JSON.stringify(updated.additional_costs);
      }

      const validFields = [
        'order_number', 'equipment', 'chassis_plate', 'client', 'manufacturing_date',
        'call_opening_date', 'technician', 'assistance_type', 'assistance_location',
        'contact_person', 'phone', 'reported_issue', 'supplier', 'part', 'observations',
        'service_date', 'responsible_technician', 'part_labor_cost', 'travel_freight_cost',
        'part_return', 'supplier_warranty', 'technical_solution', 'additional_costs'
      ];
      const fields = Object.keys(updated).filter(k => k !== 'id' && validFields.includes(k));
      if (fields.length === 0) return false;

      const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
      const values = fields.map(f => updated[f]);
      values.push(id);

      await pool.query(
        `UPDATE service_records SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1}`,
        values
      );
      return true;
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      return false;
    }
  });

  ipcMain.handle('deleteServiceRecord', async (event, id) => {
    try {
      await pool.query('DELETE FROM service_records WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
      return false;
    }
  });

  // ATTACHMENTS
  ipcMain.handle('getAttachments', async (event, service_record_id) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, service_record_id, filename, mimetype, size, created_at FROM attachments WHERE service_record_id = $1',
        [service_record_id]
      );
      return rows;
    } catch (error) {
      console.error('Erro ao buscar anexos:', error);
      return [];
    }
  });

  ipcMain.handle('addAttachment', async (event, attachment) => {
    try {
      const id = uuidv4();
      const fileData = attachment.buffer ? Buffer.from(attachment.buffer) : null;

      await pool.query(`
        INSERT INTO attachments (
          id, service_record_id, filename, mimetype, size, file_data, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [id, attachment.service_record_id, attachment.filename, attachment.mimetype, attachment.size, fileData, attachment.uploaded_by || null]);

      return { id, service_record_id: attachment.service_record_id, filename: attachment.filename };
    } catch (error) {
      console.error('Erro ao adicionar anexo:', error);
      throw error;
    }
  });

  ipcMain.handle('deleteAttachment', async (event, id) => {
    try {
      await pool.query('DELETE FROM attachments WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
      return false;
    }
  });

  ipcMain.handle('getAttachmentFile', async (event, attachmentId) => {
    try {
      const { rows } = await pool.query(
        'SELECT file_data, mimetype, filename FROM attachments WHERE id = $1',
        [attachmentId]
      );
      if (rows.length === 0) return null;
      return {
        buffer: rows[0].file_data,
        mimetype: rows[0].mimetype,
        filename: rows[0].filename
      };
    } catch (error) {
      console.error('Erro ao buscar arquivo:', error);
      return null;
    }
  });

  // SETTINGS
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

  // IMPORT EXCEL
  ipcMain.handle('importExcel', async (event, filePath) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('Atendimentos Técnicos');
    if (!worksheet) throw new Error('Planilha "Atendimentos Técnicos" não encontrada.');

    const colMap = {
      'OF': 'order_number', 'EQUIPAMENTO': 'equipment', 'CHASSI / PLACA': 'chassis_plate',
      'CLIENTE': 'client', 'DATA FABRICAÇÃO': 'manufacturing_date', 'DATA ABERTURA CHAMADO': 'call_opening_date',
      'TECNICO': 'technician', 'TIPO ASSISTENCIA': 'assistance_type', 'LOCAL ASSISTÊNCIA': 'assistance_location',
      'CONTATO': 'contact_person', 'TELEFONE': 'phone', 'PROBLEMA APRESENTADO': 'reported_issue',
      'FORNECEDOR': 'supplier', 'PEÇA': 'part', 'OBSERVAÇÕES': 'observations',
      'DATA ATENDIMENTO': 'service_date', 'TÉCNICO RESPONSÁVEL': 'responsible_technician',
      'CUSTO PEÇA/MÃO DE OBRA': 'part_labor_cost', 'CUSTO VIAGEM / FRETE': 'travel_freight_cost',
      'DEVOLUÇÃO PEÇA': 'part_return', 'GARANTIA FORNECEDOR': 'supplier_warranty', 'SOLUÇÃO TÉCNICA': 'technical_solution'
    };

    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell(cell => headers.push(cell.text));

    const importedRecords = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        const key = colMap[header];
        if (!key) return;
        let value = cell.value;
        if (key === 'part_labor_cost' || key === 'travel_freight_cost') {
          value = typeof value === 'number' ? value : parseFloat(value?.toString() || '0');
        }
        if (key === 'supplier_warranty') {
          value = (cell.text || '').toString().toUpperCase() === 'SIM' ? 1 : 0;
        }
        rowData[key] = value ?? '';
      });
      importedRecords.push(rowData);
    });

    const saved = [];
    for (const rec of importedRecords) {
      const id = uuidv4();
      const additionalCosts = '[]';
      await pool.query(`
        INSERT INTO service_records (
          id, order_number, equipment, chassis_plate, client, manufacturing_date, call_opening_date,
          technician, assistance_type, assistance_location, contact_person, phone, reported_issue,
          supplier, part, observations, service_date, responsible_technician, part_labor_cost,
          travel_freight_cost, part_return, supplier_warranty, technical_solution, additional_costs
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      `, [
        id, rec.order_number, rec.equipment, rec.chassis_plate, rec.client, rec.manufacturing_date,
        rec.call_opening_date, rec.technician, rec.assistance_type, rec.assistance_location,
        rec.contact_person, rec.phone, rec.reported_issue, rec.supplier, rec.part,
        rec.observations, rec.service_date, rec.responsible_technician, rec.part_labor_cost,
        rec.travel_freight_cost, rec.part_return, rec.supplier_warranty, rec.technical_solution, additionalCosts
      ]);
      saved.push({ id, ...rec });
    }
    return saved;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});