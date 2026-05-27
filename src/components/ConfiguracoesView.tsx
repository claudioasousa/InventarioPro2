import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  FolderLock,
  Plus,
  Check,
  Download,
  Upload,
  RefreshCw,
  Clock,
  UserCheck,
  CheckCircle2,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  UserX,
  Shield,
  ShieldCheck,
  Lock,
  X
} from "lucide-react";
import { Sector, Category, User } from "../types";
import { ApiClient } from "../api";

interface ConfiguracoesViewProps {
  sectors: Sector[];
  categories: Category[];
  userPerfil: string;
  onAddSector: (data: Partial<Sector>) => Promise<any>;
  onAddCategory: (data: Partial<Category>) => Promise<any>;
  onExportBackup: () => Promise<any>;
  onRestoreBackup: (data: any) => Promise<any>;
}

export default function ConfiguracoesView({
  sectors,
  categories,
  userPerfil,
  onAddSector,
  onAddCategory,
  onExportBackup,
  onRestoreBackup
}: ConfiguracoesViewProps) {
  
  // Estado de SubAbas
  const [activeSubTab, setActiveSubTab] = useState<"geral" | "backup" | "usuarios">("geral");

  // Estados de Setores
  const [secNome, setSecNome] = useState("");
  const [secSigla, setSecSigla] = useState("");
  const [secDesc, setSecDesc] = useState("");
  const [secResp, setSecResp] = useState("");
  const [secEmail, setSecEmail] = useState("");
  const [secError, setSecError] = useState("");

  // Estados de Categorias
  const [catNome, setCatNome] = useState("");
  const [catCodigo, setCatCodigo] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catDeprec, setCatDeprec] = useState(10.0);
  const [catError, setCatError] = useState("");

  // Feedback global
  const [successMsg, setSuccessMsg] = useState("");
  const [backupLoading, setBackupLoading] = useState(false);

  // Estados de Usuários (Módulo Administrativo Exclusivo)
  const [users, setUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userSuccessMsg, setUserSuccessMsg] = useState("");
  const [userErrorMsg, setUserErrorMsg] = useState("");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // Campos do formulário de usuário
  const [usrNome, setUsrNome] = useState("");
  const [usrEmail, setUsrEmail] = useState("");
  const [usrCargo, setUsrCargo] = useState("");
  const [usrPerfil, setUsrPerfil] = useState<"Administrador" | "Operador" | "Consulta">("Consulta");
  const [usrSenha, setUsrSenha] = useState("");
  const [usrAtivo, setUsrAtivo] = useState(true);

  // Filtro de Busca de Usuários
  const [userSearchText, setUserSearchText] = useState("");

  const showGlobalMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Carrega usuários da API
  const loadUsers = async () => {
    if (userPerfil !== "Administrador") return;
    setUserLoading(true);
    setUserErrorMsg("");
    try {
      const data = await ApiClient.getUsers();
      setUsers(data);
    } catch (err: any) {
      setUserErrorMsg(err.message || "Erro ao carregar lista de usuários.");
    } finally {
      setUserLoading(false);
    }
  };

  // Effect para sincronização sob demanda dos usuários
  useEffect(() => {
    if (userPerfil === "Administrador" && activeSubTab === "usuarios") {
      loadUsers();
    }
  }, [activeSubTab, userPerfil]);

  // Submit do Setor
  const handleAddSectorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecError("");
    try {
      if (!secNome || !secSigla) {
        throw new Error("Nome e Sigla do setor são campos de preenchimento obrigatório.");
      }
      await onAddSector({
        nome: secNome,
        sigla: secSigla.toUpperCase(),
        descricao: secDesc,
        responsavel: secResp || "Não listado",
        emailContato: secEmail
      });
      showGlobalMsg(`Organismo Municipal '${secSigla.toUpperCase()}' criado com sucesso.`);
      setSecNome("");
      setSecSigla("");
      setSecDesc("");
      setSecResp("");
      setSecEmail("");
    } catch (err: any) {
      setSecError(err.message || "Erro ao tentar registrar novo setor.");
    }
  };

  // Submit da Categoria
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError("");
    try {
      if (!catNome || !catCodigo) {
        throw new Error("Nome e Código de categoria são campos obrigatórios.");
      }
      await onAddCategory({
        nome: catNome,
        codigo: catCodigo.toUpperCase(),
        descricao: catDesc,
        depreciacaoAnualPct: Number(catDeprec) || 10.0
      });
      showGlobalMsg(`Grupo Patrimonial '${catNome}' incorporado.`);
      setCatNome("");
      setCatCodigo("");
      setCatDesc("");
      setCatDeprec(10.0);
    } catch (err: any) {
      setCatError(err.message || "Falha ao registrar categoria patrimonial.");
    }
  };

  // Exportar Backup JSON nativo
  const handleBackupExport = async () => {
    setBackupLoading(true);
    try {
      const response = await onExportBackup();
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.setAttribute("href", URL.createObjectURL(blob));
      link.setAttribute("download", response.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showGlobalMsg("Backup Municipal consolidado e descarregado com sucesso.");
    } catch (err: any) {
      alert("Falha ao exportar base ativa: " + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // Restaurar Backup Local
  const handleRestoreImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm("RESTAURAR BASE DE DADOS? Aviso: esta ação irá expurgar todos os dados patrimoniais correntemente ativos e redefinirá os logs de auditorias para os valores arquivados.")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (!parsed.users || !parsed.patrimonios || !parsed.setores) {
            throw new Error("Arquivo incorreto de dados patrimoniais.");
          }
          await onRestoreBackup(parsed);
          showGlobalMsg("Restauração de sistema governamental efetuada!");
          setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
          alert("Backup inválido: " + err.message);
        }
      };
      reader.readAsText(file);
    }
    // limpa input
    e.target.value = "";
  };

  // Manipuladores de Usuários
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMsg("");
    setUserSuccessMsg("");

    if (!usrNome || !usrEmail || !usrCargo || !usrPerfil) {
      setUserErrorMsg("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!editingUserId && !usrSenha) {
      setUserErrorMsg("A senha é obrigatória para o cadastro de novos usuários.");
      return;
    }

    try {
      if (editingUserId) {
        // Envia atualização
        const payload: any = {
          nome: usrNome,
          email: usrEmail,
          cargo: usrCargo,
          perfil: usrPerfil,
          ativo: usrAtivo
        };
        if (usrSenha.trim()) {
          payload.password = usrSenha;
        }

        await ApiClient.updateUser(editingUserId, payload);
        setUserSuccessMsg(`Usuário '${usrNome}' atualizado com sucesso no cadastro municipal.`);
        resetUserForm();
      } else {
        // Envia criação
        await ApiClient.createUser({
          nome: usrNome,
          email: usrEmail,
          cargo: usrCargo,
          perfil: usrPerfil,
          ativo: usrAtivo,
          password: usrSenha
        });
        setUserSuccessMsg(`Usuário '${usrNome}' cadastrado com sucesso.`);
        resetUserForm();
      }
      await loadUsers();
    } catch (err: any) {
      setUserErrorMsg(err.message || "Erro ao salvar dados do usuário.");
    }
  };

  const handleEditUserClick = (targetUser: User) => {
    setEditingUserId(targetUser.id);
    setUsrNome(targetUser.nome);
    setUsrEmail(targetUser.email);
    setUsrCargo(targetUser.cargo);
    setUsrPerfil(targetUser.perfil);
    setUsrAtivo(targetUser.ativo);
    setUsrSenha(""); // Deixa campo de senha limpo caso queira alterar
    setUserErrorMsg("");
    setUserSuccessMsg("");
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUsrNome("");
    setUsrEmail("");
    setUsrCargo("");
    setUsrPerfil("Consulta");
    setUsrSenha("");
    setUsrAtivo(true);
    setUserErrorMsg("");
  };

  const handleDeleteUserClick = async (targetUser: User) => {
    if (confirm(`RETIRAR USUÁRIO DO SISTEMA? Aviso: o usuário '${targetUser.nome}' será permanentemente expurgado de nosso quadro de acesso municipal.`)) {
      setUserErrorMsg("");
      setUserSuccessMsg("");
      try {
        await ApiClient.deleteUser(targetUser.id);
        setUserSuccessMsg(`Usuário '${targetUser.nome}' removido com sucesso.`);
        if (editingUserId === targetUser.id) {
          resetUserForm();
        }
        await loadUsers();
      } catch (err: any) {
        setUserErrorMsg(err.message || "Erro ao remover usuário.");
      }
    }
  };

  // Filtra lista de usuários em tela de forma rápida
  const filteredUsers = users.filter(u => {
    const term = userSearchText.toLowerCase();
    return (
      u.nome.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.cargo.toLowerCase().includes(term) ||
      u.perfil.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 text-left" id="configuracoes-view-main">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500 animate-spin" />
          Configurações, Repartições & Controle de Usuários
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Gerenciamento operacional da hierarquia municipal de ativos, cópias de segurança do inventário e controle de perfis de operadores.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SubAbas de Navegação */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab("geral")}
          className={`px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase transition-all border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === "geral"
              ? "border-blue-500 text-blue-400 bg-blue-500/5 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Repartições & Categorias
        </button>
        <button
          onClick={() => setActiveSubTab("backup")}
          className={`px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase transition-all border-b-2 shrink-0 cursor-pointer ${
            activeSubTab === "backup"
              ? "border-blue-500 text-blue-400 bg-blue-500/5 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Resguardo & Backup
        </button>
        {userPerfil === "Administrador" && (
          <button
            onClick={() => setActiveSubTab("usuarios")}
            className={`px-4 py-2 text-xs font-bold font-mono tracking-wider uppercase transition-all border-b-2 shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "usuarios"
                ? "border-blue-500 text-blue-500 bg-blue-500/5 rounded-t-lg font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            Gestão de Usuários
          </button>
        )}
      </div>

      {/* RENDERIZAÇÃO ABA - GERENCIAMENTO DE REPARTIÇÕES E CATEGORIAS */}
      {activeSubTab === "geral" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* Adicionar Novo Setor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-1">
                <Building2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase font-mono">Incorporar Nova Repartição / Setor</h4>
                  <p className="text-[10px] text-slate-500">Criação de centros de captação e responsabiliade física municipal.</p>
                </div>
              </div>

              {secError && (
                <div className="p-2 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded font-medium">
                  {secError}
                </div>
              )}

              <form onSubmit={handleAddSectorSubmit} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Nome da Repartição *</label>
                    <input
                      type="text"
                      value={secNome}
                      onChange={(e) => setSecNome(e.target.value)}
                      placeholder="Secretaria de Esportes"
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Sigla *</label>
                    <input
                      type="text"
                      value={secSigla}
                      onChange={(e) => setSecSigla(e.target.value)}
                      placeholder="SESPORT"
                      maxLength={10}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white placeholder:text-slate-700 uppercase font-bold text-center"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Líder / Responsável</label>
                    <input
                      type="text"
                      value={secResp}
                      onChange={(e) => setSecResp(e.target.value)}
                      placeholder="Prof. Sergio Antunes"
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">E-mail Ouvidoria</label>
                    <input
                      type="email"
                      value={secEmail}
                      onChange={(e) => setSecEmail(e.target.value)}
                      placeholder="sesport@mun.gov.br"
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Descrição do Atendimento</label>
                  <input
                    type="text"
                    value={secDesc}
                    onChange={(e) => setSecDesc(e.target.value)}
                    placeholder="Supervisao e fomento de praticas esportivas e quadras escolares municipais."
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={userPerfil === "Consulta"}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold py-2 rounded text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Registrar Repartição Ativa
                </button>
              </form>
            </div>
          </div>

          {/* Adicionar Nova Categoria */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-1">
                <FolderLock className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase font-mono">Lançar Novo Grupo Patrimonial (Categoria)</h4>
                  <p className="text-[10px] text-slate-500">Mapeador de taxas anuais periciais de depreciação de bens.</p>
                </div>
              </div>

              {catError && (
                <div className="p-2 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded font-medium">
                  {catError}
                </div>
              )}

              <form onSubmit={handleAddCategorySubmit} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Título do Grupo *</label>
                    <input
                      type="text"
                      value={catNome}
                      onChange={(e) => setCatNome(e.target.value)}
                      placeholder="Mobiliario de Auditorio"
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Abrev Código *</label>
                    <input
                      type="text"
                      value={catCodigo}
                      onChange={(e) => setCatCodigo(e.target.value)}
                      placeholder="MBAUD"
                      maxLength={10}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white text-center uppercase font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Detalhes / Escopo</label>
                    <input
                      type="text"
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      placeholder="Cadeiras acolchoadas, púlpitos e caixas de som de palcos e câmaras"
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Depreciação Anual (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="100"
                      value={catDeprec}
                      onChange={(e) => setCatDeprec(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white font-mono text-center font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={userPerfil === "Consulta"}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold py-2 rounded text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Registrar Categoria de Ativo
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* RENDERIZAÇÃO ABA - BACKUP E RESGUARDO */}
      {activeSubTab === "backup" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                Módulo de Segurança e Contingência (Backup)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Políticas rígidas do município. Exporte a malha ativa municipal como arquivo portátil JSON ou restaure uma versão contingenciada.
              </p>
            </div>

            <div className="flex gap-2">
              
              {/* Exportar arquivo backup */}
              <button
                onClick={handleBackupExport}
                disabled={backupLoading}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Resgatar banco de dados em arquivo JSON"
                id="btn-backup-export"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                {backupLoading ? "Sincronizando..." : "Exportar Cópia (JSON)"}
              </button>

              {/* Restaurar backup */}
              {userPerfil === "Administrador" && (
                <label className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-semibold text-red-500 flex items-center gap-1.5 cursor-pointer" title="Fazer Upload de backup JSON salvo anteriormente">
                  <Upload className="w-3.5 h-3.5" />
                  Carregar Backup (Restore)
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreImport}
                    className="hidden"
                    id="input-file-backup-restore"
                  />
                </label>
              )}

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-400 bg-slate-950/40 p-4 rounded-lg border border-slate-800/60">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-white flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-400" /> Freqüência Semestral</span>
              <p className="text-[10px] text-slate-500">De acordo com a Lei de Responsabilidade Digital Municipal, os backups de integridade cambial de ativos móveis devem ser salvos a cada fechamento contábil.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-white flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Permissão Exclusiva</span>
              <p className="text-[10px] text-slate-500">Apenas perfis do tipo 'Administrador' possuem chaves de descriptografia fortes necessárias para carregar um backup e sobrescrever os audit logs.</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">🔒 Criptoselagem</span>
              <p className="text-[10px] text-slate-500">Os arquivos portados gerados contêm strings SHA-256 geradas pelo Express que validam a integridade dos registros salvos.</p>
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO ABA - GESTÃO EXCLUSIVA DE USUÁRIOS (GERENCIAMENTO ADM) */}
      {activeSubTab === "usuarios" && userPerfil === "Administrador" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Tabela de Usuários (2 Colunas no Grid) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Quadro de Usuários & Perfis Eleitorais
                  </h4>
                  <p className="text-[10px] text-slate-500">Modifique cargos, perfis e controle o acesso de servidores públicos municipais.</p>
                </div>
                <div className="text-[10px] bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-slate-400 font-mono self-start sm:self-center">
                  Total: {filteredUsers.length} de {users.length} cadastros
                </div>
              </div>

              {/* Barra de Filtro de Usuários */}
              <div className="relative">
                <input
                  type="text"
                  value={userSearchText}
                  onChange={(e) => setUserSearchText(e.target.value)}
                  placeholder="Pesquisar por nome, e-mail, perfil ou função municipal..."
                  className="w-full bg-slate-950 border border-slate-850 text-xs rounded-lg p-2 px-3 text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {userLoading && (
                <div className="py-16 flex flex-col justify-center items-center text-slate-500 text-xs font-mono space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span>Sincronizando operadores da Prefeitura...</span>
                </div>
              )}

              {!userLoading && filteredUsers.length === 0 && (
                <div className="py-16 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                  Nenhum usuário correspondente aos filtros foi localizado no município.
                </div>
              )}

              {!userLoading && filteredUsers.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-mono uppercase text-[9px] tracking-widest">
                        <th className="py-3 pb-2 font-bold">Colaborador / E-mail</th>
                        <th className="py-3 pb-2 font-bold">Cargo & Repartição</th>
                        <th className="py-3 pb-2 text-center font-bold">Nível / Perfil</th>
                        <th className="py-3 pb-2 text-center font-bold">Estado</th>
                        <th className="py-3 pb-2 text-right font-bold">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-850/20 transition-colors group">
                          <td className="py-3 pr-2">
                            <div className="font-bold text-slate-200 flex items-center gap-1.5">
                              {u.nome}
                              {u.perfil === "Administrador" && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                          </td>
                          <td className="py-3 pr-2 text-slate-400">
                            <span className="font-medium">{u.cargo}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono border font-semibold ${
                              u.perfil === "Administrador"
                                ? "bg-blue-950/40 border-blue-500/35 text-blue-400"
                                : u.perfil === "Operador"
                                ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-300"
                                : "bg-slate-950/65 border-slate-800 text-slate-400"
                            }`}>
                              {u.perfil}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                              u.ativo
                                ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-950/30 text-red-400 border border-red-500/20"
                            }`}>
                              {u.ativo ? "Sim" : "Não"}
                            </span>
                          </td>
                          <td className="py-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleEditUserClick(u)}
                              className="p-1 px-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-blue-400 rounded-md cursor-pointer inline-flex items-center gap-1 transition-all"
                              title="Editar dados cadastrais"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span className="text-[10px] font-mono">Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUserClick(u)}
                              className="p-1 px-1.5 bg-slate-950 hover:bg-red-950 border border-slate-800 hover:border-red-950 text-slate-500 hover:text-red-400 rounded-md cursor-pointer transition-all"
                              title="Expurgar Usuário"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Formulário de Usuários (1 Coluna no Grid) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between" id="usr-form-panel">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 mb-1">
                <UserPlus className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase font-mono">
                    {editingUserId ? "Alterar Credencial" : "Selo de Novo Usuário"}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {editingUserId ? "Editando permissões de acesso e dados." : "Emissão de novas credenciais autorizadas pelo município."}
                  </p>
                </div>
              </div>

              {userErrorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-xl font-medium">
                  {userErrorMsg}
                </div>
              )}

              {userSuccessMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-medium">
                  {userSuccessMsg}
                </div>
              )}

              <form onSubmit={handleUserSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Nome Completo *</label>
                  <input
                    type="text"
                    value={usrNome}
                    onChange={(e) => setUsrNome(e.target.value)}
                    placeholder="Servidor Joaquim Santana"
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">E-mail de Acesso *</label>
                  <input
                    type="email"
                    value={usrEmail}
                    onChange={(e) => setUsrEmail(e.target.value)}
                    placeholder="joaquim@patrimonio.gov.br"
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Cargo *</label>
                    <input
                      type="text"
                      value={usrCargo}
                      onChange={(e) => setUsrCargo(e.target.value)}
                      placeholder="Técnico Administrativo"
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono font-bold">Perfil *</label>
                    <select
                      value={usrPerfil}
                      onChange={(e) => setUsrPerfil(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none font-bold"
                    >
                      <option value="Consulta">Consulta</option>
                      <option value="Operador">Operador</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                    {editingUserId ? "Senha (vazio para manter atual)" : "Chave / Senha Inicial *"}
                  </label>
                  <input
                    type="password"
                    value={usrSenha}
                    onChange={(e) => setUsrSenha(e.target.value)}
                    placeholder={editingUserId ? "•••••••• (nova senha opcional)" : "Mínimo de 6 dígitos"}
                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-2 text-white focus:outline-none font-mono"
                    required={!editingUserId}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 pb-1">
                  <input
                    type="checkbox"
                    id="usrAtivo"
                    checked={usrAtivo}
                    onChange={(e) => setUsrAtivo(e.target.checked)}
                    className="bg-slate-950 border border-slate-800 text-blue-600 rounded cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="usrAtivo" className="text-[10px] font-bold text-slate-400 font-mono tracking-wider cursor-pointer select-none uppercase">
                    Credencial em Estado Ativo
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={resetUserForm}
                      className="flex-grow bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 font-semibold py-2 rounded-lg text-xs text-center cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-grow bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 text-white font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {editingUserId ? "Atualizar" : "Salvar Usuário"}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
