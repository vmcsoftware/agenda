/**
 * auth.js - Funções de autenticação e gerenciamento de usuários
 * Agenda de Serviços — CCB Administração Ituiutaba
 */

// Referência ao formulário de login
const loginForm = document.getElementById('loginForm');

// Referência ao formulário de cadastro
const signupForm = document.getElementById('signupForm');

// Referência aos links de alternância entre login e cadastro
const showLoginLink = document.getElementById('showLogin');
const showSignupLink = document.getElementById('showSignup');

// Referência aos containers de login e cadastro
const loginContainer = document.getElementById('loginContainer');
const signupContainer = document.getElementById('signupContainer');

// Referência ao link de recuperação de senha
const forgotPasswordLink = document.getElementById('forgotPassword');

// Referência ao modal de recuperação de senha
const forgotPasswordModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'), {
    keyboard: false
});

// Referência ao formulário de recuperação de senha
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

/**
 * Inicialização dos eventos de autenticação
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de login/cadastro
    if (loginForm || signupForm) {
        setupAuthForms();
    }
});

/**
 * Configurar formulários de autenticação e eventos
 */
function setupAuthForms() {
    // Configurar formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Configurar formulário de cadastro
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Configurar alternância entre login e cadastro
    if (showLoginLink && loginContainer && signupContainer) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginContainer.classList.remove('d-none');
            signupContainer.classList.add('d-none');
        });
    }
    
    if (showSignupLink && loginContainer && signupContainer) {
        showSignupLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginContainer.classList.add('d-none');
            signupContainer.classList.remove('d-none');
        });
    }
    
    // Configurar recuperação de senha
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            forgotPasswordModal.show();
        });
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
}

/**
 * Manipular envio do formulário de login
 */
function handleLogin(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validar campos
    if (!email || !password) {
        Utils.showAlert('Por favor, preencha todos os campos.', 'warning');
        return;
    }
    
    // Desabilitar botão de login e mostrar spinner
    const loginButton = document.getElementById('loginButton');
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';
    
    // Fazer login com Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login bem-sucedido
            const user = userCredential.user;
            console.log('Login bem-sucedido:', user.email);
            
            // Redirecionar para o dashboard
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            // Erro no login
            console.error('Erro no login:', error);
            
            // Traduzir mensagens de erro comuns
            let errorMessage = 'Ocorreu um erro ao fazer login. Tente novamente.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Usuário não encontrado. Verifique seu e-mail ou cadastre-se.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Senha incorreta. Tente novamente.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'E-mail inválido. Verifique o formato do e-mail.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Este usuário foi desativado. Entre em contato com o administrador.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
                    break;
            }
            
            Utils.showAlert(errorMessage, 'danger');
            
            // Reativar botão de login
            loginButton.disabled = false;
            loginButton.innerHTML = 'Entrar';
        });
}

/**
 * Manipular envio do formulário de cadastro
 */
