import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Configurações e variáveis de ambiente
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data-db.json");

// Middleware de Parsing
app.use(express.json({ limit: "50mb" }));

// Interfaces de Tipo do Banco de Dados
interface User {
  id: number;
  nome: string;
  email: string;
  passwordHash: string; // Senha em texto ou hash para fins demonstrativos
  cargo: string;
  perfil: "Administrador" | "Operador" | "Comissão" | "Operador Patrimonial" | "Consulta";
  ativo: boolean;
  dataCriacao: string;
  dataUltimoLogin?: string;
}

interface Setor {
  id: number;
  nome: string;
  sigla: string;
  descricao: string;
  responsavel: string;
  emailContato: string;
  dataCriacao: string;
}

interface Categoria {
  id: number;
  nome: string;
  codigo: string;
  descricao: string;
  depreciacaoAnualPct: number;
}

interface Patrimonio {
  id: number;
  numeroPatrimonial: string;
  tombamento: string;
  descricao: string;
  categoriaId: number;
  quantidade: number;
  estadoConservacao: "Ótimo" | "Bom" | "Regular" | "Ruim" | "Inservível";
  localizacaoAtual: string;
  setorId: number;
  dataAquisicao: string;
  valorEstimado: number;
  observacoes: string;
  fotoUrl?: string; // base64 ou URL
  ativo: boolean;
  dataCadastro: string;
  dataAtualizacao: string;
}

interface Movimentacao {
  id: number;
  patrimonioId: number;
  setorOrigemId: number | null;
  setorDestinoId: number;
  usuarioId: number;
  usuarioNome: string;
  dataMovimentacao: string;
  motivo: string;
  observacoes: string;
}

interface Auditoria {
  id: number;
  userId?: number;
  userEmail: string;
  acao: string;
  detalhes: string;
  dataRegistro: string;
  ipOrigem?: string;
}

interface Notification {
  id: number;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  tipo: "info" | "transfer" | "alert";
}

interface MembroComissao {
  nome: string;
  matricula: string;
  cargo: string;
  funcaoComissao: "Presidente" | "Membro" | "Suplente" | "Secretário";
}

interface Comissao {
  id: number;
  portaria: string;
  descricao: string;
  membros: MembroComissao[];
  dataInicio: string;
  dataFim: string;
  ativa: boolean;
}

interface VistoriaTecnica {
  dataVistoria: string;
  servidorResponsavel: string;
  parecerTecnico: string;
  assinaturaDigital: string;
  fotos: string[];
  documentos: string[];
}

interface Laudo {
  id: number;
  dataEmissao: string;
  responsavel: string;
  parecerFinal: string;
}

interface BaixaPatrimonial {
  dataBaixa: string;
  visualDocumentoUrl?: string;
  termoAssinado?: string;
}

interface DestinacaoFinalDetail {
  tipo: "Leilão" | "Doação" | "Transferência" | "Reciclagem" | "Descarte ambiental";
  data: string;
  responsavel: string;
  comprovantes: string[];
  empresaReceptora: string;
  observacoes: string;
}

interface Anexo {
  nome: string;
  tipo: string;
  dataUpload: string;
  url: string;
}

interface Desfazimento {
  id: number;
  patrimonioId: number;
  numeroPatrimonial: string;
  descricao: string;
  localizacaoOriginal: string;
  categoriaId: number;
  classificacao: "Ocioso" | "Recuperável" | "Antieconômico" | "Irrecuperável" | "Obsoleto" | "Inservível";
  estadoConservacaoOriginal: string;
  custoEstimadoReparo: number;
  valorResidualEstimado: number;
  observacoesTecnicas: string;
  parecerComissao?: string;
  comissaoId?: number;
  vistoria?: VistoriaTecnica;
  laudo?: Laudo;
  baixa?: BaixaPatrimonial;
  destinacao?: DestinacaoFinalDetail;
  anexos: Anexo[];
  etapaAtual: number; // 1 a 7
  status: "Em análise" | "Aguardando vistoria" | "Aguardando aprovação" | "Aprovado" | "Baixado" | "Finalizado";
  usuarioCriador: string;
  dataCriacao: string;
  dataUltimaMovimentacao: string;
}

interface DatabaseStructure {
  users: User[];
  setores: Setor[];
  categorias: Categoria[];
  patrimonios: Patrimonio[];
  movimentacoes: Movimentacao[];
  auditoria: Auditoria[];
  notifications: Notification[];
  comissoes: Comissao[];
  desfazimentos: Desfazimento[];
}

