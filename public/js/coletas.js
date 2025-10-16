/**
 * coletas.js - Funções para gerenciamento de coletas
 * Agenda de Serviços — CCB Administração Ituiutaba
 */

// Referência às coleções no Firestore
const coletasRef = db.collection('coletas');
const eventosRef = db.collection('eventos');
const congregacoesRef = db.collection('congregacoes');

// Elementos do DOM
const coletaForm = document.getElementById('coletaForm');
const coletasTableBody = document.getElementById('coletasTableBody');
const searchColetaInput = document.getElementById('searchColeta');
const addColetaBtn = document.getElementById('addColetaBtn');
const coletaModal = new bootstrap.Modal(document.getElementById('coletaModal'));
const deleteColetaModal = new bootstrap.Modal(document.getElementById('deleteColetaModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteColeta');
const viewColetaModal = new bootstrap.Modal(document.getElementById('viewColetaModal'));
const receberColetaModal = new bootstrap.Modal(document.getElementById('receberColetaModal'));
const receberColetaForm = document.getElementById('receberColetaForm');

// ID da coleta atual sendo editada ou excluída
let currentColetaId = null;

// Listener para quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de coletas
    if (coletaForm) {
        initColetas();
    }
    
    // Verificar se estamos no dashboard (para mostrar resumo de coletas)
    const coletasResumoContainer = document.getElementById('coletasResumoContainer');
    if (coletasResumoContainer) {
        loadColetasResumo();
    }
});

/**
 * Inicializar a página de coletas
 */
function initColetas() {
    // Configurar listeners de eventos
    setupEventListeners();
    
    // Carregar lista de coletas
    loadColetas();
    
    // Carregar eventos para o select
    loadEventos();
    
    // Inicializar gráficos
    initCharts();
    
    // Carregar resumo de coletas
    loadColetasResumo();
});

/**
 * Configurar listeners de eventos
 */
function setupEventListeners() {
    // Listener para o formulário de coleta
    if (coletaForm) {
        coletaForm.addEventListener('submit', handleColetaSubmit);
    }
    
    // Listener para o formulário de recebimento de coleta
    if (receberColetaForm) {
        receberColetaForm.addEventListener('submit', handleReceberColetaSubmit);
    }
    
    // Listener para o botão de adicionar coleta
    if (addColetaBtn) {
        addColetaBtn.addEventListener('click', () => {
            resetColetaForm();
            document.getElementById('coletaModalLabel').textContent = 'Adicionar Coleta';
            coletaModal.show();
        });
    }
    
    // Listener para o botão de confirmar exclusão
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteColeta);
    }
    
    // Listener para o campo de busca
    if (searchColetaInput) {
        searchColetaInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterColetas(searchTerm);
        });
    }
    
    // Listeners para filtros
    const dataInicioFilter = document.getElementById('dataInicioFilter');
    const dataFimFilter = document.getElementById('dataFimFilter');
    const tipoFilter = document.getElementById('tipoFilter');
    const statusFilter = document.getElementById('statusFilter');
    const eventoFilter = document.getElementById('eventoFilter');
    
    if (dataInicioFilter) {
        dataInicioFilter.addEventListener('change', applyFilters);
    }
    
    if (dataFimFilter) {
        dataFimFilter.addEventListener('change', applyFilters);
    }
    
    if (tipoFilter) {
        tipoFilter.addEventListener('change', applyFilters);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (eventoFilter) {
        eventoFilter.addEventListener('change', applyFilters);
    }
    
    // Listener para o botão de limpar filtros
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Listener para o botão de exportar para CSV
    const exportCSVBtn = document.getElementById('exportColetasCSV');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportColetasToCSV);
    }
    
    // Listener para o botão de exportar para PDF
    const exportPDFBtn = document.getElementById('exportColetasPDF');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', exportColetasToPDF);
    }
});

/**
 * Carregar lista de eventos para o select
 */
