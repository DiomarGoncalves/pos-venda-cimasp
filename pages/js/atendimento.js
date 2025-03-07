document.addEventListener('DOMContentLoaded', () => {
  const atendimentoForm = document.getElementById('atendimentoForm');
  const listaAtendimentos = document.getElementById('listaAtendimentos');
  const usuarioSelect = document.getElementById('usuario');
  const modalVenda = document.getElementById('modalVenda');
  const modalGarantia = document.getElementById('modalGarantia');
  const modalEditar = document.getElementById('modalEditar');
  const closeVenda = document.getElementById('closeVenda');
  const closeGarantia = document.getElementById('closeGarantia');
  const closeEditar = document.getElementById('closeEditar');
  const vendaForm = document.getElementById('vendaForm');
  const garantiaForm = document.getElementById('garantiaForm');
  const editarForm = document.getElementById('editarForm');
  let atendimentoId;
  let atendimentoRow;
  let atendimentoData;
  let usuarios = [];

  // Função para exibir notificações estilo toast
  function showMessage(message, type) {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.style.position = "fixed";
      toastContainer.style.top = "20px";
      toastContainer.style.right = "20px";
      toastContainer.style.zIndex = "9999";
      toastContainer.style.display = "flex";
      toastContainer.style.flexDirection = "column";
      toastContainer.style.gap = "10px";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `toast-message alert alert-${type}`;
    toast.textContent = message;
    toast.style.padding = "15px 20px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
    toast.style.color = "#fff";
    toast.style.fontWeight = "bold";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    const colors = {
      success: "#4CAF50",
      error: "#F44336",
      warning: "#FFC107",
      info: "#2196F3"
    };
    toast.style.backgroundColor = colors[type] || "#333";

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    }, 100);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-20px)";
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  // Carregar usuários existentes
  async function carregarUsuarios() {
    usuarios = await window.api.listarUsuarios();
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
      showMessage('Atendimento inserido com sucesso!', 'success');
    });

    async function adicionarAtendimento(atendimento) {
      const row = listaAtendimentos.insertRow();
      row.insertCell(0).innerText = atendimento.telefone;
      row.insertCell(1).innerText = atendimento.nome;
      row.insertCell(2).innerText = atendimento.endereco;
      row.insertCell(3).innerText = atendimento.motivo;
      row.insertCell(4).innerText = getUsuarioNome(atendimento.usuario_id);
      row.insertCell(5).innerText = atendimento.data_inicio;
      const acoesCell = row.insertCell(6);
      acoesCell.appendChild(criarBotao('Excluir', () => moverParaHistorico(row, atendimento.id)));
      acoesCell.appendChild(criarBotao('Venda', () => abrirModal(modalVenda, atendimento.id, row, atendimento)));
      acoesCell.appendChild(criarBotao('Garantia', () => abrirModal(modalGarantia, atendimento.id, row, atendimento)));
      acoesCell.appendChild(criarBotao('Editar', () => abrirModalEditar(atendimento, row)));
    }

    function getUsuarioNome(id) {
      const usuario = usuarios.find(user => user.id === id);
      return usuario ? usuario.nome : 'Desconhecido';
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
      showMessage('Atendimento movido para histórico!', 'info');
    }

    function abrirModal(modal, id, row, atendimento) {
      atendimentoId = id;
      atendimentoRow = row;
      atendimentoData = atendimento;
      modal.classList.remove('hidden');
    }

    function abrirModalEditar(atendimento, row) {
      if (editarForm) {
        editarForm.telefone.value = atendimento.telefone || '';
        editarForm.nome.value = atendimento.nome || '';
        editarForm.endereco.value = atendimento.endereco || '';
        editarForm.motivo.value = atendimento.motivo || '';
        atendimentoId = atendimento.id;
        atendimentoRow = row;
        atendimentoData = atendimento;
        modalEditar.classList.remove('hidden');
      }
    }

    closeVenda.addEventListener('click', () => {
      modalVenda.classList.add('hidden');
    });

    closeGarantia.addEventListener('click', () => {
      modalGarantia.classList.add('hidden');
    });

    closeEditar.addEventListener('click', () => {
      modalEditar.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
      if (event.target == modalVenda) {
        modalVenda.classList.add('hidden');
      }
      if (event.target == modalGarantia) {
        modalGarantia.classList.add('hidden');
      }
      if (event.target == modalEditar) {
        modalEditar.classList.add('hidden');
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
          showMessage('Produto não fornecido!', 'error');
          return;
        }
        await window.api.inserirVenda(venda);
        await window.api.moverParaHistorico(atendimentoId);
        modalVenda.classList.add('hidden');
        location.reload(); // Atualiza a página após a inserção da venda
        showMessage('Venda inserida com sucesso!', 'success');
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
        showMessage('Garantia inserida com sucesso!', 'success');
      });
    }

    if (editarForm) {
      editarForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(editarForm);
        const atendimentoAtualizado = {
          telefone: formData.get('telefone'),
          nome: formData.get('nome'),
          endereco: formData.get('endereco'),
          motivo: formData.get('motivo'),
          usuario_id: formData.get('usuario') || atendimentoData.usuario_id,
          data_inicio: atendimentoData.data_inicio
        };
        await window.api.editarAtendimento(atendimentoId, atendimentoAtualizado);
        atendimentoRow.cells[0].innerText = atendimentoAtualizado.telefone;
        atendimentoRow.cells[1].innerText = atendimentoAtualizado.nome;
        atendimentoRow.cells[2].innerText = atendimentoAtualizado.endereco;
        atendimentoRow.cells[3].innerText = atendimentoAtualizado.motivo;
        atendimentoRow.cells[4].innerText = getUsuarioNome(atendimentoAtualizado.usuario_id);
        modalEditar.classList.add('hidden');
        showMessage('Atendimento atualizado com sucesso!', 'success');
      });
    }

    (async () => {
      const atendimentos = await window.api.listarAtendimentos();
      atendimentos.forEach(adicionarAtendimento);
    })();
  }
});