// Inicializador de Banco de Dados com Dados de Alta Fidelidade Governamental
function getInitialDB(): DatabaseStructure {
  return {
    users: [
      {
        id: 1,
        nome: "Administrador Geral (Patrimônio)",
        email: "admin@patrimonio.gov.br",
        passwordHash: "admin123", // Para simplificar validação direta
        cargo: "Diretor de Patrimônio",
        perfil: "Administrador",
        ativo: true,
        dataCriacao: new Date().toISOString()
      },
      {
        id: 2,
        nome: "Operador Seccional TI",
        email: "operador@patrimonio.gov.br",
        passwordHash: "operador123",
        cargo: "Técnico de Almoxarifado",
        perfil: "Operador",
        ativo: true,
        dataCriacao: new Date().toISOString()
      },
      {
        id: 3,
        nome: "Consulta Auditoria",
        email: "consulta@patrimonio.gov.br",
        passwordHash: "consulta123",
        cargo: "Controlador Interno",
        perfil: "Consulta",
        ativo: true,
        dataCriacao: new Date().toISOString()
      }
    ],
    setores: [
      { id: 1, nome: "Gabinete do Prefeito", sigla: "GAB", descricao: "Gabinete central do executivo municipal", responsavel: "Dr. Roberto Mendes", emailContato: "gab@municipio.gov.br", dataCriacao: "2018-01-01T08:00:00Z" },
      { id: 2, nome: "Secretaria Municipal de Saúde", sigla: "SESAU", descricao: "Prédio administrativo da saúde municipal", responsavel: "Dra. Helena Souza", emailContato: "sesau@municipio.gov.br", dataCriacao: "2018-01-01T08:00:00Z" },
      { id: 3, nome: "Secretaria Municipal de Educação", sigla: "SEDUC", descricao: "Supervisão da rede de escolas municipais", responsavel: "Prof. Marcos Lima", emailContato: "seduc@municipio.gov.br", dataCriacao: "2018-01-01T08:00:00Z" },
      { id: 4, nome: "Tecnologia da Informação", sigla: "SETIC", descricao: "Apoio e infraestrutura tecnológica municipal", responsavel: "Eng. Pedro Rocha", emailContato: "setic@municipio.gov.br", dataCriacao: "2019-03-15T10:00:00Z" },
      { id: 5, nome: "Secretaria de Administração", sigla: "SEMAD", descricao: "Recursos humanos, compras e frotas", responsavel: "Ana Clara Santos", emailContato: "semad@municipio.gov.br", dataCriacao: "2018-01-01T08:00:00Z" }
    ],
    categorias: [
      { id: 1, nome: "Equipamentos de TI", codigo: "ETI", descricao: "Notebooks, computadores, monitores, impressoras", depreciacaoAnualPct: 15.0 },
      { id: 2, nome: "Mobiliário Administrativo", codigo: "MOBA", descricao: "Mesas, cadeiras giratórias, gaveteiros, armários", depreciacaoAnualPct: 10.0 },
      { id: 3, nome: "Veículos Automotivos", codigo: "VEIC", descricao: "Carros de som, ambulâncias municipais, motos de ronda", depreciacaoAnualPct: 20.0 },
      { id: 4, nome: "Equipamentos de Climatização", codigo: "CLIM", descricao: "Aparelhos de ar condicionado split, ventiladores de teto", depreciacaoAnualPct: 12.5 },
      { id: 5, nome: "Equipamentos Hospitalares", codigo: "HOSP", descricao: "Leitos, ventiladores pulmonares, ultrassons", depreciacaoAnualPct: 12.0 }
    ],
    patrimonios: [
      {
        id: 1,
        numeroPatrimonial: "PM2026-0001",
        tombamento: "TMB-847291",
        descricao: "Notebook Dell Vostro 3520 Intel Core i5 16GB RAM 512GB SSD",
        categoriaId: 1,
        quantidade: 1,
        estadoConservacao: "Ótimo",
        localizacaoAtual: "Sala de Redes - Bloco B",
        setorId: 4,
        dataAquisicao: "2024-02-15",
        valorEstimado: 4500.0,
        observacoes: "Utilizado no suporte técnico de campo. Garantia estendida até 2027.",
        fotoUrl: "",
        ativo: true,
        dataCadastro: "2024-02-15T14:30:00Z",
        dataAtualizacao: "2024-02-15T14:30:00Z"
      },
      {
        id: 2,
        numeroPatrimonial: "PM2026-0002",
        tombamento: "TMB-193850",
        descricao: "Ar Condicionado Split Electrolux 18.000 BTU/h Inverter Eco",
        categoriaId: 4,
        quantidade: 1,
        estadoConservacao: "Bom",
        localizacaoAtual: "Sala de Atendimento ao Cidadão",
        setorId: 2,
        dataAquisicao: "2023-07-10",
        valorEstimado: 3200.0,
        observacoes: "Manutenção preventiva semestral em dia.",
        fotoUrl: "",
        ativo: true,
        dataCadastro: "2023-07-10T11:15:00Z",
        dataAtualizacao: "2025-01-20T09:30:00Z"
      },
      {
        id: 3,
        numeroPatrimonial: "PM2026-0003",
        tombamento: "TMB-902847",
        descricao: "Cadeira Ergonômica NR17 com Apoio de Cabeça e Braços 3D",
        categoriaId: 2,
        quantidade: 3,
        estadoConservacao: "Bom",
        localizacaoAtual: "Gabinete Principal",
        setorId: 1,
        dataAquisicao: "2022-11-05",
        valorEstimado: 1200.0,
        observacoes: "Lote de 3 cadeiras integradas ao patrimônio. Estofados higienizados.",
        fotoUrl: "",
        ativo: true,
        dataCadastro: "2022-11-05T09:00:00Z",
        dataAtualizacao: "2022-11-05T09:00:00Z"
      },
      {
        id: 4,
        numeroPatrimonial: "PM2026-0004",
        tombamento: "TMB-112233",
        descricao: "Servidor Rack Dell PowerEdge R760 Intel Xeon 64GB RAM 4TB SAS",
        categoriaId: 1,
        quantidade: 1,
        estadoConservacao: "Ótimo",
        localizacaoAtual: "Data Center Municipal - Climatizado",
        setorId: 4,
        dataAquisicao: "2025-01-10",
        valorEstimado: 45000.0,
        observacoes: "Hospeda o módulo de folha de pagamento e tributos municipais.",
        fotoUrl: "",
        ativo: true,
        dataCadastro: "2025-01-11T13:00:00Z",
        dataAtualizacao: "2025-01-11T13:00:00Z"
      },
      {
        id: 5,
        numeroPatrimonial: "PM2026-0005",
        tombamento: "TMB-334455",
        descricao: "Veículo Toyota Yaris Sedan 1.5 Flex CVT (Placa ABC-1D23)",
        categoriaId: 3,
        quantidade: 1,
        estadoConservacao: "Bom",
        localizacaoAtual: "Garagem Municipal Central",
        setorId: 5,
        dataAquisicao: "2021-05-20",
        valorEstimado: 85000.0,
        observacoes: "Uso administrativo geral da Secretaria de Administração. Seguro ativo.",
        fotoUrl: "",
        ativo: true,
        dataCadastro: "2021-05-20T10:00:00Z",
        dataAtualizacao: "2024-09-12T16:45:00Z"
      },
      {
        id: 6,
        numeroPatrimonial: "PM2026-0006",
        tombamento: "TMB-556677",
        descricao: "Eletrocardiógrafo Digital Touch Multicanal",
        categoriaId: 5,
        quantidade: 1,
        estadoConservacao: "Regular",
        localizacaoAtual: "Sala de Triagem de Enfermagem",
        setorId: 2,
        dataAquisicao: "2020-03-12",
        valorEstimado: 12500.0,
        observacoes: "Apresenta desgaste estético leve. Sensor de eletrodo recalibrado.",
        fotoUrl: "",
        ativo: true,
        dataCadastro: "2020-03-13T08:30:00Z",
        dataAtualizacao: "2026-02-18T10:20:00Z"
      },
      {
        id: 7,
        numeroPatrimonial: "PM2026-0007",
        tombamento: "TMB-778899",
        descricao: "Estabilizador de Tensão Industrial APC 15kVA",
        categoriaId: 1,
        quantidade: 1,
        estadoConservacao: "Ruim",
        localizacaoAtual: "Sala Técnica Geral",
        setorId: 4,
        dataAquisicao: "2019-06-25",
        valorEstimado: 6800.0,
        observacoes: "Baterias internas exauridas. Depende de orçamento para retrofitting.",
        fotoUrl: "",
        ativo: true,
        dataCadastro: "2019-06-26T11:00:00Z",
        dataAtualizacao: "2026-05-01T15:10:00Z"
      },
      {
        id: 8,
        numeroPatrimonial: "PM2026-0008",
        tombamento: "TMB-990000",
        descricao: "Projetor Multimídia Epson PowerLite 3600 Lumens WXGA",
        categoriaId: 1,
        quantidade: 1,
        estadoConservacao: "Inservível",
        localizacaoAtual: "Depósito de Bens Inservíveis - Setor de Almoxarifado",
        setorId: 3,
        dataAquisicao: "2017-04-18",
        valorEstimado: 3100.0,
        observacoes: "Placa lógica queimada por surto de energia. Recuperação economicamente inviável (Laudo 034/2026).",
        fotoUrl: "",
        ativo: false,
        dataCadastro: "2017-04-19T09:30:00Z",
        dataAtualizacao: "2026-03-10T14:00:00Z"
      }
    ],
    movimentacoes: [
      {
        id: 1,
        patrimonioId: 1,
        setorOrigemId: 1,
        setorDestinoId: 4,
        usuarioId: 1,
        usuarioNome: "Administrador Geral (Patrimônio)",
        dataMovimentacao: "2024-06-18T10:15:00Z",
        motivo: "Transferência para equipe técnica da TI municipal fornecer suporte corporativo.",
        observacoes: "Entregue completo com carregador, mochila e mouse USB em prefeito estado."
      },
      {
        id: 2,
        patrimonioId: 3,
        setorOrigemId: 5,
        setorDestinoId: 1,
        usuarioId: 1,
        usuarioNome: "Administrador Geral (Patrimônio)",
        dataMovimentacao: "2023-08-05T14:40:00Z",
        motivo: "Adequação ergonômica para assessor técnico do gabinete.",
        observacoes: "Remanejada do estoque reserva da Administração."
      }
    ],
    auditoria: [
      {
        id: 1,
        userEmail: "admin@patrimonio.gov.br",
        acao: "LOGIN",
        detalhes: "Acesso administrativo bem-sucedido via console web institucional.",
        dataRegistro: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        userEmail: "admin@patrimonio.gov.br",
        acao: "CRIAR_PATRIMONIO",
        detalhes: "Cadastrado bem 'Servidor Rack Dell PowerEdge R760' sob número PM2026-0004.",
        dataRegistro: new Date(Date.now() - 7200000 * 5).toISOString()
      },
      {
        id: 3,
        userEmail: "operador@patrimonio.gov.br",
        acao: "TRANSFERENCIA_BEM",
        detalhes: "Movimentado patrimônio ID 1 do Gabinete para Tecnologia da Informação.",
        dataRegistro: new Date(Date.now() - 7200000 * 24).toISOString()
      }
    ],
    notifications: [
      {
        id: 1,
        titulo: "Depreciação Calculada",
        mensagem: "Os índices de depreciação mensal de bens eletrônicos foram consolidados para o exercício corrente.",
        data: new Date(Date.now() - 3600000 * 12).toISOString(),
        lida: false,
        tipo: "info"
      },
      {
        id: 2,
        titulo: "Aviso de Laudo Inservível",
        mensagem: "Patrimônio PM2026-0008 (Projetor Multimídia) marcado como 'Inservível' aguarda termo de alienação por leilão público municipal.",
        data: new Date(Date.now() - 3600000 * 48).toISOString(),
        lida: false,
        tipo: "alert"
      }
    ],
    comissoes: [
      {
        id: 1,
        portaria: "PORTARIA Nº 045/DAP/2026",
        descricao: "Comissão Permanente de Avaliação e Desfazimento de Bens Móveis Inservíveis - Setor Administrativo Geral",
        membros: [
          { nome: "Flávio Roberto Costa", matricula: "349.910-2", cargo: "Auditor de Controle Interno", funcaoComissao: "Presidente" },
          { nome: "Aline Mendes Santos", matricula: "128.450-4", cargo: "Técnico de Almoxarifado", funcaoComissao: "Membro" },
          { nome: "Tânia Maria Pereira", matricula: "556.129-8", cargo: "Analista de TI", funcaoComissao: "Membro" }
        ],
        dataInicio: "2026-01-10",
        dataFim: "2026-12-31",
        ativa: true
      }
    ],
    desfazimentos: [
      {
        id: 1,
        patrimonioId: 8,
        numeroPatrimonial: "PM2026-0008",
        descricao: "Projetor Multimídia Epson PowerLite 3600 Lumens WXGA",
        localizacaoOriginal: "Depósito de Bens Inservíveis - Setor de Almoxarifado",
        categoriaId: 1,
        classificacao: "Inservível",
        estadoConservacaoOriginal: "Inservível",
        custoEstimadoReparo: 2450.0,
        valorResidualEstimado: 200.0,
        observacoesTecnicas: "Placa lógica queimada por surto de energia. O conserto equivale a 80% do valor de um projetor novo equivalente.",
        parecerComissao: "Comissão sugere baixa e alienação via doação para fins de reciclagem educacional de componentes eletrônicos ou sucateamento oficial.",
        comissaoId: 1,
        etapaAtual: 3,
        status: "Aguardando vistoria",
        usuarioCriador: "admin@patrimonio.gov.br",
        dataCriacao: "2026-05-10T14:30:00Z",
        dataUltimaMovimentacao: "2026-05-20T10:00:00Z",
        anexos: [
          { nome: "FichaTecnica_PM2026_0008.pdf", tipo: "application/pdf", dataUpload: "2026-05-10T14:31:00Z", url: "" }
        ]
      }
    ]
  };
}

