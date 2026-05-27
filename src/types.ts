export interface User {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  perfil: "Administrador" | "Operador" | "Comissão" | "Operador Patrimonial" | "Consulta";
  ativo: boolean;
  dataUltimoLogin?: string;
  passwordHash?: string;
}

export interface Sector {
  id: number;
  nome: string;
  sigla: string;
  descricao: string;
  responsavel: string;
  emailContato: string;
  dataCriacao: string;
}

export interface Category {
  id: number;
  nome: string;
  codigo: string;
  descricao: string;
  depreciacaoAnualPct: number;
}

export interface Patrimonio {
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
  fotoUrl?: string;
  ativo: boolean;
  dataCadastro: string;
  dataAtualizacao: string;
}

export interface Movimentacao {
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

export interface Auditoria {
  id: number;
  userId?: number;
  userEmail: string;
  acao: string;
  detalhes: string;
  dataRegistro: string;
  ipOrigem?: string;
}

export interface AppNotification {
  id: number;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  tipo: "info" | "transfer" | "alert";
}

export interface DashboardStats {
  totalPatrimonios: number;
  bensAtivos: number;
  bensInativos: number;
  itensCriticos: number;
  valorTotalAcumulado: number;
  estados: {
    "Ótimo": number;
    "Bom": number;
    "Regular": number;
    "Ruim": number;
    "Inservível": number;
  };
  porSetor: {
    id: number;
    setor: string;
    nome: string;
    quantidade: number;
    valor: number;
  }[];
  porCategoria: {
    categoria: string;
    codigo: string;
    quantidade: number;
  }[];
  ultimasMovimentacoes: {
    id: number;
    patrimonioDesc: string;
    codigo: string;
    origem: string;
    destino: string;
    usuario: string;
    data: string;
    motivo: string;
  }[];
}

export interface MembroComissao {
  nome: string;
  matricula: string;
  cargo: string;
  funcaoComissao: "Presidente" | "Membro" | "Suplente" | "Secretário";
}

export interface Comissao {
  id: number;
  portaria: string;
  descricao: string;
  membros: MembroComissao[];
  dataInicio: string;
  dataFim: string;
  ativa: boolean;
}

export interface VistoriaTecnica {
  dataVistoria: string;
  servidorResponsavel: string;
  parecerTecnico: string;
  assinaturaDigital: string;
  fotos: string[];
  documentos: string[];
}

export interface Laudo {
  id: number;
  dataEmissao: string;
  responsavel: string;
  parecerFinal: string;
}

export interface BaixaPatrimonial {
  dataBaixa: string;
  visualDocumentoUrl?: string;
  termoAssinado?: string;
}

export interface DestinacaoFinalDetail {
  tipo: "Leilão" | "Doação" | "Transferência" | "Reciclagem" | "Descarte ambiental";
  data: string;
  responsavel: string;
  comprovantes: string[];
  empresaReceptora: string;
  observacoes: string;
}

export interface Anexo {
  nome: string;
  tipo: string;
  dataUpload: string;
  url: string;
}

export interface Desfazimento {
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
  etapaAtual: number;
  status: "Em análise" | "Aguardando vistoria" | "Aguardando aprovação" | "Aprovado" | "Baixado" | "Finalizado";
  usuarioCriador: string;
  dataCriacao: string;
  dataUltimaMovimentacao: string;
}

