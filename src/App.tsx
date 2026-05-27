import React, { useState, useEffect } from "react";
import {
  Bell,
  Landmark,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  LogOut,
  Calendar,
  Clock,
  Menu,
  X,
  UserCheck
} from "lucide-react";
import {
  User,
  Sector,
  Category,
  Patrimonio,
  Movimentacao,
  Auditoria,
  AppNotification,
  DashboardStats
} from "./types";
import { ApiClient } from "./api";
import Sidebar from "./components/Sidebar";
import LoginScreen from "./components/LoginScreen";
import DashboardView from "./components/DashboardView";
import PatrimonioView from "./components/PatrimonioView";
import TransferenciaView from "./components/TransferenciaView";
import RelatoriosView from "./components/RelatoriosView";
import AuditoriaView from "./components/AuditoriaView";
import ConfiguracoesView from "./components/ConfiguracoesView";
import DesfazimentoView from "./components/DesfazimentoView";

export default function App() {
  // Estados Principais de Autenticação e Navegação
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Estados das Coleções Municipais
  const [patrimonios, setPatrimonios] = useState<Patrimonio[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Estados Auxiliares de Notificação
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverError, setServerError] = useState("");

  // Relógio ativo para formalidade governamental
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Relógio que atualiza a cada segundo
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString("pt-BR", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Inicialização e Redirecionamento da Sessão Ativa
  useEffect(() => {
    const initApp = async () => {
      const savedToken = localStorage.getItem("patrimonio_token");
      if (savedToken) {
        try {
          const verify = await ApiClient.me();
          setUser(verify.user);
          await loadAllData();
        } catch (err: any) {
          console.error("Sessão persistida expirada ou offline.", err);
          handleLogout();
        } finally {
          setInitialLoading(false);
        }
      } else {
        setInitialLoading(false);
      }
    };
    initApp();
  }, []);

  // Carga paralela de dados (Performance Otimizada)
  const loadAllData = async () => {
    setServerError("");
    try {
      const [bens, s, c, m, n, st] = await Promise.all([
        ApiClient.getPatrimonios(),
        ApiClient.getSectors(),
        ApiClient.getCategories(),
        ApiClient.getMovimentacoes(),
        ApiClient.getNotifications(),
        ApiClient.getDashboardStats()
      ]);

      setPatrimonios(bens);
      setSectors(s);
      setCategories(c);
      setMovimentacoes(m);
      setNotifications(n);
      setStats(st);

      // Carrega auditorias se o nível de acesso permitir
      const savedUser = verifyUserRole();
      if (savedUser === "Administrador" || savedUser === "Consulta") {
        const audit = await ApiClient.getAuditorias();
        setAuditorias(audit);
      }
    } catch (err: any) {
      console.error("Falha ao sincronizar dados com o banco do município.", err);
      // Tentamos novamente após pequeno delay ou guardamos erro amigável para o painel
      setServerError("Inabilidade temporária de sincronização síncrona com o servidor municipal. Caso acabe de iniciar, aguarde o emparelhamento.");
    }
  };

  const verifyUserRole = () => {
    if (user) return user.perfil;
    const email = localStorage.getItem("patrimonio_email") || "";
    if (email.includes("admin")) return "Administrador";
    if (email.includes("operador")) return "Operador";
    return "Consulta";
  };

  // Callbacks de Comunicação dos Módulos à API

  const handleLoginSuccess = async (token: string, userLogged: User) => {
    localStorage.setItem("patrimonio_token", token);
    localStorage.setItem("patrimonio_email", userLogged.email);
    setUser(userLogged);
    setInitialLoading(true);
    try {
      await loadAllData();
    } catch (e) {
      // Ignora erro e deixa fluir
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("patrimonio_token");
    localStorage.removeItem("patrimonio_email");
    setUser(null);
    setPatrimonios([]);
    setMovimentacoes([]);
    setNotifications([]);
    setStats(null);
    setActiveTab("dashboard");
  };

  const handleLoginAttempt = async (email: string, pass: string) => {
    return ApiClient.login(email, pass);
  };

  const handlePasswordRecovery = async (email: string) => {
    return ApiClient.recovery(email).then(r => r.message);
  };

  const handleAddPatrimonio = async (data: Partial<Patrimonio>) => {
    await ApiClient.createPatrimonio(data);
    await loadAllData();
  };

  const handleEditPatrimonio = async (id: number, data: Partial<Patrimonio> & { motivoMovimentacao?: string }) => {
    await ApiClient.updatePatrimonio(id, data);
    await loadAllData();
  };

  const handleDeletePatrimonio = async (id: number) => {
    await ApiClient.deletePatrimonio(id);
    await loadAllData();
  };

  const handleTransfer = async (patrimonioId: number, sectorId: number, motive: string, obs?: string) => {
    await ApiClient.transferPatrimonio(patrimonioId, sectorId, motive, obs);
    await loadAllData();
  };

  const handleAddSector = async (data: Partial<Sector>) => {
    await ApiClient.createSector(data);
    await loadAllData();
  };

  const handleAddCategory = async (data: Partial<Category>) => {
    await ApiClient.createCategory(data);
    await loadAllData();
  };

  const handleImportExcel = async (itens: any[]) => {
    const res = await ApiClient.importPlanilha(itens);
    await loadAllData();
    return res;
  };

  const handleExportBackup = async () => {
    return ApiClient.exportBackup();
  };

  const handleRestoreBackup = async (data: any) => {
    const res = await ApiClient.restoreBackup(data);
    await loadAllData();
    return res;
  };

  const handleReadAllNotifications = async () => {
    try {
      await ApiClient.readAllNotifications();
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    } catch (e) {
      // Falha silenciosa
    }
  };

  // Contagem de alertas não lidos no cabeçalho
  const unreadNotificationsCount = notifications.filter(n => !n.lida).length;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-300 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <h4 className="font-extrabold text-sm tracking-wider text-white">SISTEMA DE PATRIMÔNIO</h4>
          <p className="text-xs text-slate-500 font-mono mt-1">Carregando chaves e assinaturas eletrônicas...</p>
        </div>
      </div>
    );
  }

  // Redireciona para o portal se não estiver logado
  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onLoginAttempt={handleLoginAttempt}
        onPasswordRecovery={handlePasswordRecovery}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden" id="sys-patrimonio-viewport">
      
      {/* 1. Sidebar de navegação */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      {/* Menu sanduíche responsivo para telas pequenas */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-blue-500" />
              <span className="font-bold text-sm">SisPatrimônio Mobile</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 space-y-3 text-left">
            {[
              { id: "dashboard", label: "Dashboard", role: ["Administrador", "Operador", "Comissão", "Operador Patrimonial", "Consulta"] },
              { id: "patrimonios", label: "Gestão Ativos", role: ["Administrador", "Operador", "Comissão", "Operador Patrimonial", "Consulta"] },
              { id: "transferencias", label: "Transferências", role: ["Administrador", "Operador", "Comissão", "Operador Patrimonial", "Consulta"] },
              { id: "desfazimentos", label: "Desfazimento", role: ["Administrador", "Operador", "Comissão", "Operador Patrimonial", "Consulta"] },
              { id: "relatorios", label: "Fichas & Relatórios", role: ["Administrador", "Operador", "Comissão", "Operador Patrimonial", "Consulta"] },
              { id: "auditoria", label: "Logs de Auditoria", role: ["Administrador", "Consulta", "Comissão"] },
              { id: "configuracoes", label: "Sectores & Ajustes", role: ["Administrador", "Operador", "Operador Patrimonial"] }
            ]
              .filter(item => item.role.includes(user.perfil))
              .map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-3 rounded-lg text-sm text-left font-bold ${
                    activeTab === item.id ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-950/40 text-red-400 py-3 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer border border-red-900/30 mt-auto"
          >
            <LogOut className="w-5 h-5" /> Sair da Conta
          </button>
        </div>
      )}

      {/* 2. Área principal de visualização */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative pb-10">
        
        {/* Topbar / Cabeçalho Principal */}
        <header className="bg-slate-900 border-b border-slate-800 h-16 min-h-16 flex items-center justify-between px-6 shrink-0 z-10 no-print">
          
          {/* Lado Esquerdo: Título do Tab e Mobile Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 bg-slate-850 rounded border border-slate-700 text-slate-300 hover:text-white md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-left hidden sm:block">
              <h1 className="text-sm font-extrabold text-white uppercase tracking-tight font-mono">
                {activeTab === "dashboard" && "PAINEL DE AUDITORIA PATRIMONIAL"}
                {activeTab === "patrimonios" && "PESQUISA DE BENS MÓVEIS"}
                {activeTab === "transferencias" && "MÓDULO DE REMANEJAMENTO"}
                {activeTab === "desfazimentos" && "DESFAZIMENTO PATRIMONIAL"}
                {activeTab === "relatorios" && "TERMOS E BALANÇOS FISCAIS"}
                {activeTab === "auditoria" && "LOGS DE CRIPTOGRAFIA DE DADOS"}
                {activeTab === "configuracoes" && "REPARTIÇÕES & ATIVOS"}
              </h1>
              <p className="text-[10px] text-slate-400 font-sans tracking-wide">
                Instituído de acordo com decretos federais municipais
              </p>
            </div>
          </div>

          {/* Lado Direito: Notificações, Tempo Eletrônico, Conta */}
          <div className="flex items-center gap-4">
            
            {/* Relógio em tempo real do painel */}
            <div className="hidden lg:flex items-center gap-2 text-slate-400 font-mono text-xs bg-slate-950/50 border border-slate-800/80 px-3 py-1.5 rounded-lg select-all">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{currentTime}</span>
            </div>

            {/* Alerta de sincronização se houver */}
            <div className="hidden md:flex items-center gap-1.5 text-emerald-400 font-mono text-[9px] font-bold bg-emerald-950/30 border border-emerald-900/30 px-2 py-1 rounded">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span>● CONSTRUTIVO ATIVO</span>
            </div>

            {/* Central de Notificações */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationCenter(!showNotificationCenter);
                  if (unreadNotificationsCount > 0) {
                    handleReadAllNotifications();
                  }
                }}
                className={`p-2 rounded-lg border transition-all cursor-pointer relative ${
                  unreadNotificationsCount > 0
                    ? "bg-amber-950/20 border-amber-500/40 text-amber-400"
                    : "bg-slate-850 border-slate-800 text-slate-400 hover:text-white"
                }`}
                title="Quadro Informativo e Alertas"
                id="btn-bell-notification"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Caixa suspensa da Central de Notificações */}
              {showNotificationCenter && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-40 text-left animate-fadeIn">
                  <div className="p-3 bg-slate-950/80 border-b border-slate-850 flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase font-mono">Quadro de Notificações</span>
                    <button
                      onClick={() => setShowNotificationCenter(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        Nenhuma notificação encontrada no sistema patrimonial.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs flex gap-2 items-start hover:bg-slate-850/40 transition-colors ${
                            !notif.lida ? "bg-blue-950/10" : ""
                          }`}
                        >
                          <div className={`p-1.5 rounded shrink-0 ${
                            notif.tipo === "alert" ? "bg-red-500/10 text-red-400" :
                            notif.tipo === "transfer" ? "bg-blue-500/10 text-blue-400" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-200 block">{notif.titulo}</span>
                            <span className="text-slate-400 text-[10px] mt-0.5 block leading-tight">{notif.mensagem}</span>
                            <span className="text-slate-500 text-[9px] font-mono mt-1 block">
                              {new Date(notif.data).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-slate-950/40 text-center border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowNotificationCenter(false);
                      }}
                      className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                    >
                      Fechar Quadro
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Resumo rápido do Perfil no Topo */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 select-none">
                {user.nome.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left max-w-[110px] truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">{user.nome}</div>
                <div className="text-[9px] font-mono text-slate-500 truncate lowercase">{user.email}</div>
              </div>
            </div>

          </div>

        </header>

        {/* Ligar Alerta de Erro de Rede caso o Servidor Express não esteja 100% */}
        {serverError && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-950/20 border border-amber-500/40 text-amber-300 text-xs rounded-xl text-left leading-relaxed font-sans">
            <span className="font-bold underline block mb-0.5">Aviso do Processamento Local</span>
            {serverError}
          </div>
        )}

        {/* 3. Renderização Condicional da Tab Ativa */}
        <main className="p-6 flex-1 max-w-7xl mx-auto w-full">
          
          {activeTab === "dashboard" && (
            <DashboardView
              stats={stats}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === "patrimonios" && (
            <PatrimonioView
              patrimonios={patrimonios}
              sectors={sectors}
              categories={categories}
              userPerfil={user.perfil}
              onAddPatrimonio={handleAddPatrimonio}
              onEditPatrimonio={handleEditPatrimonio}
              onDeletePatrimonio={handleDeletePatrimonio}
              onImportExcel={handleImportExcel}
              onTransfer={handleTransfer}
            />
          )}

          {activeTab === "transferencias" && (
            <TransferenciaView
              movimentacoes={movimentacoes}
              patrimonios={patrimonios}
              sectors={sectors}
              userPerfil={user.perfil}
              onTransfer={handleTransfer}
            />
          )}

          {activeTab === "desfazimentos" && (
            <DesfazimentoView
              patrimonios={patrimonios}
              categories={categories}
              userPerfil={user.perfil}
            />
          )}

          {activeTab === "relatorios" && (
            <RelatoriosView
              patrimonios={patrimonios}
              sectors={sectors}
              categories={categories}
              movimentacoes={movimentacoes}
            />
          )}

          {activeTab === "auditoria" && (
            <AuditoriaView
              auditorias={auditorias}
            />
          )}

          {activeTab === "configuracoes" && (
            <ConfiguracoesView
              sectors={sectors}
              categories={categories}
              userPerfil={user.perfil}
              onAddSector={handleAddSector}
              onAddCategory={handleAddCategory}
              onExportBackup={handleExportBackup}
              onRestoreBackup={handleRestoreBackup}
            />
          )}

        </main>

      </div>

    </div>
  );
}
