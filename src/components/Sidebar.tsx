import React from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  FileText,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Lock,
  UserCheck
} from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  collapsed,
  setCollapsed
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Painel Principal", icon: LayoutDashboard, roles: ["Administrador", "Operador", "Consulta"] },
    { id: "patrimonios", label: "Gestão de Bens", icon: Boxes, roles: ["Administrador", "Operador", "Consulta"] },
    { id: "transferencias", label: "Guia de Transferência", icon: ArrowLeftRight, roles: ["Administrador", "Operador", "Consulta"] },
    { id: "relatorios", label: "Relatórios & Planilhas", icon: FileText, roles: ["Administrador", "Operador", "Consulta"] },
    { id: "auditoria", label: "Trilha de Auditoria", icon: ShieldAlert, roles: ["Administrador", "Consulta"] },
    { id: "configuracoes", label: "Setores & Ajustes", icon: Settings, roles: ["Administrador", "Operador"] }
  ];

  const allowedItems = menuItems.filter(item => {
    if (!user) return false;
    return item.roles.includes(user.perfil);
  });

  return (
    <motion.aside
      className={`bg-slate-900 border-r border-slate-800 text-white flex flex-col h-screen h-full shrink-0 relative transition-transform duration-300 z-10`}
      animate={{ width: collapsed ? 72 : 260 }}
    >
      {/* Cabeçalho do Órgão Público */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800 h-16 min-h-16 overflow-hidden">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm shrink-0">
              P
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm tracking-tight text-slate-100">
                SIGEP <span className="text-blue-500 underline decoration-2">MUNICIPAL</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">Controle de Ativos</span>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm mx-auto" id="sidebar-logo-collapsed">
            P
          </div>
        )}
        
        {/* Botão de Fechar/Retrair */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-5 bg-slate-800 hover:bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center border border-slate-700 text-white cursor-pointer z-20"
          id="btn-collapse-sidebar"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Info do Usuário Conectado */}
      {user && !collapsed && (
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm">
              {user.nome.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col text-left truncate">
              <span className="font-medium text-xs text-slate-200 truncate">{user.nome}</span>
              <span className="text-[10px] text-slate-400 truncate">{user.cargo}</span>
              <div className="flex items-center gap-1 mt-1">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/40 px-1 rounded border border-emerald-900/30">
                  {user.perfil}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegação Principal */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {allowedItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              onClick={() => setActiveTab(item.id)}
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all relative ${
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
              }`}
              id={`nav-link-${item.id}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <div className="overflow-hidden whitespace-nowrap text-left">
                {!collapsed && item.label}
              </div>
              {isActive && !collapsed && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute right-2 w-1.5 h-1.5 rounded-full bg-slate-100"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Rodapé do Sidebar */}
      <div className="p-3 border-t border-slate-800 mt-auto bg-slate-950/40">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-md transition-all active:scale-[0.98]"
          id="btn-sidebar-logout"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <div className="overflow-hidden whitespace-nowrap text-left">
            {!collapsed && "Finalizar Sessão"}
          </div>
        </button>
        {!collapsed && (
          <div className="mt-3 text-center">
            <span className="text-[10px] text-slate-500 font-mono">Versão 2.4.0 (Abertura)</span>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
