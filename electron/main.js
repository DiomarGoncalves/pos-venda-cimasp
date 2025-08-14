const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const { join } = require('path');
const isDev = !app.isPackaged;
// Remover: const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Adicione o pacote pg para PostgreSQL
const { Pool } = require('pg');

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

// --- NOVO: função para obter a connection string do banco ---
function getDatabaseUrl() {
  // 1. Prioriza variável de ambiente
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL;
  // 2. Busca no arquivo de config
  const config = readConfigFile();
  if (config.NEON_DATABASE_URL) return config.NEON_DATABASE_URL;
  // 3. Valor padrão (se quiser)
  return 'postgresql://postgres:cimasp%402020@overview-calendars.gl.at.ply.gg:50285/sysposvendas?sslmode=disable';
}

// Configuração da conexão com o banco Neon PostgreSQL
const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

// Função para testar conexão com o banco
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

// Função para criar tabelas se não existirem (executada uma vez)
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
        additional_costs TEXT, -- JSON string para custos adicionais
        created_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        service_record_id TEXT REFERENCES service_records(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        url TEXT,
        mimetype TEXT,
        size INTEGER,
        uploaded_by TEXT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS service_record_history (
        id TEXT PRIMARY KEY,
        service_record_id TEXT REFERENCES service_records(id) ON DELETE CASCADE,
        changed_by TEXT REFERENCES users(id),
        change_type TEXT,
        change_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_service_records_client ON service_records(client);
      CREATE INDEX IF NOT EXISTS idx_service_records_technician ON service_records(technician);
      CREATE INDEX IF NOT EXISTS idx_attachments_service_record_id ON attachments(service_record_id);
    `);

    // Garante que a coluna file_data existe em attachments
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='attachments' AND column_name='file_data'
        ) THEN
          ALTER TABLE attachments ADD COLUMN file_data BYTEA;
        END IF;
      END
      $$;
    `);
    
    console.log('✅ Tabelas do banco de dados verificadas/criadas');
  } catch (error) {
    console.error('❌ Erro ao criar/verificar tabelas:', error);
    throw error;
  }
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

function writeConfigFile(config) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
}

// --- AUTO-UPDATER ---
function setupAutoUpdater() {
  // Só configura auto-updater em produção
  if (isDev) {
    console.log('Auto-updater desabilitado em desenvolvimento');
    return;
  }

  // Configura o caminho do arquivo de configuração
  const updateConfigPath = join(process.resourcesPath, 'app-update.yml');
  if (!fs.existsSync(updateConfigPath)) {
    console.error('Arquivo app-update.yml não encontrado em:', updateConfigPath);
    return;
  }

  // Configurações do auto-updater
  autoUpdater.updateConfigPath = updateConfigPath;
  autoUpdater.checkForUpdatesAndNotify();
  
  // Log para debug
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';
  
  // Verifica atualizações a cada 10 minutos
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 10 * 60 * 1000);

  autoUpdater.on('checking-for-update', () => {
    console.log('Verificando atualizações...');
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Nenhuma atualização disponível.');
  });

  autoUpdater.on('update-available', () => {
    console.log('Atualização disponível! Baixando...');
    if (mainWindow) {
      mainWindow.webContents.send('update-available');
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Velocidade de download: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Baixado ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('Atualização baixada! Será instalada ao reiniciar.');
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded');
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Erro no auto-updater:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });

  // IPC handlers para controle manual
  ipcMain.on('check-for-updates', () => {
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    } else {
      console.log('Auto-updater não disponível em desenvolvimento');
      if (mainWindow) {
        mainWindow.webContents.send('update-error', 'Auto-updater não disponível em desenvolvimento');
      }
    }
  });

  ipcMain.on('restart-app-for-update', () => {
    if (!isDev) {
      autoUpdater.quitAndInstall();
    }
  });

  ipcMain.on('install-update-now', () => {
    if (!isDev) {
      autoUpdater.quitAndInstall(false, true);
    }
  });
}

