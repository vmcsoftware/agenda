# Agenda de Serviços — CCB Administração Ituiutaba

Sistema de gerenciamento para administração de serviços da CCB Ituiutaba, desenvolvido com HTML5, CSS3 (Bootstrap 5), JavaScript e Firebase.

## Funcionalidades

- **Autenticação de Usuários**: Login e cadastro com Firebase Authentication (e-mail/senha)
- **Perfis de acesso**: admin, dirigente, obreiro, membro
- **Cadastro Ministerial**: Gerenciamento completo de ministérios
- **Cadastro de Congregações**: Gerenciamento de congregações com mapa
- **Cadastro de Eventos**: Agendamento e controle de eventos
- **Marcação de Coletas**: Controle financeiro de coletas
- **Dashboard e Relatórios**: Resumo de atividades e exportação de dados

## Tecnologias Utilizadas

- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (puro)
- Firebase (Authentication + Firestore)
- GitHub (repositório e hospedagem)

## Estrutura do Projeto

```
/public
  ├─ index.html
  ├─ dashboard.html
  ├─ events.html
  ├─ ministerios.html
  ├─ congregacoes.html
  ├─ coletas.html
  ├─ css/styles.css
  └─ js/
      ├─ app.js
      ├─ auth.js
      ├─ events.js
      ├─ ministerios.js
      ├─ congregacoes.js
      └─ coletas.js
```

## Configuração do Firebase

Para configurar o Firebase para este projeto, siga os passos abaixo:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Adicione um aplicativo web ao seu projeto
4. Copie as credenciais de configuração fornecidas
5. Substitua as credenciais no arquivo `public/js/app.js`
6. Ative o Firebase Authentication com o método de e-mail/senha
7. Crie um banco de dados Firestore
8. Implante as regras de segurança do Firestore (`firestore.rules`)

## Configuração de Permissões (Custom Claims)

Para configurar as permissões de usuários (custom claims), você precisará implementar uma função Cloud Function ou usar o Firebase Admin SDK em um ambiente seguro. Exemplo de código para definir custom claims:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

// Definir um usuário como admin
async function setAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
}

// Definir um usuário como dirigente
async function setDirigente(uid) {
  await admin.auth().setCustomUserClaims(uid, { dirigente: true });
}

// Definir um usuário como obreiro
async function setObreiro(uid) {
  await admin.auth().setCustomUserClaims(uid, { obreiro: true });
}
```

## Implantação

Para implantar o projeto usando o Firebase Hosting:

1. Instale o Firebase CLI: `npm install -g firebase-tools`
2. Faça login no Firebase: `firebase login`
3. Inicialize o projeto: `firebase init` (selecione Hosting e Firestore)
4. Implante o projeto: `firebase deploy`

## Desenvolvimento Local

Para executar o projeto localmente:

1. Instale o Firebase CLI: `npm install -g firebase-tools`
2. Inicie o servidor local: `firebase serve`
3. Acesse `http://localhost:5000` no navegador

## Licença

Este projeto é proprietário e destinado exclusivamente para uso da CCB Administração Ituiutaba.

## Contato

Para suporte ou dúvidas, entre em contato com o administrador do sistema.