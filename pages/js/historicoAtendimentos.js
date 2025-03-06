document.addEventListener('DOMContentLoaded', async () => {
    const listaHistoricoAtendimentos = document.getElementById('listaHistoricoAtendimentos');
    const filtroDataInicio = document.getElementById('filtroDataInicio');
    const filtroDataFim = document.getElementById('filtroDataFim');
    const filtroNome = document.getElementById('filtroNome');
    const filtroMotivo = document.getElementById('filtroMotivo');
    const aplicarFiltros = document.getElementById('aplicarFiltros');
    const exportarExcel = document.getElementById('exportarExcel');
    const exportarPDF = document.getElementById('exportarPDF');

    const historicoAtendimentos = await window.api.listarHistoricoAtendimentos();
    const usuarios = await window.api.listarUsuarios();

    function getUsuarioNome(id) {
        const usuario = usuarios.find(user => user.id === id);
        return usuario ? usuario.nome : 'Desconhecido';
    }

    function adicionarAtendimento(atendimento) {
        const row = listaHistoricoAtendimentos.insertRow();
        row.insertCell(0).innerText = atendimento.telefone;
        row.insertCell(1).innerText = atendimento.nome;
        row.insertCell(2).innerText = atendimento.endereco;
        row.insertCell(3).innerText = atendimento.motivo;
        row.insertCell(4).innerText = getUsuarioNome(atendimento.usuario_id);
        row.insertCell(5).innerText = atendimento.data_inicio;
        row.insertCell(6).innerText = atendimento.data_fim;
    }

    historicoAtendimentos.forEach(adicionarAtendimento);

    function aplicarFiltrosHistorico() {
        const dataInicio = filtroDataInicio.value;
        const dataFim = filtroDataFim.value;
        const nome = filtroNome.value.toLowerCase();
        const motivo = filtroMotivo.value.toLowerCase();

        const rows = listaHistoricoAtendimentos.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            const dataInicioAtendimento = cells[5].innerText;
            const dataFimAtendimento = cells[6].innerText;
            const nomeAtendimento = cells[1].innerText.toLowerCase();
            const motivoAtendimento = cells[3].innerText.toLowerCase();

            const dataValida = (!dataInicio || dataInicioAtendimento >= dataInicio) && (!dataFim || dataFimAtendimento <= dataFim);
            const nomeValido = !nome || nomeAtendimento.includes(nome);
            const motivoValido = !motivo || motivoAtendimento.includes(motivo);

            if (dataValida && nomeValido && motivoValido) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    }

    function exportarParaExcel() {
        const rows = listaHistoricoAtendimentos.getElementsByTagName('tr');
        const wb = XLSX.utils.book_new();
        const ws_data = [['Telefone', 'Nome', 'Endereço', 'Motivo', 'Usuário', 'Data Início', 'Data Fim']];
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            let row = [];
            for (let j = 0; j < cells.length; j++) {
                row.push(cells[j].innerText);
            }
            ws_data.push(row);
        }
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Atendimentos');
        XLSX.writeFile(wb, 'historico_atendimentos.xlsx');
    }

    function exportarParaPDF() {
        const rows = listaHistoricoAtendimentos.getElementsByTagName('tr');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Histórico de Atendimentos", 20, 20);
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
        doc.save('historico_atendimentos.pdf');
    }

    aplicarFiltros.addEventListener('click', aplicarFiltrosHistorico);
    exportarExcel.addEventListener('click', exportarParaExcel);
    exportarPDF.addEventListener('click', exportarParaPDF);
});
