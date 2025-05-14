document.addEventListener('DOMContentLoaded', async () => {
  const vendaForm = document.getElementById('vendaForm');
  const listaVendas = document.getElementById('listaVendas');
  const vendedorSelect = document.getElementById('vendedor');
  let vendaEditando = null;

  // Preencher select de vendedores
  async function carregarVendedores() {
    const usuarios = await window.api.listarUsuarios();
    vendedorSelect.innerHTML = '<option value="">Selecione o Vendedor</option>';
    usuarios.forEach(usuario => {
      const opt = document.createElement('option');
      opt.value = usuario.nome;
      opt.textContent = usuario.nome;
      vendedorSelect.appendChild(opt);
    });
  }

  async function carregarVendas() {
    const vendas = await window.api.listarVendas();
    listaVendas.innerHTML = '';
    vendas.forEach(venda => {
      const row = listaVendas.insertRow();
      row.insertCell(0).innerText = venda.pedidoNectar || '';
      row.insertCell(1).innerText = venda.numeroNota || '';
      row.insertCell(2).innerText = venda.produto || '';
      row.insertCell(3).innerText = venda.cliente || '';
      row.insertCell(4).innerText = venda.valor !== undefined && venda.valor !== null ? Number(venda.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
      row.insertCell(5).innerText = venda.dataCotacao || '';
      row.insertCell(6).innerText = venda.dataVenda || '';
      row.insertCell(7).innerText = venda.vendedor || '';
      row.insertCell(8).innerText = venda.situacao || '';
      row.insertCell(9).innerText = venda.comissao !== undefined && venda.comissao !== null ? Number(venda.comissao).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
      const acoesCell = row.insertCell(10);
      // Botão Editar
      const btnEditar = document.createElement('button');
      btnEditar.innerText = 'Editar';
      btnEditar.className = 'bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded mr-2';
      btnEditar.onclick = () => editarVenda(venda);
      acoesCell.appendChild(btnEditar);
      // Botão Excluir
      const btnExcluir = document.createElement('button');
      btnExcluir.innerText = 'Excluir';
      btnExcluir.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded';
      btnExcluir.onclick = () => excluirVenda(venda.id);
      acoesCell.appendChild(btnExcluir);
    });
  }

  function preencherFormulario(venda) {
    document.getElementById('pedidoNectar').value = venda.pedidoNectar || '';
    document.getElementById('numeroNota').value = venda.numeroNota || '';
    document.getElementById('produto').value = venda.produto || '';
    document.getElementById('cliente').value = venda.cliente || '';
    document.getElementById('valor').value = venda.valor || '';
    document.getElementById('dataCotacao').value = venda.dataCotacao || '';
    document.getElementById('dataVenda').value = venda.dataVenda || '';
    document.getElementById('vendedor').value = venda.vendedor || '';
    document.getElementById('situacao').value = venda.situacao || 'Em Cotação';
  }

  function limparFormulario() {
    document.getElementById('vendaForm').reset();
    vendaEditando = null;
  }

  async function editarVenda(venda) {
    preencherFormulario(venda);
    vendaEditando = venda.id;
  }

  async function excluirVenda(id) {
    await window.api.excluirVenda(id);
    carregarVendas();
    limparFormulario();
  }

  vendaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const venda = {
      pedidoNectar: document.getElementById('pedidoNectar').value,
      numeroNota: document.getElementById('numeroNota').value,
      produto: document.getElementById('produto').value,
      cliente: document.getElementById('cliente').value,
      valor: parseFloat(document.getElementById('valor').value) || 0,
      dataCotacao: document.getElementById('dataCotacao').value,
      dataVenda: document.getElementById('dataVenda').value,
      vendedor: document.getElementById('vendedor').value,
      situacao: document.getElementById('situacao').value
    };
    if (vendaEditando) {
      await window.api.editarVenda(vendaEditando, venda);
      vendaEditando = null;
    } else {
      await window.api.inserirVenda(venda);
    }
    limparFormulario();
    carregarVendas();
  });

  await carregarVendedores();
  carregarVendas();
});
