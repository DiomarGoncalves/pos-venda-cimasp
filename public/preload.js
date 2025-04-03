const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  inserirAtendimento: (atendimento) => ipcRenderer.invoke('inserir-atendimento', atendimento),
  listarAtendimentos: () => ipcRenderer.invoke('listar-atendimentos'),
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  cadastrarUsuario: (username, password) => ipcRenderer.invoke('cadastrar-usuario', username, password),
  listarUsuarios: () => ipcRenderer.invoke('listar-usuarios'),
  listarAssistencias: () => ipcRenderer.invoke('listar-assistencias'),
  inserirAssistencia: (assistencia) => ipcRenderer.invoke('inserir-assistencia', assistencia),
  editarAssistencia: (id, assistencia) => ipcRenderer.invoke('editar-assistencia', id, assistencia),
  excluirAssistencia: (id) => ipcRenderer.invoke('excluir-assistencia', id),
  listarEquipamentos: () => ipcRenderer.invoke('listar-equipamentos'),
  inserirEquipamento: (nome) => ipcRenderer.invoke('inserir-equipamento', nome),
  excluirEquipamento: (id) => ipcRenderer.invoke('excluir-equipmento', id),
  gerarRelatorioPdf: () => ipcRenderer.invoke('gerar-relatorio-pdf'),
  gerarRelatorioXlsx: () => ipcRenderer.invoke('gerar-relatorio-xlsx'),
  listarOfs: () => ipcRenderer.invoke('listar-ofs'),
  carregarPlanilhaOfs: () => ipcRenderer.invoke('carregar-planilha-ofs'),
  abrirPlanilhaOfs: () => ipcRenderer.invoke('abrir-planilha-ofs'),
});