// Leitura/Escrita no arquivo de Banco Local Mocked JSON
function readDB(): DatabaseStructure {
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed.comissoes) {
      parsed.comissoes = getInitialDB().comissoes;
    }
    if (!parsed.desfazimentos) {
      parsed.desfazimentos = getInitialDB().desfazimentos;
    }
    return parsed;
  } catch (error) {
    console.error("Falha ao ler banco JSON. Recriando inicial...", error);
    const initial = getInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

function writeDB(data: DatabaseStructure) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Log de Auditoria Automatizado
function registrarAuditoria(email: string, acao: string, detalhes: string) {
  const db = readDB();
  const novoLog: Auditoria = {
    id: db.auditoria.length > 0 ? Math.max(...db.auditoria.map(a => a.id)) + 1 : 1,
    userEmail: email,
    acao,
    detalhes,
    dataRegistro: new Date().toISOString()
  };
  db.auditoria.unshift(novoLog); // Adiciona no início
  writeDB(db);
}

// Middleware de Autenticação Segura JWT Simplificado
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Sessão não autorizada. Faça login novamente." });
  }
  const token = authHeader.split(" ")[1];
  const db = readDB();
  // Token fictício estruturado: "token_<email>"
  const email = token.replace("token_", "");
  const user = db.users.find(u => u.email === email && u.ativo);

  if (!user) {
    return res.status(401).json({ message: "Usuário inativo ou sessão expirada." });
  }

  // Anexa usuário ao request
  (req as any).user = user;
  next();
}

// Middleware de Controle de Acesso por Perfil
function requireRole(perfisPermitidos: ("Administrador" | "Operador" | "Comissão" | "Operador Patrimonial" | "Consulta")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as User;
    if (!user) return res.status(401).json({ message: "Inicie sessão para continuar." });

    if (!perfisPermitidos.includes(user.perfil)) {
      return res.status(403).json({
        message: `Nível de acesso '${user.perfil}' insuficiente para realizar esta operação.`
      });
    }
    next();
  };
}

// ==================== ROTAS DE AUTENTICAÇÃO ====================

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Preencha e-mail e senha correspondentes." });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.passwordHash !== password) {
    // Auditamos falhas de login suspeitas
    registrarAuditoria(email, "LOGIN_FALHA", `Tentativa malsucedida com a senha: ${password}`);
    return res.status(401).json({ message: "E-mail ou senha inválidos." });
  }

  if (!user.ativo) {
    return res.status(403).json({ message: "Este usuário está desativado no sistema municipal." });
  }

  // Atualiza data do último login
  user.dataUltimoLogin = new Date().toISOString();
  writeDB(db);

  registrarAuditoria(user.email, "LOGIN", `Acesso feito por ${user.nome} (${user.perfil})`);

  // Emite token simples contendo e-mail
  const token = `token_${user.email}`;

  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      perfil: user.perfil,
      ativo: user.ativo
    }
  });
});

app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user as User;
  res.json({
    user: {
      id: currentUser.id,
      nome: currentUser.nome,
      email: currentUser.email,
      cargo: currentUser.cargo,
      perfil: currentUser.perfil,
      ativo: currentUser.ativo
    }
  });
});

