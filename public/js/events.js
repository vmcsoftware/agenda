/**
 * events.js - Funções para gerenciamento de eventos
 * Agenda de Serviços — CCB Administração Ituiutaba
 */

// Referência às coleções no Firestore
const eventosRef = db.collection('eventos');
const ministeriosRef = db.collection('ministerios');
const congregacoesRef = db.collection('congregacoes');
const usersRef = db.collection('users');

// Elementos do DOM
const eventoForm = document.getElementById('eventoForm');
const eventosTableBody = document.getElementById('eventosTableBody');
const searchEventoInput = document.getElementById('searchEvento');
const addEventoBtn = document.getElementById('addEventoBtn');
const eventoModal = new bootstrap.Modal(document.getElementById('eventoModal'));
const deleteEventoModal = new bootstrap.Modal(document.getElementById('deleteEventoModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteEvento');
const viewEventoModal = new bootstrap.Modal(document.getElementById('viewEventoModal'));

// ID do evento atual sendo editado ou excluído
let currentEventoId = null;

// Listener para quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de eventos
    if (eventoForm) {
        initEventos();
    }
    
    // Verificar se estamos no dashboard (para mostrar próximos eventos)
    const proximosEventosTable = document.getElementById('proximosEventosTable');
    if (proximosEventosTable) {
        loadProximosEventos();
    }
});

/**
 * Inicializar a página de eventos
 */
function initEventos() {
    // Configurar listeners de eventos
    setupEventListeners();
    
    // Carregar lista de eventos
    loadEventos();
    
    // Carregar listas para os selects
    loadMinisterios();
    loadCongregacoes();
    loadParticipantes();
}

/**
 * Configurar listeners de eventos
 */
function setupEventListeners() {
    // Listener para o formulário de evento
    if (eventoForm) {
        eventoForm.addEventListener('submit', handleEventoSubmit);
    }
    
    // Listener para o botão de adicionar evento
    if (addEventoBtn) {
        addEventoBtn.addEventListener('click', () => {
            resetEventoForm();
            document.getElementById('eventoModalLabel').textContent = 'Adicionar Evento';
            eventoModal.show();
        });
    }
    
    // Listener para o botão de confirmar exclusão
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteEvento);
    }
    
    // Listener para o campo de busca
    if (searchEventoInput) {
        searchEventoInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterEventos(searchTerm);
        });
    }
    
    // Listeners para filtros de data
    const dataInicioFilter = document.getElementById('dataInicioFilter');
    const dataFimFilter = document.getElementById('dataFimFilter');
    const statusFilter = document.getElementById('statusFilter');
    const ministerioFilter = document.getElementById('ministerioFilter');
    const congregacaoFilter = document.getElementById('congregacaoFilter');
    
    if (dataInicioFilter) {
        dataInicioFilter.addEventListener('change', applyFilters);
    }
    
    if (dataFimFilter) {
        dataFimFilter.addEventListener('change', applyFilters);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (ministerioFilter) {
        ministerioFilter.addEventListener('change', applyFilters);
    }
    
    if (congregacaoFilter) {
        congregacaoFilter.addEventListener('change', applyFilters);
    }
    
    // Listener para o botão de limpar filtros
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Listener para o botão de exportar para CSV
    const exportCSVBtn = document.getElementById('exportEventosCSV');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportEventosToCSV);
    }
    
    // Listener para o botão de exportar para PDF
    const exportPDFBtn = document.getElementById('exportEventosPDF');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', exportEventosToPDF);
    }
}

/**
 * Carregar lista de ministérios para o select
 */
