/**
 * ministerios.js - Funções para gerenciamento de ministérios
 * Agenda de Serviços — CCB Administração Ituiutaba
 */

// Referência à coleção de ministérios no Firestore
const ministeriosRef = db.collection('ministerios');

// Referência à coleção de usuários no Firestore
const usersRef = db.collection('users');

// Elementos do DOM
const ministerioForm = document.getElementById('ministerioForm');
const ministeriosList = document.getElementById('ministeriosList');
const ministeriosTable = document.getElementById('ministeriosTable');
const ministeriosTableBody = document.getElementById('ministeriosTableBody');
const searchMinisterioInput = document.getElementById('searchMinisterio');
const addMinisterioBtn = document.getElementById('addMinisterioBtn');
const ministerioModal = new bootstrap.Modal(document.getElementById('ministerioModal'));
const deleteMinisterioModal = new bootstrap.Modal(document.getElementById('deleteMinisterioModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteMinisterio');
const viewMinisterioModal = new bootstrap.Modal(document.getElementById('viewMinisterioModal'));

// ID do ministério atual sendo editado ou excluído
let currentMinisterioId = null;

// Listener para quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de ministérios
    if (ministerioForm) {
        initMinisterios();
    }
});

/**
 * Inicializar a página de ministérios
 */
function initMinisterios() {
    // Configurar listeners de eventos
    setupEventListeners();
    
    // Carregar lista de ministérios
    loadMinisterios();
    
    // Carregar lista de usuários para o select de responsável
    loadResponsaveis();
}

/**
 * Configurar listeners de eventos
 */
function setupEventListeners() {
    // Listener para o formulário de ministério
    if (ministerioForm) {
        ministerioForm.addEventListener('submit', handleMinisterioSubmit);
    }
    
    // Listener para o botão de adicionar ministério
    if (addMinisterioBtn) {
        addMinisterioBtn.addEventListener('click', () => {
            resetMinisterioForm();
            document.getElementById('ministerioModalLabel').textContent = 'Adicionar Ministério';
            ministerioModal.show();
        });
    }
    
    // Listener para o botão de confirmar exclusão
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteMinisterio);
    }
    
    // Listener para o campo de busca
    if (searchMinisterioInput) {
        searchMinisterioInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterMinisterios(searchTerm);
        });
    }
}

/**
 * Carregar lista de ministérios do Firestore
 */
function loadMinisterios() {
    // Mostrar indicador de carregamento
    if (ministeriosTableBody) {
        ministeriosTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    }
    
    // Buscar ministérios ordenados por nome
    ministeriosRef.orderBy('nome').get()
        .then((querySnapshot) => {
            // Limpar tabela
            if (ministeriosTableBody) {
                ministeriosTableBody.innerHTML = '';
            }
            
            // Verificar se há ministérios
            if (querySnapshot.empty) {
                if (ministeriosTableBody) {
                    ministeriosTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum ministério cadastrado.</td></tr>';
                }
                return;
            }
            
            // Processar cada ministério
            querySnapshot.forEach((doc) => {
                const ministerio = doc.data();
                ministerio.id = doc.id;
                
                // Adicionar à tabela
                if (ministeriosTableBody) {
                    addMinisterioToTable(ministerio);
                }
                
                // Adicionar ao grid de cards (se existir)
                if (ministeriosList) {
                    addMinisterioToGrid(ministerio);
                }
            });
        })
        .catch((error) => {
            console.error('Erro ao carregar ministérios:', error);
            Utils.showAlert('Erro ao carregar ministérios. Tente novamente.', 'danger');
            
            if (ministeriosTableBody) {
                ministeriosTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Erro ao carregar ministérios.</td></tr>';
            }
        });
}

/**
 * Carregar lista de usuários para o select de responsável
 */
function loadResponsaveis() {
    const responsavelSelect = document.getElementById('ministerioResponsavel');
    
    if (!responsavelSelect) return;
    
    // Limpar opções atuais, mantendo a primeira (selecione)
    responsavelSelect.innerHTML = '<option value="">Selecione um responsável</option>';
    
    // Buscar usuários
    usersRef.orderBy('nome').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const user = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = user.nome;
                responsavelSelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Erro ao carregar responsáveis:', error);
        });
}

/**
 * Adicionar ministério à tabela
 */
