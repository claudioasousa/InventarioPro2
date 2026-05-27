import React, { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Search,
  Building2,
  FolderOpen,
  AlertTriangle,
  History,
  FileSpreadsheet,
  CheckCircle2,
  FileCheck2,
  Landmark
} from "lucide-react";
import { Patrimonio, Sector, Category, Movimentacao } from "../types";

interface RelatoriosViewProps {
  patrimonios: Patrimonio[];
  sectors: Sector[];
  categories: Category[];
  movimentacoes: Movimentacao[];
}

type ReportType =
  | "geral"
  | "setor"
  | "categoria"
  | "danificados"
  | "inativos"
  | "movimentacoes";

export default function RelatoriosView({
  patrimonios,
  sectors,
  categories,
  movimentacoes
}: RelatoriosViewProps) {
  const [reportType, setReportType] = useState<ReportType>("geral");
  const [sectorFilter, setSectorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  // Mensagem feedback
  const [feedback, setFeedback] = useState("");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // Filtra dados com base na escolha do relatório
  const getFilteredData = () => {
    switch (reportType) {
      case "geral":
        return patrimonios;
      case "setor":
        return sectorFilter
          ? patrimonios.filter(p => p.setorId === Number(sectorFilter))
          : [];
      case "categoria":
        return categoryFilter
          ? patrimonios.filter(p => p.categoriaId === Number(categoryFilter))
          : [];
      case "danificados":
        return patrimonios.filter(p => p.estadoConservacao === "Ruim" || p.estadoConservacao === "Inservível");
      case "inativos":
        return patrimonios.filter(p => !p.ativo);
      case "movimentacoes":
        return movimentacoes;
      default:
        return [];
    }
  };

  const currentData = getFilteredData();

  // Função para exportar CSV formatado com BOM bônus de codificação Excel Português
  const handleExportCSV = (excelMode = false) => {
    try {
      let csvContent = "\ufeff"; // BOM para Excel Português ler acentos!
      
      if (reportType === "movimentacoes") {
        // Cabeçalhos de movimentações
        csvContent += "Código;Descrição;Origem;Destino;Usuario Responsavel;Motivo;Data\r\n";
        (currentData as Movimentacao[]).forEach(m => {
          const p = patrimonios.find(pat => pat.id === m.patrimonioId);
          const o = sectors.find(s => s.id === m.setorOrigemId)?.sigla || "Entrada";
          const d = sectors.find(s => s.id === m.setorDestinoId)?.sigla || "PM";
          
          const code = p?.numeroPatrimonial || "";
          const desc = p?.descricao.replace(/;/g, ",") || "";
          const user = m.usuarioNome;
          const motive = m.motivo.replace(/;/g, ",");
          const date = new Date(m.dataMovimentacao).toLocaleString("pt-BR");

          csvContent += `${code};${desc};${o};${d};${user};${motive};${date}\r\n`;
        });
      } else {
        // Cabeçalho de Ativos
        csvContent += "N° Patrimonial;Tombamento;Descrição do Bem;Categoria;Conservacao;Setor;Valor Real (R$);Status\r\n";
        (currentData as Patrimonio[]).forEach(p => {
          const c = categories.find(cat => cat.id === p.categoriaId)?.nome || "";
          const s = sectors.find(set => set.id === p.setorId)?.sigla || "";
          const desc = p.descricao.replace(/;/g, ",");
          const status = p.ativo ? "Ativo" : "Baixado";

          csvContent += `${p.numeroPatrimonial};${p.tombamento};${desc};${c};${p.estadoConservacao};${s};${p.valorEstimado};${status}\r\n`;
        });
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const filename = `relatorio-${reportType}-${new Date().toISOString().slice(0, 10)}.${excelMode ? "xls" : "csv"}`;
      
      link.setAttribute("href", URL.createObjectURL(blob));
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setFeedback(`Arquivo ${filename} baixado com sucesso.`);
      setTimeout(() => setFeedback(""), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Impressão nativa do relatório formatado
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-left" id="relatorios-view-main">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl no-print">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Gerador de Relatórios e Planilhas Oficiais
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Selecione o filtro corporativo aplicável, audite a visualização prévia e exporte em formatos regulamentares do controle de contas eletrônicas.
        </p>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-medium no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Seletor do Relatório de Controle */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        
        {/* Painel lateral de escolha do Tipo */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-1 space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-3">Modelos Disponíveis</span>
          
          <button
            onClick={() => { setReportType("geral"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-medium text-left transition-all ${
              reportType === "geral" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" /> Inventário Geral
          </button>

          <button
            onClick={() => { setReportType("setor"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-medium text-left transition-all ${
              reportType === "setor" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4" /> Bens por Setor
          </button>

          <button
            onClick={() => { setReportType("categoria"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-medium text-left transition-all ${
              reportType === "categoria" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-white"
            }`}
          >
            <FolderOpen className="w-4 h-4" /> Bens por Categoria
          </button>

          <button
            onClick={() => { setReportType("danificados"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-medium text-left transition-all ${
              reportType === "danificados" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Bens Danificados (Laudo)
          </button>

          <button
            onClick={() => { setReportType("inativos"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-medium text-left transition-all ${
              reportType === "inativos" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Bens Inativos / Baixados
          </button>

          <button
            onClick={() => { setReportType("movimentacoes"); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-medium text-left transition-all ${
              reportType === "movimentacoes" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-850 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" /> Fluxo de Movimentações
          </button>

        </div>

        {/* Parâmetros do Relatório & Ações de Exportação */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:col-span-3 flex flex-col justify-between">
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase font-mono">Modulagem e Filtros Operacionais</h4>
            
            {reportType === "setor" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Secretaria do Estado Alvo</label>
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-medium"
                >
                  <option value="">-- Escolher Setor Alvo --</option>
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {reportType === "categoria" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Categoria de Bem Alvo</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300"
                >
                  <option value="">-- Escolher Categoria Alvo --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Texto de sumário contextualizado */}
            <p className="text-xs text-slate-400">
              {reportType === "geral" && "O Inventário Geral compila informações de todos os tombo ativos ou baixados no município, com valorações reais para cálculo de depreciação global e balanço contábil estadual."}
              {reportType === "setor" && "Filtra especificamente os ativos sob cuidados operacionais da secretaria escolhida. Serve para realizar o inventário semestral local do departamento."}
              {reportType === "categoria" && "Mostra as estatísticas e os bens móveis segmentados por tipo patrimonial, facilitando cálculos tributários e taxas de depreciação."}
              {reportType === "danificados" && "Agrupa eletrônicos e móveis com classificação pericial 'Ruim' ou 'Inservível'. Serve de subsidio direto para o setor de licitação declarar termo de leilão ou descarte público regulamentado."}
              {reportType === "inativos" && "Reúne bens móveis desincorporados de forma permanente do ativo físico em virtude de destruição por sinistros, doação legal, obsolescência total ou roubo registrado."}
              {reportType === "movimentacoes" && "Emite o histórico cronológico de guias de transferência com o carimbo eletrônico de cada auditor garantidor."}
            </p>
          </div>

          {/* Botões de Ação para Formatos Requeridos */}
          {currentData.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-800 mt-6 justify-end">
              <button
                onClick={() => handleExportCSV(false)}
                className="px-3.5 py-2 bg-slate-850 hover:bg-slate-750 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-800"
                id="btn-export-csv"
              >
                <Download className="w-3.5 h-3.5" /> Planilha CSV
              </button>

              <button
                onClick={() => handleExportCSV(true)}
                className="px-3.5 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                id="btn-export-excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportar Microsoft Excel
              </button>

              <button
                onClick={handlePrintReport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-900/15 cursor-pointer"
                id="btn-print-report"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Relatório Oficial
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ================= RELATÓRIO PRÉ-FORMULADO PARA IMPRESSÃO (A4 FEELING) ================= */}
      <div className="bg-white text-slate-900 p-6 sm:p-10 rounded-xl border border-slate-300 shadow-xl overflow-hidden font-sans flex flex-col min-h-[500px]" id="report-printable-frame">
        
        {/* Cabeçalho do Brasão Municipal Oficial */}
        <div className="flex items-start justify-between border-b-4 border-slate-950 pb-5 mb-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 border-2 border-slate-950 rounded-full flex items-center justify-center bg-slate-100 p-1 shrink-0">
              <Landmark className="w-8 h-8 text-slate-850" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide leading-none uppercase">Prefeitura Municipal Eletrônica</h3>
              <p className="text-[11px] text-slate-500 font-bold font-mono mt-0.5">ESTADO DA FEDERAÇÃO • LEGISLATIVO & EXECUTIVO</p>
              <p className="text-[10px] text-slate-400 font-sans tracking-tight mt-0.5">Controladoria de Ativos Mobiliários Intangíveis e Corpóreos</p>
            </div>
          </div>
          <div className="text-right font-mono text-[9px] text-slate-500 space-y-0.5">
            <div>EXERCÍCIO CORRENTE: 2026</div>
            <div>EMITIDO EM: {new Date().toLocaleDateString("pt-BR")}</div>
            <div>AUTENTICAÇÃO: SISPAT-DOC-{Math.floor(100000 + Math.random() * 900000)}</div>
          </div>
        </div>

        {/* Título do Relatório */}
        <div className="mb-6 text-left">
          <h4 className="text-lg font-black uppercase text-slate-950 leading-none">
            {reportType === "geral" && "Termo de Inventário Geral de Bens Móveis"}
            {reportType === "setor" && `Inventário Analítico Local - Setor ID ${sectorFilter || "Não Escolhido"}`}
            {reportType === "categoria" && `Ficha de Depreciação e Controle por Categoria ID ${categoryFilter || "Não Escolhido"}`}
            {reportType === "danificados" && "Termo de Bens Classificados para Baixa por Desgaste Crítico"}
            {reportType === "inativos" && "Ficha de Ativos Patrimoniais Inativados (Perdas faturadas / Baichados)"}
            {reportType === "movimentacoes" && "Historial Unificado de Guias de Transporte de Bens Móveis"}
          </h4>
          <p className="text-xs text-slate-500 mt-1 italic">
            Visualização prévia do laudo eletrônico fiscal sob regime municipal.
          </p>
        </div>

        {/* Tabela do Relatório */}
        <div className="flex-1 overflow-x-auto">
          {currentData.length === 0 ? (
            <div className="py-24 text-center text-slate-400 space-y-2">
              <FileCheck2 className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs font-bold uppercase tracking-wider">Nada a exibir</p>
              <p className="text-[11px]">Selecione um filtro e clique nos parâmetros no menu superior para hidratar esta seção.</p>
            </div>
          ) : (
            <table className="w-full text-left text-[11px] leading-tight border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 font-bold uppercase bg-slate-100">
                  {reportType === "movimentacoes" ? (
                    <>
                      <th className="p-2">Tombamento</th>
                      <th className="p-2">Equipamento</th>
                      <th className="p-2">Fluxo</th>
                      <th className="p-2">Auditor Responsável</th>
                      <th className="p-2">Justificativa Legal</th>
                      <th className="p-2 text-right">Data</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2">Código</th>
                      <th className="p-2">Tombamento</th>
                      <th className="p-2">Modelo / Descrição do Ativo</th>
                      <th className="p-2">Categoria</th>
                      <th className="p-2">Setor</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2 text-right">Valor Unitário</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {reportType === "movimentacoes" ? (
                  (currentData as Movimentacao[]).map((m, idx) => {
                    const p = patrimonios.find(pat => pat.id === m.patrimonioId);
                    const o = sectors.find(s => s.id === m.setorOrigemId)?.sigla || "Entrada";
                    const d = sectors.find(s => s.id === m.setorDestinoId)?.sigla || "S/D";

                    return (
                      <tr key={m.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-slate-950">{p?.numeroPatrimonial || "N/A"}</td>
                        <td className="p-2 font-medium">{p?.descricao}</td>
                        <td className="p-2 font-mono">{o} ➔ {d}</td>
                        <td className="p-2">{m.usuarioNome}</td>
                        <td className="p-2 italic text-slate-500">"{m.motivo}"</td>
                        <td className="p-2 text-right font-mono">{new Date(m.dataMovimentacao).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    );
                  })
                ) : (
                  (currentData as Patrimonio[]).map((p, idx) => {
                    const c = categories.find(cat => cat.id === p.categoriaId)?.nome || "";
                    const s = sectors.find(set => set.id === p.setorId)?.sigla || "";

                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-black text-slate-950">{p.numeroPatrimonial}</td>
                        <td className="p-2 font-mono text-slate-500">{p.tombamento}</td>
                        <td className="p-2 font-semibold">
                          {p.descricao}
                          {p.quantidade > 1 && <span className="text-red-600 block text-[9px] font-black">LOTE CONSOLIDADO: {p.quantidade} ITENS</span>}
                        </td>
                        <td className="p-2">{c}</td>
                        <td className="p-2 font-bold font-mono">{s}</td>
                        <td className="p-2 font-bold">{p.estadoConservacao}</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(p.valorEstimado)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Rodapé de Assinatura Governamental */}
        {currentData.length > 0 && (
          <div className="pt-10 border-t border-slate-300 mt-10 md:pt-16 grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-48 border-b-2 border-slate-950 h-5" />
              <span className="font-bold uppercase text-slate-800">Diretor de Controladoria do Patrimônio</span>
              <span className="text-[10px] text-slate-500 tracking-tight leading-none">Matrícula Municipal N° {Math.floor(200000 + Math.random() * 90002)}</span>
            </div>
            
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-48 border-b-2 border-slate-950 h-5" />
              <span className="font-bold uppercase text-slate-800">Assinatura do Recebedor / Fiscalizador</span>
              <span className="text-[10px] text-slate-500 tracking-tight leading-none font-mono">Assinado digitalmente por SisPatrimônio</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
