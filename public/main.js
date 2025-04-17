const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database/database');
const { gerarPdf, gerarXlsx } = require('./relatorios/relatorios');
const xlsx = require('xlsx');
const { exec } = require('child_process'); // Importa o módulo child_process
const fs = require('fs');
const os = require('os');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../pages/html/login.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('inserir-atendimento', async (event, atendimento) => {
  return await db.inserirAtendimento(atendimento.telefone, atendimento.nome, atendimento.motivo);
});

ipcMain.handle('listar-atendimentos', async () => {
  return await db.listarAtendimentos();
});

ipcMain.handle('login', async (event, username, password) => {
  const user = await db.autenticarUsuario(username, password);
  return user ? { success: true } : { success: false };
});

ipcMain.handle('cadastrar-usuario', async (event, username, password) => {
  try {
    return await db.inserirUsuario(username, password);
  } catch {
    return null;
  }
});

ipcMain.handle('listar-usuarios', async () => {
  return await db.listarUsuarios();
});

ipcMain.handle('listar-assistencias', async () => {
  return await db.listarAssistencias();
});

ipcMain.handle('inserir-assistencia', async (event, assistencia) => {
  return await db.inserirAssistencia(assistencia);
});

ipcMain.handle('editar-assistencia', async (event, id, assistencia) => {
  return await db.editarAssistencia(id, assistencia);
});

ipcMain.handle('excluir-assistencia', async (event, id) => {
  return await db.excluirAssistencia(id);
});

ipcMain.handle('listar-equipamentos', async () => {
  return await db.listarEquipamentos();
});

ipcMain.handle('inserir-equipamento', async (event, nome) => {
  return await db.inserirEquipamento(nome);
});

ipcMain.handle('excluir-equipamento', async (event, id) => {
  return await db.excluirEquipamento(id);
});

ipcMain.handle('gerar-relatorio-pdf', async () => {
  return await gerarPdf();
});

ipcMain.handle('gerar-relatorio-xlsx', async () => {
  return await gerarXlsx();
});

function carregarPlanilhaOfs() {
  try {
    const filePath = "\\\\192.168.1.2\\publica\\Pasta de OF - Originais\\1 - Relatório de Produção - 2015 - Leandro-Diomar.xlsx";
    console.log(`Tentando carregar a planilha em: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    console.log('Planilha carregada com sucesso.');
    const sheet = workbook.Sheets['Controle de OF'];
    if (!sheet) {
      throw new Error('A aba "Controle de OF" não foi encontrada na planilha.');
    }
    console.log('Aba "Controle de OF" encontrada.');

    // Converte os dados da planilha para JSON
    const rawData = xlsx.utils.sheet_to_json(sheet);

    // Mapeia as colunas para os nomes esperados no frontend
    const mappedData = rawData.map(row => ({
      of: row['Relatório de Produção'] || 'N/A',
      cliente: row['__EMPTY'] || 'N/A',
      qtd: row['__EMPTY_1'] || 'N/A',
      equipamento: row['__EMPTY_2'] || 'N/A',
      recebOf: row['__EMPTY_3'] || 'N/A',
      chassi: row['__EMPTY_4'] || 'N/A',
      chegadaChassi: row['__EMPTY_5'] || 'N/A',
      numChassi: row['__EMPTY_6'] || 'N/A',
      serie: row['__EMPTY_7'] || 'N/A',
      situacao: row['__EMPTY_8'] || 'N/A',
      fabr: row['__EMPTY_9'] || 'N/A',
      dataSaida: row['__EMPTY_10'] || 'N/A',
      entregaTecnica: row['__EMPTY_11'] || 'N/A',
      cidade: row['__EMPTY_12'] || 'N/A',
      uf: row['__EMPTY_13'] || 'N/A',
    }));

    return mappedData;
  } catch (error) {
    console.error('Erro ao carregar a planilha de OFs:', error);
    throw error;
  }
}

ipcMain.handle('listar-ofs', async () => {
  try {
    return carregarPlanilhaOfs();
  } catch (error) {
    console.error('Erro ao carregar a planilha de OFs:', error);
    throw error;
  }
});

ipcMain.handle('carregar-planilha-ofs', async () => {
  try {
    const filePath = "\\\\192.168.1.2\\publica\\Pasta de OF - Originais\\1 - Relatório de Produção - 2015 - Leandro-Diomar.xlsx";
    console.log(`Carregando planilha em: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['Controle de OF'];
    if (!sheet) throw new Error('A aba "Controle de OF" não foi encontrada na planilha.');
    return xlsx.utils.sheet_to_json(sheet);
  } catch (error) {
    console.error('Erro ao carregar a planilha de OFs:', error);
    throw error;
  }
});

ipcMain.handle('abrir-planilha-ofs', async () => {
  try {
    const filePath = "\\\\192.168.1.2\\publica\\Pasta de OF - Originais\\1 - Relatório de Produção - 2015 - Leandro-Diomar.xlsx";
    console.log(`Abrindo planilha em: ${filePath}`);
    exec(`start "" "${filePath}"`, (error) => {
      if (error) {
        console.error('Erro ao abrir a planilha:', error);
        throw error;
      }
    });
  } catch (error) {
    console.error('Erro ao tentar abrir a planilha:', error);
    throw error;
  }
});

ipcMain.handle('listarPastasClientes', async () => {
  try {
    const basePath = "\\\\192.168.1.2\\publica\\POS-VENDAS\\sistema\\anexos";
    const pastas = fs.readdirSync(basePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    console.log('Pastas de clientes carregadas:', pastas);
    return pastas;
  } catch (error) {
    console.error('Erro ao listar pastas de clientes:', error);
    throw error;
  }
});

ipcMain.handle('inserirAnexos', async (event, clienteNome, fileData) => {
  try {
    if (!clienteNome || typeof clienteNome !== 'string' || clienteNome.trim() === '') {
      throw new Error('O nome do cliente é inválido ou não foi fornecido.');
    }

    const basePath = "\\\\192.168.1.2\\publica\\POS-VENDAS\\sistema\\anexos";
    const clientPath = path.join(basePath, clienteNome.trim());

    // Cria o diretório do cliente, se não existir
    if (!fs.existsSync(clientPath)) {
      fs.mkdirSync(clientPath, { recursive: true });
    }

    fileData.forEach(file => {
      const filePath = path.join(clientPath, file.name);
      fs.writeFileSync(filePath, Buffer.from(file.buffer));
      console.log(`Arquivo salvo em: ${filePath}`);
    });

    return true;
  } catch (error) {
    console.error('Erro ao inserir anexos:', error);
    throw error;
  }
});

ipcMain.handle('listarAnexos', async (event, clienteNome) => {
  try {
    const basePath = "\\\\192.168.1.2\\publica\\POS-VENDAS\\sistema\\anexos";
    const clientPath = path.join(basePath, clienteNome);

    if (!fs.existsSync(clientPath)) {
      throw new Error(`A pasta ${clientPath} não existe.`);
    }

    const anexos = fs.readdirSync(clientPath)
      .filter(file => fs.statSync(path.join(clientPath, file)).isFile())
      .map(file => path.join(clientPath, file));

    console.log(`Anexos encontrados para ${clienteNome}:`, anexos);
    return anexos;
  } catch (error) {
    console.error('Erro ao listar anexos:', error);
    throw error;
  }
});