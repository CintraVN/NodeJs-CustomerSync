
# NodeJs-CustomerSync

Refatoração de sistema originalmente escrito em PHP para Node.js com foco em sincronização de clientes entre serviços.

## 🧠 Objetivo

Este projeto tem como finalidade realizar a sincronização automatizada de informações de clientes entre diferentes sistemas, utilizando uma aplicação em Node.js. O código foi refatorado a partir de uma base originalmente escrita em PHP, com melhorias na estrutura, modularidade e deploy.

## 🛠️ Tecnologias Utilizadas

- [Node.js](https://nodejs.org/) Ambiente de execução JavaScript server-side.
- Express.js: Framework para construção de APIs web.
- [Docker](https://www.docker.com/) Contêineres para empacotamento e execução isolada.
- [Docker Compose](https://docs.docker.com/compose/) Orquestração de múltiplos contêineres.
- dotenv: Gerenciamento de variáveis de ambiente
- npm: Gerenciador de pacotes JavaScript (via package.json)
- Oracle db
- winston: Biblioteca para registro de logs.

## 📁 Estrutura do Projeto

```bash
NodeJs-CustomerSync/
├── logs/                      # Logs da aplicação
│   ├── combined.log
│   └── error.log
│
├── node_modules/              # Módulos do Node.js (gerado pelo npm)
│
├── src/                       # Código-fonte principal
│   ├── config/
│   │   └── dbconnect.js       # Conexão com o banco de dados
│   │
│   └── utils/                 # Utilitários e lógica de negócio
│       ├── bpmClienteEnderecos.js
│       ├── bpmClienteOrigens.js
│       ├── bpmClienteRca.js
│       ├── bpmClientes.js
│       ├── bpmClienteTelefones.js
│       ├── logger.js
│       └── tratamentoDados.js
│
├── .env                       # Variáveis de ambiente
├── .gitignore                 # Arquivos ignorados pelo Git
├── docker-compose.yml         # Orquestração de containers
├── Dockerfile                 # Imagem da aplicação Node.js
├── index.js                   # Ponto de entrada da aplicação
├── package.json               # Configurações do projeto e dependências
├── package-lock.json          # Lockfile para versões de dependências
└── README.md                  # Documentação do projeto

```

## ⚙️ Instalação e Execução

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/NodeJs-CustomerSync.git
cd NodeJs-CustomerSync
```

### 2. Configurar o .env

Crie um arquivo `.env` com base no exemplo abaixo:

```env
DB_USER=SEU_URUARIO
DB_PASSWORD=SENHA_DO_BANCO
DB_CONNECTION_STRING=STRING_PARA_CONECTAR
NODE_ENV=production
SQL_DATE_RANGE=30
NROREPRESENTANTE1=78
NROREPRESENTANTE2=84
```

### 3. Subir com Docker

```bash
docker-compose up --build
```

## 🚀 Funcionalidades

- Conexão com banco de dados
- Processamento de dados com controle de erros
- Registro de logs para monitoramento da aplicação.
- Estrutura modular e escalável

---

> Projeto desenvolvido por [Cristhian Cintra] - Refatorado de PHP para Node.js com Docker.
