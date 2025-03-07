const { contextBridge, ipcRenderer } = require('electron');

// Exposing safe methods to the renderer process
contextBridge.exposeInMainWorld('api', {
  openVendaModal: () => {
    console.log('Abrindo modal de venda'); // Log para depuração
    ipcRenderer.send('open-venda-modal');
  },
  openGarantiaModal: () => {
    console.log('Abrindo modal de garantia'); // Log para depuração
    ipcRenderer.send('open-garantia-modal');
  },
  openAtendimentoModal: () => {
    console.log('Abrindo modal de atendimento'); // Log para depuração
    ipcRenderer.send('open-atendimento-modal');
  },
  openComissao: () => {
    console.log('Abrindo comissao'); // Log para depuração
    ipcRenderer.send('open-comissao');
  },
  openConfiguracao: () => {
    console.log('Abrindo configuracao'); // Log para depuração
    ipcRenderer.send('open-configuracao');
  },
  inserirAtendimento: (atendimento) => {
    console.log('Inserindo atendimento', atendimento); // Log para depuração
    return ipcRenderer.invoke('inserir-atendimento', atendimento);
  },
  excluirAtendimento: (id) => {
    console.log('Excluindo atendimento com ID:', id); // Log para depuração
    return ipcRenderer.invoke('excluir-atendimento', id);
  },
  listarAtendimentos: () => {
    console.log('Listando atendimentos'); // Log para depuração
    return ipcRenderer.invoke('listar-atendimentos');
  },
  inserirVenda: (venda, prazo_fabricacao) => {
    console.log('Inserindo venda', venda, 'Prazo de fabricação:', prazo_fabricacao); // Log para depuração
    return ipcRenderer.invoke('inserir-venda', venda, prazo_fabricacao);
  },
  listarVendas: () => {
    console.log('Listando vendas'); // Log para depuração
    return ipcRenderer.invoke('listar-vendas');
  },
  excluirVenda: (id) => {
    console.log('Excluindo venda com ID:', id); // Log para depuração
    return ipcRenderer.invoke('excluir-venda', id);
  },
  inserirGarantia: (garantia) => {
    console.log('Inserindo garantia', garantia); // Log para depuração
    return ipcRenderer.invoke('inserir-garantia', garantia);
  },
  listarGarantias: () => {
    console.log('Listando garantias'); // Log para depuração
    return ipcRenderer.invoke('listar-garantias');
  },
  inserirAnexos: (clienteNome, tipo, formData) => {
    console.log('Inserindo anexos para cliente:', clienteNome, 'Tipo:', tipo); // Log para depuração
    return ipcRenderer.invoke('inserir-anexos', clienteNome, tipo, formData);
  },
  listarAnexos: (clienteNome) => {
    console.log('Listando anexos para cliente:', clienteNome); // Log para depuração
    return ipcRenderer.invoke('listar-anexos', clienteNome);
  },
  listarPastasClientes: () => {
    console.log('Listando pastas de clientes'); // Log para depuração
    return ipcRenderer.invoke('listar-pastas-clientes');
  },
  login: (username, password) => {
    console.log('Login com username:', username); // Log para depuração
    return ipcRenderer.invoke('login', username, password);
  },
  cadastrarUsuario: (username, password) => {
    console.log('Cadastrando usuario', username); // Log para depuração
    return ipcRenderer.invoke('cadastrar-usuario', username, password);
  },
  listarUsuarios: () => {
    console.log('Listando usuarios'); // Log para depuração
    return ipcRenderer.invoke('listar-usuarios');
  },
  inserirComissao: (comissao) => {
    console.log('Inserindo comissão', comissao); // Log para depuração
    return ipcRenderer.invoke('inserir-comissao', comissao);
  },
  listarComissoes: () => {
    console.log('Listando comissões'); // Log para depuração
    return ipcRenderer.invoke('listar-comissoes');
  },
  listarConfiguracoes: () => {
    console.log('Listando configurações'); // Log para depuração
    return ipcRenderer.invoke('listar-configuracoes');
  },
  salvarConfiguracao: (configuracao) => {
    console.log('Salvando configuração', configuracao); // Log para depuração
    return ipcRenderer.invoke('salvar-configuracao', configuracao);
  },
  excluirConfiguracao: (id) => {
    console.log('Excluindo configuração com ID:', id); // Log para depuração
    return ipcRenderer.invoke('excluir-configuracao', id);
  },
  moverParaHistorico: (id) => {
    console.log('Movendo atendimento para histórico com ID:', id); // Log para depuração
    return ipcRenderer.invoke('mover-para-historico', id);
  },
  verificarPermissao: (username, permissao) => {
    console.log(`Verificando permissão ${permissao} para o usuário:`, username); // Log para depuração
    return ipcRenderer.invoke('verificar-permissao', username, permissao);
  },
  editarPermissaoUsuario: (id, permissao) => {
    console.log(`Editando permissão do usuário com ID: ${id}`); // Log para depuração
    return ipcRenderer.invoke('editar-permissao-usuario', id, permissao);
  },
  listarHistoricoAtendimentos: () => {
    console.log('Listando histórico de atendimentos'); // Log para depuração
    return ipcRenderer.invoke('listar-historico-atendimentos');
  },
  editarAtendimento: (id, atendimento) => {
    console.log('Editando atendimento com ID:', id, atendimento); // Log para depuração
    return ipcRenderer.invoke('editar-atendimento', id, atendimento);
  }
});