app.post("/api/auth/recovery", (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Envie o e-mail de registro." });
  }

  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: "Não cadastrado em nosso servidor." });
  }

  // Simula link de recuperação e loga na auditoria
  registrarAuditoria(email, "RECUPERACAO_SENHA", "Solicitada recuperação de senha municipal.");
  res.json({
    message: "Uma notificação de redefinição de credencial foi disparada para " + email + ". Verifique sua caixa de entrada institucional."
  });
});

// ==================== ROTAS DE USUÁRIOS (GERENCIAMENTO ADM) ====================

app.get("/api/users", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const db = readDB();
  const usersList = db.users.map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    cargo: u.cargo,
    perfil: u.perfil,
    ativo: u.ativo,
    dataCriacao: u.dataCriacao,
    dataUltimoLogin: u.dataUltimoLogin,
    passwordHash: u.passwordHash
  }));
  res.json(usersList);
});

app.post("/api/users", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const { nome, email, password, cargo, perfil, ativo } = req.body;
  if (!nome || !email || !password || !cargo || !perfil) {
    return res.status(400).json({ message: "Preencha todos os campos obrigatórios para o usuário." });
  }

  const db = readDB();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "E-mail de usuário já cadastrado no sistema municipal." });
  }

  const novoUsuario: User = {
    id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
    nome,
    email,
    passwordHash: password,
    cargo,
    perfil,
    ativo: ativo !== undefined ? Boolean(ativo) : true,
    dataCriacao: new Date().toISOString()
  };

  db.users.push(novoUsuario);
  writeDB(db);

  registrarAuditoria((req as any).user.email, "CRIAR_USUARIO", `Cadastrou usuário ${nome} como perfil ${perfil}`);
  res.status(201).json({
    id: novoUsuario.id,
    nome: novoUsuario.nome,
    email: novoUsuario.email,
    cargo: novoUsuario.cargo,
    perfil: novoUsuario.perfil,
    ativo: novoUsuario.ativo,
    dataCriacao: novoUsuario.dataCriacao
  });
});

app.put("/api/users/:id", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { nome, email, password, cargo, perfil, ativo } = req.body;

  const db = readDB();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Usuário não encontrado." });
  }

  const uOriginal = db.users[idx];

  if (email && email.toLowerCase() !== uOriginal.email.toLowerCase()) {
    if (db.users.some(u => u.id !== id && u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: "Este e-mail já está sendo utilizado por outro usuário." });
    }
  }

  if (id === (req as any).user.id && ativo === false) {
    return res.status(400).json({ message: "Por questões de segurança, você não pode desativar sua própria conta de administrador." });
  }

  if (id === (req as any).user.id && perfil && perfil !== "Administrador") {
    return res.status(400).json({ message: "Você não pode mudar seu próprio perfil de administrador." });
  }

  const usuarioAtualizado: User = {
    ...uOriginal,
    nome: nome || uOriginal.nome,
    email: email || uOriginal.email,
    passwordHash: password !== undefined ? password : uOriginal.passwordHash,
    cargo: cargo || uOriginal.cargo,
    perfil: perfil || uOriginal.perfil,
    ativo: ativo !== undefined ? Boolean(ativo) : uOriginal.ativo
  };

  db.users[idx] = usuarioAtualizado;
  writeDB(db);

  registrarAuditoria((req as any).user.email, "ATUALIZAR_USUARIO", `Atualizou conta id ${id} - usuário ${usuarioAtualizado.nome}`);
  res.json({
    id: usuarioAtualizado.id,
    nome: usuarioAtualizado.nome,
    email: usuarioAtualizado.email,
    cargo: usuarioAtualizado.cargo,
    perfil: usuarioAtualizado.perfil,
    ativo: usuarioAtualizado.ativo,
    dataCriacao: usuarioAtualizado.dataCriacao
  });
});

app.delete("/api/users/:id", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (id === (req as any).user.id) {
    return res.status(400).json({ message: "Operação ilegal. Você não pode deletar si próprio." });
  }

  const db = readDB();
  const uObj = db.users.find(u => u.id === id);
  if (!uObj) {
    return res.status(404).json({ message: "Usuário não localizado." });
  }

  db.users = db.users.filter(u => u.id !== id);
  writeDB(db);

  registrarAuditoria((req as any).user.email, "EXCLUIR_USUARIO", `Deletou o usuário ${uObj.nome} (${uObj.email})`);
  res.json({ message: `Usuário ${uObj.nome} removido do servidor com sucesso.` });
});

// ==================== ROTAS DE SECTORS (SETORES) ====================

app.get("/api/sectors", requireAuth, (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.setores);
});

app.post("/api/sectors", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const { nome, sigla, descricao, responsavel, emailContato } = req.body;
  if (!nome || !sigla) {
    return res.status(400).json({ message: "Nome do setor e sigla são obrigatórios." });
  }

  const db = readDB();
  if (db.setores.some(s => s.sigla.toLowerCase() === sigla.toLowerCase())) {
    return res.status(400).json({ message: "Sigla já existente no município." });
  }

  const novoSetor: Setor = {
    id: db.setores.length > 0 ? Math.max(...db.setores.map(s => s.id)) + 1 : 1,
    nome,
    sigla: sigla.toUpperCase(),
    descricao: descricao || "",
    responsavel: responsavel || "Não definido",
    emailContato: emailContato || "",
    dataCriacao: new Date().toISOString()
  };

  db.setores.push(novoSetor);
  writeDB(db);

  registrarAuditoria((req as any).user.email, "CRIAR_SETOR", `Criou setor ${nome} (${sigla})`);
  res.status(201).json(novoSetor);
});

// ==================== ROTAS DE CATEGORIES (CATEGORIAS) ====================

app.get("/api/categories", requireAuth, (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.categorias);
});

app.post("/api/categories", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const { nome, codigo, descricao, depreciacaoAnualPct } = req.body;
  if (!nome || !codigo) {
    return res.status(400).json({ message: "Nome e código da categoria são exigidos." });
  }

  const db = readDB();
  if (db.categorias.some(c => c.codigo.toLowerCase() === codigo.toLowerCase())) {
    return res.status(400).json({ message: "Código de categoria já reservado." });
  }

  const novaCategoria: Categoria = {
    id: db.categorias.length > 0 ? Math.max(...db.categorias.map(c => c.id)) + 1 : 1,
    nome,
    codigo: codigo.toUpperCase(),
    descricao: descricao || "",
    depreciacaoAnualPct: Number(depreciacaoAnualPct) || 10.0
  };

  db.categorias.push(novaCategoria);
  writeDB(db);

  registrarAuditoria((req as any).user.email, "CRIAR_CATEGORIA", `Criou categoria ${nome}`);
  res.status(201).json(novaCategoria);
});

// ==================== ROTAS DE AUDITORIA ====================

app.get("/api/auditoria", requireAuth, requireRole(["Administrador", "Consulta"]), (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.auditoria);
});

// ==================== ROTAS DE NOTIFICATIONS ====================

app.get("/api/notifications", requireAuth, (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.notifications);
});

app.post("/api/notifications/read-all", requireAuth, (req: Request, res: Response) => {
  const db = readDB();
  db.notifications.forEach(n => n.lida = true);
  writeDB(db);
  res.json({ success: true });
});

// ==================== ROTAS DE PATRIMÔNIO (BENS MÓVEIS MUNICIPAIS) ====================

