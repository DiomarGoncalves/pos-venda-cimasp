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
    row.insertCell(0).innerText = garantia.produto;
    row.insertCell(1).innerText = garantia.preco_custo;
    row.insertCell(2).innerText = garantia.preco_venda;
    row.insertCell(3).innerText = garantia.data_venda;
    row.insertCell(4).innerText = garantia.vendedor;
    row.insertCell(5).innerHTML = garantia.anexos.split(',').map(anexo => `<a href="${anexo}" target="_blank" class="text-blue-400 hover:text-blue-300">${anexo}</a>`).join('<br>');
    const acoesCell = row.insertCell(6);
    acoesCell.appendChild(criarBotao('Inserir Anexos', () => inserirAnexos(garantia.id)));
    acoesCell.appendChild(criarBotao('Visualizar Anexos', () => visualizarAnexos(garantia.anexos)));
  }

  function criarBotao(texto, onClick) {
    const button = document.createElement('button');
    button.innerText = texto;
    button.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded m-1';
    button.addEventListener('click', onClick);
    return button;
  }

  async function inserirAnexos(id) {
    const { value: files } = await Swal.fire({
      title: 'Selecione os arquivos',
      input: 'file',
      inputAttributes: {
        'multiple': 'multiple'
      },
      showCancelButton: true,
      confirmButtonText: 'Inserir',
      cancelButtonText: 'Cancelar'
    });

    if (files) {
      const formData = [];
      for (let i = 0; i < files.length; i++) {
        formData.push({
          name: files[i].name,
          buffer: await files[i].arrayBuffer()
        });
      }
      await window.api.inserirAnexos(id, formData);
      Swal.fire('Anexos inseridos com sucesso!', '', 'success');
      carregarGarantias();
    }
  }

  function visualizarAnexos(anexos) {
    const anexosArray = anexos.split(',');
    let anexosHtml = '';
    anexosArray.forEach(anexo => {
      anexosHtml += `<a href="${anexo}" target="_blank" class="block text-blue-400 hover:text-blue-300">${anexo}</a>`;
    });
    Swal.fire({
      title: 'Anexos',
      html: anexosHtml,
      width: '600px',
      padding: '3em',
      background: '#fff',
      backdrop: `
        rgba(0,0,123,0.4)
        url("https://cimasp.com.br/site/wp-content/uploads/2022/01/logo-cimasp-1024x242.png")
        left top
        no-repeat
      `
    });
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
