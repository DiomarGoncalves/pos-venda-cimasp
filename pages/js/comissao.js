document.addEventListener('DOMContentLoaded', async () => {
  const listaComissoes = document.getElementById('listaComissoes');
  const filtroDataInicio = document.getElementById('filtroDataInicio');
  const filtroDataFim = document.getElementById('filtroDataFim');
  const filtroNome = document.getElementById('filtroNome');
  const filtroCliente = document.getElementById('filtroCliente');
  const filtroVendedor = document.getElementById('filtroVendedor');
  const aplicarFiltros = document.getElementById('aplicarFiltros');
  const exportarExcel = document.getElementById('exportarExcel');
  const exportarPDF = document.getElementById('exportarPDF');
  const comissaoTable = document.getElementById('comissaoTable');

  async function carregarComissoes() {
    const comissoes = await window.api.listarComissoes();
    comissoes.forEach(adicionarComissao);
  }

  async function carregarVendas() {
    const vendas = await window.api.listarVendas();
    vendas.forEach(adicionarVenda);
  }

  function adicionarComissao(comissao) {
    const row = listaComissoes.insertRow();
    row.insertCell(0).innerText = comissao.venda_id;
    row.insertCell(1).innerText = comissao.porcentagem;
    const acoesCell = row.insertCell(2);
    acoesCell.appendChild(criarBotao('Editar', () => editarComissao(comissao.id)));
    acoesCell.appendChild(criarBotao('Excluir', () => excluirComissao(comissao.id)));
  }

  function adicionarVenda(venda) {
    const row = comissaoTable.insertRow();
    row.classList.add('bg-gray-700');
    row.insertCell(0).innerText = venda.vendedor;
    row.insertCell(1).innerHTML = `R$ <span class="valor-venda">${venda.preco_venda.toFixed(2)}</span>`;
    const comissaoCell = row.insertCell(2);
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'comissao-percent text-black w-20 p-1';
    input.value = 2.5;
    comissaoCell.appendChild(input);
    row.insertCell(3).innerHTML = `R$ <span class="valor-comissao">${(venda.preco_venda * 0.025).toFixed(2)}</span>`;

    input.addEventListener('input', function() {
      let valorVenda = parseFloat(row.querySelector('.valor-venda').textContent);
      let percent = parseFloat(this.value) || 0;
      let valorComissao = (valorVenda * percent) / 100;
      row.querySelector('.valor-comissao').textContent = valorComissao.toFixed(2);
    });
  }

  function criarBotao(texto, onClick) {
    const button = document.createElement('button');
    button.innerText = texto;
    button.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded m-1';
    button.addEventListener('click', onClick);
    return button;
  }

  function aplicarFiltrosComissoes() {
    const dataInicio = filtroDataInicio.value;
    const dataFim = filtroDataFim.value;
    const nome = filtroNome.value.toLowerCase();
    const cliente = filtroCliente.value.toLowerCase();
    const vendedor = filtroVendedor.value.toLowerCase();

    const rows = listaComissoes.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td');
      const dataVenda = cells[3].innerText;
      const nomeVenda = cells[0].innerText.toLowerCase();
      const clienteVenda = cells[1].innerText.toLowerCase();
      const vendedorVenda = cells[4].innerText.toLowerCase();

      const dataValida = (!dataInicio || dataVenda >= dataInicio) && (!dataFim || dataVenda <= dataFim);
      const nomeValido = !nome || nomeVenda.includes(nome);
      const clienteValido = !cliente || clienteVenda.includes(cliente);
      const vendedorValido = !vendedor || vendedorVenda.includes(vendedor);

      if (dataValida && nomeValido && clienteValido && vendedorValido) {
        rows[i].style.display = '';
      } else {
        rows[i].style.display = 'none';
      }
    }
  }

  function exportarParaExcel() {
    const rows = listaComissoes.getElementsByTagName('tr');
    const wb = XLSX.utils.book_new();
    const ws_data = [['ID da Venda', 'Porcentagem de Comissão']];
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td');
      let row = [];
      for (let j = 0; j < cells.length; j++) {
        row.push(cells[j].innerText);
      }
      ws_data.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Comissões');
    XLSX.writeFile(wb, 'comissoes.xlsx');
  }

  function exportarParaPDF() {
    const rows = listaComissoes.getElementsByTagName('tr');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Lista de Comissões", 20, 20);
    let rowIndex = 30;
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td');
      let row = [];
      for (let j = 0; j < cells.length; j++) {
        row.push(cells[j].innerText);
      }
      doc.text(row.join(" "), 20, rowIndex);
      rowIndex += 10;
    }
    doc.save('comissoes.pdf');
  }

  aplicarFiltros.addEventListener('click', aplicarFiltrosComissoes);
  exportarExcel.addEventListener('click', exportarParaExcel);
  exportarPDF.addEventListener('click', exportarParaPDF);

  await carregarComissoes();
  await carregarVendas();
});
