const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database/database');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

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

  // Open the DevTools (optional)
  mainWindow.webContents.openDevTools();
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
  return await db.inserirAtendimento(atendimento.telefone, atendimento.nome, atendimento.endereco, atendimento.motivo, atendimento.usuario_id, atendimento.data_inicio, atendimento.anexos);
});

ipcMain.handle('excluir-atendimento', async (event, id) => {
  console.log('Excluindo atendimento com ID:', id); // Log para depuração
  return await db.excluirAtendimento(id);
});

ipcMain.handle('listar-atendimentos', async () => {
  console.log('Listando atendimentos'); // Log para depuração
  return await db.listarAtendimentos();
});

ipcMain.handle('login', async (event, username, password) => {
  console.log('Login com username:', username); // Log para depuração
  const user = await db.autenticarUsuario(username, password);
  if (user) {
    return { success: true };
  } else {
    return { success: false };
  }
});

ipcMain.handle('cadastrar-usuario', async (event, username, password) => {
  console.log('Cadastrando usuario', username); // Log para depuração
  try {
    const userId = await db.inserirUsuario(username, password);
    return userId;
  } catch (error) {
    return null;
  }
});

ipcMain.handle('inserir-venda', async (event, venda) => {
  console.log('Inserindo venda', venda); // Log para depuração
  try {
    const vendaId = await db.inserirVenda(
      venda.atendimento_id,
      venda.telefone,
      venda.nome,
      venda.endereco,
      venda.motivo,
      venda.usuario_id,
      venda.data_inicio,
      venda.anexos,
      venda.produto,
      venda.preco_custo,
      venda.preco_venda,
      venda.data_venda,
      venda.vendedor
    );
    return vendaId;
  } catch (error) {
    console.error('Erro ao inserir venda:', error.message); // Log para depuração
    throw error;
  }
});

ipcMain.handle('inserir-garantia', async (event, garantia) => {
  console.log('Inserindo garantia', garantia); // Log para depuração
  return await db.inserirGarantia(
    garantia.atendimento_id,
    garantia.telefone,
    garantia.nome,
    garantia.endereco,
    garantia.motivo,
    garantia.usuario_id,
    garantia.data_inicio,
    garantia.anexos,
    garantia.data_servico,
    garantia.prestador
  );
});

ipcMain.handle('listar-usuarios', async () => {
  console.log('Listando usuarios'); // Log para depuração
  return await db.listarUsuarios();
});

ipcMain.handle('listar-vendas', async () => {
  console.log('Listando vendas'); // Log para depuração
  return await db.listarVendas();
});

ipcMain.handle('excluir-venda', async (event, id) => {
  console.log('Excluindo venda com ID:', id); // Log para depuração
  return await db.excluirVenda(id);
});

ipcMain.handle('inserir-anexos', async (event, id, files) => {
  console.log('Inserindo anexos para venda com ID:', id); // Log para depuração
  const anexos = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = path.join(__dirname, 'uploads', fileName);
    fs.writeFileSync(filePath, Buffer.from(file.buffer));
    anexos.push(filePath);
  }
  return await db.inserirAnexos(id, anexos.join(','));
});