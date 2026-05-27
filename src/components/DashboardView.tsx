import React from "react";
import {
  Boxes,
  Activity,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Users
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { DashboardStats } from "../types";

interface DashboardViewProps {
  stats: DashboardStats | null;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({ stats, onNavigateToTab }: DashboardViewProps) {
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Activity className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="font-medium text-sm">Carregando métricas e relatórios patrimoniais...</p>
      </div>
    );
  }

  // Cores institucionais do governo municipal
  const COLORS_CONSERVATION = {
    "Ótimo": "#059669",     // emerald-600
    "Bom": "#2563eb",       // blue-600
    "Regular": "#d97706",   // amber-600
    "Ruim": "#ea580c",      // orange-600
    "Inservível": "#dc2626"  // red-600
  };

  const CATEGORY_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6"];

  // Formata os dados de conservação para o PieChart
  const dataConservation = Object.entries(stats.estados).map(([key, val]) => ({
    name: key,
    value: val
  })).filter(item => item.value > 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  return (
    <div className="space-y-6" id="dashboard-view-body">
      {/* Cards de Métricas Rápidas (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total de Bens */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-blue-500/30 transition-all flex items-center justify-between group">
          <div className="text-left">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">Tombamentos Ativos</span>
            <h4 className="text-3xl font-light text-white mt-1 group-hover:text-blue-400 transition-colors">
              {stats.totalPatrimonios}
            </h4>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 h-3" /> {stats.bensAtivos} ativos em carga
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Patrimônio Líquido Estimado */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-emerald-500/30 transition-all flex items-center justify-between group">
          <div className="text-left">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">Valoração Global</span>
            <h4 className="text-[22px] font-light text-emerald-400 mt-1.5 truncate">
              {formatCurrency(stats.valorTotalAcumulado)}
            </h4>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              Ativos Líquidos Auditados
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Itens Danificados ou Críticos */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-amber-500/30 transition-all flex items-center justify-between group">
          <div className="text-left">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">Laudos Críticos</span>
            <h4 className="text-3xl font-light text-amber-500 mt-1">
              {stats.itensCriticos}
            </h4>
            <div className="text-[10px] text-amber-400/80 font-semibold mt-1 font-mono">
              Ruins & Inservíveis
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Bens Inativos ou Baixados */}
        <div className="ring-1 ring-blue-500/30 bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-blue-500/50 transition-all flex items-center justify-between group">
          <div className="text-left">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">Aguardando Baixa</span>
            <h4 className="text-3xl font-light text-slate-300 mt-1">
              {stats.bensInativos}
            </h4>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Bens desincorporados
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Gráficos de Alta Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribuição por Setor Administrativo */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col">
          <div className="mb-4 text-left">
            <h5 className="text-sm font-bold text-slate-200">Volume Patrimonial por Secretaria / Setor</h5>
            <p className="text-[11px] text-slate-400">Total físico e quantitativo de bens móveis por sigla de setor municipal</p>
          </div>
          <div className="h-64 mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.porSetor || []} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="setor" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                  labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
                  itemStyle={{ color: "#3b82f6" }}
                />
                <Bar dataKey="quantidade" fill="#2563eb" radius={[4, 4, 0, 0]} name="Qtd Bens" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado de Conservação Físico */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col">
          <div className="mb-4 text-left">
            <h5 className="text-sm font-bold text-slate-200">Condição de Conservação Física</h5>
            <p className="text-[11px] text-slate-400">Proporção relativa de bens de acordo com o laudo pericial</p>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-around h-64">
            {dataConservation.length === 0 ? (
              <span className="text-slate-400 text-xs">Sem registros suficientes para gráficos</span>
            ) : (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataConservation}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {dataConservation.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS_CONSERVATION[entry.name as keyof typeof COLORS_CONSERVATION] || "#3b82f6"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                        itemStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-2 p-2">
                  {dataConservation.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              COLORS_CONSERVATION[item.name as keyof typeof COLORS_CONSERVATION] || "#3b82f6"
                          }}
                        />
                        <span className="font-medium text-slate-300">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-100">{item.value} {item.value === 1 ? 'bem' : 'bens'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Grid Secundário: Tabela de Setores Auditados & Movimentações Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Setores e sua Valoração Ativa */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl lg:col-span-1 text-left flex flex-col">
          <div className="mb-3">
            <h5 className="text-sm font-bold text-slate-200">Setores Municipais</h5>
            <p className="text-[11px] text-slate-400">Valoração calculada por departamento cadastrado</p>
          </div>
          <div className="divide-y divide-slate-800 overflow-y-auto max-h-72 flex-1">
            {stats.porSetor?.map(set => (
              <div key={set.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-extrabold text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/30 font-mono mr-2">
                    {set.setor}
                  </span>
                  <span className="text-slate-300 hover:text-white transition-colors truncate max-w-[140px] inline-block align-middle" title={set.nome}>
                    {set.nome}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-200">{formatCurrency(set.valor)}</div>
                  <div className="text-[9px] text-slate-500">{set.quantidade} itens ativos</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas Movimentações */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl lg:col-span-2 text-left flex flex-col">
          <div className="mb-3 flex justify-between items-center">
            <div>
              <h5 className="text-sm font-bold text-slate-200">Movimentações Físicas Recentes</h5>
              <p className="text-[11px] text-slate-400">Histórico fiscal de mudanças de departamentos de bens móveis</p>
            </div>
            <button
              onClick={() => onNavigateToTab("transferencias")}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline cursor-pointer font-medium"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto flex-1 max-h-72">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 font-medium">Patrimônio / Bem</th>
                  <th className="py-2.5 font-medium">Origem ➔ Destino</th>
                  <th className="py-2.5 font-medium">Operador Responsável</th>
                  <th className="py-2.5 font-medium text-right">Data / Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.ultimasMovimentacoes?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Nenhuma movimentação municipal homologada recentemente.
                    </td>
                  </tr>
                ) : (
                  stats.ultimasMovimentacoes?.map(mov => (
                    <tr key={mov.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3">
                        <div className="font-bold text-slate-200">{mov.codigo}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{mov.patrimonioDesc}</div>
                      </td>
                      <td className="py-3 font-mono">
                        <span className="text-slate-400">{mov.origem}</span>
                        <span className="mx-1 text-slate-600">➔</span>
                        <span className="text-blue-400 font-bold">{mov.destino}</span>
                      </td>
                      <td className="py-3">
                        <div className="text-slate-300 font-medium">{mov.usuario}</div>
                        <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{mov.motivo}</div>
                      </td>
                      <td className="py-3 text-right text-slate-400 font-mono">
                        {new Date(mov.data).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