function loadMinisterios() {
    const ministerioSelect = document.getElementById('eventoMinisterio');
    const ministerioFilter = document.getElementById('ministerioFilter');
    
    // Buscar ministérios
    ministeriosRef.orderBy('nome').get()
        .then((querySnapshot) => {
            // Preencher select do formulário
            if (ministerioSelect) {
                // Limpar opções atuais, mantendo a primeira (selecione)
                ministerioSelect.innerHTML = '<option value="">Selecione um ministério</option>';
                
                querySnapshot.forEach((doc) => {
                    const ministerio = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = ministerio.nome;
                    ministerioSelect.appendChild(option);
                });
            }
            
            // Preencher select do filtro
            if (ministerioFilter) {
                // Limpar opções atuais, mantendo a primeira (todos)
                ministerioFilter.innerHTML = '<option value="">Todos os ministérios</option>';
                
                querySnapshot.forEach((doc) => {
                    const ministerio = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = ministerio.nome;
                    ministerioFilter.appendChild(option);
                });
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar ministérios:', error);
        });
}

/**
 * Carregar lista de congregações para o select
 */
function loadCongregacoes() {
    const congregacaoSelect = document.getElementById('eventoCongregacao');
    const congregacaoFilter = document.getElementById('congregacaoFilter');
    
    // Buscar congregações
    congregacoesRef.orderBy('nome').get()
        .then((querySnapshot) => {
            // Preencher select do formulário
            if (congregacaoSelect) {
                // Limpar opções atuais, mantendo a primeira (selecione)
                congregacaoSelect.innerHTML = '<option value="">Selecione uma congregação</option>';
                
                querySnapshot.forEach((doc) => {
                    const congregacao = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = congregacao.nome;
                    congregacaoSelect.appendChild(option);
                });
            }
            
            // Preencher select do filtro
            if (congregacaoFilter) {
                // Limpar opções atuais, mantendo a primeira (todas)
                congregacaoFilter.innerHTML = '<option value="">Todas as congregações</option>';
                
                querySnapshot.forEach((doc) => {
                    const congregacao = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = congregacao.nome;
                    congregacaoFilter.appendChild(option);
                });
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar congregações:', error);
        });
}

/**
 * Carregar lista de usuários para o select de participantes
 */
function loadParticipantes() {
    const participantesSelect = document.getElementById('eventoParticipantes');
    
    if (!participantesSelect) return;
    
    // Limpar opções atuais
    participantesSelect.innerHTML = '';
    
    // Buscar usuários
    usersRef.orderBy('nome').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const user = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = user.nome;
                participantesSelect.appendChild(option);
            });
            
            // Inicializar o select múltiplo com Bootstrap Select
            if ($.fn.selectpicker) {
                $(participantesSelect).selectpicker({
                    noneSelectedText: 'Selecione os participantes',
                    selectAllText: 'Selecionar Todos',
                    deselectAllText: 'Desmarcar Todos',
                    actionsBox: true,
                    liveSearch: true,
                    selectedTextFormat: 'count > 3',
                    countSelectedText: '{0} participantes selecionados'
                });
                
                $(participantesSelect).selectpicker('refresh');
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar participantes:', error);
        });
}

/**
 * Carregar lista de eventos do Firestore
 */
function loadEventos() {
    // Mostrar indicador de carregamento
    if (eventosTableBody) {
        eventosTableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    }
    
    // Buscar eventos ordenados por data (mais recentes primeiro)
    eventosRef.orderBy('data', 'desc').get()
        .then((querySnapshot) => {
            // Limpar tabela
            if (eventosTableBody) {
                eventosTableBody.innerHTML = '';
            }
            
            // Verificar se há eventos
            if (querySnapshot.empty) {
                if (eventosTableBody) {
                    eventosTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum evento cadastrado.</td></tr>';
                }
                return;
            }
            
            // Processar cada evento
            querySnapshot.forEach((doc) => {
                const evento = doc.data();
                evento.id = doc.id;
                
                // Adicionar à tabela
                if (eventosTableBody) {
                    addEventoToTable(evento);
                }
            });
        })
        .catch((error) => {
            console.error('Erro ao carregar eventos:', error);
            Utils.showAlert('Erro ao carregar eventos. Tente novamente.', 'danger');
            
            if (eventosTableBody) {
                eventosTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Erro ao carregar eventos.</td></tr>';
            }
        });
}

/**
 * Carregar próximos eventos para o dashboard
 */
