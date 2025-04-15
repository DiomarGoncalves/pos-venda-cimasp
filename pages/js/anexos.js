document.addEventListener('DOMContentLoaded', () => {
    const anexosForm = document.getElementById('anexosForm');
    const visualizarForm = document.getElementById('visualizarForm');
    const anexosLista = document.getElementById('anexosLista');
    const pastasClientes = document.getElementById('pastasClientes');

    // Função para exibir notificações estilo toast
    function showMessage(message, type) {
        let toastContainer = document.getElementById("toast-container");
        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.id = "toast-container";
            toastContainer.style.position = "fixed";
            toastContainer.style.top = "20px";
            toastContainer.style.right = "20px";
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
            info: "#2196F3"
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

    anexosForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(anexosForm);
        const clienteNome = formData.get('clienteNome');
        const files = formData.getAll('anexos');
        const fileData = [];

        if (!clienteNome || clienteNome.trim() === '') {
            showMessage('O nome do cliente é obrigatório!', 'error');
            return;
        }

        for (let file of files) {
            fileData.push({
                name: file.name,
                buffer: await file.arrayBuffer()
            });
        }

        try {
            await window.api.inserirAnexos(clienteNome.trim(), fileData);
            showMessage('Anexos inseridos com sucesso!', 'success');
            anexosForm.reset();
            listarPastasClientes();
        } catch (error) {
            console.error('Erro ao inserir anexos:', error);
            showMessage('Erro ao inserir anexos!', 'error');
        }
    });

    // visualizarForm.addEventListener('submit', async (e) => {
    //     e.preventDefault();
    //     const formData = new FormData(visualizarForm);
    //     const clienteNome = formData.get('clienteNomeVisualizar');
    //     const anexos = await window.api.listarAnexos(clienteNome);

    //     anexosLista.innerHTML = '';
    //     anexos.split(',').forEach(anexo => {
    //         const link = document.createElement('a');
    //         link.href = anexo;
    //         link.target = '_blank';
    //         link.className = 'block text-blue-400 hover:text-blue-300';
    //         link.innerText = anexo;
    //         anexosLista.appendChild(link);
    //     });
    // });

    async function listarPastasClientes() {
        try {
            const pastas = await window.api.listarPastasClientes();
            pastasClientes.innerHTML = '';
            pastas.forEach(pasta => {
                const div = document.createElement('div');
                div.className = 'p-2 bg-gray-700 rounded border border-gray-600 cursor-pointer hover:bg-gray-600';
                div.innerText = pasta;

                // Adiciona evento de clique para abrir os anexos da pasta
                div.addEventListener('click', async () => {
                    try {
                        const anexos = await window.api.listarAnexos(pasta);
                        anexosLista.innerHTML = '';
                        anexos.forEach(anexo => {
                            const link = document.createElement('a');
                            link.href = anexo;
                            link.target = '_blank';
                            link.className = 'block text-blue-400 hover:text-blue-300';
                            link.innerText = anexo.split('\\').pop(); // Exibe apenas o nome do arquivo
                            anexosLista.appendChild(link);
                        });
                        showMessage(`Anexos carregados para a pasta: ${pasta}`, 'info');
                    } catch (error) {
                        console.error('Erro ao listar anexos:', error);
                        showMessage('Erro ao listar anexos!', 'error');
                    }
                });

                pastasClientes.appendChild(div);
            });
        } catch (error) {
            console.error('Erro ao listar pastas de clientes:', error);
            showMessage('Erro ao listar pastas de clientes!', 'error');
        }
    }

    listarPastasClientes();
});
