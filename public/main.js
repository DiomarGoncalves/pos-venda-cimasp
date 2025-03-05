const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database/database');

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
  // mainWindow.webContents.openDevTools();
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
  return await db.excluirAtendimento(id);
});

ipcMain.handle('listar-atendimentos', async () => {
  return await db.listarAtendimentos();
});

ipcMain.handle('login', async (event, username, password) => {
  const user = await db.autenticarUsuario(username, password);
  if (user) {
    event.sender.send('login-success');
  } else {
    event.sender.send('login-failure');
  }
});

ipcMain.handle('cadastrar-usuario', async (event, username, password) => {
  try {
    const userId = await db.inserirUsuario(username, password);
    return userId;
  } catch (error) {
    return null;
  }
});