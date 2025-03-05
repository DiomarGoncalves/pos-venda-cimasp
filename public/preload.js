const { contextBridge, ipcRenderer } = require('electron');

// Exposing safe methods to the renderer process
contextBridge.exposeInMainWorld('api', {
  openVendaModal: () => ipcRenderer.send('open-venda-modal'),
  openGarantiaModal: () => ipcRenderer.send('open-garantia-modal'),
  openAtendimentoModal: () => ipcRenderer.send('open-atendimento-modal'),
  openComissao: () => ipcRenderer.send('open-comissao'),
  openConfiguracao: () => ipcRenderer.send('open-configuracao'),
  inserirAtendimento: (atendimento) => ipcRenderer.invoke('inserir-atendimento', atendimento),
  excluirAtendimento: (id) => ipcRenderer.invoke('excluir-atendimento', id),
  listarAtendimentos: () => ipcRenderer.invoke('listar-atendimentos'),
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  cadastrarUsuario: (username, password) => ipcRenderer.invoke('cadastrar-usuario', username, password)
});