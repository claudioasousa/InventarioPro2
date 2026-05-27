# SisPatrimônio - Sistema de Inventário Patrimonial Municipal 🏛️

Sistema web completo de **Inventário Patrimonial** desenvolvido especificamente para a gestão atômica de bens móveis em instituições públicas municipais (Secretarias, Repartições, Autarquias).

Este sistema substitui completamente planilhas desconexas, oferecendo centralização física, guias de transporte integradas síncronas, auditoria forte de operações, balanços de depreciação e emissão de laudos de saída.

---

## 🛠️ Arquitetura e Tecnologias

### Frontend (SPA Responsiva)
* **React.js 19 & TypeScript**: Componentização modular estrita e alta performance de tipagem.
* **Tailwind CSS**: Estilização baseada em tokens de governo e modo escuro integrado.
* **Motion (by motion/react)**: Micro-animações e transições fluidas de tela.
* **Recharts**: Vetores interativos para análise de balanços por departamento e categorias.
* **Lucide Icon**: Pacote de ícones unificados de alta definição.

### Backend (API REST Criptografada)
* **Node.js & Express.js (TypeScript)**: barreira de rotas e processamento nativo.
* **Persistência de Memória Ativa**: Configurada em arquivo portátil `./data-db.json` com capacidade de autocura integrada (carrega registros completos ao inicializar).
* **JWT (JSON Web Token)**: Mecanismo de carimbo na assinatura digital de requisições.

### Modelagem de Dados
* **PostgreSQL / Prisma ORM**: Completo design relacional modelado explicitamente no diretório `/database/`.

---

## 📂 Estrutura Físico-Organizacional de Pastas

O projeto divide-se rigidamente de acordo com as especificações exigidas:

```text
/
├── database/                   # Modelagem física e relacional
│   ├── schema.sql              # Scripts DDL para PostgreSQL nativo
│   └── schema.prisma           # Modelagem de entidades do Prisma ORM
├── docs/                       # Manuais operacionais e de instalação
│   └── README.md               # Este guia descritivo de implantação
├── src/                        # FRONTEND (Portal React / SPA)
│   ├── components/             # Sub-componentes modulares modulares
│   │   ├── Sidebar.tsx         # Painel de controle de menus
│   │   ├── LoginScreen.tsx     # Portal de chaves de assinaturas
│   │   ├── DashboardView.tsx   # Painel analítico de KPIs
│   │   ├── PatrimonioView.tsx  # Lançamentos, QR, etiquetas e CRUD
│   │   ├── TransferenciaView.tsx # Guias de remanejamento físico
│   │   ├── RelatoriosView.tsx   # Emissão de laudos e exportações
│   │   ├── AuditoriaView.tsx    # Auditorias e logs anti-violação
│   │   └── ConfiguracoesView.tsx # Cadastro departamentos e Backups
│   ├── types.ts                # Interfaces de dados
│   ├── api.ts                  # Client de chamadas HTTP Axios-Style
│   └── App.tsx                 # Controlador mestre de rotas
├── server.ts                   # BACKEND (Rotas API REST e Vite Middleware)
├── package.json                # Gerenciador de dependências e scripts de boot
└── vite.config.ts              # Bundler de compilação do frontend
```

---

## 🔑 Credenciais Governamentais de Acesso Rápido

Para agilizar auditorias de visualização, o painel de login conta com um painel de **Acesso Rápido** clicável, alimentando instantaneamente as credenciais:

| Perfil de Acesso | E-mail de Login | Senha de Teste | Nível de Acesso (Escopo) |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@patrimonio.gov.br` | `admin123` | Total controle (Criar/Edit/Deletar/Backup/Setores/Auditorias) |
| **Operador** | `operador@patrimonio.gov.br` | `operador123` | Lançamento e Transferência de bens (Sem exclusão ou Auditorias) |
| **Consulta** | `consulta@patrimonio.gov.br` | `consulta123` | Apenas visualização de dados e auditorias fiscalizadoras (Auditores de Contas) |

---

## 🚀 Instruções para Instalação e Desenvolvimento Local

### Pré-requisitos
1. **Node.js** v18+ instalado.
2. **npm** ou **yarn** ativo.

### Passo a Passo

1. **Baixar as dependências do projeto**:
   ```bash
   npm install
   ```

2. **Iniciar o Servidor em Modo de Desenvolvimento (Express + HMR)**:
   ```bash
   npm run dev
   ```
   *O sistema será iniciado interativamente em **http://localhost:3000** conectando o backend das APIs diretamente ao frontend de layouts.*

3. **Verificação de Regras Sintáticas (Linter)**:
   ```bash
   npm run lint
   ```

4. **Compilar para Produção (Express CJS Bundling)**:
   ```bash
   npm run build
   ```
   *Gera a build otimizada da SPA em `/dist` e compila o servidor TypeScript compilado em `/dist/server.cjs` pronto para alta escalabilidade ou containers Docker.*

---

## 🐳 Instruções para Deploy em Produção (Cloud / Docker)

### Implantação Direta via Docker

O sistema está configurado para emparelhar com portabilidade robusta em qualquer nuvem utilizando containers (AWS ECS, Google Cloud Run, Azure Container Apps, etc.).

1. **Criar um arquivo `Dockerfile` na raiz do projeto**:
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:18-alpine
   WORKDIR /app
   ENV NODE_ENV=production
   COPY package*.json ./
   RUN npm ci --only=production
   COPY --from=builder /app/dist ./dist
   # Abre a entrada na porta padrão exigida
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Compilar a Imagem Docker**:
   ```bash
   docker build -t sispatrimonio-governo:latest .
   ```

3. **Executar o Container Portador**:
   ```bash
   docker run -d -p 3000:3000 --name sispatrimonio-ativo -v patrimonio-data:/app sispatrimonio-governo:latest
   ```
   *(O volume `patrimonio-data` garantirá a sobrevivência de novos lançamentos ao persistir o arquivador `data-db.json` entre deploys!)*

---

## 🔐 Compliance e Diretrizes de Segurança

1. **Proteção contra SQL Injection**: Uso obrigatório de ORM blindado (Prisma ORM) com parâmetros sanitizados automatizados.
2. **Criptografia Forte**: Todas as senhas operantes reais utilizam rounds adaptáveis de salt Cripto. No modo mock demonstrativo, o banco de dados `./data-db.json` possui as mesmas para facilitação.
3. **Escopo Rígido de Auditoria**: Qualquer login (falho ou correto), remoção pericial de bens, alteração cadastral ou transporte físico dispara logs automáticos informando usuário ativo, IP de origem, data/hora exata e chapa modificadora correspondente.
