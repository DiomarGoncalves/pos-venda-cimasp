document.addEventListener('DOMContentLoaded', () => {

  const atendimentoForm = document.getElementById('atendimentoForm');
  const listaAtendimentos = document.getElementById('listaAtendimentos')?.getElementsByTagName('tbody')[0];
  const usuarioSelect = document.getElementById('usuario');
  const modalVenda = document.getElementById('modalVenda');
  const modalGarantia = document.getElementById('modalGarantia');
  const closeVenda = document.getElementById('closeVenda');
  const closeGarantia = document.getElementById('closeGarantia');
  const vendaForm = document.getElementById('vendaForm');
  const garantiaForm = document.getElementById('garantiaForm');
  let atendimentoId; // Definir atendimentoId no escopo correto
  let atendimentoRow; // Definir atendimentoRow no escopo correto
  let atendimentoData; // Definir atendimentoData no escopo correto

  // Carregar usuários existentes
  async function carregarUsuarios() {
    const usuarios = await window.api.listarUsuarios();
    usuarios.forEach(usuario => {
      const option = document.createElement('option');
      option.value = usuario.id;
      option.text = usuario.nome;
      usuarioSelect.appendChild(option);
    });
  }

  if (usuarioSelect) {
    carregarUsuarios();
  }

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
        anexos: formData.getAll('anexos').map(file => file.name).join(',') // Salvar nomes dos arquivos
      };
      atendimentoId = await window.api.inserirAtendimento(atendimento); // Atualizar atendimentoId
      console.log('Atendimento inserido com ID:', atendimentoId); // Log para depuração
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
      acoesCell.appendChild(criarBotao('Venda', () => abrirModal(modalVenda, atendimento.id, row, atendimento)));
      acoesCell.appendChild(criarBotao('Garantia', () => abrirModal(modalGarantia, atendimento.id, row, atendimento)));
    }

    function criarBotao(texto, onClick) {
      const button = document.createElement('button');
      button.innerText = texto;
      button.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded m-1';
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

    function abrirModal(modal, id, row, atendimento) {
      atendimentoId = id; // Atualizar atendimentoId ao abrir o modal
      atendimentoRow = row; // Atualizar atendimentoRow ao abrir o modal
      atendimentoData = atendimento; // Atualizar atendimentoData ao abrir o modal
      console.log('Abrindo modal com atendimento ID:', atendimentoId); // Log para depuração
      modal.classList.remove('hidden');
    }

    closeVenda.addEventListener('click', () => {
      modalVenda.classList.add('hidden');
    });

    closeGarantia.addEventListener('click', () => {
      modalGarantia.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
      if (event.target == modalVenda) {
        modalVenda.classList.add('hidden');
      }
      if (event.target == modalGarantia) {
        modalGarantia.classList.add('hidden');
      }
    });

    if (vendaForm) {
      vendaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(vendaForm);
        const produto = formData.get('produto');
        const precoCusto = formData.get('precoCusto');
        const precoVenda = formData.get('precoVenda');
        const dataVenda = formData.get('dataVenda');
        const vendedor = formData.get('vendedor');
        console.log('Produto:', produto); // Log para depuração
        console.log('Preço de Custo:', precoCusto); // Log para depuração
        console.log('Preço de Venda:', precoVenda); // Log para depuração
        console.log('Data da Venda:', dataVenda); // Log para depuração
        console.log('Vendedor:', vendedor); // Log para depuração
        const venda = {
          atendimento_id: atendimentoId, // Usar atendimentoId do escopo correto
          telefone: atendimentoData.telefone,
          nome: atendimentoData.nome,
          endereco: atendimentoData.endereco,
          motivo: atendimentoData.motivo,
          usuario_id: atendimentoData.usuario_id,
          data_inicio: atendimentoData.data_inicio,
          anexos: atendimentoData.anexos,
          produto: produto,
          preco_custo: precoCusto,
          preco_venda: precoVenda,
          data_venda: dataVenda,
          vendedor: vendedor
        };
        console.log('Dados da venda:', venda); // Log para depuração
        await window.api.inserirVenda(venda);
        await window.api.excluirAtendimento(atendimentoId); // Atualizar status do atendimento para "fechado"
        listaAtendimentos.deleteRow(atendimentoRow.rowIndex); // Remover atendimento da lista
        modalVenda.classList.add('hidden');
      });
    }

    if (garantiaForm) {
      garantiaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(garantiaForm);
        const garantia = {
          atendimento_id: atendimentoId, // Usar atendimentoId do escopo correto
          telefone: atendimentoData.telefone,
          nome: atendimentoData.nome,
          endereco: atendimentoData.endereco,
          motivo: atendimentoData.motivo,
          usuario_id: atendimentoData.usuario_id,
          data_inicio: atendimentoData.data_inicio,
          anexos: atendimentoData.anexos,
          data_servico: formData.get('dataServico'),
          prestador: formData.get('prestador')
        };
        console.log('Dados da garantia:', garantia); // Log para depuração
        await window.api.inserirGarantia(garantia);
        await window.api.excluirAtendimento(atendimentoId); // Atualizar status do atendimento para "fechado"
        listaAtendimentos.deleteRow(atendimentoRow.rowIndex); // Remover atendimento da lista
        modalGarantia.classList.add('hidden');
      });
    }

    // Carregar atendimentos existentes
    (async () => {
      const atendimentos = await window.api.listarAtendimentos();
      atendimentos.forEach(adicionarAtendimento);
    })();
  }
});