function loadProximosEventos() {
    const proximosEventosTable = document.getElementById('proximosEventosTableBody');
    
    if (!proximosEventosTable) return;
    
    // Mostrar indicador de carregamento
    proximosEventosTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    
    // Data atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Buscar próximos eventos (a partir de hoje, ordenados por data)
    eventosRef.where('data', '>=', firebase.firestore.Timestamp.fromDate(hoje))
        .orderBy('data')
        .limit(5) // Limitar a 5 eventos
        .get()
        .then((querySnapshot) => {
            // Limpar tabela
            proximosEventosTable.innerHTML = '';
            
            // Verificar se há eventos
            if (querySnapshot.empty) {
                proximosEventosTable.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum evento próximo.</td></tr>';
                return;
            }
            
            // Processar cada evento
            const promises = [];
            
            querySnapshot.forEach((doc) => {
                const evento = doc.data();
                evento.id = doc.id;
                
                // Buscar nome da congregação
                let congregacaoPromise = Promise.resolve('Não definida');
                if (evento.congregacaoId) {
                    congregacaoPromise = congregacoesRef.doc(evento.congregacaoId).get()
                        .then(congregacaoDoc => {
                            return congregacaoDoc.exists ? congregacaoDoc.data().nome : 'Não encontrada';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Buscar nome do ministério
                let ministerioPromise = Promise.resolve('Não definido');
                if (evento.ministerioId) {
                    ministerioPromise = ministeriosRef.doc(evento.ministerioId).get()
                        .then(ministerioDoc => {
                            return ministerioDoc.exists ? ministerioDoc.data().nome : 'Não encontrado';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Adicionar promessa para resolver os nomes
                promises.push(
                    Promise.all([congregacaoPromise, ministerioPromise])
                        .then(([congregacaoNome, ministerioNome]) => {
                            // Formatar data e hora
                            const data = evento.data ? new Date(evento.data.toDate()) : new Date();
                            const formattedDate = Utils.formatDate(data);
                            const hora = evento.hora || '';
                            
                            // Criar linha da tabela
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${evento.titulo}</td>
                                <td>${formattedDate}</td>
                                <td>${hora}</td>
                                <td>${congregacaoNome}</td>
                                <td>
                                    <span class="badge bg-${Utils.getStatusColor(evento.status)}">
                                        ${Utils.getStatusName(evento.status)}
                                    </span>
                                </td>
                            `;
                            
                            proximosEventosTable.appendChild(row);
                        })
                );
            });
            
            // Se não houver promessas (não deveria acontecer, mas por segurança)
            if (promises.length === 0) {
                proximosEventosTable.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum evento próximo.</td></tr>';
            }
            
            // Resolver todas as promessas
            return Promise.all(promises);
        })
        .catch((error) => {
            console.error('Erro ao carregar próximos eventos:', error);
            proximosEventosTable.innerHTML = '<tr><td colspan="5" class="text-center">Erro ao carregar eventos.</td></tr>';
        });
}

/**
 * Adicionar evento à tabela
 */
function addEventoToTable(evento) {
    if (!eventosTableBody) return;
    
    const row = document.createElement('tr');
    row.setAttribute('data-id', evento.id);
    row.setAttribute('data-data', evento.data ? evento.data.toDate().toISOString() : '');
    row.setAttribute('data-status', evento.status || '');
    row.setAttribute('data-ministerio', evento.ministerioId || '');
    row.setAttribute('data-congregacao', evento.congregacaoId || '');
    
    // Formatar data e hora
    const data = evento.data ? new Date(evento.data.toDate()) : new Date();
    const formattedDate = Utils.formatDate(data);
    const hora = evento.hora || '';
    
    // Buscar nome da congregação
    let congregacaoNome = 'Carregando...';
    if (evento.congregacaoId) {
        congregacoesRef.doc(evento.congregacaoId).get()
            .then(doc => {
                if (doc.exists) {
                    congregacaoNome = doc.data().nome;
                    row.querySelector('.congregacao-nome').textContent = congregacaoNome;
                } else {
                    row.querySelector('.congregacao-nome').textContent = 'Não encontrada';
                }
            })
            .catch(() => {
                row.querySelector('.congregacao-nome').textContent = 'Erro ao carregar';
            });
    } else {
        congregacaoNome = 'Não definida';
    }
    
    // Buscar nome do ministério
    let ministerioNome = 'Carregando...';
    if (evento.ministerioId) {
        ministeriosRef.doc(evento.ministerioId).get()
            .then(doc => {
                if (doc.exists) {
                    ministerioNome = doc.data().nome;
                    row.querySelector('.ministerio-nome').textContent = ministerioNome;
                } else {
                    row.querySelector('.ministerio-nome').textContent = 'Não encontrado';
                }
            })
            .catch(() => {
                row.querySelector('.ministerio-nome').textContent = 'Erro ao carregar';
            });
    } else {
        ministerioNome = 'Não definido';
    }
    
    // Contar participantes
    const participantesCount = evento.participantes ? evento.participantes.length : 0;
    
    row.innerHTML = `
        <td>${evento.titulo}</td>
        <td>${formattedDate}</td>
        <td>${hora}</td>
        <td class="congregacao-nome">${congregacaoNome}</td>
        <td class="ministerio-nome">${ministerioNome}</td>
        <td>
            <span class="badge bg-${Utils.getStatusColor(evento.status)}">
                ${Utils.getStatusName(evento.status)}
            </span>
        </td>
        <td>
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-info view-evento" data-id="${evento.id}" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-primary edit-evento" data-id="${evento.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-danger delete-evento" data-id="${evento.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Adicionar event listeners para os botões
    row.querySelector('.view-evento').addEventListener('click', () => viewEvento(evento.id));
    row.querySelector('.edit-evento').addEventListener('click', () => editEvento(evento.id));
    row.querySelector('.delete-evento').addEventListener('click', () => showDeleteModal(evento.id));
    
    eventosTableBody.appendChild(row);
}

/**
 * Filtrar eventos com base no termo de busca
 */
function filterEventos(searchTerm) {
    // Filtrar tabela
    if (eventosTableBody) {
        const rows = eventosTableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            if (row.cells.length > 1) { // Ignorar linhas de mensagem
                const titulo = row.cells[0].textContent.toLowerCase();
                const data = row.cells[1].textContent.toLowerCase();
                const hora = row.cells[2].textContent.toLowerCase();
                const congregacao = row.cells[3].textContent.toLowerCase();
                const ministerio = row.cells[4].textContent.toLowerCase();
                const status = row.cells[5].textContent.toLowerCase();
                
                if (titulo.includes(searchTerm) || data.includes(searchTerm) || 
                    hora.includes(searchTerm) || congregacao.includes(searchTerm) || 
                    ministerio.includes(searchTerm) || status.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }
}

/**
 * Aplicar filtros de data, status, ministério e congregação
 */
function applyFilters() {
    if (!eventosTableBody) return;
    
    const dataInicio = document.getElementById('dataInicioFilter').value;
    const dataFim = document.getElementById('dataFimFilter').value;
    const status = document.getElementById('statusFilter').value;
    const ministerioId = document.getElementById('ministerioFilter').value;
    const congregacaoId = document.getElementById('congregacaoFilter').value;
    
    const rows = eventosTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (row.cells.length > 1) { // Ignorar linhas de mensagem
            let mostrar = true;
            
            // Filtrar por data de início
            if (dataInicio && row.getAttribute('data-data')) {
                const rowDate = new Date(row.getAttribute('data-data'));
                const filterDate = new Date(dataInicio);
                
                if (rowDate < filterDate) {
                    mostrar = false;
                }
            }
            
            // Filtrar por data de fim
            if (mostrar && dataFim && row.getAttribute('data-data')) {
                const rowDate = new Date(row.getAttribute('data-data'));
                const filterDate = new Date(dataFim);
                filterDate.setHours(23, 59, 59); // Fim do dia
                
                if (rowDate > filterDate) {
                    mostrar = false;
                }
            }
            
            // Filtrar por status
            if (mostrar && status && row.getAttribute('data-status') !== status) {
                mostrar = false;
            }
            
            // Filtrar por ministério
            if (mostrar && ministerioId && row.getAttribute('data-ministerio') !== ministerioId) {
                mostrar = false;
            }
            
            // Filtrar por congregação
            if (mostrar && congregacaoId && row.getAttribute('data-congregacao') !== congregacaoId) {
                mostrar = false;
            }
            
            // Aplicar filtro
            row.style.display = mostrar ? '' : 'none';
        }
    });
    
    // Verificar se há resultados visíveis
    const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
    
    if (visibleRows.length === 0 && rows.length > 0) {
        // Adicionar mensagem de nenhum resultado
        let noResultsRow = eventosTableBody.querySelector('.no-results-row');
        
        if (!noResultsRow) {
            noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-row';
            noResultsRow.innerHTML = '<td colspan="7" class="text-center">Nenhum evento encontrado com os filtros aplicados.</td>';
            eventosTableBody.appendChild(noResultsRow);
        } else {
            noResultsRow.style.display = '';
        }
    } else {
        // Esconder mensagem de nenhum resultado se existir
        const noResultsRow = eventosTableBody.querySelector('.no-results-row');
        if (noResultsRow) {
            noResultsRow.style.display = 'none';
        }
    }
}

/**
 * Limpar todos os filtros
 */
function clearFilters() {
    // Resetar campos de filtro
    document.getElementById('dataInicioFilter').value = '';
    document.getElementById('dataFimFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('ministerioFilter').value = '';
    document.getElementById('congregacaoFilter').value = '';
    document.getElementById('searchEvento').value = '';
    
    // Mostrar todas as linhas
    if (eventosTableBody) {
        const rows = eventosTableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            if (!row.classList.contains('no-results-row')) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
}

/**
 * Manipular envio do formulário de evento
 */
function handleEventoSubmit(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const titulo = document.getElementById('eventoTitulo').value.trim();
    const data = document.getElementById('eventoData').value;
    const hora = document.getElementById('eventoHora').value;
    const congregacaoId = document.getElementById('eventoCongregacao').value;
    const ministerioId = document.getElementById('eventoMinisterio').value;
    const status = document.getElementById('eventoStatus').value;
    const observacoes = document.getElementById('eventoObservacoes').value.trim();
    
    // Obter participantes selecionados
    const participantesSelect = document.getElementById('eventoParticipantes');
    const participantes = Array.from(participantesSelect.selectedOptions).map(option => option.value);
    
    // Validar campos obrigatórios
    if (!titulo || !data) {
        Utils.showAlert('Por favor, preencha os campos obrigatórios.', 'warning');
        return;
    }
    
    // Desabilitar botão de salvar e mostrar spinner
    const saveButton = document.getElementById('saveEventoBtn');
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    // Converter data para timestamp
    const dataObj = new Date(data);
    
    // Preparar dados do evento
    const eventoData = {
        titulo: titulo,
        data: firebase.firestore.Timestamp.fromDate(dataObj),
        hora: hora,
        congregacaoId: congregacaoId || null,
        ministerioId: ministerioId || null,
        status: status || 'agendado',
        observacoes: observacoes,
        participantes: participantes,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Verificar se é uma edição ou novo cadastro
    if (currentEventoId) {
        // Atualizar evento existente
        eventosRef.doc(currentEventoId).update(eventoData)
            .then(() => {
                Utils.showAlert('Evento atualizado com sucesso!', 'success');
                eventoModal.hide();
                loadEventos(); // Recarregar lista
                
                // Recarregar próximos eventos no dashboard, se existir
                const proximosEventosTable = document.getElementById('proximosEventosTableBody');
                if (proximosEventosTable) {
                    loadProximosEventos();
                }
            })
            .catch((error) => {
                console.error('Erro ao atualizar evento:', error);
                Utils.showAlert('Erro ao atualizar evento. Tente novamente.', 'danger');
            })
            .finally(() => {
                // Reativar botão
                saveButton.disabled = false;
                saveButton.innerHTML = 'Salvar';
            });
    } else {
        // Adicionar timestamp de criação para novos eventos
        eventoData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        // Criar novo evento
        eventosRef.add(eventoData)
            .then(() => {
                Utils.showAlert('Evento cadastrado com sucesso!', 'success');
                eventoModal.hide();
                loadEventos(); // Recarregar lista
                
                // Recarregar próximos eventos no dashboard, se existir
                const proximosEventosTable = document.getElementById('proximosEventosTableBody');
                if (proximosEventosTable) {
                    loadProximosEventos();
                }
            })
            .catch((error) => {
                console.error('Erro ao cadastrar evento:', error);
                Utils.showAlert('Erro ao cadastrar evento. Tente novamente.', 'danger');
            })
            .finally(() => {
                // Reativar botão
                saveButton.disabled = false;
                saveButton.innerHTML = 'Salvar';
            });
    }
}

/**
 * Visualizar detalhes de um evento
 */
function viewEvento(eventoId) {
    // Mostrar indicador de carregamento
    const viewModalBody = document.getElementById('viewEventoBody');
    viewModalBody.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    
    // Mostrar modal
    viewEventoModal.show();
    
    // Buscar dados do evento
    eventosRef.doc(eventoId).get()
        .then((doc) => {
            if (doc.exists) {
                const evento = doc.data();
                evento.id = doc.id;
                
                // Formatar data e hora
                const data = evento.data ? new Date(evento.data.toDate()) : new Date();
                const formattedDate = Utils.formatDate(data);
                const hora = evento.hora || 'Não definida';
                
                // Buscar nome da congregação
                let congregacaoPromise = Promise.resolve('Não definida');
                if (evento.congregacaoId) {
                    congregacaoPromise = congregacoesRef.doc(evento.congregacaoId).get()
                        .then(congregacaoDoc => {
                            return congregacaoDoc.exists ? congregacaoDoc.data().nome : 'Não encontrada';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Buscar nome do ministério
                let ministerioPromise = Promise.resolve('Não definido');
                if (evento.ministerioId) {
                    ministerioPromise = ministeriosRef.doc(evento.ministerioId).get()
                        .then(ministerioDoc => {
                            return ministerioDoc.exists ? ministerioDoc.data().nome : 'Não encontrado';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Buscar nomes dos participantes
                let participantesPromise = Promise.resolve([]);
                if (evento.participantes && evento.participantes.length > 0) {
                    const participantesPromises = evento.participantes.map(participanteId => {
                        return usersRef.doc(participanteId).get()
                            .then(userDoc => {
                                return userDoc.exists ? userDoc.data().nome : 'Participante não encontrado';
                            })
                            .catch(() => 'Erro ao carregar');
                    });
                    
                    participantesPromise = Promise.all(participantesPromises);
                }
                
                // Quando todas as promessas forem resolvidas
                Promise.all([congregacaoPromise, ministerioPromise, participantesPromise])
                    .then(([congregacaoNome, ministerioNome, participantesNomes]) => {
                        // Preencher modal com os dados
                        viewModalBody.innerHTML = `
                            <div class="row">
                                <div class="col-md-12 mb-3">
                                    <h4>${evento.titulo}</h4>
                                    <p class="text-muted">
                                        <span class="badge bg-${Utils.getStatusColor(evento.status)}">
                                            ${Utils.getStatusName(evento.status)}
                                        </span>
                                    </p>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <h5>Data</h5>
                                    <p>${formattedDate}</p>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <h5>Hora</h5>
                                    <p>${hora}</p>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <h5>Congregação</h5>
                                    <p>${congregacaoNome}</p>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <h5>Ministério</h5>
                                    <p>${ministerioNome}</p>
                                </div>
                                
                                <div class="col-md-12 mb-3">
                                    <h5>Observações</h5>
                                    <p>${evento.observacoes || 'Sem observações'}</p>
                                </div>
                                
                                <div class="col-md-12 mb-3">
                                    <h5>Participantes (${participantesNomes.length})</h5>
                                    ${participantesNomes.length > 0 ? 
                                        `<ul class="list-group">
                                            ${participantesNomes.map(nome => `<li class="list-group-item">${nome}</li>`).join('')}
                                        </ul>` : 
                                        '<p>Nenhum participante cadastrado</p>'}
                                </div>
                            </div>
                        `;
                    });
            } else {
                viewModalBody.innerHTML = '<div class="alert alert-warning">Evento não encontrado.</div>';
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar detalhes do evento:', error);
            viewModalBody.innerHTML = '<div class="alert alert-danger">Erro ao carregar detalhes do evento.</div>';
        });
}

/**
 * Preparar formulário para edição de evento
 */
function editEvento(eventoId) {
    // Definir ID do evento atual
    currentEventoId = eventoId;
    
    // Atualizar título do modal
    document.getElementById('eventoModalLabel').textContent = 'Editar Evento';
    
    // Buscar dados do evento
    eventosRef.doc(eventoId).get()
        .then((doc) => {
            if (doc.exists) {
                const evento = doc.data();
                
                // Formatar data para o input
                let dataFormatada = '';
                if (evento.data) {
                    const data = new Date(evento.data.toDate());
                    const ano = data.getFullYear();
                    const mes = String(data.getMonth() + 1).padStart(2, '0');
                    const dia = String(data.getDate()).padStart(2, '0');
                    dataFormatada = `${ano}-${mes}-${dia}`;
                }
                
                // Preencher formulário
                document.getElementById('eventoTitulo').value = evento.titulo || '';
                document.getElementById('eventoData').value = dataFormatada;
                document.getElementById('eventoHora').value = evento.hora || '';
                document.getElementById('eventoStatus').value = evento.status || 'agendado';
                document.getElementById('eventoObservacoes').value = evento.observacoes || '';
                
                // Selecionar congregação, se existir
                const congregacaoSelect = document.getElementById('eventoCongregacao');
                if (congregacaoSelect && evento.congregacaoId) {
                    congregacaoSelect.value = evento.congregacaoId;
                }
                
                // Selecionar ministério, se existir
                const ministerioSelect = document.getElementById('eventoMinisterio');
                if (ministerioSelect && evento.ministerioId) {
                    ministerioSelect.value = evento.ministerioId;
                }
                
                // Selecionar participantes, se existirem
                const participantesSelect = document.getElementById('eventoParticipantes');
                if (participantesSelect && evento.participantes) {
                    // Limpar seleções anteriores
                    Array.from(participantesSelect.options).forEach(option => {
                        option.selected = evento.participantes.includes(option.value);
                    });
                    
                    // Atualizar o select múltiplo, se estiver usando Bootstrap Select
                    if ($.fn.selectpicker) {
                        $(participantesSelect).selectpicker('refresh');
                    }
                }
                
                // Mostrar modal
                eventoModal.show();
            } else {
                Utils.showAlert('Evento não encontrado.', 'warning');
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar evento para edição:', error);
            Utils.showAlert('Erro ao carregar evento para edição.', 'danger');
        });
}

/**
 * Mostrar modal de confirmação de exclusão
 */
function showDeleteModal(eventoId) {
    // Definir ID do evento atual
    currentEventoId = eventoId;
    
    // Mostrar modal de confirmação
    deleteEventoModal.show();
}

/**
 * Excluir evento
 */
function deleteEvento() {
    if (!currentEventoId) return;
    
    // Desabilitar botão de confirmar exclusão e mostrar spinner
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
    
    // Excluir evento
    eventosRef.doc(currentEventoId).delete()
        .then(() => {
            Utils.showAlert('Evento excluído com sucesso!', 'success');
            deleteEventoModal.hide();
            
            // Remover da tabela
            if (eventosTableBody) {
                const row = eventosTableBody.querySelector(`tr[data-id="${currentEventoId}"]`);
                if (row) row.remove();
            }
            
            // Verificar se a tabela ficou vazia
            if (eventosTableBody && eventosTableBody.children.length === 0) {
                eventosTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum evento cadastrado.</td></tr>';
            }
            
            // Recarregar próximos eventos no dashboard, se existir
            const proximosEventosTable = document.getElementById('proximosEventosTableBody');
            if (proximosEventosTable) {
                loadProximosEventos();
            }
        })
        .catch((error) => {
            console.error('Erro ao excluir evento:', error);
            Utils.showAlert('Erro ao excluir evento. Tente novamente.', 'danger');
        })
        .finally(() => {
            // Reativar botão
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Confirmar Exclusão';
            
            // Limpar ID atual
            currentEventoId = null;
        });
}

/**
 * Resetar formulário de evento
 */
function resetEventoForm() {
    // Limpar ID atual
    currentEventoId = null;
    
    // Resetar formulário
    eventoForm.reset();
    
    // Resetar select múltiplo de participantes, se estiver usando Bootstrap Select
    const participantesSelect = document.getElementById('eventoParticipantes');
    if (participantesSelect && $.fn.selectpicker) {
        $(participantesSelect).selectpicker('deselectAll');
        $(participantesSelect).selectpicker('refresh');
    }
}

/**
 * Exportar eventos para CSV
 */
function exportEventosToCSV() {
    // Buscar todos os eventos
    eventosRef.orderBy('data', 'desc').get()
        .then((querySnapshot) => {
            // Verificar se há eventos
            if (querySnapshot.empty) {
                Utils.showAlert('Não há eventos para exportar.', 'warning');
                return;
            }
            
            // Preparar dados para CSV
            const csvData = [];
            
            // Adicionar cabeçalho
            csvData.push(['Título', 'Data', 'Hora', 'Congregação', 'Ministério', 'Status', 'Participantes', 'Observações']);
            
            // Processar cada evento
            const promises = [];
            
            querySnapshot.forEach((doc) => {
                const evento = doc.data();
                
                // Formatar data
                const data = evento.data ? new Date(evento.data.toDate()) : new Date();
                const formattedDate = Utils.formatDate(data);
                
                // Buscar nome da congregação
                let congregacaoPromise = Promise.resolve('Não definida');
                if (evento.congregacaoId) {
                    congregacaoPromise = congregacoesRef.doc(evento.congregacaoId).get()
                        .then(congregacaoDoc => {
                            return congregacaoDoc.exists ? congregacaoDoc.data().nome : 'Não encontrada';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Buscar nome do ministério
                let ministerioPromise = Promise.resolve('Não definido');
                if (evento.ministerioId) {
                    ministerioPromise = ministeriosRef.doc(evento.ministerioId).get()
                        .then(ministerioDoc => {
                            return ministerioDoc.exists ? ministerioDoc.data().nome : 'Não encontrado';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Buscar nomes dos participantes
                let participantesPromise = Promise.resolve([]);
                if (evento.participantes && evento.participantes.length > 0) {
                    const participantesPromises = evento.participantes.map(participanteId => {
                        return usersRef.doc(participanteId).get()
                            .then(userDoc => {
                                return userDoc.exists ? userDoc.data().nome : 'Participante não encontrado';
                            })
                            .catch(() => 'Erro ao carregar');
                    });
                    
                    participantesPromise = Promise.all(participantesPromises);
                }
                
                // Adicionar promessa para resolver os nomes
                promises.push(
                    Promise.all([congregacaoPromise, ministerioPromise, participantesPromise])
                        .then(([congregacaoNome, ministerioNome, participantesNomes]) => {
                            csvData.push([
                                evento.titulo || '',
                                formattedDate,
                                evento.hora || '',
                                congregacaoNome,
                                ministerioNome,
                                Utils.getStatusName(evento.status),
                                participantesNomes.join(', '),
                                evento.observacoes || ''
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
                    link.setAttribute('download', `eventos_${Utils.formatDateForFilename(new Date())}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
        })
        .catch((error) => {
            console.error('Erro ao exportar eventos:', error);
            Utils.showAlert('Erro ao exportar eventos. Tente novamente.', 'danger');
        });
}

/**
 * Exportar eventos para PDF
 */
function exportEventosToPDF() {
    // Verificar se a biblioteca jsPDF está disponível
    if (typeof jsPDF === 'undefined') {
        Utils.showAlert('Biblioteca jsPDF não encontrada. Não é possível exportar para PDF.', 'warning');
        return;
    }
    
    // Buscar todos os eventos
    eventosRef.orderBy('data', 'desc').get()
        .then((querySnapshot) => {
            // Verificar se há eventos
            if (querySnapshot.empty) {
                Utils.showAlert('Não há eventos para exportar.', 'warning');
                return;
            }
            
            // Criar novo documento PDF
            const doc = new jsPDF();
            
            // Adicionar título
            doc.setFontSize(18);
            doc.text('Relatório de Eventos', 14, 22);
            
            // Adicionar data de geração
            doc.setFontSize(10);
            doc.text(`Gerado em: ${Utils.formatDate(new Date())}`, 14, 30);
            
            // Configurar tabela
            const columns = [
                {header: 'Título', dataKey: 'titulo'},
                {header: 'Data', dataKey: 'data'},
                {header: 'Hora', dataKey: 'hora'},
                {header: 'Congregação', dataKey: 'congregacao'},
                {header: 'Ministério', dataKey: 'ministerio'},
                {header: 'Status', dataKey: 'status'}
            ];
            
            // Preparar dados para a tabela
            const rows = [];
            const promises = [];
            
            querySnapshot.forEach((doc) => {
                const evento = doc.data();
                
                // Formatar data
                const data = evento.data ? new Date(evento.data.toDate()) : new Date();
                const formattedDate = Utils.formatDate(data);
                
                // Buscar nome da congregação
                let congregacaoPromise = Promise.resolve('Não definida');
                if (evento.congregacaoId) {
                    congregacaoPromise = congregacoesRef.doc(evento.congregacaoId).get()
                        .then(congregacaoDoc => {
                            return congregacaoDoc.exists ? congregacaoDoc.data().nome : 'Não encontrada';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Buscar nome do ministério
                let ministerioPromise = Promise.resolve('Não definido');
                if (evento.ministerioId) {
                    ministerioPromise = ministeriosRef.doc(evento.ministerioId).get()
                        .then(ministerioDoc => {
                            return ministerioDoc.exists ? ministerioDoc.data().nome : 'Não encontrado';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Adicionar promessa para resolver os nomes
                promises.push(
                    Promise.all([congregacaoPromise, ministerioPromise])
                        .then(([congregacaoNome, ministerioNome]) => {
                            rows.push({
                                titulo: evento.titulo || '',
                                data: formattedDate,
                                hora: evento.hora || '',
                                congregacao: congregacaoNome,
                                ministerio: ministerioNome,
                                status: Utils.getStatusName(evento.status)
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
                            titulo: {cellWidth: 40}
                        }
                    });
                    
                    // Salvar PDF
                    doc.save(`eventos_${Utils.formatDateForFilename(new Date())}.pdf`);
                });
        })
        .catch((error) => {
            console.error('Erro ao exportar eventos para PDF:', error);
            Utils.showAlert('Erro ao exportar eventos para PDF. Tente novamente.', 'danger');
        });
}