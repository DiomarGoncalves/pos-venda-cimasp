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

  // Verificação dos campos obrigatórios
  if (!venda.produto || !venda.preco_custo || !venda.preco_venda || !venda.data_venda || !venda.vendedor || !venda.cliente || !venda.nota_fiscal || !venda.pedido_venda) {
    console.error('Erro: Campos obrigatórios não preenchidos'); // Log para depuração
    throw new Error('Campos obrigatórios não preenchidos');
  }

  try {
    const vendaId = await db.inserirVenda(
      venda.atendimento_id,
      venda.telefone,
      venda.nome,
      venda.endereco,
      venda.motivo,
      venda.usuario_id,
      venda.data_inicio,
      venda.produto,
      venda.preco_custo,
      venda.preco_venda,
      venda.data_venda,
      venda.vendedor,
      venda.cliente,
      venda.nota_fiscal,
      venda.pedido_venda,
      venda.prazo_fabricacao
    );
    console.log('Venda inserida com ID:', vendaId); // Log para depuração
    return vendaId;
  } catch (error) {
    console.error('Erro ao inserir venda main:', error.message); // Log para depuração
    throw error;
  }
});

ipcMain.handle('inserir-garantia', async (event, garantia) => {
  console.log('Inserindo garantia', garantia); // Log para depuração
  // Verificação dos campos obrigatórios
  if (!garantia.data_servico) {
    console.error('Erro: Campo data_servico não preenchido'); // Log para depuração
    throw new Error('Campo data_servico não preenchido');
  }
  return await db.inserirGarantia(
    garantia.atendimento_id,
    garantia.telefone,
    garantia.nome,
    garantia.endereco,
    garantia.motivo,
    garantia.usuario_id,
    garantia.data_inicio,
    garantia.data_servico,
    garantia.prestador,
    garantia.nota,
    garantia.peca_substituida,
    garantia.valor
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

ipcMain.handle('inserir-anexos', async (event, clienteNome, tipo, files) => {
  console.log('Inserindo anexos para cliente:', clienteNome, 'Tipo:', tipo); // Log para depuração
  const baseDir = '\\\\192.168.1.2\\publica\\Diomar Gonçalves\\SISTEMA-POSVENDA';
  const clienteDir = path.join(baseDir, clienteNome);
  const tipoDir = path.join(clienteDir, tipo);

  if (!fs.existsSync(clienteDir)) {
    fs.mkdirSync(clienteDir);
  }
  if (!fs.existsSync(tipoDir)) {
    fs.mkdirSync(tipoDir);
  }

  const anexos = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = file.name;
    const filePath = path.join(tipoDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(file.buffer));
    anexos.push(filePath);
  }
  return anexos.join(',');
});

ipcMain.handle('listar-garantias', async () => {
  console.log('Listando garantias'); // Log para depuração
  return await db.listarGarantias();
});

ipcMain.handle('inserir-comissao', async (event, comissao) => {
  console.log('Inserindo comissão', comissao); // Log para depuração
  return await db.inserirComissao(comissao.venda_id, comissao.porcentagem);
});

ipcMain.handle('listar-comissoes', async () => {
  console.log('Listando comissões'); // Log para depuração
  return await db.listarComissoes();
});

ipcMain.handle('listar-configuracoes', async () => {
  console.log('Listando configurações'); // Log para depuração
  return await db.listarConfiguracoes();
});

ipcMain.handle('salvar-configuracao', async (event, configuracao) => {
  console.log('Salvando configuração', configuracao); // Log para depuração
  return await db.salvarConfiguracao(configuracao.usuario, configuracao.acesso);
});

ipcMain.handle('excluir-configuracao', async (event, id) => {
  console.log('Excluindo configuração com ID:', id); // Log para depuração
  return await db.excluirConfiguracao(id);
});

ipcMain.handle('mover-para-historico', async (event, id) => {
  console.log('Movendo atendimento para histórico com ID:', id); // Log para depuração
  return await db.excluirAtendimento(id);
});

ipcMain.handle('verificar-permissao', async (event, username, permissao) => {
  console.log(`Verificando permissão ${permissao} para o usuário:`, username); // Log para depuração
  const user = await db.obterPermissaoUsuario(username, permissao);
  return user ? true : false;
});

ipcMain.handle('editar-permissao-usuario', async (event, id, permissao) => {
  console.log(`Editando permissão do usuário com ID: ${id}`); // Log para depuração
  return await db.editarPermissaoUsuario(id, permissao);
});

ipcMain.handle('listar-historico-atendimentos', async () => {
  console.log('Listando histórico de atendimentos'); // Log para depuração
  return await db.listarHistoricoAtendimentos();
});

ipcMain.handle('editar-atendimento', async (event, id, atendimento) => {
  console.log('Editando atendimento com ID:', id, atendimento); // Log para depuração
  return await db.editarAtendimento(id, atendimento.telefone, atendimento.nome, atendimento.endereco, atendimento.motivo);
});

ipcMain.handle('listar-anexos', async (event, clienteNome) => {
  console.log('Listando anexos para cliente:', clienteNome); // Log para depuração
  const baseDir = '\\\\192.168.1.2\\publica\\Diomar Gonçalves\\SISTEMA-POSVENDA';
  const clienteDir = path.join(baseDir, clienteNome);
  if (!fs.existsSync(clienteDir)) {
    return '';
  }

  const anexos = [];
  const tipos = fs.readdirSync(clienteDir);
  tipos.forEach(tipo => {
    const tipoDir = path.join(clienteDir, tipo);
    const files = fs.readdirSync(tipoDir);
    files.forEach(file => {
      anexos.push(path.join(tipoDir, file));
    });
  });

  return anexos.join(',');
});

ipcMain.handle('listar-pastas-clientes', async () => {
  console.log('Listando pastas de clientes'); // Log para depuração
  const baseDir = '\\\\192.168.1.2\\publica\\Diomar Gonçalves\\SISTEMA-POSVENDA';
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const pastas = fs.readdirSync(baseDir);
  return pastas;
});