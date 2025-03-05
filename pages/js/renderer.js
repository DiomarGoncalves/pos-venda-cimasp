document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const result = await window.api.login(username, password);
      if (result) {
        window.location.href = 'index.html';
      } else {
        document.getElementById('error-message').innerText = 'Usuário ou senha incorretos';
      }
    });
  }

  const atendimentoForm = document.getElementById('atendimentoForm');
  const listaAtendimentos = document.getElementById('listaAtendimentos')?.getElementsByTagName('tbody')[0];
  const modalVenda = document.getElementById('modalVenda');
  const modalGarantia = document.getElementById('modalGarantia');
  const closeVenda = document.getElementById('closeVenda');
  const closeGarantia = document.getElementById('closeGarantia');

  if (atendimentoForm && listaAtendimentos) {
    atendimentoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(atendimentoForm);
      const atendimento = {
        telefone: formData.get('telefone'),
        nome: formData.get('nome'),
        endereco: formData.get('endereco'),
        motivo: formData.get('motivo'),
        usuario_id: formData.get('usuario'),
        data_inicio: new Date().toLocaleString(),
        anexos: formData.getAll('anexos').join(',')
      };
      const atendimentoId = await window.api.inserirAtendimento(atendimento);
      atendimento.id = atendimentoId;
      adicionarAtendimento(atendimento);
      atendimentoForm.reset();
    });

    async function adicionarAtendimento(atendimento) {
      const row = listaAtendimentos.insertRow();
      row.insertCell(0).innerText = atendimento.telefone;
      row.insertCell(1).innerText = atendimento.nome;
      row.insertCell(2).innerText = atendimento.endereco;
      row.insertCell(3).innerText = atendimento.motivo;
      row.insertCell(4).innerText = atendimento.usuario_id;
      row.insertCell(5).innerText = atendimento.data_inicio;
      const acoesCell = row.insertCell(6);
      acoesCell.appendChild(criarBotao('Excluir', () => excluirAtendimento(row, atendimento.id)));
      acoesCell.appendChild(criarBotao('Editar', () => editarAtendimento(row, atendimento.id)));
      acoesCell.appendChild(criarBotao('Venda', () => abrirModal(modalVenda)));
      acoesCell.appendChild(criarBotao('Garantia', () => abrirModal(modalGarantia)));
    }

    function criarBotao(texto, onClick) {
      const button = document.createElement('button');
      button.innerText = texto;
      button.addEventListener('click', onClick);
      return button;
    }

    async function excluirAtendimento(row, id) {
      await window.api.excluirAtendimento(id);
      listaAtendimentos.deleteRow(row.rowIndex - 1);
    }

    function editarAtendimento(row, id) {
      // Implementar lógica de edição
    }

    function abrirModal(modal) {
      modal.style.display = 'block';
    }

    closeVenda.addEventListener('click', () => {
      modalVenda.style.display = 'none';
    });

    closeGarantia.addEventListener('click', () => {
      modalGarantia.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
      if (event.target == modalVenda) {
        modalVenda.style.display = 'none';
      }
      if (event.target == modalGarantia) {
        modalGarantia.style.display = 'none';
      }
    });

    // Carregar atendimentos existentes
    (async () => {
      const atendimentos = await window.api.listarAtendimentos();
      atendimentos.forEach(adicionarAtendimento);
    })();
  }
});