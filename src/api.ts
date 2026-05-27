import {
  User,
  Sector,
  Category,
  Patrimonio,
  Movimentacao,
  Auditoria,
  AppNotification,
  DashboardStats,
  Comissao,
  Desfazimento
} from "./types";

const API_BASE = "/api";

function getHeaders() {
  const token = localStorage.getItem("patrimonio_token") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// Auxiliar para tratamento de resposta
async function handleResponse(response: Response) {
  if (!response.ok) {
    let errorMsg = "Ocorreu um erro no servidor patrimonial.";
    try {
      const data = await response.json();
      errorMsg = data.message || errorMsg;
    } catch (e) {
      // Ignora erro de JSON e mantém mensagem padrão
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

/**
 * CLIENT DE COMUNICAÇÃO COM A API REST BACKEND
 * Integração com as rotas do server.ts
 */
export const ApiClient = {
  // Autenticação
  async login(email: string, passwordString: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: passwordString })
    });
    return handleResponse(res);
  },

  async me(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async recovery(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/recovery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  // Setores
  async getSectors(): Promise<Sector[]> {
    const res = await fetch(`${API_BASE}/sectors`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createSector(sector: Partial<Sector>): Promise<Sector> {
    const res = await fetch(`${API_BASE}/sectors`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(sector)
    });
    return handleResponse(res);
  },

  // Categorias
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(category)
    });
    return handleResponse(res);
  },

  // Patrimônio (Bens Móveis)
  async getPatrimonios(filters: {
    search?: string;
    sectorId?: string;
    categoryId?: string;
    state?: string;
    status?: string;
  } = {}): Promise<Patrimonio[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.sectorId) params.append("sectorId", filters.sectorId);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.state) params.append("state", filters.state);
    if (filters.status) params.append("status", filters.status);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/patrimonios${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getPatrimonioById(id: number): Promise<Patrimonio> {
    const res = await fetch(`${API_BASE}/patrimonios/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createPatrimonio(patrimonio: Partial<Patrimonio>): Promise<Patrimonio> {
    const res = await fetch(`${API_BASE}/patrimonios`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(patrimonio)
    });
    return handleResponse(res);
  },

  async updatePatrimonio(id: number, data: Partial<Patrimonio> & { motivoMovimentacao?: string }): Promise<Patrimonio> {
    const res = await fetch(`${API_BASE}/patrimonios/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deletePatrimonio(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/patrimonios/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Transferências / Movimentações
  async getMovimentacoes(): Promise<Movimentacao[]> {
    const res = await fetch(`${API_BASE}/movimentacoes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async transferPatrimonio(patrimonioId: number, setorDestinoId: number, motivo: string, observacoes?: string): Promise<Movimentacao> {
    const res = await fetch(`${API_BASE}/movimentacoes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ patrimonioId, setorDestinoId, motivo, observacoes })
    });
    return handleResponse(res);
  },

  // Auditoria
  async getAuditorias(): Promise<Auditoria[]> {
    const res = await fetch(`${API_BASE}/auditoria`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Notificações
  async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async readAllNotifications(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: "POST",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Backup e Restauração
  async exportBackup(): Promise<{ timestamp: string; data: any; filename: string }> {
    const res = await fetch(`${API_BASE}/backup/download`, {
      method: "POST",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async restoreBackup(data: any): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/backup/restore`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ data })
    });
    return handleResponse(res);
  },
  
  // Usuários (Gerenciamento)
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createUser(userData: Partial<User> & { password?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async updateUser(id: number, userData: Partial<User> & { password?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Importar planilha Excel (simulada)
  async importPlanilha(itens: any[]): Promise<{ message: string; importados: number; duplicados: number }> {
    const res = await fetch(`${API_BASE}/importar-planilha`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ itens })
    });
    return handleResponse(res);
  },

  // Comissão de Avaliação
  async getComissoes(): Promise<Comissao[]> {
    const res = await fetch(`${API_BASE}/comissoes`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createComissao(data: Partial<Comissao>): Promise<Comissao> {
    const res = await fetch(`${API_BASE}/comissoes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateComissao(id: number, data: Partial<Comissao>): Promise<Comissao> {
    const res = await fetch(`${API_BASE}/comissoes/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteComissao(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/comissoes/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Desfazimento Patrimonial
  async getDesfazimentos(): Promise<Desfazimento[]> {
    const res = await fetch(`${API_BASE}/desfazimentos`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createDesfazimento(data: Partial<Desfazimento>): Promise<Desfazimento> {
    const res = await fetch(`${API_BASE}/desfazimentos`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateDesfazimento(id: number, data: Partial<Desfazimento>): Promise<Desfazimento> {
    const res = await fetch(`${API_BASE}/desfazimentos/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteDesfazimento(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/desfazimentos/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
