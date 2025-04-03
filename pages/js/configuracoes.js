document.addEventListener('DOMContentLoaded', () => {
    const equipamentoForm = document.getElementById('equipamentoForm');
    const listaEquipamentos = document.getElementById('listaEquipamentos');
    const novoEquipamento = document.getElementById('novoEquipamento');

    equipamentoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = novoEquipamento.value.trim();
        if (!nome) return;
        const id = await window.api.inserirEquipamento(nome);
        adicionarEquipamento({ id, nome });
        novoEquipamento.value = '';
    });

    function adicionarEquipamento(equipamento) {
        const row = listaEquipamentos.insertRow();
        row.insertCell(0).innerText = equipamento.id;
        row.insertCell(1).innerText = equipamento.nome;
        const acoesCell = row.insertCell(2);
        acoesCell.appendChild(criarBotao('Excluir', () => excluirEquipamento(equipamento.id, row)));
    }

    function criarBotao(texto, onClick) {
        const button = document.createElement('button');
        button.innerText = texto;
        button.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded';
        button.addEventListener('click', onClick);
        return button;
    }

    async function excluirEquipamento(id, row) {
        await window.api.excluirEquipamento(id);
        listaEquipamentos.deleteRow(row.rowIndex);
    }

    (async () => {
        const equipamentos = await window.api.listarEquipamentos();
        equipamentos.forEach(adicionarEquipamento);
    })();
});