function loadEventos() {
    const eventoSelect = document.getElementById('coletaEvento');
    const eventoFilter = document.getElementById('eventoFilter');
    
    // Buscar eventos
    eventosRef.orderBy('data', 'desc').get()
        .then((querySnapshot) => {
            // Preencher select do formulário
            if (eventoSelect) {
                // Limpar opções atuais, mantendo a primeira (selecione)
                eventoSelect.innerHTML = '<option value="">Selecione um evento</option>';
                
                querySnapshot.forEach((doc) => {
                    const evento = doc.data();
                    const data = evento.data ? new Date(evento.data.toDate()) : new Date();
                    const formattedDate = Utils.formatDate(data);
                    
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = `${evento.titulo} (${formattedDate})`;
                    eventoSelect.appendChild(option);
                });
            }
            
            // Preencher select do filtro
            if (eventoFilter) {
                // Limpar opções atuais, mantendo a primeira (todos)
                eventoFilter.innerHTML = '<option value="">Todos os eventos</option>';
                
                querySnapshot.forEach((doc) => {
                    const evento = doc.data();
                    const data = evento.data ? new Date(evento.data.toDate()) : new Date();
                    const formattedDate = Utils.formatDate(data);
                    
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = `${evento.titulo} (${formattedDate})`;
                    eventoFilter.appendChild(option);
                });
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar eventos:', error);
        });
}

/**
 * Carregar lista de coletas do Firestore
 */
function loadColetas() {
    // Mostrar indicador de carregamento
    if (coletasTableBody) {
        coletasTableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    }
    
    // Buscar coletas ordenadas por data (mais recentes primeiro)
    coletasRef.orderBy('data', 'desc').get()
        .then((querySnapshot) => {
            // Limpar tabela
            if (coletasTableBody) {
                coletasTableBody.innerHTML = '';
            }
            
            // Verificar se há coletas
            if (querySnapshot.empty) {
                if (coletasTableBody) {
                    coletasTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma coleta cadastrada.</td></tr>';
                }
                return;
            }
            
            // Processar cada coleta
            querySnapshot.forEach((doc) => {
                const coleta = doc.data();
                coleta.id = doc.id;
                
                // Adicionar à tabela
                if (coletasTableBody) {
                    addColetaToTable(coleta);
                }
            });
        })
        .catch((error) => {
            console.error('Erro ao carregar coletas:', error);
            Utils.showAlert('Erro ao carregar coletas. Tente novamente.', 'danger');
            
            if (coletasTableBody) {
                coletasTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Erro ao carregar coletas.</td></tr>';
            }
        });
}

/**
 * Carregar resumo de coletas para o dashboard
 */
function loadColetasResumo() {
    // Elementos do resumo
    const totalColetasElement = document.getElementById('totalColetas');
    const totalRecebidoElement = document.getElementById('totalRecebido');
    const totalPendenteElement = document.getElementById('totalPendente');
    const ultimasColetasTable = document.getElementById('ultimasColetasTableBody');
    
    // Verificar se estamos na página correta
    if (!totalColetasElement && !ultimasColetasTable) return;
    
    // Mostrar indicador de carregamento nas tabelas
    if (ultimasColetasTable) {
        ultimasColetasTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    }
    
    // Data atual
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    // Buscar coletas do mês atual
    coletasRef
        .where('data', '>=', firebase.firestore.Timestamp.fromDate(primeiroDiaMes))
        .where('data', '<=', firebase.firestore.Timestamp.fromDate(ultimoDiaMes))
        .get()
        .then((querySnapshot) => {
            let totalColetas = 0;
            let totalRecebido = 0;
            let totalPendente = 0;
            
            querySnapshot.forEach((doc) => {
                const coleta = doc.data();
                totalColetas++;
                
                if (coleta.status === 'recebido' && coleta.collectedAmount) {
                    totalRecebido += parseFloat(coleta.collectedAmount);
                } else if (coleta.expectedAmount) {
                    totalPendente += parseFloat(coleta.expectedAmount);
                }
            });
            
            // Atualizar elementos do resumo
            if (totalColetasElement) {
                totalColetasElement.textContent = totalColetas;
            }
            
            if (totalRecebidoElement) {
                totalRecebidoElement.textContent = Utils.formatCurrency(totalRecebido);
            }
            
            if (totalPendenteElement) {
                totalPendenteElement.textContent = Utils.formatCurrency(totalPendente);
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar resumo de coletas:', error);
        });
    
    // Buscar últimas coletas para a tabela
    if (ultimasColetasTable) {
        coletasRef.orderBy('data', 'desc').limit(5).get()
            .then((querySnapshot) => {
                // Limpar tabela
                ultimasColetasTable.innerHTML = '';
                
                // Verificar se há coletas
                if (querySnapshot.empty) {
                    ultimasColetasTable.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma coleta cadastrada.</td></tr>';
                    return;
                }
                
                // Processar cada coleta
                const promises = [];
                
                querySnapshot.forEach((doc) => {
                    const coleta = doc.data();
                    coleta.id = doc.id;
                    
                    // Buscar nome do evento
                    let eventoPromise = Promise.resolve('Não vinculado');
                    if (coleta.eventoId) {
                        eventoPromise = eventosRef.doc(coleta.eventoId).get()
                            .then(eventoDoc => {
                                return eventoDoc.exists ? eventoDoc.data().titulo : 'Evento não encontrado';
                            })
                            .catch(() => 'Erro ao carregar');
                    }
                    
                    // Adicionar promessa para resolver o nome do evento
                    promises.push(
                        eventoPromise.then((eventoTitulo) => {
                            // Formatar data
                            const data = coleta.data ? new Date(coleta.data.toDate()) : new Date();
                            const formattedDate = Utils.formatDate(data);
                            
                            // Criar linha da tabela
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${Utils.getTipoColetaName(coleta.tipo)}</td>
                                <td>${formattedDate}</td>
                                <td>${eventoTitulo}</td>
                                <td>${Utils.formatCurrency(coleta.status === 'recebido' ? coleta.collectedAmount : coleta.expectedAmount)}</td>
                                <td>
                                    <span class="badge bg-${Utils.getStatusColetaColor(coleta.status)}">
                                        ${Utils.getStatusColetaName(coleta.status)}
                                    </span>
                                </td>
                            `;
                            
                            ultimasColetasTable.appendChild(row);
                        })
                    );
                });
                
                // Se não houver promessas (não deveria acontecer, mas por segurança)
                if (promises.length === 0) {
                    ultimasColetasTable.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma coleta cadastrada.</td></tr>';
                }
                
                // Resolver todas as promessas
                return Promise.all(promises);
            })
            .catch((error) => {
                console.error('Erro ao carregar últimas coletas:', error);
                ultimasColetasTable.innerHTML = '<tr><td colspan="5" class="text-center">Erro ao carregar coletas.</td></tr>';
            });
    }
}

/**
 * Inicializar gráficos de coletas
 */
function initCharts() {
    // Verificar se estamos na página correta
    const coletasPorTipoChart = document.getElementById('coletasPorTipoChart');
    const coletasPorMesChart = document.getElementById('coletasPorMesChart');
    
    if (!coletasPorTipoChart && !coletasPorMesChart) return;
    
    // Buscar dados para os gráficos
    coletasRef.orderBy('data', 'asc').get()
        .then((querySnapshot) => {
            // Dados para gráfico por tipo
            const tiposMap = {};
            // Dados para gráfico por mês
            const mesesMap = {};
            
            querySnapshot.forEach((doc) => {
                const coleta = doc.data();
                
                // Processar por tipo
                const tipo = coleta.tipo || 'outro';
                if (!tiposMap[tipo]) {
                    tiposMap[tipo] = 0;
                }
                
                // Somar valor recebido ou esperado
                if (coleta.status === 'recebido' && coleta.collectedAmount) {
                    tiposMap[tipo] += parseFloat(coleta.collectedAmount);
                } else if (coleta.expectedAmount) {
                    tiposMap[tipo] += parseFloat(coleta.expectedAmount);
                }
                
                // Processar por mês
                if (coleta.data) {
                    const data = new Date(coleta.data.toDate());
                    const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
                    
                    if (!mesesMap[mesAno]) {
                        mesesMap[mesAno] = {
                            recebido: 0,
                            pendente: 0
                        };
                    }
                    
                    // Somar valor recebido ou pendente
                    if (coleta.status === 'recebido' && coleta.collectedAmount) {
                        mesesMap[mesAno].recebido += parseFloat(coleta.collectedAmount);
                    } else if (coleta.expectedAmount) {
                        mesesMap[mesAno].pendente += parseFloat(coleta.expectedAmount);
                    }
                }
            });
            
            // Criar gráfico por tipo
            if (coletasPorTipoChart) {
                const tiposLabels = Object.keys(tiposMap).map(tipo => Utils.getTipoColetaName(tipo));
                const tiposValues = Object.values(tiposMap);
                
                new Chart(coletasPorTipoChart, {
                    type: 'pie',
                    data: {
                        labels: tiposLabels,
                        datasets: [{
                            data: tiposValues,
                            backgroundColor: [
                                '#4e73df',
                                '#1cc88a',
                                '#36b9cc',
                                '#f6c23e',
                                '#e74a3b',
                                '#858796'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12
                            }
                        },
                        tooltips: {
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    const value = data.datasets[0].data[tooltipItem.index];
                                    return `${data.labels[tooltipItem.index]}: ${Utils.formatCurrency(value)}`;
                                }
                            }
                        }
                    }
                });
            }
            
            // Criar gráfico por mês
            if (coletasPorMesChart) {
                // Ordenar meses cronologicamente
                const mesesOrdenados = Object.keys(mesesMap).sort((a, b) => {
                    const [mesA, anoA] = a.split('/');
                    const [mesB, anoB] = b.split('/');
                    return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
                });
                
                // Limitar a últimos 6 meses se houver muitos
                const mesesExibir = mesesOrdenados.length > 6 ? mesesOrdenados.slice(-6) : mesesOrdenados;
                
                // Formatar labels dos meses
                const mesesLabels = mesesExibir.map(mesAno => {
                    const [mes, ano] = mesAno.split('/');
                    return `${Utils.getNomeMes(parseInt(mes) - 1)}/${ano}`;
                });
                
                // Valores para o gráfico
                const recebidoValues = mesesExibir.map(mesAno => mesesMap[mesAno].recebido);
                const pendenteValues = mesesExibir.map(mesAno => mesesMap[mesAno].pendente);
                
                new Chart(coletasPorMesChart, {
                    type: 'bar',
                    data: {
                        labels: mesesLabels,
                        datasets: [
                            {
                                label: 'Recebido',
                                backgroundColor: '#1cc88a',
                                data: recebidoValues
                            },
                            {
                                label: 'Pendente',
                                backgroundColor: '#f6c23e',
                                data: pendenteValues
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            xAxes: [{
                                gridLines: {
                                    display: false
                                },
                                ticks: {
                                    maxRotation: 0
                                }
                            }],
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    callback: function(value) {
                                        return Utils.formatCurrency(value);
                                    }
                                }
                            }]
                        },
                        tooltips: {
                            callbacks: {
                                label: function(tooltipItem, data) {
                                    const value = tooltipItem.yLabel;
                                    const datasetLabel = data.datasets[tooltipItem.datasetIndex].label;
                                    return `${datasetLabel}: ${Utils.formatCurrency(value)}`;
                                }
                            }
                        }
                    }
                });
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar dados para gráficos:', error);
        });
}

/**
 * Adicionar coleta à tabela
 */
function addColetaToTable(coleta) {
    if (!coletasTableBody) return;
    
    const row = document.createElement('tr');
    row.setAttribute('data-id', coleta.id);
    row.setAttribute('data-data', coleta.data ? coleta.data.toDate().toISOString() : '');
    row.setAttribute('data-tipo', coleta.tipo || '');
    row.setAttribute('data-status', coleta.status || '');
    row.setAttribute('data-evento', coleta.eventoId || '');
    
    // Formatar data
    const data = coleta.data ? new Date(coleta.data.toDate()) : new Date();
    const formattedDate = Utils.formatDate(data);
    
    // Buscar nome do evento
    let eventoTitulo = 'Carregando...';
    if (coleta.eventoId) {
        eventosRef.doc(coleta.eventoId).get()
            .then(doc => {
                if (doc.exists) {
                    eventoTitulo = doc.data().titulo;
                    row.querySelector('.evento-titulo').textContent = eventoTitulo;
                } else {
                    row.querySelector('.evento-titulo').textContent = 'Evento não encontrado';
                }
            })
            .catch(() => {
                row.querySelector('.evento-titulo').textContent = 'Erro ao carregar';
            });
    } else {
        eventoTitulo = 'Não vinculado';
    }
    
    // Determinar valor a exibir (recebido ou esperado)
    const valorExibir = coleta.status === 'recebido' && coleta.collectedAmount ? 
        coleta.collectedAmount : coleta.expectedAmount;
    
    row.innerHTML = `
        <td>${Utils.getTipoColetaName(coleta.tipo)}</td>
        <td>${formattedDate}</td>
        <td class="evento-titulo">${eventoTitulo}</td>
        <td>${Utils.formatCurrency(valorExibir)}</td>
        <td>
            <span class="badge bg-${Utils.getStatusColetaColor(coleta.status)}">
                ${Utils.getStatusColetaName(coleta.status)}
            </span>
        </td>
        <td>
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-info view-coleta" data-id="${coleta.id}" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                ${coleta.status !== 'recebido' ? `
                <button type="button" class="btn btn-success receber-coleta" data-id="${coleta.id}" title="Registrar Recebimento">
                    <i class="fas fa-check"></i>
                </button>` : ''}
                <button type="button" class="btn btn-primary edit-coleta" data-id="${coleta.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-danger delete-coleta" data-id="${coleta.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Adicionar event listeners para os botões
    row.querySelector('.view-coleta').addEventListener('click', () => viewColeta(coleta.id));
    
    const receberBtn = row.querySelector('.receber-coleta');
    if (receberBtn) {
        receberBtn.addEventListener('click', () => showReceberModal(coleta.id));
    }
    
    row.querySelector('.edit-coleta').addEventListener('click', () => editColeta(coleta.id));
    row.querySelector('.delete-coleta').addEventListener('click', () => showDeleteModal(coleta.id));
    
    coletasTableBody.appendChild(row);
}

/**
 * Filtrar coletas com base no termo de busca
 */
function filterColetas(searchTerm) {
    // Filtrar tabela
    if (coletasTableBody) {
        const rows = coletasTableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            if (row.cells.length > 1) { // Ignorar linhas de mensagem
                const tipo = row.cells[0].textContent.toLowerCase();
                const data = row.cells[1].textContent.toLowerCase();
                const evento = row.cells[2].textContent.toLowerCase();
                const valor = row.cells[3].textContent.toLowerCase();
                const status = row.cells[4].textContent.toLowerCase();
                
                if (tipo.includes(searchTerm) || data.includes(searchTerm) || 
                    evento.includes(searchTerm) || valor.includes(searchTerm) || 
                    status.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }
}

/**
 * Aplicar filtros de data, tipo, status e evento
 */
function applyFilters() {
    if (!coletasTableBody) return;
    
    const dataInicio = document.getElementById('dataInicioFilter').value;
    const dataFim = document.getElementById('dataFimFilter').value;
    const tipo = document.getElementById('tipoFilter').value;
    const status = document.getElementById('statusFilter').value;
    const eventoId = document.getElementById('eventoFilter').value;
    
    const rows = coletasTableBody.querySelectorAll('tr');
    
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
            
            // Filtrar por tipo
            if (mostrar && tipo && row.getAttribute('data-tipo') !== tipo) {
                mostrar = false;
            }
            
            // Filtrar por status
            if (mostrar && status && row.getAttribute('data-status') !== status) {
                mostrar = false;
            }
            
            // Filtrar por evento
            if (mostrar && eventoId && row.getAttribute('data-evento') !== eventoId) {
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
        let noResultsRow = coletasTableBody.querySelector('.no-results-row');
        
        if (!noResultsRow) {
            noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-row';
            noResultsRow.innerHTML = '<td colspan="6" class="text-center">Nenhuma coleta encontrada com os filtros aplicados.</td>';
            coletasTableBody.appendChild(noResultsRow);
        } else {
            noResultsRow.style.display = '';
        }
    } else {
        // Esconder mensagem de nenhum resultado se existir
        const noResultsRow = coletasTableBody.querySelector('.no-results-row');
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
    document.getElementById('tipoFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('eventoFilter').value = '';
    document.getElementById('searchColeta').value = '';
    
    // Mostrar todas as linhas
    if (coletasTableBody) {
        const rows = coletasTableBody.querySelectorAll('tr');
        
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
 * Manipular envio do formulário de coleta
 */
function handleColetaSubmit(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const tipo = document.getElementById('coletaTipo').value;
    const data = document.getElementById('coletaData').value;
    const eventoId = document.getElementById('coletaEvento').value;
    const expectedAmount = document.getElementById('coletaExpectedAmount').value;
    const observacoes = document.getElementById('coletaObservacoes').value.trim();
    
    // Validar campos obrigatórios
    if (!tipo || !data) {
        Utils.showAlert('Por favor, preencha os campos obrigatórios.', 'warning');
        return;
    }
    
    // Desabilitar botão de salvar e mostrar spinner
    const saveButton = document.getElementById('saveColetaBtn');
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    // Converter data para timestamp
    const dataObj = new Date(data);
    
    // Preparar dados da coleta
    const coletaData = {
        tipo: tipo,
        data: firebase.firestore.Timestamp.fromDate(dataObj),
        eventoId: eventoId || null,
        expectedAmount: expectedAmount ? parseFloat(expectedAmount) : 0,
        status: 'pendente',
        observacoes: observacoes,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Verificar se é uma edição ou novo cadastro
    if (currentColetaId) {
        // Atualizar coleta existente
        coletasRef.doc(currentColetaId).update(coletaData)
            .then(() => {
                Utils.showAlert('Coleta atualizada com sucesso!', 'success');
                coletaModal.hide();
                loadColetas(); // Recarregar lista
                loadColetasResumo(); // Atualizar resumo
                initCharts(); // Atualizar gráficos
            })
            .catch((error) => {
                console.error('Erro ao atualizar coleta:', error);
                Utils.showAlert('Erro ao atualizar coleta. Tente novamente.', 'danger');
            })
            .finally(() => {
                // Reativar botão
                saveButton.disabled = false;
                saveButton.innerHTML = 'Salvar';
            });
    } else {
        // Adicionar timestamp de criação para novas coletas
        coletaData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        // Criar nova coleta
        coletasRef.add(coletaData)
            .then(() => {
                Utils.showAlert('Coleta cadastrada com sucesso!', 'success');
                coletaModal.hide();
                loadColetas(); // Recarregar lista
                loadColetasResumo(); // Atualizar resumo
                initCharts(); // Atualizar gráficos
            })
            .catch((error) => {
                console.error('Erro ao cadastrar coleta:', error);
                Utils.showAlert('Erro ao cadastrar coleta. Tente novamente.', 'danger');
            })
            .finally(() => {
                // Reativar botão
                saveButton.disabled = false;
                saveButton.innerHTML = 'Salvar';
            });
    }
}

/**
 * Manipular envio do formulário de recebimento de coleta
 */
function handleReceberColetaSubmit(e) {
    e.preventDefault();
    
    if (!currentColetaId) return;
    
    // Obter valor do formulário
    const collectedAmount = document.getElementById('receberColetaAmount').value;
    const observacoes = document.getElementById('receberColetaObservacoes').value.trim();
    
    // Validar campos obrigatórios
    if (!collectedAmount) {
        Utils.showAlert('Por favor, informe o valor recebido.', 'warning');
        return;
    }
    
    // Desabilitar botão de salvar e mostrar spinner
    const saveButton = document.getElementById('saveReceberColetaBtn');
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    // Preparar dados da coleta
    const coletaData = {
        collectedAmount: parseFloat(collectedAmount),
        status: 'recebido',
        observacoesRecebimento: observacoes,
        dataRecebimento: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Atualizar coleta
    coletasRef.doc(currentColetaId).update(coletaData)
        .then(() => {
            Utils.showAlert('Recebimento registrado com sucesso!', 'success');
            receberColetaModal.hide();
            loadColetas(); // Recarregar lista
            loadColetasResumo(); // Atualizar resumo
            initCharts(); // Atualizar gráficos
        })
        .catch((error) => {
            console.error('Erro ao registrar recebimento:', error);
            Utils.showAlert('Erro ao registrar recebimento. Tente novamente.', 'danger');
        })
        .finally(() => {
            // Reativar botão
            saveButton.disabled = false;
            saveButton.innerHTML = 'Confirmar Recebimento';
            
            // Limpar ID atual
            currentColetaId = null;
        });
}

/**
 * Visualizar detalhes de uma coleta
 */
function viewColeta(coletaId) {
    // Mostrar indicador de carregamento
    const viewModalBody = document.getElementById('viewColetaBody');
    viewModalBody.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    
    // Mostrar modal
    viewColetaModal.show();
    
    // Buscar dados da coleta
    coletasRef.doc(coletaId).get()
        .then((doc) => {
            if (doc.exists) {
                const coleta = doc.data();
                coleta.id = doc.id;
                
                // Formatar data
                const data = coleta.data ? new Date(coleta.data.toDate()) : new Date();
                const formattedDate = Utils.formatDate(data);
                
                // Formatar data de recebimento, se existir
                let dataRecebimento = 'Não recebido';
                if (coleta.dataRecebimento) {
                    const dataRec = new Date(coleta.dataRecebimento.toDate());
                    dataRecebimento = Utils.formatDate(dataRec);
                }
                
                // Buscar nome do evento
                let eventoPromise = Promise.resolve('Não vinculado');
                if (coleta.eventoId) {
                    eventoPromise = eventosRef.doc(coleta.eventoId).get()
                        .then(eventoDoc => {
                            if (eventoDoc.exists) {
                                const evento = eventoDoc.data();
                                const dataEvento = evento.data ? new Date(evento.data.toDate()) : new Date();
                                const formattedDateEvento = Utils.formatDate(dataEvento);
                                return `${evento.titulo} (${formattedDateEvento})`;
                            }
                            return 'Evento não encontrado';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Quando a promessa for resolvida
                eventoPromise.then((eventoTitulo) => {
                    // Preencher modal com os dados
                    viewModalBody.innerHTML = `
                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <h4>${Utils.getTipoColetaName(coleta.tipo)}</h4>
                                <p class="text-muted">
                                    <span class="badge bg-${Utils.getStatusColetaColor(coleta.status)}">
                                        ${Utils.getStatusColetaName(coleta.status)}
                                    </span>
                                </p>
                            </div>
                            
                            <div class="col-md-6 mb-3">
                                <h5>Data</h5>
                                <p>${formattedDate}</p>
                            </div>
                            
                            <div class="col-md-6 mb-3">
                                <h5>Evento</h5>
                                <p>${eventoTitulo}</p>
                            </div>
                            
                            <div class="col-md-6 mb-3">
                                <h5>Valor Previsto</h5>
                                <p>${Utils.formatCurrency(coleta.expectedAmount || 0)}</p>
                            </div>
                            
                            ${coleta.status === 'recebido' ? `
                            <div class="col-md-6 mb-3">
                                <h5>Valor Recebido</h5>
                                <p>${Utils.formatCurrency(coleta.collectedAmount || 0)}</p>
                            </div>
                            
                            <div class="col-md-6 mb-3">
                                <h5>Data de Recebimento</h5>
                                <p>${dataRecebimento}</p>
                            </div>
                            ` : ''}
                            
                            <div class="col-md-12 mb-3">
                                <h5>Observações</h5>
                                <p>${coleta.observacoes || 'Sem observações'}</p>
                            </div>
                            
                            ${coleta.status === 'recebido' && coleta.observacoesRecebimento ? `
                            <div class="col-md-12 mb-3">
                                <h5>Observações do Recebimento</h5>
                                <p>${coleta.observacoesRecebimento}</p>
                            </div>
                            ` : ''}
                        </div>
                    `;
                });
            } else {
                viewModalBody.innerHTML = '<div class="alert alert-warning">Coleta não encontrada.</div>';
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar detalhes da coleta:', error);
            viewModalBody.innerHTML = '<div class="alert alert-danger">Erro ao carregar detalhes da coleta.</div>';
        });
}

/**
 * Preparar formulário para edição de coleta
 */
function editColeta(coletaId) {
    // Definir ID da coleta atual
    currentColetaId = coletaId;
    
    // Atualizar título do modal
    document.getElementById('coletaModalLabel').textContent = 'Editar Coleta';
    
    // Buscar dados da coleta
    coletasRef.doc(coletaId).get()
        .then((doc) => {
            if (doc.exists) {
                const coleta = doc.data();
                
                // Formatar data para o input
                let dataFormatada = '';
                if (coleta.data) {
                    const data = new Date(coleta.data.toDate());
                    const ano = data.getFullYear();
                    const mes = String(data.getMonth() + 1).padStart(2, '0');
                    const dia = String(data.getDate()).padStart(2, '0');
                    dataFormatada = `${ano}-${mes}-${dia}`;
                }
                
                // Preencher formulário
                document.getElementById('coletaTipo').value = coleta.tipo || '';
                document.getElementById('coletaData').value = dataFormatada;
                document.getElementById('coletaExpectedAmount').value = coleta.expectedAmount || '';
                document.getElementById('coletaObservacoes').value = coleta.observacoes || '';
                
                // Selecionar evento, se existir
                const eventoSelect = document.getElementById('coletaEvento');
                if (eventoSelect && coleta.eventoId) {
                    eventoSelect.value = coleta.eventoId;
                }
                
                // Mostrar modal
                coletaModal.show();
            } else {
                Utils.showAlert('Coleta não encontrada.', 'warning');
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar coleta para edição:', error);
            Utils.showAlert('Erro ao carregar coleta para edição.', 'danger');
        });
}

/**
 * Mostrar modal de confirmação de exclusão
 */
function showDeleteModal(coletaId) {
    // Definir ID da coleta atual
    currentColetaId = coletaId;
    
    // Mostrar modal de confirmação
    deleteColetaModal.show();
}

/**
 * Mostrar modal de recebimento de coleta
 */
function showReceberModal(coletaId) {
    // Definir ID da coleta atual
    currentColetaId = coletaId;
    
    // Buscar dados da coleta para preencher o valor esperado
    coletasRef.doc(coletaId).get()
        .then((doc) => {
            if (doc.exists) {
                const coleta = doc.data();
                
                // Preencher valor esperado como sugestão
                document.getElementById('receberColetaAmount').value = coleta.expectedAmount || '';
                document.getElementById('receberColetaObservacoes').value = '';
                
                // Mostrar modal
                receberColetaModal.show();
            } else {
                Utils.showAlert('Coleta não encontrada.', 'warning');
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar coleta para recebimento:', error);
            Utils.showAlert('Erro ao carregar coleta para recebimento.', 'danger');
        });
}

/**
 * Excluir coleta
 */
function deleteColeta() {
    if (!currentColetaId) return;
    
    // Desabilitar botão de confirmar exclusão e mostrar spinner
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
    
    // Excluir coleta
    coletasRef.doc(currentColetaId).delete()
        .then(() => {
            Utils.showAlert('Coleta excluída com sucesso!', 'success');
            deleteColetaModal.hide();
            
            // Remover da tabela
            if (coletasTableBody) {
                const row = coletasTableBody.querySelector(`tr[data-id="${currentColetaId}"]`);
                if (row) row.remove();
            }
            
            // Verificar se a tabela ficou vazia
            if (coletasTableBody && coletasTableBody.children.length === 0) {
                coletasTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma coleta cadastrada.</td></tr>';
            }
            
            // Atualizar resumo e gráficos
            loadColetasResumo();
            initCharts();
        })
        .catch((error) => {
            console.error('Erro ao excluir coleta:', error);
            Utils.showAlert('Erro ao excluir coleta. Tente novamente.', 'danger');
        })
        .finally(() => {
            // Reativar botão
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Confirmar Exclusão';
            
            // Limpar ID atual
            currentColetaId = null;
        });
}

/**
 * Resetar formulário de coleta
 */
function resetColetaForm() {
    // Limpar ID atual
    currentColetaId = null;
    
    // Resetar formulário
    coletaForm.reset();
}

/**
 * Exportar coletas para CSV
 */
function exportColetasToCSV() {
    // Buscar todas as coletas
    coletasRef.orderBy('data', 'desc').get()
        .then((querySnapshot) => {
            // Verificar se há coletas
            if (querySnapshot.empty) {
                Utils.showAlert('Não há coletas para exportar.', 'warning');
                return;
            }
            
            // Preparar dados para CSV
            const csvData = [];
            
            // Adicionar cabeçalho
            csvData.push(['Tipo', 'Data', 'Evento', 'Valor Previsto', 'Valor Recebido', 'Status', 'Data Recebimento', 'Observações']);
            
            // Processar cada coleta
            const promises = [];
            
            querySnapshot.forEach((doc) => {
                const coleta = doc.data();
                
                // Formatar data
                const data = coleta.data ? new Date(coleta.data.toDate()) : new Date();
                const formattedDate = Utils.formatDate(data);
                
                // Formatar data de recebimento, se existir
                let dataRecebimento = '';
                if (coleta.dataRecebimento) {
                    const dataRec = new Date(coleta.dataRecebimento.toDate());
                    dataRecebimento = Utils.formatDate(dataRec);
                }
                
                // Buscar nome do evento
                let eventoPromise = Promise.resolve('Não vinculado');
                if (coleta.eventoId) {
                    eventoPromise = eventosRef.doc(coleta.eventoId).get()
                        .then(eventoDoc => {
                            return eventoDoc.exists ? eventoDoc.data().titulo : 'Evento não encontrado';
                        })
                        .catch(() => 'Erro ao carregar');
                }
                
                // Adicionar promessa para resolver o nome do evento
                promises.push(
                    eventoPromise.then((eventoTitulo) => {
                        csvData.push([
                            Utils.getTipoColetaName(coleta.tipo),
                            formattedDate,
                            eventoTitulo,
                            coleta.expectedAmount || '0',
                            coleta.collectedAmount || '0',
                            Utils.getStatusColetaName(coleta.status),
                            dataRecebimento,
                            coleta.observacoes || ''
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
                    link.setAttribute('download', `coletas_${Utils.formatDateForFilename(new Date())}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
        })
        .catch((error) => {
            console.error('Erro ao exportar coletas:', error);
            Utils.showAlert('Erro ao exportar coletas. Tente novamente.', 'danger');
        });
}

/**
 * Exportar coletas para PDF
 */
function exportColetasToPDF() {
    // Verificar se a biblioteca jsPDF está disponível
    if (typeof jsPDF === 'undefined') {
        Utils.showAlert('Biblioteca jsPDF não encontrada. Não é possível exportar para PDF.', 'warning');
        return;
    }
    
    // Buscar todas as coletas
    coletasRef.orderBy('data', 'desc').get()
        .then((querySnapshot) => {
            // Verificar se há coletas
            if (querySnapshot.empty) {
                Utils.showAlert('Não há coletas para exportar.', 'warning');
                return;
            }
            
            // Criar novo documento PDF
            const doc = new jsPDF();
            
            // Adicionar título
            doc.setFontSize(18);
            doc.text('Relatório de Coletas', 14, 22);
            
            // Adicionar data de geração
            doc.setFontSize(10);
            doc.text(`Gerado em: ${Utils.formatDate(new Date())}`, 14, 30);
            
            // Configurar tabela
            const columns = [
                {header: 'Tipo', dataKey: 'tipo'},
                {header: 'Data', dataKey: 'data'},
                {header: 'Valor Previsto', dataKey: 'valorPrevisto'},
                {header: 'Valor Recebido', dataKey: 'valorRecebido'},
                {header: 'Status', dataKey: 'status'}
            ];
            
            // Preparar dados para a tabela
            const rows = [];
            
            querySnapshot.forEach((doc) => {
                const coleta = doc.data();
                
                // Formatar data
                const data = coleta.data ? new Date(coleta.data.toDate()) : new Date();
                const formattedDate = Utils.formatDate(data);
                
                rows.push({
                    tipo: Utils.getTipoColetaName(coleta.tipo),
                    data: formattedDate,
                    valorPrevisto: Utils.formatCurrency(coleta.expectedAmount || 0),
                    valorRecebido: coleta.status === 'recebido' ? Utils.formatCurrency(coleta.collectedAmount || 0) : '-',
                    status: Utils.getStatusColetaName(coleta.status)
                });
            });
            
            // Adicionar tabela ao PDF
            doc.autoTable(columns, rows, {
                startY: 40,
                margin: {top: 40, right: 14, bottom: 20, left: 14},
                styles: {overflow: 'linebreak'},
                columnStyles: {
                    tipo: {cellWidth: 30},
                    data: {cellWidth: 25},
                    valorPrevisto: {cellWidth: 30},
                    valorRecebido: {cellWidth: 30},
                    status: {cellWidth: 25}
                }
            });
            
            // Salvar PDF
            doc.save(`coletas_${Utils.formatDateForFilename(new Date())}.pdf`);
        })
        .catch((error) => {
            console.error('Erro ao exportar coletas para PDF:', error);
            Utils.showAlert('Erro ao exportar coletas para PDF. Tente novamente.', 'danger');
        });
}