app.get("/api/patrimonios", requireAuth, (req: Request, res: Response) => {
  const db = readDB();
  const { search, sectorId, categoryId, state, status } = req.query;

  let bens = [...db.patrimonios];

  // Filtro Termo de Busca Geral
  if (search) {
    const q = String(search).toLowerCase();
    bens = bens.filter(b =>
      b.numeroPatrimonial.toLowerCase().includes(q) ||
      b.tombamento.toLowerCase().includes(q) ||
      b.descricao.toLowerCase().includes(q) ||
      (b.localizacaoAtual && b.localizacaoAtual.toLowerCase().includes(q))
    );
  }

  // Filtro por Setor
  if (sectorId) {
    bens = bens.filter(b => b.setorId === Number(sectorId));
  }

  // Filtro por Categoria
  if (categoryId) {
    bens = bens.filter(b => b.categoriaId === Number(categoryId));
  }

  // Filtro por Estado
  if (state) {
    bens = bens.filter(b => b.estadoConservacao === String(state));
  }

  // Filtro Ativos/Inativos
  if (status) {
    const isActive = status === "active";
    const isInactive = status === "inactive";
    if (isActive) bens = bens.filter(b => b.ativo);
    if (isInactive) bens = bens.filter(b => !b.ativo);
  }

  res.json(bens);
});

app.get("/api/patrimonios/:id", requireAuth, (req: Request, res: Response) => {
  const db = readDB();
  const id = Number(req.params.id);
  const bem = db.patrimonios.find(p => p.id === id);

  if (!bem) return res.status(404).json({ message: "Patrimônio não localizado." });
  res.json(bem);
});

app.post("/api/patrimonios", requireAuth, requireRole(["Administrador", "Operador"]), (req: Request, res: Response) => {
  const data = req.body;
  if (!data.numeroPatrimonial || !data.descricao || !data.categoriaId || !data.setorId || !data.dataAquisicao || data.valorEstimado === undefined) {
    return res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
  }

  const db = readDB();
  if (db.patrimonios.some(p => p.numeroPatrimonial.toUpperCase() === data.numeroPatrimonial.toUpperCase())) {
    return res.status(400).json({ message: "Número patrimonial duplicado. Já registrado!" });
  }

  const novoPatrimonio: Patrimonio = {
    id: db.patrimonios.length > 0 ? Math.max(...db.patrimonios.map(p => p.id)) + 1 : 1,
    numeroPatrimonial: data.numeroPatrimonial.toUpperCase(),
    tombamento: data.tombamento ? data.tombamento.toUpperCase() : `TMB-${Math.floor(100000 + Math.random() * 900000)}`,
    descricao: data.descricao,
    categoriaId: Number(data.categoriaId),
    quantidade: Math.max(1, Number(data.quantidade) || 1),
    estadoConservacao: data.estadoConservacao || "Bom",
    localizacaoAtual: data.localizacaoAtual || "",
    setorId: Number(data.setorId),
    dataAquisicao: data.dataAquisicao,
    valorEstimado: Number(data.valorEstimado),
    observacoes: data.observacoes || "",
    fotoUrl: data.fotoUrl || "",
    ativo: data.ativo !== undefined ? Boolean(data.ativo) : true,
    dataCadastro: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString()
  };

  db.patrimonios.push(novoPatrimonio);
  writeDB(db);

  registrarAuditoria(
    (req as any).user.email,
    "CREAR_PATRIMONIO",
    `Novo patrimônio cadastrado: ${novoPatrimonio.numeroPatrimonial} - ${novoPatrimonio.descricao}`
  );

  res.status(201).json(novoPatrimonio);
});

app.put("/api/patrimonios/:id", requireAuth, requireRole(["Administrador", "Operador"]), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = req.body;

  const db = readDB();
  const idx = db.patrimonios.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Patrimônio não localizado." });
  }

  const bOriginal = db.patrimonios[idx];

  // Se houver alteração de setor, registra movimentação automaticamente
  if (data.setorId && Number(data.setorId) !== bOriginal.setorId) {
    const setorOrigem = db.setores.find(s => s.id === bOriginal.setorId)?.nome || "Não listado";
    const setorDestino = db.setores.find(s => s.id === Number(data.setorId))?.nome || "Não listado";

    const novaMov: Movimentacao = {
      id: db.movimentacoes.length > 0 ? Math.max(...db.movimentacoes.map(m => m.id)) + 1 : 1,
      patrimonioId: id,
      setorOrigemId: bOriginal.setorId,
      setorDestinoId: Number(data.setorId),
      usuarioId: (req as any).user.id,
      usuarioNome: (req as any).user.nome,
      dataMovimentacao: new Date().toISOString(),
      motivo: data.motivoMovimentacao || "Readequação física interna de rotina",
      observacoes: `Remanejamento solicitado em ata tributária. Setor original: ${setorOrigem} -> SetorDestino: ${setorDestino}.`
    };

    db.movimentacoes.push(novaMov);

    // Cria notificação interna
    db.notifications.unshift({
      id: db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1,
      titulo: `BEM REMANEJADO: ${bOriginal.numeroPatrimonial}`,
      mensagem: `O bem foi movimentado do setor ${bOriginal.setorId} para ${data.setorId} por ${req.body.usuarioNome || (req as any).user.nome}`,
      data: new Date().toISOString(),
      lida: false,
      tipo: "transfer"
    });
  }

  const patrimonioAtualizado: Patrimonio = {
    ...bOriginal,
    ...data,
    id, // protege ID
    numeroPatrimonial: (data.numeroPatrimonial || bOriginal.numeroPatrimonial).toUpperCase(),
    categoriaId: data.categoriaId !== undefined ? Number(data.categoriaId) : bOriginal.categoriaId,
    setorId: data.setorId !== undefined ? Number(data.setorId) : bOriginal.setorId,
    valorEstimado: data.valorEstimado !== undefined ? Number(data.valorEstimado) : bOriginal.valorEstimado,
    dataAtualizacao: new Date().toISOString()
  };

  db.patrimonios[idx] = patrimonioAtualizado;
  writeDB(db);

  registrarAuditoria(
    (req as any).user.email,
    "ATUALIZAR_PATRIMONIO",
    `Patrimônio atualizado id ${id} (${patrimonioAtualizado.numeroPatrimonial})`
  );

  res.json(patrimonioAtualizado);
});

app.delete("/api/patrimonios/:id", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const db = readDB();

  const bem = db.patrimonios.find(p => p.id === id);
  if (!bem) {
    return res.status(404).json({ message: "Patrimônio não localizado no sistema." });
  }

  // Rompe/deleta ou inativa
  db.patrimonios = db.patrimonios.filter(p => p.id !== id);
  writeDB(db);

  registrarAuditoria(
    (req as any).user.email,
    "EXCLUIR_PATRIMONIO",
    `BEM REMOVIDO: N° ${bem.numeroPatrimonial} - ${bem.descricao}`
  );

  res.json({ message: `Patrimônio ${bem.numeroPatrimonial} excluído com sucesso.` });
});


// ==================== ROTAS DE MOVIMENTATION (MOVIMENTAÇÕES / TRANSFERÊNCIAS) ====================

app.get("/api/movimentacoes", requireAuth, (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.movimentacoes);
});