app.whenReady().then(async () => {
  console.log('🚀 Aplicação iniciando...');
  
  // Testa conexão com banco antes de criar tabelas
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Não foi possível conectar ao banco de dados');
    // Em produção, continua mesmo sem banco (modo offline)
    if (!isDev) {
      console.warn('⚠️ Continuando em modo offline');
    }
  } else {
    await ensureTables();
  }
  
  createWindow();

  // INICIA O AUTO-UPDATER
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // IPC handlers para USERS
  ipcMain.handle('getUsers', async () => {
    try {
      const { rows } = await pool.query('SELECT * FROM users');
      return rows;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  });

  ipcMain.handle('addUser', async (event, user) => {
    try {
      const id = uuidv4();
      await pool.query(
        'INSERT INTO users (id, username, password) VALUES ($1, $2, $3)',
        [id, user.username, user.password]
      );
      return { id, ...user };
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      throw error;
    }
  });

  // IPC handlers para SERVICE RECORDS
  ipcMain.handle('getServiceRecords', async () => {
    try {
      const { rows } = await pool.query('SELECT * FROM service_records');
      // Parse additional_costs JSON para cada registro
      return rows.map(row => ({
        ...row,
        additional_costs: row.additional_costs ? JSON.parse(row.additional_costs) : []
      }));
    } catch (error) {
      console.error('Erro ao buscar registros de serviço:', error);
      return [];
    }
  });

  ipcMain.handle('addServiceRecord', async (event, record) => {
    try {
      const id = uuidv4();
      // Garante que created_by seja null se não enviado
      const createdBy = record.created_by || null;
      // Serializa custos adicionais como JSON
      const additionalCosts = record.additional_costs ? JSON.stringify(record.additional_costs) : '[]';
      
      // Converte supplier_warranty para inteiro
      let supplierWarranty = 0;
      if (record.supplier_warranty === true || record.supplier_warranty === 1 || record.supplier_warranty === '1' || record.supplier_warranty === 'true') {
        supplierWarranty = 1;
      } else if (record.supplier_warranty === false || record.supplier_warranty === 0 || record.supplier_warranty === '0' || record.supplier_warranty === 'false') {
        supplierWarranty = 0;
      }
      
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
        additionalCosts,
        createdBy
      ]);
      return { id, ...record, created_by: createdBy, supplier_warranty: supplierWarranty, additional_costs: record.additional_costs || [] };
    } catch (error) {
      console.error('Erro ao adicionar registro de serviço:', error);
      throw error;
    }
  });

  ipcMain.handle('deleteServiceRecord', async (event, id) => {
    try {
      await pool.query('DELETE FROM service_records WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Erro ao deletar registro de serviço:', error);
      return false;
    }
  });

  ipcMain.handle('updateServiceRecord', async (event, id, updated) => {
    try {
      // Converte supplier_warranty para inteiro de forma mais robusta
      if ('supplier_warranty' in updated) {
        let supplierWarranty = 0;
        if (updated.supplier_warranty === true || updated.supplier_warranty === 1 || updated.supplier_warranty === '1' || updated.supplier_warranty === 'true') {
          supplierWarranty = 1;
        } else if (updated.supplier_warranty === false || updated.supplier_warranty === 0 || updated.supplier_warranty === '0' || updated.supplier_warranty === 'false') {
          supplierWarranty = 0;
        }
        updated.supplier_warranty = supplierWarranty;
      }
      
      // Serializa custos adicionais como JSON
      if (updated.additional_costs) {
        updated.additional_costs = JSON.stringify(updated.additional_costs);
      }
      
      const validFields = [
        'order_number', 'equipment', 'chassis_plate', 'client', 'manufacturing_date',
        'call_opening_date', 'technician', 'assistance_type', 'assistance_location',
        'contact_person', 'phone', 'reported_issue', 'supplier', 'part', 'observations',
        'service_date', 'responsible_technician', 'part_labor_cost', 'travel_freight_cost',
        'part_return', 'supplier_warranty', 'technical_solution', 'additional_costs',
        // Remover 'created_by' daqui
        'created_at', 'updated_at'
      ];
      const fields = Object.keys(updated).filter(
        k => k !== 'id' && validFields.includes(k)
      );
      if (fields.length === 0) return false;
      const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
      const values = fields.map(f => updated[f]);
      values.push(id);
      await pool.query(
        `UPDATE service_records SET ${setClause} WHERE id = $${fields.length + 1}`,
        values
      );
      return true;
    } catch (error) {
      console.error('Erro ao atualizar registro de serviço:', error);
      return false;
    }
  });

  // IPC handlers para ATTACHMENTS
  ipcMain.handle('getAttachments', async (event, service_record_id) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM attachments WHERE service_record_id = $1',
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
      // O buffer chega como array, converta para Buffer
      const fileData = attachment.buffer ? Buffer.from(attachment.buffer) : null;
      await pool.query(`
        INSERT INTO attachments (
          id, service_record_id, filename, url, mimetype, size, uploaded_by, file_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
      `, [
        id,
        attachment.service_record_id,
        attachment.filename,
        '', // url não é mais usada
        attachment.mimetype,
        attachment.size,
        attachment.uploaded_by,
        fileData
      ]);
      return { id, ...attachment };
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

  // Novo handler para baixar o arquivo do anexo
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
      console.error('Erro ao buscar arquivo do anexo:', error);
      return null;
    }
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

  // Handler para importar Excel para o banco Neon
  ipcMain.handle('importExcel', async (event, filePath) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('Atendimentos Técnicos');
    if (!worksheet) throw new Error('Planilha "Atendimentos Técnicos" não encontrada.');

    const colMap = {
      'OF': 'order_number',
      'EQUIPAMENTO': 'equipment',
      'CHASSI / PLACA': 'chassis_plate',
      'CLIENTE': 'client',
      'DATA FABRICAÇÃO': 'manufacturing_date',
      'DATA ABERTURA CHAMADO': 'call_opening_date',
      'TECNICO': 'technician',
      'TIPO ASSISTENCIA': 'assistance_type',
      'LOCAL ASSISTÊNCIA': 'assistance_location',
      'CONTATO': 'contact_person',
      'TELEFONE': 'phone',
      'PROBLEMA APRESENTADO': 'reported_issue',
      'FORNECEDOR': 'supplier',
      'PEÇA': 'part',
      'OBSERVAÇÕES': 'observations',
      'DATA ATENDIMENTO': 'service_date',
      'TÉCNICO RESPONSÁVEL': 'responsible_technician',
      'CUSTO PEÇA/MÃO DE OBRA': 'part_labor_cost',
      'CUSTO VIAGEM / FRETE': 'travel_freight_cost',
      'DEVOLUÇÃO PEÇA': 'part_return',
      'GARANTIA FORNECEDOR': 'supplier_warranty',
      'SOLUÇÃO TÉCNICA': 'technical_solution'
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
        // Garante que value é string para campos de texto
        if (
          [
            'order_number', 'equipment', 'chassis_plate', 'client', 'manufacturing_date',
            'call_opening_date', 'technician', 'assistance_type', 'assistance_location',
            'contact_person', 'phone', 'reported_issue', 'supplier', 'part', 'observations',
            'service_date', 'responsible_technician', 'part_return', 'technical_solution'
          ].includes(key)
        ) {
          value = value == null ? '' : value.toString();
        }
        rowData[key] = value ?? '';
      });
      // Garante que todos os campos obrigatórios existem e são string
      rowData.created_at = '';
      rowData.updated_at = '';
      importedRecords.push(rowData);
    });

    const saved = [];
    for (const rec of importedRecords) {
      const id = uuidv4();
      await pool.query(`
        INSERT INTO service_records (
          id, order_number, equipment, chassis_plate, client, manufacturing_date, call_opening_date,
          technician, assistance_type, assistance_location, contact_person, phone, reported_issue,
          supplier, part, observations, service_date, responsible_technician, part_labor_cost,
          travel_freight_cost, part_return, supplier_warranty, technical_solution
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
      `, [
        id, rec.order_number, rec.equipment, rec.chassis_plate, rec.client, rec.manufacturing_date,
        rec.call_opening_date, rec.technician, rec.assistance_type, rec.assistance_location,
        rec.contact_person, rec.phone, rec.reported_issue, rec.supplier, rec.part,
        rec.observations, rec.service_date, rec.responsible_technician, rec.part_labor_cost,
        rec.travel_freight_cost, rec.part_return, rec.supplier_warranty, rec.technical_solution
      ]);
      saved.push({ id, ...rec });
    }
    return saved;
  });

  // ...existing code...
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});