function handleSignup(e) {
    e.preventDefault();
    
    // Obter valores do formulário
    const nome = document.getElementById('signupNome').value;
    const email = document.getElementById('signupEmail').value;
    const telefone = document.getElementById('signupTelefone').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const congregacao = document.getElementById('signupCongregacao').value;
    
    // Validar campos
    if (!nome || !email || !password || !confirmPassword) {
        Utils.showAlert('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        Utils.showAlert('As senhas não coincidem.', 'warning');
        return;
    }
    
    if (password.length < 6) {
        Utils.showAlert('A senha deve ter pelo menos 6 caracteres.', 'warning');
        return;
    }
    
    // Desabilitar botão de cadastro e mostrar spinner
    const signupButton = document.getElementById('signupButton');
    signupButton.disabled = true;
    signupButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cadastrando...';
    
    // Criar usuário com Firebase
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Cadastro bem-sucedido
            const user = userCredential.user;
            console.log('Cadastro bem-sucedido:', user.email);
            
            // Salvar informações adicionais no Firestore
            return db.collection('users').doc(user.uid).set({
                nome: nome,
                email: email,
                telefone: telefone || '',
                congregacaoId: congregacao || '',
                roles: ['membro'], // Papel padrão: membro
                ministerios: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Dados salvos com sucesso
            Utils.showAlert('Cadastro realizado com sucesso!', 'success');
            
            // Redirecionar para o dashboard após um breve delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        })
        .catch((error) => {
            // Erro no cadastro
            console.error('Erro no cadastro:', error);
            
            // Traduzir mensagens de erro comuns
            let errorMessage = 'Ocorreu um erro ao fazer o cadastro. Tente novamente.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este e-mail já está em uso. Tente fazer login ou use outro e-mail.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'E-mail inválido. Verifique o formato do e-mail.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Senha fraca. Use uma senha mais forte.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Cadastro com e-mail e senha não está habilitado. Entre em contato com o administrador.';
                    break;
            }
            
            Utils.showAlert(errorMessage, 'danger');
            
            // Reativar botão de cadastro
            signupButton.disabled = false;
            signupButton.innerHTML = 'Cadastrar';
        });
}

/**
 * Manipular envio do formulário de recuperação de senha
 */
function handleForgotPassword(e) {
    e.preventDefault();
    
    // Obter e-mail do formulário
    const email = document.getElementById('forgotPasswordEmail').value;
    
    // Validar e-mail
    if (!email) {
        Utils.showAlert('Por favor, informe seu e-mail.', 'warning');
        return;
    }
    
    // Desabilitar botão e mostrar spinner
    const resetButton = document.getElementById('resetPasswordButton');
    resetButton.disabled = true;
    resetButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
    
    // Enviar e-mail de recuperação de senha
    auth.sendPasswordResetEmail(email)
        .then(() => {
            // E-mail enviado com sucesso
            Utils.showAlert('E-mail de recuperação enviado. Verifique sua caixa de entrada.', 'success');
            
            // Fechar modal
            forgotPasswordModal.hide();
            
            // Limpar formulário
            document.getElementById('forgotPasswordEmail').value = '';
            
            // Reativar botão
            resetButton.disabled = false;
            resetButton.innerHTML = 'Enviar';
        })
        .catch((error) => {
            // Erro ao enviar e-mail
            console.error('Erro ao enviar e-mail de recuperação:', error);
            
            // Traduzir mensagens de erro comuns
            let errorMessage = 'Ocorreu um erro ao enviar o e-mail de recuperação. Tente novamente.';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'E-mail inválido. Verifique o formato do e-mail.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'Não há usuário registrado com este e-mail.';
                    break;
            }
            
            Utils.showAlert(errorMessage, 'danger');
            
            // Reativar botão
            resetButton.disabled = false;
            resetButton.innerHTML = 'Enviar';
        });
}

/**
 * Verificar se o usuário atual é administrador
 */
function isAdmin() {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        
        if (!user) {
            resolve(false);
            return;
        }
        
        user.getIdTokenResult()
            .then((idTokenResult) => {
                resolve(!!idTokenResult.claims.admin);
            })
            .catch((error) => {
                console.error('Erro ao verificar permissões:', error);
                resolve(false);
            });
    });
}

/**
 * Verificar se o usuário atual é dirigente
 */
function isDirigente() {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        
        if (!user) {
            resolve(false);
            return;
        }
        
        user.getIdTokenResult()
            .then((idTokenResult) => {
                resolve(!!idTokenResult.claims.dirigente || !!idTokenResult.claims.admin);
            })
            .catch((error) => {
                console.error('Erro ao verificar permissões:', error);
                resolve(false);
            });
    });
}

/**
 * Verificar se o usuário atual é obreiro
 */
function isObreiro() {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        
        if (!user) {
            resolve(false);
            return;
        }
        
        user.getIdTokenResult()
            .then((idTokenResult) => {
                resolve(!!idTokenResult.claims.obreiro || !!idTokenResult.claims.dirigente || !!idTokenResult.claims.admin);
            })
            .catch((error) => {
                console.error('Erro ao verificar permissões:', error);
                resolve(false);
            });
    });
}

/**
 * Obter o papel (role) do usuário atual
 */
function getUserRole() {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        
        if (!user) {
            resolve('visitante');
            return;
        }
        
        user.getIdTokenResult()
            .then((idTokenResult) => {
                if (idTokenResult.claims.admin) {
                    resolve('admin');
                } else if (idTokenResult.claims.dirigente) {
                    resolve('dirigente');
                } else if (idTokenResult.claims.obreiro) {
                    resolve('obreiro');
                } else {
                    resolve('membro');
                }
            })
            .catch((error) => {
                console.error('Erro ao obter papel do usuário:', error);
                resolve('visitante');
            });
    });
}

/**
 * Verificar se o usuário tem permissão para uma ação específica
 */
function hasPermission(permission) {
    return new Promise((resolve, reject) => {
        const user = auth.currentUser;
        
        if (!user) {
            resolve(false);
            return;
        }
        
        user.getIdTokenResult()
            .then((idTokenResult) => {
                const claims = idTokenResult.claims;
                
                // Definir permissões por papel
                const permissions = {
                    'admin': ['read', 'write', 'delete', 'manage_users'],
                    'dirigente': ['read', 'write'],
                    'obreiro': ['read', 'write_limited'],
                    'membro': ['read']
                };
                
                // Verificar se o usuário tem algum papel que concede a permissão
                for (const [role, rolePermissions] of Object.entries(permissions)) {
                    if (claims[role] && rolePermissions.includes(permission)) {
                        resolve(true);
                        return;
                    }
                }
                
                resolve(false);
            })
            .catch((error) => {
                console.error('Erro ao verificar permissões:', error);
                resolve(false);
            });
    });
}