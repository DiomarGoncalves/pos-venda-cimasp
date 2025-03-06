document.addEventListener('DOMContentLoaded', () => {
  const atendimentoForm = document.getElementById('atendimentoForm');
  const listaAtendimentos = document.getElementById('listaAtendimentos');
  const usuarioSelect = document.getElementById('usuario');
  const modalVenda = document.getElementById('modalVenda');
  const modalGarantia = document.getElementById('modalGarantia');
  const closeVenda = document.getElementById('closeVenda');
  const closeGarantia = document.getElementById('closeGarantia');
  const vendaForm = document.getElementById('vendaForm');
  const garantiaForm = document.getElementById('garantiaForm');
  let atendimentoId;
  let atendimentoRow;
  let atendimentoData;

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
        data_inicio: new Date().toLocaleString()
      };
      atendimentoId = await window.api.inserirAtendimento(atendimento);
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
      acoesCell.appendChild(criarBotao('Excluir', () => moverParaHistorico(row, atendimento.id)));
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

    async function moverParaHistorico(row, id) {
      await window.api.moverParaHistorico(id);
      listaAtendimentos.deleteRow(row.rowIndex - 1);
    }

    function abrirModal(modal, id, row, atendimento) {
      atendimentoId = id;
      atendimentoRow = row;
      atendimentoData = atendimento;
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
        const venda = {
          atendimento_id: atendimentoId,
          telefone: atendimentoData.telefone,
          nome: atendimentoData.nome,
          endereco: atendimentoData.endereco,
          motivo: atendimentoData.motivo,
          usuario_id: atendimentoData.usuario_id,
          data_inicio: atendimentoData.data_inicio,
          produto: formData.get('produto'),
          preco_custo: formData.get('precoCusto'),
          preco_venda: formData.get('precoVenda'),
          data_venda: formData.get('dataVenda'),
          vendedor: formData.get('vendedor'),
          cliente: formData.get('cliente'),
          nota_fiscal: formData.get('notaFiscal'),
          pedido_venda: formData.get('pedidoVenda'),
          prazo_fabricacao: formData.get('prazoFabricacao')
        };

        console.log('Dados da venda:', venda); // Log para depuração
        if (!venda.produto) {
          console.error('Produto não fornecido'); // Log para depuração
          return;
        }
        await window.api.inserirVenda(venda);
        await window.api.moverParaHistorico(atendimentoId);
        modalVenda.classList.add('hidden');
        location.reload(); // Atualiza a página após a inserção da venda
      });
    }

    if (garantiaForm) {
      garantiaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(garantiaForm);
        const garantia = {
          atendimento_id: atendimentoId,
          telefone: atendimentoData.telefone,
          nome: atendimentoData.nome,
          endereco: atendimentoData.endereco,
          motivo: atendimentoData.motivo,
          usuario_id: atendimentoData.usuario_id,
          data_inicio: atendimentoData.data_inicio,
          data_servico: formData.get('dataServico'),
          prestador: formData.get('prestador'),
          nota: formData.get('nota'),
          peca_substituida: formData.get('pecaSubstituida'),
          valor: formData.get('valor')
        };
        console.log('Dados da garantia:', garantia); // Log para depuração
        await window.api.inserirGarantia(garantia);
        await window.api.moverParaHistorico(atendimentoId);
        modalGarantia.classList.add('hidden');
        location.reload(); // Atualiza a página após a inserção da garantia
      });
    }

    (async () => {
      const atendimentos = await window.api.listarAtendimentos();
      atendimentos.forEach(adicionarAtendimento);
    })();
  }
});