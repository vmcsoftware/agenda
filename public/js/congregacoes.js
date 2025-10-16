/**
 * congregacoes.js - Funções para gerenciamento de congregações
 * Agenda de Serviços — CCB Administração Ituiutaba
 */

// Referência à coleção de congregações no Firestore
const congregacoesRef = db.collection('congregacoes');

// Elementos do DOM
const congregacaoForm = document.getElementById('congregacaoForm');
const congregacoesList = document.getElementById('congregacoesList');
const congregacoesTable = document.getElementById('congregacoesTable');
const congregacoesTableBody = document.getElementById('congregacoesTableBody');
const searchCongregacaoInput = document.getElementById('searchCongregacao');
const addCongregacaoBtn = document.getElementById('addCongregacaoBtn');
const congregacaoModal = new bootstrap.Modal(document.getElementById('congregacaoModal'));
const deleteCongregacaoModal = new bootstrap.Modal(document.getElementById('deleteCongregacaoModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteCongregacao');
const viewCongregacaoModal = new bootstrap.Modal(document.getElementById('viewCongregacaoModal'));

// Mapa para exibição das congregações
let congregacoesMap = null;

// ID da congregação atual sendo editada ou excluída
let currentCongregacaoId = null;

// Listener para quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de congregações
    if (congregacaoForm) {
        initCongregacoes();
    }
});

/**
 * Inicializar a página de congregações
 */
function initCongregacoes() {
    // Configurar listeners de eventos
    setupEventListeners();
    
    // Carregar lista de congregações
    loadCongregacoes();
    
    // Inicializar mapa se o elemento existir
    const mapContainer = document.getElementById('congregacoesMap');
    if (mapContainer && typeof L !== 'undefined') {
        initMap();
    }
}

/**
 * Configurar listeners de eventos
 */
function setupEventListeners() {
    // Listener para o formulário de congregação
    if (congregacaoForm) {
        congregacaoForm.addEventListener('submit', handleCongregacaoSubmit);
    }
    
    // Listener para o botão de adicionar congregação
    if (addCongregacaoBtn) {
        addCongregacaoBtn.addEventListener('click', () => {
            resetCongregacaoForm();
            document.getElementById('congregacaoModalLabel').textContent = 'Adicionar Congregação';
            congregacaoModal.show();
        });
    }
    
    // Listener para o botão de confirmar exclusão
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCongregacao);
    }
    
    // Listener para o campo de busca
    if (searchCongregacaoInput) {
        searchCongregacaoInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterCongregacoes(searchTerm);
        });
    }
    
    // Listener para o botão de exportar para CSV
    const exportCSVBtn = document.getElementById('exportCongregacoesCSV');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportCongregacoesToCSV);
    }
    
    // Listener para o botão de exportar para PDF
    const exportPDFBtn = document.getElementById('exportCongregacoesPDF');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', exportCongregacoesToPDF);
    }
}

/**
 * Inicializar mapa Leaflet
 */
function initMap() {
    const mapContainer = document.getElementById('congregacoesMap');
    
    if (!mapContainer || typeof L === 'undefined') return;
    
    // Criar mapa centrado no Brasil
    congregacoesMap = L.map('congregacoesMap').setView([-18.9707, -49.4588], 13); // Coordenadas de Ituiutaba-MG
    
    // Adicionar camada de mapa (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(congregacoesMap);
    
    // Adicionar marcadores para as congregações após carregar os dados
    loadCongregacoesForMap();
}

/**
 * Carregar congregações para o mapa
 */
function loadCongregacoesForMap() {
    if (!congregacoesMap) return;
    
    // Buscar todas as congregações
    congregacoesRef.get()
        .then((querySnapshot) => {
            // Limpar marcadores existentes
            congregacoesMap.eachLayer(layer => {
                if (layer instanceof L.Marker) {
                    congregacoesMap.removeLayer(layer);
                }
            });
            
            // Adicionar marcadores para cada congregação
            querySnapshot.forEach((doc) => {
                const congregacao = doc.data();
                congregacao.id = doc.id;
                
                // Verificar se temos coordenadas válidas
                if (congregacao.latitude && congregacao.longitude) {
                    // Criar marcador
                    const marker = L.marker([congregacao.latitude, congregacao.longitude])
                        .addTo(congregacoesMap)
                        .bindPopup(`
                            <strong>${congregacao.nome}</strong><br>
                            ${congregacao.endereco || ''}<br>
                            ${congregacao.cidade || ''}<br>
                            <a href="#" onclick="viewCongregacao('${congregacao.id}'); return false;">Ver detalhes</a>
                        `);
                }
            });
        })
        .catch((error) => {
            console.error('Erro ao carregar congregações para o mapa:', error);
        });
}

