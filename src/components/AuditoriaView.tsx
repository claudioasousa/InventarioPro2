import React, { useState } from "react";
import { ShieldAlert, Search, Shield, User, Clock, Network, Filter } from "lucide-react";
import { Auditoria } from "../types";

interface AuditoriaViewProps {
  auditorias: Auditoria[];
}

export default function AuditoriaView({ auditorias }: AuditoriaViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("");

  // Categorias de auditoria mapeadas
  const distinctActions = Array.from(new Set(auditorias.map(a => a.acao)));

  const filteredLogs = auditorias.filter(log => {
    const textMatch =
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalhes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchTerm.toLowerCase());

    const actionMatch = selectedAction ? log.acao === selectedAction : true;

    return textMatch && actionMatch;
  });

  return (
    <div className="space-y-6 text-left" id="auditoria-view-main">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            Trilha de Auditoria e Logs do Sistema
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registro cronológico provido por assinatura eletrônica governamental, auditando toda movimentação e alteração de bens patrimoniais.
          </p>
        </div>
        <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hidden md:block">
          <Shield className="w-6 h-6" />
        </div>
      </div>

      {/* Caixa de Pesquisa e Filtros */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-900 p-4 border border-slate-800 rounded-xl">
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 py-0 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por Operador, Detalhes ou Ação..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-blue-500/40 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 max-w-sm w-full">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40"
          >
            <option value="">-- Todas as Operações --</option>
            {distinctActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Tabela de Trilha de Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 text-left">
          <h3 className="text-xs font-bold font-mono uppercase text-slate-400">Termos de Registro e Segurança Governamentais</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-950/20">
                <th className="p-4 font-semibold">Horário / Registro</th>
                <th className="p-4 font-semibold">Operante (Email)</th>
                <th className="p-4 font-semibold">Ação Fiscal</th>
                <th className="p-4 font-semibold">Detalhamento da Operação</th>
                <th className="p-4 font-semibold text-right">Origem IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500">
                    Nenhum log municipal de segurança localizado com estes filtros.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  let accentColor = "text-slate-300 bg-slate-800/40 border-slate-700";
                  if (log.acao.includes("LOGIN")) accentColor = "text-blue-400 bg-blue-950/40 border-blue-900/40";
                  if (log.acao.includes("FALHA")) accentColor = "text-red-400 bg-red-950/40 border-red-900/40";
                  if (log.acao.includes("CREAR") || log.acao.includes("CRIAR")) accentColor = "text-emerald-400 bg-emerald-950/40 border-emerald-900/40";
                  if (log.acao.includes("EXCLUIR")) accentColor = "text-rose-400 bg-red-950/40 border-red-900/40";
                  if (log.acao.includes("TRANSFER")) accentColor = "text-amber-400 bg-amber-950/40 border-amber-900/40";

                  return (
                    <tr key={log.id} className="hover:bg-slate-850/40 transition-colors">
                      {/* Timestamp */}
                      <td className="p-4 text-slate-400 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.dataRegistro).toLocaleString("pt-BR")}</span>
                        </div>
                      </td>

                      {/* Operante */}
                      <td className="p-4 font-mono font-bold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{log.userEmail}</span>
                        </div>
                      </td>

                      {/* Ação */}
                      <td className="p-4 font-mono">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold ${accentColor}`}>
                          {log.acao}
                        </span>
                      </td>

                      {/* Detalhes */}
                      <td className="p-4 text-slate-300 font-medium leading-relaxed max-w-sm">
                        {log.detalhes}
                      </td>

                      {/* IP de Origem */}
                      <td className="p-4 text-right text-slate-500 font-mono text-[10px]">
                        <div className="flex items-center justify-end gap-1">
                          <Network className="w-3 h-3 text-slate-600" />
                          <span>{log.ipOrigem || "192.168.10.42"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
