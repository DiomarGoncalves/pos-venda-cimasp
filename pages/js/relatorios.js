document.addEventListener('DOMContentLoaded', () => {
    const listaRelatorios = document.getElementById('listaRelatorios');
    const filtroInput = document.getElementById('filtro');
    const exportPdfButton = document.getElementById('exportPdf');
    const exportXlsxButton = document.getElementById('exportXlsx');

    async function carregarRelatorios() {
        try {
            const assistencias = await window.api.listarAssistencias();
            listaRelatorios.innerHTML = ''; // Limpa a tabela antes de recarregar
            assistencias.forEach(adicionarRelatorio);
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
        }
    }

    function adicionarRelatorio(assistencia) {
        const row = listaRelatorios.insertRow();
        row.insertCell(0).innerText = assistencia.of || 'N/A';
        row.insertCell(1).innerText = assistencia.equipamento || 'N/A';
        row.insertCell(2).innerText = assistencia.chassi || 'N/A';
        row.insertCell(3).innerText = assistencia.cliente || 'N/A';
        row.insertCell(4).innerText = assistencia.dataFabricacao || 'N/A';
        row.insertCell(5).innerText = assistencia.dataAberturaChamado || 'N/A';
        row.insertCell(6).innerText = assistencia.tecnico || 'N/A';
        row.insertCell(7).innerText = assistencia.tipoAssistencia || 'N/A';
        row.insertCell(8).innerText = assistencia.localAssistencia || 'N/A';
        row.insertCell(9).innerText = assistencia.contato || 'N/A';
        row.insertCell(10).innerText = assistencia.telefone || 'N/A';
        row.insertCell(11).innerText = assistencia.problemaApresentado || 'N/A';
        row.insertCell(12).innerText = assistencia.fornecedor || 'N/A';
        row.insertCell(13).innerText = assistencia.peca || 'N/A';
        row.insertCell(14).innerText = assistencia.observacoes || 'N/A';
        row.insertCell(15).innerText = assistencia.dataAtendimento || 'N/A';
        row.insertCell(16).innerText = assistencia.tecnicoResponsavel || 'N/A';
        row.insertCell(17).innerText = assistencia.custoPecaMaoObra || 'N/A';
        row.insertCell(18).innerText = assistencia.custoViagemFrete || 'N/A';
        row.insertCell(19).innerText = assistencia.devolucaoPeca || 'N/A';
        row.insertCell(20).innerText = assistencia.garantiaFornecedor || 'N/A';
        row.insertCell(21).innerText = assistencia.solucaoTecnica || 'N/A';
    }

    filtroInput.addEventListener('input', () => {
        const filtro = filtroInput.value.toLowerCase();
        Array.from(listaRelatorios.rows).forEach(row => {
            const valores = Array.from(row.cells).map(cell => cell.innerText.toLowerCase());
            row.style.display = valores.some(valor => valor.includes(filtro)) ? '' : 'none';
        });
    });

    exportPdfButton.addEventListener('click', () => {
        window.api.gerarRelatorioPdf();
    });

    exportXlsxButton.addEventListener('click', () => {
        window.api.gerarRelatorioXlsx();
    });

    carregarRelatorios();
});
