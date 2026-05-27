export interface User {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  perfil: "Administrador" | "Operador" | "Consulta";
  ativo: boolean;
  dataUltimoLogin?: string;
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
