document.addEventListener('DOMContentLoaded', async () => {
  const listaGarantias = document.getElementById('listaGarantias');
  const filtroDataInicio = document.getElementById('filtroDataInicio');
  const filtroDataFim = document.getElementById('filtroDataFim');
  const filtroNome = document.getElementById('filtroNome');
  const filtroCliente = document.getElementById('filtroCliente');
  const filtroVendedor = document.getElementById('filtroVendedor');
  const aplicarFiltros = document.getElementById('aplicarFiltros');
  const exportarExcel = document.getElementById('exportarExcel');
  const exportarPDF = document.getElementById('exportarPDF');

  async function carregarGarantias() {
    const garantias = await window.api.listarGarantias();
    garantias.forEach(adicionarGarantia);
  }

  function adicionarGarantia(garantia) {
    const row = listaGarantias.insertRow();
    row.insertCell(0).innerText = garantia.data_servico;
    row.insertCell(1).innerText = garantia.prestador;
    row.insertCell(2).innerText = garantia.telefone;
    row.insertCell(3).innerText = garantia.endereco;
    row.insertCell(4).innerText = garantia.motivo;
    row.insertCell(5).innerText = garantia.nota;
    row.insertCell(6).innerText = garantia.peca_substituida;
    row.insertCell(7).innerText = garantia.valor;
  }

  function aplicarFiltrosGarantias() {
    const dataInicio = filtroDataInicio.value;
    const dataFim = filtroDataFim.value;
    const nome = filtroNome.value.toLowerCase();
    const cliente = filtroCliente.value.toLowerCase();
    const vendedor = filtroVendedor.value.toLowerCase();

    const rows = listaGarantias.getElementsByTagName('tr');
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
    const rows = listaGarantias.getElementsByTagName('tr');
    const wb = XLSX.utils.book_new();
    const ws_data = [['Produto', 'Preço de Custo', 'Preço de Venda', 'Data da Venda', 'Vendedor', 'Anexos']];
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td');
      let row = [];
      for (let j = 0; j < cells.length; j++) {
        row.push(cells[j].innerText);
      }
      ws_data.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Garantias');
    XLSX.writeFile(wb, 'garantias.xlsx');
  }

  function exportarParaPDF() {
    const rows = listaGarantias.getElementsByTagName('tr');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Lista de Garantias", 20, 20);
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
    doc.save('garantias.pdf');
  }

  aplicarFiltros.addEventListener('click', aplicarFiltrosGarantias);
  exportarExcel.addEventListener('click', exportarParaExcel);
  exportarPDF.addEventListener('click', exportarParaPDF);

  await carregarGarantias();
});