app.post("/api/movimentacoes", requireAuth, requireRole(["Administrador", "Operador"]), (req: Request, res: Response) => {
  const { patrimonioId, setorDestinoId, motivo, observacoes } = req.body;
  if (!patrimonioId || !setorDestinoId || !motivo) {
    return res.status(400).json({ message: "ID do bem, setor de destino e motivo são obrigatórios." });
  }

  const db = readDB();
  const patrimonio = db.patrimonios.find(p => p.id === Number(patrimonioId));
  if (!patrimonio) {
    return res.status(404).json({ message: "Patrimônio não localizado." });
  }

  const setorDestino = db.setores.find(s => s.id === Number(setorDestinoId));
  if (!setorDestino) {
    return res.status(404).json({ message: "Setor de destino inválido." });
  }

  const setorOrigemId = patrimonio.setorId;
  if (setorOrigemId === Number(setorDestinoId)) {
    return res.status(400).json({ message: "O setor de destino é igual ao setor de origem atual do bem." });
  }

  // Realiza a transferência no banco
  patrimonio.setorId = Number(setorDestinoId);
  patrimonio.dataAtualizacao = new Date().toISOString();

  const usuario = (req as any).user;
  const novaMovimentacao: Movimentacao = {
    id: db.movimentacoes.length > 0 ? Math.max(...db.movimentacoes.map(m => m.id)) + 1 : 1,
    patrimonioId: patrimonio.id,
    setorOrigemId,
    setorDestinoId: Number(setorDestinoId),
    usuarioId: usuario.id,
    usuarioNome: usuario.nome,
    dataMovimentacao: new Date().toISOString(),
    motivo,
    observacoes: observacoes || ""
  };

  db.movimentacoes.push(novaMovimentacao);

  // Envia notificação
  db.notifications.unshift({
    id: db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1,
    titulo: `Transferência Concluída: ${patrimonio.numeroPatrimonial}`,
    mensagem: `Transferido para ${setorDestino.nome} por motivo: ${motivo}`,
    data: new Date().toISOString(),
    lida: false,
    tipo: "transfer"
  });

  writeDB(db);

  registrarAuditoria(
    usuario.email,
    "TRANSFERENCIA_PATRIMONIO",
    `Transferiu bem ${patrimonio.numeroPatrimonial} do Setor ${setorOrigemId} para o Setor ${setorDestinoId}`
  );

  res.status(201).json(novaMovimentacao);
});

// ==================== ROTAS DE CÓPIA DE SEGURANÇA (BACKUP EXTRA FEATURE) ====================

app.post("/api/backup/download", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const db = readDB();
  registrarAuditoria((req as any).user.email, "BACKUP_SYSTEM", "Exportação / Backup manual gerado do banco municipal.");
  res.json({
    timestamp: new Date().toISOString(),
    data: db,
    filename: `backup-patrimonio-municipal-${new Date().toISOString().slice(0, 10)}.json`
  });
});

app.post("/api/backup/restore", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const { data } = req.body;
  if (!data || !data.users || !data.patrimonios || !data.setores) {
    return res.status(400).json({ message: "Estrutura de backup inconsistente de dados municipais." });
  }

  writeDB(data);
  registrarAuditoria((req as any).user.email, "RESTORE_SYSTEM", "Restauração de backup realizada.");
  res.json({ message: "Banco de dados sincronizado e restaurado com êxito." });
});

// ==================== ROTA DE IMPORTAÇÃO DE PLANILHA (MOCKED EXCEL DATA IMPORT) ====================

app.post("/api/importar-planilha", requireAuth, requireRole(["Administrador", "Operador"]), (req: Request, res: Response) => {
  const { itens } = req.body;
  if (!itens || !Array.isArray(itens)) {
    return res.status(400).json({ message: "Envie um vetor de colunas de patrimônio." });
  }

  const db = readDB();
  let importados = 0;
  let duplicados = 0;

  for (const item of itens) {
    if (!item.numeroPatrimonial || !item.descricao) continue;

    // Evita duplicado por código
    const num = item.numeroPatrimonial.toUpperCase();
    if (db.patrimonios.some(p => p.numeroPatrimonial === num)) {
      duplicados++;
      continue;
    }

    const tmb = item.tombamento ? item.tombamento.toUpperCase() : `TMB-${Math.floor(100000 + Math.random() * 900000)}`;

    const novo: Patrimonio = {
      id: db.patrimonios.length > 0 ? Math.max(...db.patrimonios.map(p => p.id)) + 1 : 1,
      numeroPatrimonial: num,
      tombamento: tmb,
      descricao: item.descricao,
      categoriaId: Number(item.categoriaId) || 1,
      quantidade: 1,
      estadoConservacao: item.estadoConservacao || "Bom",
      localizacaoAtual: item.localizacaoAtual || "Diretoria Geral",
      setorId: Number(item.setorId) || 1,
      dataAquisicao: item.dataAquisicao || new Date().toISOString().slice(0, 10),
      valorEstimado: Number(item.valorEstimado) || 0,
      observacoes: item.observacoes || "Importado por planilha Excel institucional.",
      fotoUrl: "",
      ativo: true,
      dataCadastro: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    db.patrimonios.push(novo);
    importados++;
  }

  writeDB(db);
  registrarAuditoria(
    (req as any).user.email,
    "PLANILHA_IMPORTACAO",
    `Importou planilha. Sucessos: ${importados}, Duplicados pulados: ${duplicados}`
  );

  res.json({
    message: `Processamento administrativo concluído! ${importados} bens importados com sucesso. ${duplicados} bens duplicados foram ignorados.`,
    importados,
    duplicados
  });
});

// ==================== STATS DO DASHBOARD (MÉTRICAS) ====================

app.get("/api/dashboard/stats", requireAuth, (req: Request, res: Response) => {
  const db = readDB();

  const totalPatrimonios = db.patrimonios.length;
  const bensAtivos = db.patrimonios.filter(p => p.ativo).length;
  const bensInativos = totalPatrimonios - bensAtivos;

  // Total por conservação
  const estados: Record<string, number> = { Ótimo: 0, Bom: 0, Regular: 0, Ruim: 0, Inservível: 0 };
  db.patrimonios.forEach(p => {
    if (estados[p.estadoConservacao] !== undefined) {
      estados[p.estadoConservacao]++;
    }
  });

  // Itens danificados/críticos (Ruim ou Inservível)
  const itensCriticos = db.patrimonios.filter(p => p.estadoConservacao === "Ruim" || p.estadoConservacao === "Inservível").length;

  // Valor total acumulado de ativos
  const valorTotalAcumulado = db.patrimonios.reduce((acc, p) => acc + (p.ativo ? p.valorEstimado * p.quantidade : 0), 0);

  // Bens por setor
  const porSetor = db.setores.map(s => {
    const quant = db.patrimonios.filter(p => p.setorId === s.id).length;
    const valor = db.patrimonios.filter(p => p.setorId === s.id).reduce((sum, p) => sum + (p.valorEstimado * p.quantidade), 0);
    return {
      id: s.id,
      setor: s.sigla,
      nome: s.nome,
      quantidade: quant,
      valor
    };
  });

  // Bens por categoria
  const porCategoria = db.categorias.map(c => {
    const quant = db.patrimonios.filter(p => p.categoriaId === c.id).length;
    return {
      categoria: c.nome,
      codigo: c.codigo,
      quantidade: quant
    };
  });

  // Últimas movimentações com dados detalhados
  const ultimasMovimentacoes = db.movimentacoes
    .map(m => {
      const patrimonio = db.patrimonios.find(p => p.id === m.patrimonioId);
      const origem = db.setores.find(s => s.id === m.setorOrigemId)?.sigla || "Entrada";
      const destino = db.setores.find(s => s.id === m.setorDestinoId)?.sigla || "S/D";
      return {
        id: m.id,
        patrimonioDesc: patrimonio?.descricao || `Bem Móvel ID #${m.patrimonioId}`,
        codigo: patrimonio?.numeroPatrimonial || "N/A",
        origem,
        destino,
        usuario: m.usuarioNome,
        data: m.dataMovimentacao,
        motivo: m.motivo
      };
    })
    .slice(-5)
    .reverse();

  res.json({
    totalPatrimonios,
    bensAtivos,
    bensInativos,
    itensCriticos,
    valorTotalAcumulado,
    estados,
    porSetor,
    porCategoria,
    ultimasMovimentacoes
  });
});

// ==================== ROTAS DE COMISSÃO DE AVALIAÇÃO ====================

app.get("/api/comissoes", requireAuth, (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.comissoes || []);
});

