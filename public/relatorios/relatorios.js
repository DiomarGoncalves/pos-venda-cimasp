const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const ExcelJS = require('exceljs');
const os = require('os'); // Para obter o caminho da área de trabalho
const db = require('../database/database');

// Obtém o caminho da área de trabalho do usuário
const desktopPath = path.join(os.homedir(), 'Desktop');

async function gerarPdf() {
    const assistencias = await db.listarAssistencias();
    const doc = new jsPDF();

    doc.text('Relatório de Assistências Técnicas', 10, 10);
    assistencias.forEach((assistencia, index) => {
        doc.text(`${index + 1}. ${assistencia.of} - ${assistencia.cliente}`, 10, 20 + index * 10);
    });

    const filePath = path.join(desktopPath, 'relatorio_assistencia.pdf');
    doc.save(filePath);
    console.log(`Relatório PDF salvo em: ${filePath}`);
    return filePath;
}

async function gerarXlsx() {
    const assistencias = await db.listarAssistencias();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Assistências');

    sheet.columns = [
        { header: 'OF', key: 'of', width: 15 },
        { header: 'Equipamento', key: 'equipamento', width: 20 },
        { header: 'Chassi / Placa', key: 'chassi', width: 20 },
        { header: 'Cliente', key: 'cliente', width: 20 },
        { header: 'Data Fabricação', key: 'dataFabricacao', width: 20 },
        { header: 'Data Abertura Chamado', key: 'dataAberturaChamado', width: 25 },
        { header: 'Técnico', key: 'tecnico', width: 20 },
        { header: 'Tipo Assistência', key: 'tipoAssistencia', width: 20 },
        { header: 'Local Assistência', key: 'localAssistencia', width: 20 },
        { header: 'Contato', key: 'contato', width: 20 },
        { header: 'Telefone', key: 'telefone', width: 15 },
        { header: 'Problema Apresentado', key: 'problemaApresentado', width: 30 },
        { header: 'Fornecedor', key: 'fornecedor', width: 20 },
        { header: 'Peça', key: 'peca', width: 20 },
        { header: 'Observações', key: 'observacoes', width: 30 },
        { header: 'Data Atendimento', key: 'dataAtendimento', width: 20 },
        { header: 'Técnico Responsável', key: 'tecnicoResponsavel', width: 20 },
        { header: 'Custo Peça/Mão de Obra', key: 'custoPecaMaoObra', width: 20 },
        { header: 'Custo Viagem/Frete', key: 'custoViagemFrete', width: 20 },
        { header: 'Devolução Peça', key: 'devolucaoPeca', width: 20 },
        { header: 'Garantia Fornecedor', key: 'garantiaFornecedor', width: 20 },
        { header: 'Solução Técnica', key: 'solucaoTecnica', width: 30 },
    ];

    assistencias.forEach(assistencia => {
        sheet.addRow(assistencia);
    });

    // Estiliza o cabeçalho
    sheet.getRow(1).eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '1f2937' }, // Fundo azul
        };
        cell.font = {
            color: { argb: 'FFFFFF' }, // Texto branco
            bold: true,
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const filePath = path.join(desktopPath, 'relatorio_assistencia.xlsx');
    await workbook.xlsx.writeFile(filePath);
    console.log(`Relatório XLSX salvo em: ${filePath}`);
    return filePath;
}

module.exports = { gerarPdf, gerarXlsx };
