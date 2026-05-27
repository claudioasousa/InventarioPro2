import React, { useState } from "react";
import { ArrowLeftRight, Search, FileText, Calendar, User, Landmark, Plus, Check } from "lucide-react";
import { Patrimonio, Sector, Movimentacao } from "../types";

interface TransferenciaViewProps {
  movimentacoes: Movimentacao[];
  patrimonios: Patrimonio[];
  sectors: Sector[];
  userPerfil: string;
  onTransfer: (patrimonioId: number, sectorId: number, motive: string, obs?: string) => Promise<any>;
}

export default function TransferenciaView({
  movimentacoes,
  patrimonios,
  sectors,
  userPerfil,
  onTransfer
}: TransferenciaViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDestSector, setSelectedDestSector] = useState("");
  const [selectedPatrimonio, setSelectedPatrimonio] = useState("");
  const [transferMotive, setTransferMotive] = useState("");
  const [transferObs, setTransferObs] = useState("");
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filtra as movimentações por termo de busca
  const filteredMovs = movimentacoes.filter(m => {
    const p = patrimonios.find(pat => pat.id === m.patrimonioId);
    const code = p?.numeroPatrimonial || "";
    const desc = p?.descricao || "";
    const term = searchTerm.toLowerCase();

    return (
      code.toLowerCase().includes(term) ||
      desc.toLowerCase().includes(term) ||
      m.usuarioNome.toLowerCase().includes(term) ||
      m.motivo.toLowerCase().includes(term)
    );
  }).reverse(); // Mostra as mais recentes primeiro

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (!selectedPatrimonio || !selectedDestSector || !transferMotive) {
        throw new Error("Preencha todos os campos obrigatórios da guia.");
      }

      const pId = Number(selectedPatrimonio);
      const bSelected = patrimonios.find(pat => pat.id === pId);
      if (!bSelected) throw new Error("Patrimônio inválido.");

      if (bSelected.setorId === Number(selectedDestSector)) {
        throw new Error("O setor destino deve ser diferente do setor original atual do bem.");
      }

      await onTransfer(pId, Number(selectedDestSector), transferMotive, transferObs);
      
      setSuccessMsg(`Guia de movimentação financeira gerada para o bem ${bSelected.numeroPatrimonial}.`);
      setSelectedPatrimonio("");
      setSelectedDestSector("");
      setTransferMotive("");
      setTransferObs("");
      setIsNewTransferOpen(false);

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Falha na validação eletrônica da guia de transporte.");
    }
  };

  return (
    <div className="space-y-6 text-left" id="transferencia-view-main">
      
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-500" />
            Guia de Transferência e Remanejamento
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controle do fluxo de bens móveis entre as secretarias, autarquias e postos municipais.
          </p>
        </div>

        {userPerfil !== "Consulta" && (
          <button
            onClick={() => {
              setErrorMsg("");
              setIsNewTransferOpen(!isNewTransferOpen);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-900/10 cursor-pointer"
            id="btn-trigger-new-transfer"
          >
            <Plus className="w-4 h-4" /> Lançar Nova Guia
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl font-medium">
          {successMsg}
        </div>
      )}

      {/* Formulário de Transferência de Bem */}
      {isNewTransferOpen && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl animate-fadeIn">
          <div className="mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase">Preencher Guia de Transporte de Ativos</h3>
            <p className="text-[11px] text-slate-400">Insira as informações do transporte físico para compliance de auditoria interna.</p>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 bg-red-950/50 border border-red-500/40 text-red-300 text-xs rounded-lg font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleTransferSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Escolher Patrimônio */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Bem Móvel a Transportar *</label>
              <select
                value={selectedPatrimonio}
                onChange={(e) => setSelectedPatrimonio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-medium"
                required
              >
                <option value="">Selecione o bem...</option>
                {patrimonios.filter(p => p.ativo).map(p => {
                  const currentSector = sectors.find(s => s.id === p.setorId)?.sigla || "PM";
                  return (
                    <option key={p.id} value={p.id}>
                      [{p.numeroPatrimonial}] {p.descricao.slice(0, 50)}... (Atualmente em: {currentSector})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Setor de Destino */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Repartição de Destino *</label>
              <select
                value={selectedDestSector}
                onChange={(e) => setSelectedDestSector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-medium"
                required
              >
                <option value="">Selecione o destino...</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>
                ))}
              </select>
            </div>

            {/* Motivo da Transferência */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Justificativa Legal / Motivo *</label>
              <input
                type="text"
                value={transferMotive}
                onChange={(e) => setTransferMotive(e.target.value)}
                placeholder="Ex: Ampliacao do Almoxarifado central ou Laudo de Assistência Informática"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
                required
              />
            </div>

            {/* Observações da Transferência */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Observações de Entrega (Opcional)</label>
              <input
                type="text"
                value={transferObs}
                onChange={(e) => setTransferObs(e.target.value)}
                placeholder="Ex: Entregue completo com cabos, com laudo assinado pelo recebedor."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewTransferOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                id="btn-submit-transfer-form"
              >
                <Check className="w-4 h-4" /> Registrar Guia de Transporte
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Histórico completo de movimentações */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              Livro de Registro de Movimentações
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Histórico imutável de transição de responsabilidade de patrimônios.</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar histórico..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-blue-500/40 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-950/40">
                <th className="p-4 font-semibold">Tombamento</th>
                <th className="p-4 font-semibold">Bem Destinado</th>
                <th className="p-4 font-semibold">Transição Original</th>
                <th className="p-4 font-semibold">Garantidor / Operador</th>
                <th className="p-4 font-semibold">Justificativa do Movimento</th>
                <th className="p-4 font-semibold text-right">Data Lançamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredMovs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-500">
                    Nenhum termo de transporte foi localizado para os termos digitados.
                  </td>
                </tr>
              ) : (
                filteredMovs.map(mov => {
                  const p = patrimonios.find(pat => pat.id === mov.patrimonioId);
                  const sOrig = sectors.find(s => s.id === mov.setorOrigemId)?.sigla || "Entrada de Bem";
                  const sDest = sectors.find(s => s.id === mov.setorDestinoId)?.sigla || "S/D";

                  return (
                    <tr key={mov.id} className="hover:bg-slate-850/40 transition-colors">
                      {/* Tombamento */}
                      <td className="p-4 font-mono font-bold text-white text-xs">
                        {p?.numeroPatrimonial || `ID ${mov.patrimonioId}`}
                      </td>
                      
                      {/* Descrição */}
                      <td className="p-4 font-semibold text-slate-200">
                        {p?.descricao || "Bem Móvel Não Especificado"}
                      </td>

                      {/* Transição */}
                      <td className="p-4 font-mono">
                        <span className="text-slate-400" title="Origem">{sOrig}</span>
                        <span className="mx-1.5 text-slate-500">➔</span>
                        <span className="text-blue-400 font-bold" title="Destino">{sDest}</span>
                      </td>

                      {/* Operador */}
                      <td className="p-4 text-slate-300">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{mov.usuarioNome}</span>
                        </div>
                      </td>

                      {/* Justificativa */}
                      <td className="p-4 italic text-slate-400">
                        "{mov.motivo}" {mov.observacoes && <span className="text-[10px] text-slate-500 block font-sans">({mov.observacoes})</span>}
                      </td>

                      {/* Data */}
                      <td className="p-4 text-right font-mono text-slate-400">
                        {new Date(mov.dataMovimentacao).toLocaleString("pt-BR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
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
