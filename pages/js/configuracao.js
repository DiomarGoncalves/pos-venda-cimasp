document.addEventListener('DOMContentLoaded', async () => {
  const configForm = document.getElementById('configForm');
  const configList = document.getElementById('configList');

  async function carregarConfiguracoes() {
    const configuracoes = await window.api.listarConfiguracoes();
    configuracoes.forEach(adicionarConfiguracao);
  }

  function adicionarConfiguracao(configuracao) {
    const row = configList.insertRow();
    row.insertCell(0).innerText = configuracao.usuario;
    row.insertCell(1).innerText = configuracao.acesso;
    const acoesCell = row.insertCell(2);
    acoesCell.appendChild(criarBotao('Editar', () => editarConfiguracao(configuracao.id)));
    acoesCell.appendChild(criarBotao('Excluir', () => excluirConfiguracao(configuracao.id)));
  }

  function criarBotao(texto, onClick) {
    const button = document.createElement('button');
    button.innerText = texto;
    button.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded m-1';
    button.addEventListener('click', onClick);
    return button;
  }

  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(configForm);
    const configuracao = {
      usuario: formData.get('userAccess'),
      acesso: formData.get('commissionAccess')
    };
    await window.api.salvarConfiguracao(configuracao);
    carregarConfiguracoes();
  });

  async function editarConfiguracao(id) {
    // Implementar lógica de edição
  }

  async function excluirConfiguracao(id) {
    await window.api.excluirConfiguracao(id);
    carregarConfiguracoes();
  }

  await carregarConfiguracoes();
});