app.post("/api/comissoes", requireAuth, requireRole(["Administrador", "Operador", "Comissão", "Operador Patrimonial"]), (req: Request, res: Response) => {
  const db = readDB();
  const comissaoData = req.body;

  if (!comissaoData.portaria || !comissaoData.membros || !Array.isArray(comissaoData.membros)) {
    return res.status(400).json({ message: "Portaria e lista de membros são obrigatórios." });
  }

  const novaComissao: Comissao = {
    id: db.comissoes && db.comissoes.length > 0 ? Math.max(...db.comissoes.map(c => c.id)) + 1 : 1,
    portaria: comissaoData.portaria.toUpperCase(),
    descricao: comissaoData.descricao || "",
    membros: comissaoData.membros,
    dataInicio: comissaoData.dataInicio || new Date().toISOString().slice(0, 10),
    dataFim: comissaoData.dataFim || "",
    ativa: comissaoData.ativa !== undefined ? comissaoData.ativa : true
  };

  if (!db.comissoes) db.comissoes = [];
  db.comissoes.push(novaComissao);
  writeDB(db);

  registrarAuditoria(
    (req as any).user.email,
    "CRIAR_COMISSAO",
    `Criou comissão avaliadora sob portaria ${novaComissao.portaria} com ${novaComissao.membros.length} membros.`
  );

  res.status(201).json(novaComissao);
});

app.put("/api/comissoes/:id", requireAuth, requireRole(["Administrador", "Comissão", "Operador", "Operador Patrimonial"]), (req: Request, res: Response) => {
  const db = readDB();
  const id = Number(req.params.id);
  const updateData = req.body;

  if (!db.comissoes) db.comissoes = [];
  const comIndex = db.comissoes.findIndex(c => c.id === id);
  if (comIndex === -1) {
    return res.status(404).json({ message: "Comissão não localizada no município." });
  }

  db.comissoes[comIndex] = {
    ...db.comissoes[comIndex],
    portaria: updateData.portaria ? updateData.portaria.toUpperCase() : db.comissoes[comIndex].portaria,
    descricao: updateData.descricao !== undefined ? updateData.descricao : db.comissoes[comIndex].descricao,
    membros: updateData.membros !== undefined ? updateData.membros : db.comissoes[comIndex].membros,
    dataInicio: updateData.dataInicio !== undefined ? updateData.dataInicio : db.comissoes[comIndex].dataInicio,
    dataFim: updateData.dataFim !== undefined ? updateData.dataFim : db.comissoes[comIndex].dataFim,
    ativa: updateData.ativa !== undefined ? updateData.ativa : db.comissoes[comIndex].ativa
  };

  writeDB(db);

  registrarAuditoria(
    (req as any).user.email,
    "ATUALIZAR_COMISSAO",
    `Atualizou termos da portaria municipal ID #${id}`
  );

  res.json(db.comissoes[comIndex]);
});

app.delete("/api/comissoes/:id", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const db = readDB();
  const id = Number(req.params.id);

  if (!db.comissoes) db.comissoes = [];
  const comissao = db.comissoes.find(c => c.id === id);
  if (!comissao) {
    return res.status(404).json({ message: "Comissão não identificada." });
  }

  db.comissoes = db.comissoes.filter(c => c.id !== id);
  writeDB(db);

  registrarAuditoria(
    (req as any).user.email,
    "REMOVER_COMISSAO",
    `Removeu portaria avaliativa e comissão ${comissao.portaria}`
  );

  res.json({ message: "Comissão removida e arquivada com sucesso." });
});

// ==================== ROTAS DE DESFAZIMENTO PATRIMONIAL ====================

app.get("/api/desfazimentos", requireAuth, (req: Request, res: Response) => {
  const db = readDB();
  res.json(db.desfazimentos || []);
});

app.post("/api/desfazimentos", requireAuth, requireRole(["Administrador", "Operador", "Comissão", "Operador Patrimonial"]), (req: Request, res: Response) => {
  const db = readDB();
  const { patrimonioId, classificacao, observacoesTecnicas, custoEstimadoReparo, valorResidualEstimado, comissaoId } = req.body;

  if (!patrimonioId || !classificacao) {
    return res.status(400).json({ message: "Selecione o bem correspondente e a classificação de desfazimento patrimonial." });
  }

  const patrimonio = db.patrimonios.find(p => p.id === Number(patrimonioId));
  if (!patrimonio) {
    return res.status(404).json({ message: "Item patrimonial não localizado no acervo institucional." });
  }

  // Verifica se já houver processo em andamento para o mesmo bem
  if (!db.desfazimentos) db.desfazimentos = [];
  const processoExistente = db.desfazimentos.find(d => d.patrimonioId === patrimonio.id && d.status !== "Finalizado" && d.status !== "Baixado");
  if (processoExistente) {
    return res.status(400).json({ message: `Já existe um processo de desfazimento ativo para o bem '${patrimonio.numeroPatrimonial}' no status '${processoExistente.status}'.` });
  }

  const novoDesfazimento: Desfazimento = {
    id: db.desfazimentos.length > 0 ? Math.max(...db.desfazimentos.map(d => d.id)) + 1 : 1,
    patrimonioId: patrimonio.id,
    numeroPatrimonial: patrimonio.numeroPatrimonial,
    descricao: patrimonio.descricao,
    localizacaoOriginal: patrimonio.localizacaoAtual,
    categoriaId: patrimonio.categoriaId,
    classificacao,
    estadoConservacaoOriginal: patrimonio.estadoConservacao,
    custoEstimadoReparo: Number(custoEstimadoReparo) || 0,
    valorResidualEstimado: Number(valorResidualEstimado) || 0,
    observacoesTecnicas: observacoesTecnicas || "",
    comissaoId: comissaoId ? Number(comissaoId) : undefined,
    etapaAtual: 1, // Identificação
    status: "Em análise",
    usuarioCriador: (req as any).user.email,
    dataCriacao: new Date().toISOString(),
    dataUltimaMovimentacao: new Date().toISOString(),
    anexos: []
  };

  db.desfazimentos.push(novoDesfazimento);
  writeDB(db);

  registrarAuditoria(
    (req as any).user.email,
    "INICIAR_DESFAZIMENTO",
    `Iniciou processo administrativo de desfazimento do bem ${patrimonio.numeroPatrimonial} - Classificação: ${classificacao}`
  );

  res.status(201).json(novoDesfazimento);
});