function addMinisterioToTable(ministerio) {
    if (!ministeriosTableBody) return;
    
    const row = document.createElement('tr');
    row.setAttribute('data-id', ministerio.id);
    
    // Formatar data de criação
    const createdAt = ministerio.createdAt ? new Date(ministerio.createdAt.toDate()) : new Date();
    const formattedDate = Utils.formatDate(createdAt);
    
    // Contar membros
    const membrosCount = ministerio.membros ? ministerio.membros.length : 0;
    
    row.innerHTML = `
        <td>${ministerio.nome}</td>
        <td>${Utils.truncateText(ministerio.descricao || '', 50)}</td>
        <td>${membrosCount}</td>
        <td>${formattedDate}</td>
        <td>
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-info view-ministerio" data-id="${ministerio.id}" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-primary edit-ministerio" data-id="${ministerio.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-danger delete-ministerio" data-id="${ministerio.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Adicionar event listeners para os botões
    row.querySelector('.view-ministerio').addEventListener('click', () => viewMinisterio(ministerio.id));
    row.querySelector('.edit-ministerio').addEventListener('click', () => editMinisterio(ministerio.id));
    row.querySelector('.delete-ministerio').addEventListener('click', () => showDeleteModal(ministerio.id));
    
    ministeriosTableBody.appendChild(row);
}

/**
 * Adicionar ministério ao grid de cards
 */
function addMinisterioToGrid(ministerio) {
    if (!ministeriosList) return;
    
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    card.setAttribute('data-id', ministerio.id);
    
    // Formatar data de criação
    const createdAt = ministerio.createdAt ? new Date(ministerio.createdAt.toDate()) : new Date();
    const formattedDate = Utils.formatDate(createdAt);
    
    // Contar membros
    const membrosCount = ministerio.membros ? ministerio.membros.length : 0;
    
    card.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <h5 class="card-title">${ministerio.nome}</h5>
                <p class="card-text">${Utils.truncateText(ministerio.descricao || '', 100)}</p>
                <p class="card-text"><small class="text-muted">Membros: ${membrosCount}</small></p>
                <p class="card-text"><small class="text-muted">Criado em: ${formattedDate}</small></p>
            </div>
            <div class="card-footer bg-transparent">
                <div class="btn-group btn-group-sm w-100" role="group">
                    <button type="button" class="btn btn-info view-ministerio" data-id="${ministerio.id}" title="Visualizar">
                        <i class="fas fa-eye"></i> Visualizar
                    </button>
                    <button type="button" class="btn btn-primary edit-ministerio" data-id="${ministerio.id}" title="Editar">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button type="button" class="btn btn-danger delete-ministerio" data-id="${ministerio.id}" title="Excluir">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar event listeners para os botões
    card.querySelector('.view-ministerio').addEventListener('click', () => viewMinisterio(ministerio.id));
    card.querySelector('.edit-ministerio').addEventListener('click', () => editMinisterio(ministerio.id));
    card.querySelector('.delete-ministerio').addEventListener('click', () => showDeleteModal(ministerio.id));
    
    ministeriosList.appendChild(card);
}

/**
 * Filtrar ministérios com base no termo de busca
 */
function filterMinisterios(searchTerm) {
    // Filtrar tabela
    if (ministeriosTableBody) {
        const rows = ministeriosTableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            if (row.cells.length > 1) { // Ignorar linhas de mensagem
                const nome = row.cells[0].textContent.toLowerCase();
                const descricao = row.cells[1].textContent.toLowerCase();
                
                if (nome.includes(searchTerm) || descricao.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }
    
    // Filtrar grid de cards
    if (ministeriosList) {
        const cards = ministeriosList.querySelectorAll('.col-md-4');
        
        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const text = card.querySelector('.card-text').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || text.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

/**
 * Manipular envio do formulário de ministério
 */
function handleMinisterioSubmit(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const nome = document.getElementById('ministerioNome').value.trim();
    const descricao = document.getElementById('ministerioDescricao').value.trim();
    const responsavelUid = document.getElementById('ministerioResponsavel').value;
    
    // Validar campos obrigatórios
    if (!nome) {
        Utils.showAlert('Por favor, informe o nome do ministério.', 'warning');
        return;
    }
    
    // Desabilitar botão de salvar e mostrar spinner
    const saveButton = document.getElementById('saveMinisterioBtn');
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    // Preparar dados do ministério
    const ministerioData = {
        nome: nome,
        descricao: descricao,
        responsavelUid: responsavelUid || null,
        membros: [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Verificar se é uma edição ou novo cadastro
    if (currentMinisterioId) {
        // Atualizar ministério existente
        ministeriosRef.doc(currentMinisterioId).update(ministerioData)
            .then(() => {
                Utils.showAlert('Ministério atualizado com sucesso!', 'success');
                ministerioModal.hide();
                loadMinisterios(); // Recarregar lista
            })
            .catch((error) => {
                console.error('Erro ao atualizar ministério:', error);
                Utils.showAlert('Erro ao atualizar ministério. Tente novamente.', 'danger');
            })
            .finally(() => {
                // Reativar botão
                saveButton.disabled = false;
                saveButton.innerHTML = 'Salvar';
            });
    } else {
        // Adicionar timestamp de criação para novos ministérios
        ministerioData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        // Criar novo ministério
        ministeriosRef.add(ministerioData)
            .then(() => {
                Utils.showAlert('Ministério cadastrado com sucesso!', 'success');
                ministerioModal.hide();
                loadMinisterios(); // Recarregar lista
            })
            .catch((error) => {
                console.error('Erro ao cadastrar ministério:', error);
                Utils.showAlert('Erro ao cadastrar ministério. Tente novamente.', 'danger');
            })
            .finally(() => {
                // Reativar botão
                saveButton.disabled = false;
                saveButton.innerHTML = 'Salvar';
            });
    }
}

/**
 * Visualizar detalhes de um ministério
 */
function viewMinisterio(ministerioId) {
    // Mostrar indicador de carregamento
    const viewModalBody = document.getElementById('viewMinisterioBody');
    viewModalBody.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    
    // Mostrar modal
    viewMinisterioModal.show();
    
    // Buscar dados do ministério
    ministeriosRef.doc(ministerioId).get()
        .then((doc) => {
            if (doc.exists) {
                const ministerio = doc.data();
                ministerio.id = doc.id;
                
                // Formatar data de criação
                const createdAt = ministerio.createdAt ? new Date(ministerio.createdAt.toDate()) : new Date();
                const formattedDate = Utils.formatDate(createdAt);
                
                // Buscar nome do responsável
                let responsavelPromise = Promise.resolve('Não definido');
                if (ministerio.responsavelUid) {
                    responsavelPromise = usersRef.doc(ministerio.responsavelUid).get()
                        .then(userDoc => {
                            return userDoc.exists ? userDoc.data().nome : 'Não encontrado';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Buscar membros
                let membrosPromise = Promise.resolve([]);
                if (ministerio.membros && ministerio.membros.length > 0) {
                    const membrosPromises = ministerio.membros.map(membroId => {
                        return usersRef.doc(membroId).get()
                            .then(userDoc => {
                                return userDoc.exists ? userDoc.data().nome : 'Membro não encontrado';
                            })
                            .catch(() => 'Erro ao carregar');
                    });
                    
                    membrosPromise = Promise.all(membrosPromises);
                }
                
                // Quando todas as promessas forem resolvidas
                Promise.all([responsavelPromise, membrosPromise])
                    .then(([responsavelNome, membrosNomes]) => {
                        // Preencher modal com os dados
                        viewModalBody.innerHTML = `
                            <div class="row">
                                <div class="col-md-12 mb-3">
                                    <h4>${ministerio.nome}</h4>
                                    <p class="text-muted">Criado em: ${formattedDate}</p>
                                </div>
                                
                                <div class="col-md-12 mb-3">
                                    <h5>Descrição</h5>
                                    <p>${ministerio.descricao || 'Sem descrição'}</p>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <h5>Responsável</h5>
                                    <p>${responsavelNome}</p>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <h5>Membros (${membrosNomes.length})</h5>
                                    ${membrosNomes.length > 0 ? 
                                        `<ul class="list-group">
                                            ${membrosNomes.map(nome => `<li class="list-group-item">${nome}</li>`).join('')}
                                        </ul>` : 
                                        '<p>Nenhum membro cadastrado</p>'}
                                </div>
                            </div>
                        `;
                    });
            } else {
                viewModalBody.innerHTML = '<div class="alert alert-warning">Ministério não encontrado.</div>';
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar detalhes do ministério:', error);
            viewModalBody.innerHTML = '<div class="alert alert-danger">Erro ao carregar detalhes do ministério.</div>';
        });
}

/**
 * Preparar formulário para edição de ministério
 */
function editMinisterio(ministerioId) {
    // Definir ID do ministério atual
    currentMinisterioId = ministerioId;
    
    // Atualizar título do modal
    document.getElementById('ministerioModalLabel').textContent = 'Editar Ministério';
    
    // Buscar dados do ministério
    ministeriosRef.doc(ministerioId).get()
        .then((doc) => {
            if (doc.exists) {
                const ministerio = doc.data();
                
                // Preencher formulário
                document.getElementById('ministerioNome').value = ministerio.nome || '';
                document.getElementById('ministerioDescricao').value = ministerio.descricao || '';
                
                // Selecionar responsável, se existir
                const responsavelSelect = document.getElementById('ministerioResponsavel');
                if (responsavelSelect && ministerio.responsavelUid) {
                    responsavelSelect.value = ministerio.responsavelUid;
                }
                
                // Mostrar modal
                ministerioModal.show();
            } else {
                Utils.showAlert('Ministério não encontrado.', 'warning');
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar ministério para edição:', error);
            Utils.showAlert('Erro ao carregar ministério para edição.', 'danger');
        });
}

/**
 * Mostrar modal de confirmação de exclusão
 */
function showDeleteModal(ministerioId) {
    // Definir ID do ministério atual
    currentMinisterioId = ministerioId;
    
    // Mostrar modal de confirmação
    deleteMinisterioModal.show();
}

/**
 * Excluir ministério
 */
function deleteMinisterio() {
    if (!currentMinisterioId) return;
    
    // Desabilitar botão de confirmar exclusão e mostrar spinner
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
    
    // Excluir ministério
    ministeriosRef.doc(currentMinisterioId).delete()
        .then(() => {
            Utils.showAlert('Ministério excluído com sucesso!', 'success');
            deleteMinisterioModal.hide();
            
            // Remover da tabela e do grid
            if (ministeriosTableBody) {
                const row = ministeriosTableBody.querySelector(`tr[data-id="${currentMinisterioId}"]`);
                if (row) row.remove();
            }
            
            if (ministeriosList) {
                const card = ministeriosList.querySelector(`div[data-id="${currentMinisterioId}"]`);
                if (card) card.remove();
            }
            
            // Verificar se a tabela ficou vazia
            if (ministeriosTableBody && ministeriosTableBody.children.length === 0) {
                ministeriosTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum ministério cadastrado.</td></tr>';
            }
        })
        .catch((error) => {
            console.error('Erro ao excluir ministério:', error);
            Utils.showAlert('Erro ao excluir ministério. Tente novamente.', 'danger');
        })
        .finally(() => {
            // Reativar botão
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Confirmar Exclusão';
            
            // Limpar ID atual
            currentMinisterioId = null;
        });
}

/**
 * Resetar formulário de ministério
 */
function resetMinisterioForm() {
    // Limpar ID atual
    currentMinisterioId = null;
    
    // Resetar formulário
    ministerioForm.reset();
}

/**
 * Exportar ministérios para CSV
 */
function exportMinisteriosToCSV() {
    // Buscar todos os ministérios
    ministeriosRef.orderBy('nome').get()
        .then((querySnapshot) => {
            // Verificar se há ministérios
            if (querySnapshot.empty) {
                Utils.showAlert('Não há ministérios para exportar.', 'warning');
                return;
            }
            
            // Preparar dados para CSV
            const csvData = [];
            
            // Adicionar cabeçalho
            csvData.push(['Nome', 'Descrição', 'Responsável', 'Membros', 'Data de Criação']);
            
            // Processar cada ministério
            const promises = [];
            
            querySnapshot.forEach((doc) => {
                const ministerio = doc.data();
                
                // Buscar nome do responsável
                let responsavelPromise = Promise.resolve('Não definido');
                if (ministerio.responsavelUid) {
                    responsavelPromise = usersRef.doc(ministerio.responsavelUid).get()
                        .then(userDoc => {
                            return userDoc.exists ? userDoc.data().nome : 'Não encontrado';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Formatar data de criação
                const createdAt = ministerio.createdAt ? new Date(ministerio.createdAt.toDate()) : new Date();
                const formattedDate = Utils.formatDate(createdAt);
                
                // Contar membros
                const membrosCount = ministerio.membros ? ministerio.membros.length : 0;
                
                // Adicionar promessa para resolver o nome do responsável
                promises.push(
                    responsavelPromise.then(responsavelNome => {
                        csvData.push([
                            ministerio.nome || '',
                            ministerio.descricao || '',
                            responsavelNome,
                            membrosCount.toString(),
                            formattedDate
                        ]);
                    })
                );
            });
            
            // Quando todas as promessas forem resolvidas
            Promise.all(promises)
                .then(() => {
                    // Converter para string CSV
                    let csvString = '';
                    csvData.forEach(row => {
                        // Escapar campos com vírgulas ou aspas
                        const escapedRow = row.map(field => {
                            if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                                return `"${field.replace(/"/g, '""')}"`;  // Escapar aspas duplicando-as
                            }
                            return field;
                        });
                        csvString += escapedRow.join(',') + '\n';
                    });
                    
                    // Criar blob e link para download
                    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `ministerios_${Utils.formatDateForFilename(new Date())}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
        })
        .catch((error) => {
            console.error('Erro ao exportar ministérios:', error);
            Utils.showAlert('Erro ao exportar ministérios. Tente novamente.', 'danger');
        });
}

/**
 * Exportar ministérios para PDF
 */
function exportMinisteriosToPDF() {
    // Verificar se a biblioteca jsPDF está disponível
    if (typeof jsPDF === 'undefined') {
        Utils.showAlert('Biblioteca jsPDF não encontrada. Não é possível exportar para PDF.', 'warning');
        return;
    }
    
    // Buscar todos os ministérios
    ministeriosRef.orderBy('nome').get()
        .then((querySnapshot) => {
            // Verificar se há ministérios
            if (querySnapshot.empty) {
                Utils.showAlert('Não há ministérios para exportar.', 'warning');
                return;
            }
            
            // Criar novo documento PDF
            const doc = new jsPDF();
            
            // Adicionar título
            doc.setFontSize(18);
            doc.text('Relatório de Ministérios', 14, 22);
            
            // Adicionar data de geração
            doc.setFontSize(10);
            doc.text(`Gerado em: ${Utils.formatDate(new Date())}`, 14, 30);
            
            // Configurar tabela
            const columns = [
                {header: 'Nome', dataKey: 'nome'},
                {header: 'Descrição', dataKey: 'descricao'},
                {header: 'Responsável', dataKey: 'responsavel'},
                {header: 'Membros', dataKey: 'membros'},
                {header: 'Criado em', dataKey: 'createdAt'}
            ];
            
            // Preparar dados para a tabela
            const rows = [];
            const promises = [];
            
            querySnapshot.forEach((doc) => {
                const ministerio = doc.data();
                
                // Buscar nome do responsável
                let responsavelPromise = Promise.resolve('Não definido');
                if (ministerio.responsavelUid) {
                    responsavelPromise = usersRef.doc(ministerio.responsavelUid).get()
                        .then(userDoc => {
                            return userDoc.exists ? userDoc.data().nome : 'Não encontrado';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Formatar data de criação
                const createdAt = ministerio.createdAt ? new Date(ministerio.createdAt.toDate()) : new Date();
                const formattedDate = Utils.formatDate(createdAt);
                
                // Contar membros
                const membrosCount = ministerio.membros ? ministerio.membros.length : 0;
                
                // Adicionar promessa para resolver o nome do responsável
                promises.push(
                    responsavelPromise.then(responsavelNome => {
                        rows.push({
                            nome: ministerio.nome || '',
                            descricao: Utils.truncateText(ministerio.descricao || '', 30),
                            responsavel: responsavelNome,
                            membros: membrosCount.toString(),
                            createdAt: formattedDate
                        });
                    })
                );
            });
            
            // Quando todas as promessas forem resolvidas
            Promise.all(promises)
                .then(() => {
                    // Adicionar tabela ao PDF
                    doc.autoTable(columns, rows, {
                        startY: 40,
                        margin: {top: 40, right: 14, bottom: 20, left: 14},
                        styles: {overflow: 'linebreak'},
                        columnStyles: {
                            descricao: {cellWidth: 50}
                        }
                    });
                    
                    // Salvar PDF
                    doc.save(`ministerios_${Utils.formatDateForFilename(new Date())}.pdf`);
                });
        })
        .catch((error) => {
            console.error('Erro ao exportar ministérios para PDF:', error);
            Utils.showAlert('Erro ao exportar ministérios para PDF. Tente novamente.', 'danger');
        });
}