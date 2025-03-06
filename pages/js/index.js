document.addEventListener('DOMContentLoaded', async () => {
    const totalVendas = document.getElementById('totalVendas');
    const totalAtendimentos = document.getElementById('totalAtendimentos');
    const totalGarantias = document.getElementById('totalGarantias');

    const vendas = await window.api.listarVendas();
    const atendimentos = await window.api.listarAtendimentos();
    const historicoAtendimentos = await window.api.listarHistoricoAtendimentos();
    const garantias = await window.api.listarGarantias();

    totalVendas.innerText = vendas.length;
    totalAtendimentos.innerText = atendimentos.length + historicoAtendimentos.length;
    totalGarantias.innerText = garantias.length;
});