app.put("/api/desfazimentos/:id", requireAuth, requireRole(["Administrador", "Comissão", "Operador", "Operador Patrimonial"]), (req: Request, res: Response) => {
  const db = readDB();
  const id = Number(req.params.id);
  const payload = req.body;

  if (!db.desfazimentos) db.desfazimentos = [];
  const processIndex = db.desfazimentos.findIndex(d => d.id === id);
  if (processIndex === -1) {
    return res.status(404).json({ message: "Processo de desfazimento não localizado." });
  }

  const processo = db.desfazimentos[processIndex];

  // Mescla actualização
  const updatedProcesso: Desfazimento = {
    ...processo,
    classificacao: payload.classificacao !== undefined ? payload.classificacao : processo.classificacao,
    custoEstimadoReparo: payload.custoEstimadoReparo !== undefined ? Number(payload.custoEstimadoReparo) : processo.custoEstimadoReparo,
    valorResidualEstimado: payload.valorResidualEstimado !== undefined ? Number(payload.valorResidualEstimado) : processo.valorResidualEstimado,
    observacoesTecnicas: payload.observacoesTecnicas !== undefined ? payload.observacoesTecnicas : processo.observacoesTecnicas,
    parecerComissao: payload.parecerComissao !== undefined ? payload.parecerComissao : processo.parecerComissao,
    comissaoId: payload.comissaoId !== undefined ? (payload.comissaoId ? Number(payload.comissaoId) : undefined) : processo.comissaoId,
    etapaAtual: payload.etapaAtual !== undefined ? Number(payload.etapaAtual) : processo.etapaAtual,
    status: payload.status !== undefined ? payload.status : processo.status,
    vistoria: payload.vistoria !== undefined ? payload.vistoria : processo.vistoria,
    laudo: payload.laudo !== undefined ? payload.laudo : processo.laudo,
    baixa: payload.baixa !== undefined ? payload.baixa : processo.baixa,
    destinacao: payload.destinacao !== undefined ? payload.destinacao : processo.destinacao,
    anexos: payload.anexos !== undefined ? payload.anexos : processo.anexos,
    dataUltimaMovimentacao: new Date().toISOString()
  };

  // Lógica de Integração com Patrimônio se o status for mudado para "Baixado" ou "Finalizado"
  const concluindoBaixa = (payload.status === "Baixado" || payload.status === "Finalizado") && 
                           (processo.status !== "Baixado" && processo.status !== "Finalizado");

  if (concluindoBaixa) {
    const patrimonioIndex = db.patrimonios.findIndex(p => p.id === processo.patrimonioId);
    if (patrimonioIndex !== -1) {
      const pOld = db.patrimonios[patrimonioIndex];
      
      // Atualiza estado de conservação e inativa o bem
      db.patrimonios[patrimonioIndex] = {
        ...pOld,
        ativo: false,
        estadoConservacao: "Inservível",
        observacoes: `${pOld.observacoes || ""}\n[BAIXADO] Objeto desincorporado através de processo de descarregamento de patrimônio inservível. Destinação: ${payload.destinacao?.tipo || "Descarte"}.`,
        dataAtualizacao: new Date().toISOString()
      };

      // Registra uma Movimentação automática para fins de transparência do Almoxarifado
      const novaMovimentacao: Movimentacao = {
        id: db.movimentacoes.length > 0 ? Math.max(...db.movimentacoes.map(m => m.id)) + 1 : 1,
        patrimonioId: pOld.id,
        setorOrigemId: pOld.setorId,
        setorDestinoId: pOld.setorId, // Permanece no mesmo, marcado como baixado
        usuarioId: (req as any).user.id || 1,
        usuarioNome: (req as any).user.nome || "Sistema Municipal",
        dataMovimentacao: new Date().toISOString(),
        motivo: `BAIXA PATRIMONIAL DEFINITIVA - Processo desfazimento #${id}.`,
        observacoes: `Bem desincorporado sob portaria de avaliação. Destinação adotada: ${payload.destinacao?.tipo || "Não especificado"}.`
      };
      
      db.movimentacoes.push(novaMovimentacao);

      // Envia notificação global ao sistema
      db.notifications.unshift({
        id: db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1,
        titulo: `Baixa Patrimonial Efetuada`,
        mensagem: `Bem ${pOld.numeroPatrimonial} (${pOld.descricao}) desincorporado. Destinação: ${payload.destinacao?.tipo || "Doação/Descarte"}.`,
        data: new Date().toISOString(),
        lida: false,
        tipo: "alert"
      });

      registrarAuditoria(
        (req as any).user.email,
        "BAIXA_INTEGRADA_DESFAZIMENTO",
        `Concluiu desfazimento #${id}. O bem ${pOld.numeroPatrimonial} foi inativado de forma irrevogável no balanço do município.`
      );
    }
  }

  db.desfazimentos[processIndex] = updatedProcesso;
  writeDB(db);

  registrarAuditoria(
    (req as any).user.email,
    "ATUALIZAR_DESFAZIMENTO",
    `Progrediu processo de desfazimento ID #${id} para etapa ${updatedProcesso.etapaAtual} (${updatedProcesso.status})`
  );

  res.json(updatedProcesso);
});

app.delete("/api/desfazimentos/:id", requireAuth, requireRole(["Administrador"]), (req: Request, res: Response) => {
  const db = readDB();
  const id = Number(req.params.id);

  if (!db.desfazimentos) db.desfazimentos = [];
  const desfazimento = db.desfazimentos.find(d => d.id === id);
  if (!desfazimento) {
    return res.status(404).json({ message: "Processo de desfazimento não identificado no acervo." });
  }

  // Se o processo já houver concluído a baixa, por segurança governamental, não permitimos apagar
  if (desfazimento.status === "Baixado" || desfazimento.status === "Finalizado") {
    return res.status(400).json({ message: "Desfazimentos concluídos e averbados em cartório municipal de patrimônio não podem ser excluídos." });
  }

  db.desfazimentos = db.desfazimentos.filter(d => d.id !== id);
  writeDB(db);

  registrarAuditoria(
    (req as any).user.email,
    "REMOVER_DESFAZIMENTO",
    `Cancelou processo de desfazimento ID #${id} referente ao bem ${desfazimento.numeroPatrimonial}`
  );

  res.json({ message: "Processo de desfazimento excluído com êxito." });
});

// Tratamento Global de Erros no Backend
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("ERRO_GLOBAL: ", err);
  res.status(500).json({
    message: "Ocorreu uma falha inesperada no servidor institucional de patrimônio.",
    error: process.env.NODE_ENV !== "production" ? err.message : null
  });
});

// ==================== INTEGRAÇÃO VITE / FRONTEND ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Modo de Desenvolvimento: Executa o Vite como middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Dev Server rodando com suporte a Vite Middleware!");
  } else {
    // Modo de Produção: Serve estáticos do diretório dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVIDO ATIVO] Inventário Patrimonial rodando em http://localhost:${PORT}`);
  });
}

startServer();