/**
 * Carregar lista de congregações do Firestore
 */
function loadCongregacoes() {
    // Mostrar indicador de carregamento
    if (congregacoesTableBody) {
        congregacoesTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    }
    
    // Buscar congregações ordenadas por nome
    congregacoesRef.orderBy('nome').get()
        .then((querySnapshot) => {
            // Limpar tabela
            if (congregacoesTableBody) {
                congregacoesTableBody.innerHTML = '';
            }
            
            // Verificar se há congregações
            if (querySnapshot.empty) {
                if (congregacoesTableBody) {
                    congregacoesTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma congregação cadastrada.</td></tr>';
                }
                return;
            }
            
            // Processar cada congregação
            querySnapshot.forEach((doc) => {
                const congregacao = doc.data();
                congregacao.id = doc.id;
                
                // Adicionar à tabela
                if (congregacoesTableBody) {
                    addCongregacaoToTable(congregacao);
                }
                
                // Adicionar ao grid de cards (se existir)
                if (congregacoesList) {
                    addCongregacaoToGrid(congregacao);
                }
            });
            
            // Atualizar mapa se existir
            if (congregacoesMap) {
                loadCongregacoesForMap();
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar congregações:', error);
            Utils.showAlert('Erro ao carregar congregações. Tente novamente.', 'danger');
            
            if (congregacoesTableBody) {
                congregacoesTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Erro ao carregar congregações.</td></tr>';
            }
        });
}

/**
 * Adicionar congregação à tabela
 */
function addCongregacaoToTable(congregacao) {
    if (!congregacoesTableBody) return;
    
    const row = document.createElement('tr');
    row.setAttribute('data-id', congregacao.id);
    
    // Formatar data de criação
    const createdAt = congregacao.createdAt ? new Date(congregacao.createdAt.toDate()) : new Date();
    const formattedDate = Utils.formatDate(createdAt);
    
    row.innerHTML = `
        <td>${congregacao.nome}</td>
        <td>${congregacao.cidade || ''}</td>
        <td>${Utils.truncateText(congregacao.endereco || '', 30)}</td>
        <td>${congregacao.contato || ''}</td>
        <td>
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-info view-congregacao" data-id="${congregacao.id}" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-primary edit-congregacao" data-id="${congregacao.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-danger delete-congregacao" data-id="${congregacao.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // Adicionar event listeners para os botões
    row.querySelector('.view-congregacao').addEventListener('click', () => viewCongregacao(congregacao.id));
    row.querySelector('.edit-congregacao').addEventListener('click', () => editCongregacao(congregacao.id));
    row.querySelector('.delete-congregacao').addEventListener('click', () => showDeleteModal(congregacao.id));
    
    congregacoesTableBody.appendChild(row);
}

/**
 * Adicionar congregação ao grid de cards
 */
function addCongregacaoToGrid(congregacao) {
    if (!congregacoesList) return;
    
    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    card.setAttribute('data-id', congregacao.id);
    
    // Formatar data de criação
    const createdAt = congregacao.createdAt ? new Date(congregacao.createdAt.toDate()) : new Date();
    const formattedDate = Utils.formatDate(createdAt);
    
    card.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <h5 class="card-title">${congregacao.nome}</h5>
                <p class="card-text">
                    <i class="fas fa-map-marker-alt text-danger"></i> ${congregacao.endereco || 'Endereço não informado'}<br>
                    <i class="fas fa-city text-primary"></i> ${congregacao.cidade || 'Cidade não informada'}<br>
                    <i class="fas fa-phone text-success"></i> ${congregacao.contato || 'Contato não informado'}
                </p>
                <p class="card-text"><small class="text-muted">Criada em: ${formattedDate}</small></p>
            </div>
            <div class="card-footer bg-transparent">
                <div class="btn-group btn-group-sm w-100" role="group">
                    <button type="button" class="btn btn-info view-congregacao" data-id="${congregacao.id}" title="Visualizar">
                        <i class="fas fa-eye"></i> Visualizar
                    </button>
                    <button type="button" class="btn btn-primary edit-congregacao" data-id="${congregacao.id}" title="Editar">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button type="button" class="btn btn-danger delete-congregacao" data-id="${congregacao.id}" title="Excluir">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar event listeners para os botões
    card.querySelector('.view-congregacao').addEventListener('click', () => viewCongregacao(congregacao.id));
    card.querySelector('.edit-congregacao').addEventListener('click', () => editCongregacao(congregacao.id));
    card.querySelector('.delete-congregacao').addEventListener('click', () => showDeleteModal(congregacao.id));
    
    congregacoesList.appendChild(card);
}

/**
 * Filtrar congregações com base no termo de busca
 */
function filterCongregacoes(searchTerm) {
    // Filtrar tabela
    if (congregacoesTableBody) {
        const rows = congregacoesTableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            if (row.cells.length > 1) { // Ignorar linhas de mensagem
                const nome = row.cells[0].textContent.toLowerCase();
                const cidade = row.cells[1].textContent.toLowerCase();
                const endereco = row.cells[2].textContent.toLowerCase();
                const contato = row.cells[3].textContent.toLowerCase();
                
                if (nome.includes(searchTerm) || cidade.includes(searchTerm) || 
                    endereco.includes(searchTerm) || contato.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }
    
    // Filtrar grid de cards
    if (congregacoesList) {
        const cards = congregacoesList.querySelectorAll('.col-md-4');
        
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
 * Manipular envio do formulário de congregação
 */
function handleCongregacaoSubmit(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const nome = document.getElementById('congregacaoNome').value.trim();
    const endereco = document.getElementById('congregacaoEndereco').value.trim();
    const cidade = document.getElementById('congregacaoCidade').value.trim();
    const contato = document.getElementById('congregacaoContato').value.trim();
    const latitude = parseFloat(document.getElementById('congregacaoLatitude').value) || null;
    const longitude = parseFloat(document.getElementById('congregacaoLongitude').value) || null;
    
    // Validar campos obrigatórios
    if (!nome) {
        Utils.showAlert('Por favor, informe o nome da congregação.', 'warning');
        return;
    }
    
    // Desabilitar botão de salvar e mostrar spinner
    const saveButton = document.getElementById('saveCongregacaoBtn');
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    // Preparar dados da congregação
    const congregacaoData = {
        nome: nome,
        endereco: endereco,
        cidade: cidade,
        contato: contato,
        latitude: latitude,
        longitude: longitude,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Verificar se é uma edição ou novo cadastro
    if (currentCongregacaoId) {
        // Atualizar congregação existente
        congregacoesRef.doc(currentCongregacaoId).update(congregacaoData)
            .then(() => {
                Utils.showAlert('Congregação atualizada com sucesso!', 'success');
                congregacaoModal.hide();
                loadCongregacoes(); // Recarregar lista
            })
            .catch((error) => {
                console.error('Erro ao atualizar congregação:', error);
                Utils.showAlert('Erro ao atualizar congregação. Tente novamente.', 'danger');
            })
            .finally(() => {
                // Reativar botão
                saveButton.disabled = false;
                saveButton.innerHTML = 'Salvar';
            });
    } else {
        // Adicionar timestamp de criação para novas congregações
        congregacaoData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        // Criar nova congregação
        congregacoesRef.add(congregacaoData)
            .then(() => {
                Utils.showAlert('Congregação cadastrada com sucesso!', 'success');
                congregacaoModal.hide();
                loadCongregacoes(); // Recarregar lista
            })
            .catch((error) => {
                console.error('Erro ao cadastrar congregação:', error);
                Utils.showAlert('Erro ao cadastrar congregação. Tente novamente.', 'danger');
            })
            .finally(() => {
                // Reativar botão
                saveButton.disabled = false;
                saveButton.innerHTML = 'Salvar';
            });
    }
}

/**
 * Visualizar detalhes de uma congregação
 */
function viewCongregacao(congregacaoId) {
    // Mostrar indicador de carregamento
    const viewModalBody = document.getElementById('viewCongregacaoBody');
    viewModalBody.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    
    // Mostrar modal
    viewCongregacaoModal.show();
    
    // Buscar dados da congregação
    congregacoesRef.doc(congregacaoId).get()
        .then((doc) => {
            if (doc.exists) {
                const congregacao = doc.data();
                congregacao.id = doc.id;
                
                // Formatar data de criação
                const createdAt = congregacao.createdAt ? new Date(congregacao.createdAt.toDate()) : new Date();
                const formattedDate = Utils.formatDate(createdAt);
                
                // Verificar se temos coordenadas para mostrar o mapa
                let mapHtml = '';
                if (congregacao.latitude && congregacao.longitude && typeof L !== 'undefined') {
                    mapHtml = `
                        <div class="col-md-12 mb-3">
                            <h5>Localização</h5>
                            <div id="viewCongregacaoMap" style="height: 300px;"></div>
                        </div>
                    `;
                }
                
                // Preencher modal com os dados
                viewModalBody.innerHTML = `
                    <div class="row">
                        <div class="col-md-12 mb-3">
                            <h4>${congregacao.nome}</h4>
                            <p class="text-muted">Criada em: ${formattedDate}</p>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <h5>Endereço</h5>
                            <p>${congregacao.endereco || 'Não informado'}</p>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <h5>Cidade</h5>
                            <p>${congregacao.cidade || 'Não informada'}</p>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <h5>Contato</h5>
                            <p>${congregacao.contato || 'Não informado'}</p>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <h5>Coordenadas</h5>
                            <p>
                                ${congregacao.latitude && congregacao.longitude ? 
                                    `Latitude: ${congregacao.latitude}<br>Longitude: ${congregacao.longitude}` : 
                                    'Não informadas'}
                            </p>
                        </div>
                        
                        ${mapHtml}
                    </div>
                `;
                
                // Inicializar mapa na modal se temos coordenadas
                if (congregacao.latitude && congregacao.longitude && typeof L !== 'undefined') {
                    setTimeout(() => {
                        const viewMap = L.map('viewCongregacaoMap').setView([congregacao.latitude, congregacao.longitude], 15);
                        
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(viewMap);
                        
                        L.marker([congregacao.latitude, congregacao.longitude])
                            .addTo(viewMap)
                            .bindPopup(`<strong>${congregacao.nome}</strong><br>${congregacao.endereco || ''}`)
                            .openPopup();
                    }, 300); // Pequeno delay para garantir que o elemento do mapa esteja renderizado
                }
            } else {
                viewModalBody.innerHTML = '<div class="alert alert-warning">Congregação não encontrada.</div>';
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar detalhes da congregação:', error);
            viewModalBody.innerHTML = '<div class="alert alert-danger">Erro ao carregar detalhes da congregação.</div>';
        });
}

/**
 * Preparar formulário para edição de congregação
 */
function editCongregacao(congregacaoId) {
    // Definir ID da congregação atual
    currentCongregacaoId = congregacaoId;
    
    // Atualizar título do modal
    document.getElementById('congregacaoModalLabel').textContent = 'Editar Congregação';
    
    // Buscar dados da congregação
    congregacoesRef.doc(congregacaoId).get()
        .then((doc) => {
            if (doc.exists) {
                const congregacao = doc.data();
                
                // Preencher formulário
                document.getElementById('congregacaoNome').value = congregacao.nome || '';
                document.getElementById('congregacaoEndereco').value = congregacao.endereco || '';
                document.getElementById('congregacaoCidade').value = congregacao.cidade || '';
                document.getElementById('congregacaoContato').value = congregacao.contato || '';
                document.getElementById('congregacaoLatitude').value = congregacao.latitude || '';
                document.getElementById('congregacaoLongitude').value = congregacao.longitude || '';
                
                // Mostrar modal
                congregacaoModal.show();
            } else {
                Utils.showAlert('Congregação não encontrada.', 'warning');
            }
        })
        .catch((error) => {
            console.error('Erro ao carregar congregação para edição:', error);
            Utils.showAlert('Erro ao carregar congregação para edição.', 'danger');
        });
}

/**
 * Mostrar modal de confirmação de exclusão
 */
function showDeleteModal(congregacaoId) {
    // Definir ID da congregação atual
    currentCongregacaoId = congregacaoId;
    
    // Mostrar modal de confirmação
    deleteCongregacaoModal.show();
}

/**
 * Excluir congregação
 */
function deleteCongregacao() {
    if (!currentCongregacaoId) return;
    
    // Desabilitar botão de confirmar exclusão e mostrar spinner
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
    
    // Excluir congregação
    congregacoesRef.doc(currentCongregacaoId).delete()
        .then(() => {
            Utils.showAlert('Congregação excluída com sucesso!', 'success');
            deleteCongregacaoModal.hide();
            
            // Remover da tabela e do grid
            if (congregacoesTableBody) {
                const row = congregacoesTableBody.querySelector(`tr[data-id="${currentCongregacaoId}"]`);
                if (row) row.remove();
            }
            
            if (congregacoesList) {
                const card = congregacoesList.querySelector(`div[data-id="${currentCongregacaoId}"]`);
                if (card) card.remove();
            }
            
            // Verificar se a tabela ficou vazia
            if (congregacoesTableBody && congregacoesTableBody.children.length === 0) {
                congregacoesTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma congregação cadastrada.</td></tr>';
            }
            
            // Atualizar mapa
            if (congregacoesMap) {
                loadCongregacoesForMap();
            }
        })
        .catch((error) => {
            console.error('Erro ao excluir congregação:', error);
            Utils.showAlert('Erro ao excluir congregação. Tente novamente.', 'danger');
        })
        .finally(() => {
            // Reativar botão
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = 'Confirmar Exclusão';
            
            // Limpar ID atual
            currentCongregacaoId = null;
        });
}

/**
 * Resetar formulário de congregação
 */
function resetCongregacaoForm() {
    // Limpar ID atual
    currentCongregacaoId = null;
    
    // Resetar formulário
    congregacaoForm.reset();
}

/**
 * Exportar congregações para CSV
 */
function exportCongregacoesToCSV() {
    // Buscar todas as congregações
    congregacoesRef.orderBy('nome').get()
        .then((querySnapshot) => {
            // Verificar se há congregações
            if (querySnapshot.empty) {
                Utils.showAlert('Não há congregações para exportar.', 'warning');
                return;
            }
            
            // Preparar dados para CSV
            const csvData = [];
            
            // Adicionar cabeçalho
            csvData.push(['Nome', 'Endereço', 'Cidade', 'Contato', 'Latitude', 'Longitude', 'Data de Criação']);
            
            // Processar cada congregação
            querySnapshot.forEach((doc) => {
                const congregacao = doc.data();
                
                // Formatar data de criação
                const createdAt = congregacao.createdAt ? new Date(congregacao.createdAt.toDate()) : new Date();
                const formattedDate = Utils.formatDate(createdAt);
                
                csvData.push([
                    congregacao.nome || '',
                    congregacao.endereco || '',
                    congregacao.cidade || '',
                    congregacao.contato || '',
                    congregacao.latitude ? congregacao.latitude.toString() : '',
                    congregacao.longitude ? congregacao.longitude.toString() : '',
                    formattedDate
                ]);
            });
            
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
            link.setAttribute('download', `congregacoes_${Utils.formatDateForFilename(new Date())}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch((error) => {
            console.error('Erro ao exportar congregações:', error);
            Utils.showAlert('Erro ao exportar congregações. Tente novamente.', 'danger');
        });
}

/**
 * Exportar congregações para PDF
 */
function exportCongregacoesToPDF() {
    // Verificar se a biblioteca jsPDF está disponível
    if (typeof jsPDF === 'undefined') {
        Utils.showAlert('Biblioteca jsPDF não encontrada. Não é possível exportar para PDF.', 'warning');
        return;
    }
    
    // Buscar todas as congregações
    congregacoesRef.orderBy('nome').get()
        .then((querySnapshot) => {
            // Verificar se há congregações
            if (querySnapshot.empty) {
                Utils.showAlert('Não há congregações para exportar.', 'warning');
                return;
            }
            
            // Criar novo documento PDF
            const doc = new jsPDF();
            
            // Adicionar título
            doc.setFontSize(18);
            doc.text('Relatório de Congregações', 14, 22);
            
            // Adicionar data de geração
            doc.setFontSize(10);
            doc.text(`Gerado em: ${Utils.formatDate(new Date())}`, 14, 30);
            
            // Configurar tabela
            const columns = [
                {header: 'Nome', dataKey: 'nome'},
                {header: 'Endereço', dataKey: 'endereco'},
                {header: 'Cidade', dataKey: 'cidade'},
                {header: 'Contato', dataKey: 'contato'},
                {header: 'Criada em', dataKey: 'createdAt'}
            ];
            
            // Preparar dados para a tabela
            const rows = [];
            
            querySnapshot.forEach((doc) => {
                const congregacao = doc.data();
                
                // Formatar data de criação
                const createdAt = congregacao.createdAt ? new Date(congregacao.createdAt.toDate()) : new Date();
                const formattedDate = Utils.formatDate(createdAt);
                
                rows.push({
                    nome: congregacao.nome || '',
                    endereco: Utils.truncateText(congregacao.endereco || '', 30),
                    cidade: congregacao.cidade || '',
                    contato: congregacao.contato || '',
                    createdAt: formattedDate
                });
            });
            
            // Adicionar tabela ao PDF
            doc.autoTable(columns, rows, {
                startY: 40,
                margin: {top: 40, right: 14, bottom: 20, left: 14},
                styles: {overflow: 'linebreak'},
                columnStyles: {
                    endereco: {cellWidth: 50}
                }
            });
            
            // Salvar PDF
            doc.save(`congregacoes_${Utils.formatDateForFilename(new Date())}.pdf`);
        })
        .catch((error) => {
            console.error('Erro ao exportar congregações para PDF:', error);
            Utils.showAlert('Erro ao exportar congregações para PDF. Tente novamente.', 'danger');
        });
}