document.addEventListener('DOMContentLoaded', () => {
    const listaAssistencias = document.getElementById('listaAssistencias');
    const assistenciaForm = document.getElementById('assistenciaForm');
    const abrirPlanilhaButton = document.getElementById('abrirPlanilha');
    let assistenciaEditando = null; // Variável para armazenar a assistência sendo editada

    // Função para exibir notificações estilo toast
    function showMessage(message, type) {
        let toastContainer = document.getElementById("toast-container");
        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.id = "toast-container";
            toastContainer.style.position = "fixed";
            toastContainer.style.top = "20px";
            toastContainer.style.left = "20px";
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
            info: "#2196F3",
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

    function adicionarAssistencia(assistencia) {
        const row = listaAssistencias.insertRow();
        row.insertCell(0).innerText = assistencia.of || 'N/A';
        row.insertCell(1).innerText = assistencia.equipamento || 'N/A';
        row.insertCell(2).innerText = assistencia.cliente || 'N/A';
        row.insertCell(3).innerText = assistencia.dataAtendimento || 'N/A';
        const acoesCell = row.insertCell(4);
        acoesCell.appendChild(criarBotao('Editar', () => carregarAssistenciaParaEdicao(assistencia, row)));
        acoesCell.appendChild(criarBotao('Excluir', () => excluirAssistencia(assistencia.id)));
    }

    function criarBotao(texto, onClick) {
        const button = document.createElement('button');
        button.innerText = texto;
        button.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded m-1';
        button.addEventListener('click', onClick);
        return button;
    }

    function carregarAssistenciaParaEdicao(assistencia, row) {
        assistenciaEditando = { id: assistencia.id, row }; // Armazena o ID e a linha da assistência sendo editada
        for (const key in assistencia) {
            const input = document.getElementById(key);
            if (input) {
                input.value = assistencia[key];
            }
        }
        showMessage('Assistência carregada para edição.', 'info');
    }

    async function salvarEdicaoAssistencia() {
        if (!assistenciaEditando) return;

        const formData = new FormData(assistenciaForm);
        const assistenciaEditada = Object.fromEntries(formData.entries());

        try {
            await window.api.editarAssistencia(assistenciaEditando.id, assistenciaEditada);

            // Atualizar a linha na tabela
            const { row } = assistenciaEditando;
            row.cells[0].innerText = assistenciaEditada.of || 'N/A';
            row.cells[1].innerText = assistenciaEditada.equipamento || 'N/A';
            row.cells[2].innerText = assistenciaEditada.cliente || 'N/A';
            row.cells[3].innerText = assistenciaEditada.dataAtendimento || 'N/A';

            showMessage('Assistência editada com sucesso.', 'success');
            assistenciaForm.reset();
            assistenciaEditando = null; // Limpa o estado de edição
        } catch (error) {
            console.error('Erro ao editar assistência:', error);
            showMessage('Erro ao editar assistência. Verifique o console para mais detalhes.', 'error');
        }
    }

    async function excluirAssistencia(id) {
        try {
            await window.api.excluirAssistencia(id);
            showMessage('Assistência excluída com sucesso.', 'success');
            carregarAssistencias(); // Atualiza a lista após exclusão
        } catch (error) {
            console.error('Erro ao excluir assistência:', error);
            showMessage(`Erro ao excluir assistência: ${error.message}`, 'error');
        }
    }

    async function carregarAssistencias() {
        try {
            const assistencias = await window.api.listarAssistencias();
            console.log('Assistências carregadas:', assistencias); // Log para depuração
            listaAssistencias.innerHTML = ''; // Limpa a tabela antes de recarregar
            if (assistencias.length === 0) {
                showMessage('Nenhuma assistência encontrada no banco de dados.', 'warning');
                console.warn('Nenhuma assistência encontrada no banco de dados.');
            } else {
                assistencias.forEach(adicionarAssistencia);
                showMessage('Assistências carregadas com sucesso.', 'success');
            }
        } catch (error) {
            console.error('Erro ao carregar assistências:', error); // Log para depuração
            showMessage('Erro ao carregar assistências. Verifique o console para mais detalhes.', 'error');
        }
    }

    assistenciaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (assistenciaEditando) {
            await salvarEdicaoAssistencia();
        } else {
            const formData = new FormData(assistenciaForm);
            const assistencia = Object.fromEntries(formData.entries());
            console.log('Assistência a ser inserida frontend:', assistencia); // Log para depuração

            try {
                const id = await window.api.inserirAssistencia(assistencia);

                assistencia.id = id;
                adicionarAssistencia(assistencia);
                showMessage('Assistência inserida com sucesso.', 'success');
                assistenciaForm.reset();
            } catch (error) {
                console.error('Erro ao inserir assistência:', error); // Log para depuração
                showMessage('Erro ao inserir assistência. Verifique o console para mais detalhes.', 'error');
            }
        }
    });

    if (abrirPlanilhaButton) {
        abrirPlanilhaButton.addEventListener('click', async () => {
            try {
                await window.api.abrirPlanilhaOfs();
                console.log('Planilha aberta com sucesso.');
            } catch (error) {
                console.error('Erro ao abrir a planilha:', error);
                alert('Erro ao abrir a planilha. Verifique o console para mais detalhes.');
            }
        });
    }

    carregarAssistencias();
});
