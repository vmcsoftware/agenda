/**
 * app.js - Configuração principal e funções utilitárias
 * Agenda de Serviços — CCB Administração Ituiutaba
 */

// Configuração do Firebase
const firebaseConfig = {
    // ATENÇÃO: Substitua estas configurações pelas suas próprias do Firebase
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "seu-messaging-sender-id",
    appId: "seu-app-id"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências globais
const auth = firebase.auth();
const db = firebase.firestore();

// Configurações do Firestore
db.settings({
    timestampsInSnapshots: true
});

/**
 * Utilitários para formatação e manipulação de dados
 */
const Utils = {
    // Formatar data para exibição (DD/MM/YYYY)
    formatDate: function(date) {
        if (!date) return "";
        
        if (typeof date === 'string') {
            // Se for uma string no formato ISO ou YYYY-MM-DD
            const parts = date.split('-');
            if (parts.length === 3) {
                return `${parts[2].substring(0,2)}/${parts[1]}/${parts[0]}`;
            }
            return date;
        }
        
        if (date.toDate) {
            // Se for um timestamp do Firestore
            date = date.toDate();
        }
        
        if (date instanceof Date) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        
        return "";
    },
    
    // Formatar data para input (YYYY-MM-DD)
    formatDateForInput: function(date) {
        if (!date) return "";
        
        if (typeof date === 'string' && date.includes('/')) {
            // Se for uma string no formato DD/MM/YYYY
            const parts = date.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            return date;
        }
        
        if (date.toDate) {
            // Se for um timestamp do Firestore
            date = date.toDate();
        }
        
        if (date instanceof Date) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${year}-${month}-${day}`;
        }
        
        return "";
    },
    
    // Formatar hora (HH:MM)
    formatTime: function(time) {
        if (!time) return "";
        return time;
    },
    
    // Formatar valor monetário (R$ 0,00)
    formatCurrency: function(value) {
        if (value === null || value === undefined) return "R$ 0,00";
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },
    
    // Formatar número com separador de milhares
    formatNumber: function(value) {
        if (value === null || value === undefined) return "0";
        
        return new Intl.NumberFormat('pt-BR').format(value);
    },
    
    // Formatar porcentagem
    formatPercent: function(value) {
        if (value === null || value === undefined) return "0%";
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value / 100);
    },
    
    // Gerar ID único
    generateId: function() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    },
    
    // Converter string para slug
    slugify: function(text) {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    },
    
    // Truncar texto
    truncateText: function(text, length = 100) {
        if (!text) return "";
        if (text.length <= length) return text;
        return text.substring(0, length) + "...";
    },
    
    // Obter nome do mês
    getMonthName: function(month) {
        const months = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        return months[month];
    },
    
    // Obter nome do dia da semana
    getWeekdayName: function(day) {
        const weekdays = [
            "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", 
            "Quinta-feira", "Sexta-feira", "Sábado"
        ];
        return weekdays[day];
    },
    
    // Obter nome abreviado do dia da semana
    getShortWeekdayName: function(day) {
        const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        return weekdays[day];
    },
    
    // Obter nome abreviado do mês
    getShortMonthName: function(month) {
        const months = [
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"
        ];
        return months[month];
    },
    
    // Calcular diferença entre datas em dias
    daysBetween: function(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000; // horas*minutos*segundos*milissegundos
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    },
    
    // Verificar se uma data é hoje
    isToday: function(date) {
        if (!date) return false;
        
        if (date.toDate) {
            date = date.toDate();
        }
        
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },
    
    // Verificar se uma data é esta semana
    isThisWeek: function(date) {
        if (!date) return false;
        
        if (date.toDate) {
            date = date.toDate();
        }
        
        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()));
        
        return date >= weekStart && date <= weekEnd;
    },
    
    // Verificar se uma data é este mês
    isThisMonth: function(date) {
        if (!date) return false;
        
        if (date.toDate) {
            date = date.toDate();
        }
        
        const now = new Date();
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
    },
    
    // Obter primeiro dia do mês
    getFirstDayOfMonth: function(year, month) {
        return new Date(year, month, 1);
    },
    
    // Obter último dia do mês
    getLastDayOfMonth: function(year, month) {
        return new Date(year, month + 1, 0);
    },
    
    // Converter string para data
    parseDate: function(dateString) {
        if (!dateString) return null;
        
        // Se for no formato DD/MM/YYYY
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
        
        // Se for no formato YYYY-MM-DD
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return new Date(parts[0], parts[1] - 1, parts[2]);
            }
        }
        
        return new Date(dateString);
    },
    
    // Exportar para CSV
    exportToCSV: function(data, filename) {
        if (!data || !data.length) {
            console.error('Nenhum dado para exportar');
            return;
        }
        
        // Obter cabeçalhos (chaves do primeiro objeto)
        const headers = Object.keys(data[0]);
        
        // Criar linhas de dados
        const csvRows = [];
        
        // Adicionar cabeçalhos
        csvRows.push(headers.join(','));
        
        // Adicionar dados
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                // Escapar aspas e adicionar aspas em strings
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        
        // Combinar em uma string CSV
        const csvString = csvRows.join('\n');
        
        // Criar blob e link para download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename || 'export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    // Mostrar mensagem de alerta
    showAlert: function(message, type = 'success') {
        const alertContainer = document.getElementById('alertContainer') || document.createElement('div');
        
        if (!document.getElementById('alertContainer')) {
            alertContainer.id = 'alertContainer';
            alertContainer.style.position = 'fixed';
            alertContainer.style.top = '20px';
            alertContainer.style.right = '20px';
            alertContainer.style.zIndex = '9999';
            document.body.appendChild(alertContainer);
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Remover alerta após 5 segundos
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                alertContainer.removeChild(alert);
            }, 150);
        }, 5000);
    },
    
    // Confirmar ação
    confirmAction: function(message, callback) {
        if (confirm(message)) {
            callback();
        }
    },
    
    // Verificar permissões do usuário
    checkPermission: function(user, permission) {
        if (!user || !user.customClaims) return false;
        
        const roles = {
            'admin': ['read', 'write', 'delete', 'manage_users'],
            'dirigente': ['read', 'write'],
            'obreiro': ['read', 'write_limited'],
            'membro': ['read']
        };
        
        // Verificar se o usuário tem alguma das roles que permitem a permissão
        for (const [role, permissions] of Object.entries(roles)) {
            if (user.customClaims[role] && permissions.includes(permission)) {
                return true;
            }
        }
        
        return false;
    },
    
    // Obter cor para status
    getStatusColor: function(status) {
        const statusColors = {
            'pendente': 'warning',
            'realizado': 'success',
            'cancelado': 'danger',
            'ativo': 'success',
            'inativo': 'secondary',
            'confirmado': 'success',
            'aguardando': 'warning',
            'concluido': 'success'
        };
        
        return statusColors[status] || 'secondary';
    },
    
    // Obter ícone para status
    getStatusIcon: function(status) {
        const statusIcons = {
            'pendente': 'clock',
            'realizado': 'check-circle',
            'cancelado': 'times-circle',
            'ativo': 'check-circle',
            'inativo': 'circle',
            'confirmado': 'check-double',
            'aguardando': 'hourglass-half',
            'concluido': 'flag-checkered'
        };
        
        return statusIcons[status] || 'circle';
    },
    
    // Obter nome do tipo de coleta
    getColetaTypeName: function(type) {
        const types = {
            'dizimo': 'Dízimo',
            'oferta': 'Oferta',
            'especial': 'Especial',
            'outro': 'Outro'
        };
        
        return types[type] || type;
    },
    
    // Obter nome do status
    getStatusName: function(status) {
        const statusNames = {
            'pendente': 'Pendente',
            'realizado': 'Realizado',
            'cancelado': 'Cancelado',
            'ativo': 'Ativo',
            'inativo': 'Inativo',
            'confirmado': 'Confirmado',
            'aguardando': 'Aguardando',
            'concluido': 'Concluído'
        };
        
        return statusNames[status] || status;
    }
};

/**
 * Inicialização da aplicação
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado
    auth.onAuthStateChanged(user => {
        const isLoginPage = window.location.pathname.includes('index.html') || 
                           window.location.pathname.endsWith('/');
        
        if (user) {
            // Usuário logado
            if (isLoginPage) {
                // Redirecionar para o dashboard se estiver na página de login
                window.location.href = 'dashboard.html';
            } else {
                // Atualizar UI com informações do usuário
                updateUserUI(user);
            }
        } else {
            // Usuário não logado
            if (!isLoginPage) {
                // Redirecionar para a página de login
                window.location.href = 'index.html';
            }
        }
    });
    
    // Configurar eventos de logout
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarLogout = document.getElementById('sidebarLogout');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            }).catch(error => {
                console.error('Erro ao fazer logout:', error);
                Utils.showAlert('Erro ao fazer logout: ' + error.message, 'danger');
            });
        });
    }
    
    if (sidebarLogout) {
        sidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            }).catch(error => {
                console.error('Erro ao fazer logout:', error);
                Utils.showAlert('Erro ao fazer logout: ' + error.message, 'danger');
            });
        });
    }
});

/**
 * Atualizar UI com informações do usuário
 */
function updateUserUI(user) {
    const userNameElements = document.querySelectorAll('#userName');
    
    // Obter dados do usuário do Firestore
    db.collection('users').doc(user.uid).get().then(doc => {
        if (doc.exists) {
            const userData = doc.data();
            
            // Atualizar nome do usuário na navbar
            userNameElements.forEach(element => {
                element.textContent = userData.nome || user.email;
            });
            
            // Verificar permissões e ajustar UI conforme necessário
            checkUserPermissions(user, userData);
        } else {
            console.log('Documento do usuário não encontrado!');
            userNameElements.forEach(element => {
                element.textContent = user.email;
            });
        }
    }).catch(error => {
        console.error('Erro ao obter dados do usuário:', error);
        userNameElements.forEach(element => {
            element.textContent = user.email;
        });
    });
}

/**
 * Verificar permissões do usuário e ajustar UI
 */
function checkUserPermissions(user, userData) {
    // Verificar se o usuário tem custom claims
    user.getIdTokenResult().then(idTokenResult => {
        const claims = idTokenResult.claims;
        
        // Armazenar claims no objeto do usuário para uso posterior
        user.customClaims = claims;
        
        // Ajustar UI com base nas permissões
        if (claims.admin) {
            // Mostrar elementos apenas para admin
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'block';
            });
        } else {
            // Esconder elementos apenas para admin
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
        }
        
        if (claims.dirigente || claims.admin) {
            // Mostrar elementos para dirigentes e admin
            document.querySelectorAll('.dirigente-only').forEach(el => {
                el.style.display = 'block';
            });
        } else {
            // Esconder elementos apenas para dirigentes
            document.querySelectorAll('.dirigente-only').forEach(el => {
                el.style.display = 'none';
            });
        }
        
        if (claims.obreiro || claims.dirigente || claims.admin) {
            // Mostrar elementos para obreiros, dirigentes e admin
            document.querySelectorAll('.obreiro-only').forEach(el => {
                el.style.display = 'block';
            });
        } else {
            // Esconder elementos apenas para obreiros
            document.querySelectorAll('.obreiro-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    }).catch(error => {
        console.error('Erro ao verificar permissões:', error);
    });
}