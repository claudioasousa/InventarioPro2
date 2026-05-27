import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trash2,
  FileText,
  UserCheck,
  Plus,
  ChevronRight,
  ClipboardList,
  Fingerprint,
  Calendar,
  AlertTriangle,
  Layers,
  Scale,
  Wrench,
  CheckCircle2,
  X,
  FileCheck2,
  Printer,
  History,
  Info,
  Search,
  Users,
  FileX2,
  Upload,
  ArrowRightLeft
} from "lucide-react";
import { Patrimonio, Category, Comissao, Desfazimento, MembroComissao, VistoriaTecnica, Laudo, BaixaPatrimonial, DestinacaoFinalDetail, Anexo } from "../types";
import { ApiClient } from "../api";

interface DesfazimentoViewProps {
  patrimonios: Patrimonio[];
  categories: Category[];
  userPerfil: string;
}

export default function DesfazimentoView({
  patrimonios,
  categories,
  userPerfil
}: DesfazimentoViewProps) {
  
  // Tabs do Painel de Desfazimento
  const [activeSubTab, setActiveSubTab] = useState<"processos" | "comissoes" | "estatisticas">("processos");

  // Estados dos Dados Principal
  const [desfazimentos, setDesfazimentos] = useState<Desfazimento[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Filtros de Processos
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClassificacao, setFilterClassificacao] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Estado de Visualização Detalhes / Formulários
  const [selectedProcesso, setSelectedProcesso] = useState<Desfazimento | null>(null);
  const [showNovoProcessoForm, setShowNovoProcessoForm] = useState(false);
  const [showNovaComissaoForm, setShowNovaComissaoForm] = useState(false);
  
  // Estado de Documento para Impressão
  const [activePrintDocument, setActivePrintDocument] = useState<{
    tipo: "caracterizacao" | "laudo" | "termo_baixa";
    processo: Desfazimento;
  } | null>(null);

  // Form de Novo Processo de Desfazimento
  const [formPatrimonioId, setFormPatrimonioId] = useState("");
  const [formClassificacao, setFormClassificacao] = useState<"Ocioso" | "Recuperável" | "Antieconômico" | "Irrecuperável" | "Obsoleto" | "Inservível">("Inservível");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [formCustoReparo, setFormCustoReparo] = useState("0");
  const [formValorResidual, setFormValorResidual] = useState("0");
  const [formComissaoId, setFormComissaoId] = useState("");

  // Form de Nova Comissão
  const [formPortaria, setFormPortaria] = useState("");
  const [formComissaoDesc, setFormComissaoDesc] = useState("");
  const [formComissaoDataInicio, setFormComissaoDataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [formComissaoDataFim, setFormComissaoDataFim] = useState("");
  const [membrosTemp, setMembrosTemp] = useState<MembroComissao[]>([]);
  const [membroNome, setMembroNome] = useState("");
  const [membroMatricula, setMembroMatricula] = useState("");
  const [membroCargo, setMembroCargo] = useState("");
  const [membroFuncao, setMembroFuncao] = useState<"Presidente" | "Membro" | "Suplente" | "Secretário">("Membro");

  // Formulários Dinâmicos para Avanço de Etapa
  const [actionOpinionComissao, setActionOpinionComissao] = useState("");
  
  // Vistoria Técnica Form Temp
  const [vistoriaResponsavel, setVistoriaResponsavel] = useState("");
  const [vistoriaParecer, setVistoriaParecer] = useState("");
  const [vistoriaAssinatura, setVistoriaAssinatura] = useState("");

  // Laudo Técnico Form Temp
  const [laudoResponsavel, setLaudoResponsavel] = useState("");
  const [laudoParecer, setLaudoParecer] = useState("");

  // Destinação Final Form Temp
  const [destinacaoTipo, setDestinacaoTipo] = useState<"Leilão" | "Doação" | "Transferência" | "Reciclagem" | "Descarte ambiental">("Doação");
  const [destinacaoResponsavel, setDestinacaoResponsavel] = useState("");
  const [destinacaoReceptora, setDestinacaoReceptora] = useState("");
  const [destinacaoObservacoes, setDestinacaoObservacoes] = useState("");

  // Anexos Temp
  const [anexoNome, setAnexoNome] = useState("");
  const [anexoTipo, setAnexoTipo] = useState("application/pdf");

  // Carregar Dados Iniciais
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [desList, comList] = await Promise.all([
        ApiClient.getDesfazimentos(),
        ApiClient.getComissoes()
      ]);
      setDesfazimentos(desList);
      setComissoes(comList);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao conectar-se às apis de inventário patrimonio.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const timeoutMessage = (msg: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(""), 6000);
    } else {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 6000);
    }
  };

  // Criar Novo Processo de Desfazimento
  const handleCreateProcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatrimonioId) {
      timeoutMessage("Obrigatório selecionar um item de patrimônio.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const novo = await ApiClient.createDesfazimento({
        patrimonioId: Number(formPatrimonioId),
        classificacao: formClassificacao,
        observacoesTecnicas: formObservacoes,
        custoEstimadoReparo: Number(formCustoReparo),
        valorResidualEstimado: Number(formValorResidual),
        comissaoId: formComissaoId ? Number(formComissaoId) : undefined
      });
      
      timeoutMessage(`Processo instituído com sucesso para o patrimônio ${novo.numeroPatrimonial}!`, "success");
      setShowNovoProcessoForm(false);
      
      // Limpa campos
      setFormPatrimonioId("");
      setFormObservacoes("");
      setFormCustoReparo("0");
      setFormValorResidual("0");
      setFormComissaoId("");
      
      loadData();
    } catch (err: any) {
      timeoutMessage(err.message || "Falha ao dar início ao processo.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Criar Nova Comissão Municipal
  const handleCreateComissao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPortaria) {
      timeoutMessage("Insira o identificador da Portaria Federal/Municipal.", "error");
      return;
    }
    if (membrosTemp.length === 0) {
      timeoutMessage("Adicione pelo menos 1 servidor à comissão avaliativa.", "error");
      return;
    }

    setIsLoading(true);
    try {
      await ApiClient.createComissao({
        portaria: formPortaria,
        descricao: formComissaoDesc,
        dataInicio: formComissaoDataInicio,
        dataFim: formComissaoDataFim,
        membros: membrosTemp,
        ativa: true
      });
      
      timeoutMessage(`Comissão legislativa '${formPortaria}' criada com sucesso!`, "success");
      setShowNovaComissaoForm(false);
      setFormPortaria("");
      setFormComissaoDesc("");
      setMembrosTemp([]);
      loadData();
    } catch (err: any) {
      timeoutMessage(err.message || "Falha ao registrar comissão.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar Comissão
  const handleDeleteComissao = async (id: number) => {
    if (!window.confirm("Confirmar a remoção oficial desta comissão e arquivamento de portaria?")) return;
    setIsLoading(true);
    try {
      await ApiClient.deleteComissao(id);
      timeoutMessage("Comissão removida e repassada ao acervo histórico municipal.", "success");
      loadData();
    } catch (err: any) {
      timeoutMessage(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar Desfazimento
  const handleDeleteDesfazimento = async (id: number) => {
    if (!window.confirm("Remover permanentemente este processo administrativo de desincorporação?")) return;
    setIsLoading(true);
    try {
      await ApiClient.deleteDesfazimento(id);
      timeoutMessage("Processo cancelado e expurgado com sucesso.", "success");
      setSelectedProcesso(null);
      loadData();
    } catch (err: any) {
      timeoutMessage(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Avançar Etapas do Processo de Desfazimento (1 a 7)
  const handleAvancarProcesso = async (processo: Desfazimento, proximaEtapa: number, updates: Partial<Desfazimento>) => {
    setIsLoading(true);
    try {
      let statusToSet = processo.status;
      if (proximaEtapa === 2) statusToSet = "Aguardando vistoria";
      if (proximaEtapa === 3) statusToSet = "Aguardando vistoria";
      if (proximaEtapa === 4) statusToSet = "Aguardando aprovação";
      if (proximaEtapa === 5) statusToSet = "Aguardando aprovação";
      if (proximaEtapa === 6) statusToSet = "Aprovado";
      if (proximaEtapa === 7) statusToSet = "Baixado"; // Conclusão oficial

      const updated = await ApiClient.updateDesfazimento(processo.id, {
        ...updates,
        etapaAtual: proximaEtapa,
        status: statusToSet
      });

      timeoutMessage(`Processo atualizado! Etapa ${proximaEtapa} concluída.`, "success");
      setSelectedProcesso(updated);
      
      // Limpar formulários flutuantes
      setActionOpinionComissao("");
      setVistoriaResponsavel("");
      setVistoriaParecer("");
      setVistoriaAssinatura("");
      setLaudoResponsavel("");
      setLaudoParecer("");
      setDestinacaoResponsavel("");
      setDestinacaoReceptora("");
      setDestinacaoObservacoes("");

      loadData();
    } catch (err: any) {
      timeoutMessage(err.message || "Erro de validação nas etapas administrativas.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Adicionar Membro Temporário na Criação de Comissão
  const handleAddMembroTemp = () => {
    if (!membroNome || !membroMatricula) {
      alert("Escreva o Nome e a Matrícula do servidor.");
      return;
    }
    const novoMembro: MembroComissao = {
      nome: membroNome,
      matricula: membroMatricula,
      cargo: membroCargo,
      funcaoComissao: membroFuncao
    };
    setMembrosTemp([...membrosTemp, novoMembro]);
    setMembroNome("");
    setMembroMatricula("");
    setMembroCargo("");
  };

  // Remover Membro Temporário
  const handleRemoveMembroTemp = (idx: number) => {
    setMembrosTemp(membrosTemp.filter((_, i) => i !== idx));
  };

  // Filtragem dos Processos Ativos
  const filteredProcessos = desfazimentos.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = p.numeroPatrimonial.toLowerCase().includes(query) ||
                            p.descricao.toLowerCase().includes(query) ||
                            p.localizacaoOriginal.toLowerCase().includes(query);
    const matchesClassif = filterClassificacao ? p.classificacao === filterClassificacao : true;
    const matchesStatus = filterStatus ? p.status === filterStatus : true;
    return matchesSearch && matchesClassif && matchesStatus;
  });

  // Cálculo Estatísticas Rápidas
  const totalProcessos = desfazimentos.length;
  const totalResidual = desfazimentos.reduce((sum, d) => sum + d.valorResidualEstimado, 0);
  const totalReparosEvitados = desfazimentos.reduce((sum, d) => sum + d.custoEstimadoReparo, 0);
  const baixadosEst = desfazimentos.filter(d => d.status === "Baixado" || d.status === "Finalizado").length;

  return (
    <div className="space-y-6" id="modulo-desfazimento-patrimonial">
      
      {/* 1. Header do Painel de Desfazimento */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 opacity-5 bg-gradient-to-l from-red-500/30 to-transparent rounded-full select-none pointer-events-none" />
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span className="text-xs uppercase bg-red-950/40 text-red-400 font-bold px-2 py-0.5 rounded border border-red-900/30 font-mono">Setor de Baixa Oficial</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight font-sans">Desfazimento de Bens Móveis Inservíveis</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Módulo integrado para desincorporação patrimonial nos termos do <span className="text-blue-400 underline decoration-blue-900 font-semibold font-mono">Decreto Federal nº 9.373/2018</span> e leis correlatas para destinação, doação e descarte.
          </p>
        </div>
        
        {/* Buttons de Ações */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => {
              setShowNovoProcessoForm(true);
              setShowNovaComissaoForm(false);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/20 active:scale-95 transition-all"
            id="btn-novo-desfazimento"
          >
            <Plus className="w-4 h-4" /> Instaurar Processo
          </button>
          
          <button
            onClick={() => {
              setShowNovaComissaoForm(true);
              setShowNovoProcessoForm(false);
            }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            id="btn-nova-comissao"
          >
            <Users className="w-4 h-4 text-blue-400" /> Instituir Comissão
          </button>
        </div>
      </div>

      {/* 2. Notifications overlay */}
      {successMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 p-4 rounded-lg flex items-center gap-3 animate-fade-in text-sm font-semibold select-none shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-left">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-950/90 border border-red-500 text-red-200 p-4 rounded-lg flex items-center gap-3 animate-fade-in text-sm font-semibold select-none shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-left">{errorMessage}</span>
        </div>
      )}

      {/* 3. Sub-Navegação interna (Abas) */}
      <div className="flex border-b border-slate-800 pb-px" id="subtab-desfazimento">
        {[
          { id: "processos", label: "Processos em Andamento", icon: ClipboardList },
          { id: "comissoes", label: "Comissões & Portarias", icon: Scale },
          { id: "estatisticas", label: "Balanço Técnico", icon: Info }
        ].map(tab => {
          const ActiveIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setSelectedProcesso(null);
              }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold leading-none tracking-tight border-b-2 uppercase font-mono ${
                activeSubTab === tab.id
                  ? "border-red-500 text-red-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              } cursor-pointer transition-all`}
            >
              <ActiveIcon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          ABA 1: PROCESSOS DE DESFAZIMENTO
          ========================================================================= */}
      {activeSubTab === "processos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LADO ESQUERDO: BUSCA E LISTA DE PROCESSOS (8/12 colunas) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Caixa de Pesquisa e Filtros */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filtrar por nº patrimonial, tombamento ou descrição..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filtro por Classificação */}
              <select
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500 font-mono"
                value={filterClassificacao}
                onChange={(e) => setFilterClassificacao(e.target.value)}
              >
                <option value="">Todas Classificações</option>
                <option value="Ocioso">Ocioso</option>
                <option value="Recuperável">Recuperável</option>
                <option value="Antieconômico">Antieconômico</option>
                <option value="Irrecuperável">Irrecuperável</option>
                <option value="Obsoleto">Obsoleto</option>
                <option value="Inservível">Inservível</option>
              </select>

              {/* Filtro por Status */}
              <select
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500 font-mono"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos Status</option>
                <option value="Em análise">Em análise</option>
                <option value="Aguardando vistoria">Aguardando vistoria</option>
                <option value="Aguardando aprovação">Aguardando aprovação</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Baixado">Baixado</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>

            {/* Listagem de Processos */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-xl font-mono text-xs text-slate-500">
                  Caregando processos fiscais de baixa patrimonial...
                </div>
              ) : filteredProcessos.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-xl text-slate-400 flex flex-col items-center justify-center gap-2">
                  <FileX2 className="w-10 h-10 text-slate-700" />
                  <span className="font-bold text-sm">Nenhum processo de desfazimento encontrado</span>
                  <span className="text-xs text-slate-500 max-w-sm">Use o botão "Instaurar Processo" no topo para dar início a um protocolo de baixa sobre bens móveis obsoletos ou inservíveis.</span>
                </div>
              ) : (
                filteredProcessos.map(item => {
                  const isActive = selectedProcesso?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedProcesso(item);
                        setShowNovoProcessoForm(false);
                      }}
                      className={`p-4 rounded-xl border transition-all text-left cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        isActive
                          ? "bg-red-950/20 border-red-500 shadow-md shadow-red-900/10"
                          : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/20">
                            PROCESSO DF-{String(item.id).padStart(4, "0")}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-300">
                            PATRIMÔNIO: {item.numeroPatrimonial}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                            item.status === "Finalizado" || item.status === "Baixado"
                              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40"
                              : item.status === "Aprovado"
                              ? "bg-blue-950/50 text-blue-400 border border-blue-900/40"
                              : "bg-amber-950/50 text-amber-400 border border-amber-900/40"
                          }`}>
                            ● {item.status}
                          </span>
                        </div>
                        
                        <h4 className="font-bold text-sm text-slate-100 truncate">{item.descricao}</h4>
                        
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                          <span>Local: {item.localizacaoOriginal}</span>
                          <span>•</span>
                          <span>Razão: <strong className="text-slate-300 underline font-semibold">{item.classificacao}</strong></span>
                        </div>
                      </div>

                      {/* Progresso de Etapa Visual */}
                      <div className="flex flex-col items-end shrink-0 w-full md:w-auto">
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <span>Etapa {item.etapaAtual}/7</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="w-24 bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-red-500 h-full transition-all duration-300"
                            style={{ width: `${(item.etapaAtual / 7) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-1">Última ação: {new Date(item.dataUltimaMovimentacao || item.dataCriacao).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* LADO DIREITO: INTERATIVIDADE DO PROCESSO EXECUTIVO (5/12 colunas) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 min-h-[500px] text-left relative">
            <AnimatePresence mode="wait">
              
              {/* STATUS 1: FORMULÁRIO DE INSTAURAÇÃO */}
              {showNovoProcessoForm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <h3 className="font-bold text-sm text-slate-100 tracking-tight uppercase">Instaurar Novo Processo</h3>
                    </div>
                    <button
                      onClick={() => setShowNovoProcessoForm(false)}
                      className="text-slate-500 hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateProcesso} className="space-y-3.5">
                    
                    {/* Selecionar Patrimônio de Origem */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Selecionar Bem Móvel</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                        value={formPatrimonioId}
                        onChange={(e) => {
                          setFormPatrimonioId(e.target.value);
                          // Auto preenche custos e observações baseados no patrimônio selecionado
                          const selected = patrimonios.find(p => p.id === Number(e.target.value));
                          if (selected) {
                            setFormObservacoes(`Iniciado processo decorrente do estado de conservação "${selected.estadoConservacao}" identificado.`);
                            if (selected.valorEstimado) {
                              setFormValorResidual(String(Math.round(selected.valorEstimado * 0.1))); // 10% padrão
                            }
                          }
                        }}
                      >
                        <option value="">-- Escolha um Bem Ativo no Inventário --</option>
                        {patrimonios
                          .filter(p => p.ativo)
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              [{p.numeroPatrimonial}] {p.descricao} ({p.estadoConservacao})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Exibe detalhe rápido do bem selecionado */}
                    {formPatrimonioId && (() => {
                      const sel = patrimonios.find(p => p.id === Number(formPatrimonioId));
                      if (!sel) return null;
                      return (
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-[11px] font-mono space-y-1 text-slate-400">
                          <p><strong className="text-slate-300">Tombamento:</strong> {sel.tombamento || "N/A"}</p>
                          <p><strong className="text-slate-300">Localização atual:</strong> {sel.localizacaoAtual || "N/A"}</p>
                          <p><strong className="text-slate-300">Valor contábil avaliado:</strong> R$ {sel.valorEstimado?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        </div>
                      );
                    })()}

                    {/* Classificação Técnica */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Classificação na Baixa</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-red-500 font-mono"
                        value={formClassificacao}
                        onChange={(e: any) => setFormClassificacao(e.target.value)}
                      >
                        <option value="Inservível">Inservível (Geral)</option>
                        <option value="Ocioso">Ocioso (Bom estado mas sem utilidade local)</option>
                        <option value="Recuperável">Recuperável (Conserto viável financeiramente)</option>
                        <option value="Antieconômico">Antieconômico (Manutenção excede 50% do valor)</option>
                        <option value="Irrecuperável">Irrecuperável (Inviável consertar, danificado)</option>
                        <option value="Obsoleto">Obsoleto (Tecnologia defasada/fora de suporte)</option>
                      </select>
                    </div>

                    {/* Valores de Avaliação de Desfazimento */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Custo de Reparo (R$)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono"
                          value={formCustoReparo}
                          onChange={(e) => setFormCustoReparo(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Valor Residual (R$)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono"
                          value={formValorResidual}
                          onChange={(e) => setFormValorResidual(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Comissão Avaliadora Vinculada */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Vincular Comissão Avaliadora</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-red-500 font-mono"
                        value={formComissaoId}
                        onChange={(e) => setFormComissaoId(e.target.value)}
                      >
                        <option value="">-- Sem comissão vinculada (vincular na Etapa 2) --</option>
                        {comissoes
                          .filter(c => c.ativa)
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.portaria} ({c.membros.length} Membros)
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Observações Técnicas Iniciais */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Justificativa Administrativa</label>
                      <textarea
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 font-sans"
                        placeholder="Descrever causa da indisponibilidade do patrimônio para fins de auditoria do TCE..."
                        value={formObservacoes}
                        onChange={(e) => setFormObservacoes(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded-lg text-xs tracking-tight uppercase cursor-pointer shadow shadow-red-900 border border-red-500/20"
                    >
                      {isLoading ? "Processando..." : "Gravar e Abrir Dossiê"}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STATUS 2: DETALHAMENTO DE PROCESSO SELECIONADO & STEPPER WIZARD */}
              {selectedProcesso && !showNovoProcessoForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  
                  {/* Header do Dossiê */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-200">DOSSIÊ DO PROCESSO</h3>
                      <p className="text-[10px] font-mono text-red-400">DF-{String(selectedProcesso.id).padStart(4, "0")}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedProcesso(null)}
                        className="p-1 px-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Fechar
                      </button>
                      <button
                        onClick={() => handleDeleteDesfazimento(selectedProcesso.id)}
                        className="p-1 text-red-400 bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 hover:border-red-500 rounded text-[10px] font-bold cursor-pointer transition-all"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  {/* Informações Básicas */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                    <h4 className="font-bold text-xs text-slate-100 uppercase font-mono tracking-wider">Metadados Originais</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Número do Patrimônio</span>
                        <span className="font-semibold">{selectedProcesso.numeroPatrimonial}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Localização Original</span>
                        <span className="truncate block font-semibold">{selectedProcesso.localizacaoOriginal}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Classificação de Baixa</span>
                        <span className="text-red-400 font-bold">{selectedProcesso.classificacao}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Valor Técnico Estimado</span>
                        <span className="font-semibold text-emerald-400">R$ {selectedProcesso.valorResidualEstimado?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-850 pt-2 text-xs">
                      <span className="text-[10px] text-slate-500 block font-mono">Justificativa Inicial:</span>
                      <p className="text-slate-300 leading-snug">{selectedProcesso.observacoesTecnicas}</p>
                    </div>
                  </div>

                  {/* Visual Timeline de Etapas (Passo a Passo Interativo) */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-xs text-slate-200 uppercase font-mono tracking-wider">Etapa Atual do Protocolo</h4>
                    <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-4">
                      
                      {/* ETAPA 1: Identificação (Read only) */}
                      <div className="relative">
                        <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-emerald-500 border border-slate-900" />
                        <h5 className="text-xs font-bold text-slate-200">Etapa 1: Identificação do Bem Inservível</h5>
                        <p className="text-[10pt] text-slate-400 leading-tight">Bem cadastrado e instaurado no sistema sob classificação inicial de <strong>{selectedProcesso.classificacao}</strong> por {selectedProcesso.usuarioCriador}.</p>
                      </div>

                      {/* ETAPA 2: Parecer da Comissão */}
                      <div className="relative">
                        <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full ${selectedProcesso.etapaAtual >= 2 ? "bg-emerald-500" : "bg-slate-700"} border border-slate-900`} />
                        <h5 className="text-xs font-bold text-slate-200">Etapa 2: Julgamento & Avaliação da Comissão</h5>
                        
                        {selectedProcesso.etapaAtual === 1 ? (
                          <div className="bg-slate-950 p-3 rounded-lg border border-red-900/30 mt-2 space-y-2">
                            <span className="text-[10px] text-slate-400 block font-mono">Adicionar decisão e opinamento técnico corporativo.</span>
                            
                            <select
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-100 font-mono"
                              value={formComissaoId}
                              onChange={(e) => setFormComissaoId(e.target.value)}
                            >
                              <option value="">-- Vincular comissão julgadora --</option>
                              {comissoes.map(c => (
                                <option key={c.id} value={c.id}>{c.portaria} ({c.descricao.substring(0, 30)}...)</option>
                              ))}
                            </select>

                            <textarea
                              rows={2}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 placeholder-slate-600"
                              placeholder="Digite o parecer oficial da Comissão..."
                              value={actionOpinionComissao}
                              onChange={(e) => setActionOpinionComissao(e.target.value)}
                            />
                            
                            <button
                              onClick={() => {
                                if (!formComissaoId) {
                                  alert("Vincule uma comissão ativa registrada.");
                                  return;
                                }
                                handleAvancarProcesso(selectedProcesso, 2, {
                                  parecerComissao: actionOpinionComissao || "A comissão valida a classificação de inservibilidade após análise colegiada.",
                                  comissaoId: Number(formComissaoId)
                                });
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold p-1.5 rounded cursor-pointer transition-all"
                            >
                              Gravar Parecer e Enviar para Vistoria
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10pt] text-slate-400">
                            {selectedProcesso.parecerComissao ? (
                              <p className="italic bg-slate-950/40 p-2 rounded border border-slate-800 text-slate-300">
                                "{selectedProcesso.parecerComissao}"
                                <span className="block text-[8px] text-slate-500 mt-1 font-mono">
                                  Comissão Vinculada ID: #{selectedProcesso.comissaoId}
                                </span>
                              </p>
                            ) : (
                              <span className="text-slate-500">Aguardando preenchimento da comissão.</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ETAPA 3: Vistoria Técnica */}
                      <div className="relative">
                        <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full ${selectedProcesso.etapaAtual >= 3 ? "bg-emerald-500" : "bg-slate-700"} border border-slate-900`} />
                        <h5 className="text-xs font-bold text-slate-200">Etapa 3: Vistoria Técnica Laboratorial</h5>
                        
                        {selectedProcesso.etapaAtual === 2 ? (
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/85 mt-2 space-y-2">
                            <span className="text-[10px] text-slate-400 block font-mono">Registo de vistoria por engenheiro/técnico municipal habilitado no CREA/COFEN.</span>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-100"
                                placeholder="Servidor Resp. (Ex: Eng. Pedro)"
                                value={vistoriaResponsavel}
                                onChange={(e) => setVistoriaResponsavel(e.target.value)}
                              />
                              <input
                                type="text"
                                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-100"
                                placeholder="Chave de Valid. Digital (Assinatura)"
                                value={vistoriaAssinatura}
                                onChange={(e) => setVistoriaAssinatura(e.target.value)}
                              />
                            </div>

                            <textarea
                              rows={2}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 placeholder-slate-600"
                              placeholder="Firmação sobre o estado real do bem (ex: placas defeituosas, etc.)"
                              value={vistoriaParecer}
                              onChange={(e) => setVistoriaParecer(e.target.value)}
                            />

                            <button
                              onClick={() => {
                                if (!vistoriaResponsavel || !vistoriaParecer) {
                                  alert("Forneça o nome do servidor responsável e o parecer técnico para auditoria.");
                                  return;
                                }
                                handleAvancarProcesso(selectedProcesso, 3, {
                                  vistoria: {
                                    dataVistoria: new Date().toISOString().slice(0, 10),
                                    servidorResponsavel: vistoriaResponsavel,
                                    parecerTecnico: vistoriaParecer,
                                    assinaturaDigital: vistoriaAssinatura || "TCE-SIG-HASH" + Math.floor(Math.random() * 100000),
                                    fotos: [],
                                    documentos: []
                                  }
                                });
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold p-1.5 rounded cursor-pointer transition-all"
                            >
                              Finalizar Vistoria e Enviar para Emissão de Laudo
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10pt] text-slate-400">
                            {selectedProcesso.vistoria ? (
                              <div className="bg-slate-950/40 p-2 rounded border border-slate-800 text-[11px] font-mono">
                                <p><strong className="text-slate-300">Vistoriador:</strong> {selectedProcesso.vistoria.servidorResponsavel}</p>
                                <p><strong className="text-slate-300">Parecer técnico:</strong> {selectedProcesso.vistoria.parecerTecnico}</p>
                                <p><strong className="text-slate-300">Chave Assinatura:</strong> {selectedProcesso.vistoria.assinaturaDigital}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500">Aguardando laudo técnico de campo.</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ETAPA 4: Laudo de Inservibilidade */}
                      <div className="relative">
                        <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full ${selectedProcesso.etapaAtual >= 4 ? "bg-emerald-500" : "bg-slate-700"} border border-slate-900`} />
                        <h5 className="text-xs font-bold text-slate-200">Etapa 4: Emissão do Laudo de Inservibilidade</h5>
                        
                        {selectedProcesso.etapaAtual === 3 ? (
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/85 mt-2 space-y-2">
                            <span className="text-[10px] text-slate-400 block font-mono">Consolidação do documento oficial justificando a inviabilidade comercial de reaproveitamento do patrimônio.</span>
                            
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-100"
                              placeholder="Autoridade/Responsável pela homologação"
                              value={laudoResponsavel}
                              onChange={(e) => setLaudoResponsavel(e.target.value)}
                            />

                            <textarea
                              rows={2}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 placeholder-slate-600"
                              placeholder="Parecer final de consolidação jurídica do laudo..."
                              value={laudoParecer}
                              onChange={(e) => setLaudoParecer(e.target.value)}
                            />

                            <button
                              onClick={() => {
                                if (!laudoResponsavel) {
                                  alert("Preencha o nome da autoridade.");
                                  return;
                                }
                                handleAvancarProcesso(selectedProcesso, 4, {
                                  laudo: {
                                    id: Math.floor(Math.random() * 900) + 100,
                                    dataEmissao: new Date().toISOString().slice(0, 10),
                                    responsavel: laudoResponsavel,
                                    parecerFinal: laudoParecer || "Declarado inaproveitável para os fins desta divisão municipal, ratificando-se a indicação para baixa patrimonial definitiva."
                                  }
                                });
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold p-1.5 rounded cursor-pointer transition-all"
                            >
                              Registrar Laudo Oficial e Enviar para Termo de Baixa
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10pt] text-slate-400">
                            {selectedProcesso.laudo ? (
                              <div className="bg-slate-950/40 p-2 rounded border border-slate-800 text-[11px] font-mono">
                                <p><strong className="text-slate-300">Laudo nº:</strong> LAU-{selectedProcesso.laudo.id}/2026</p>
                                <p><strong className="text-slate-300">Parecer Final:</strong> {selectedProcesso.laudo.parecerFinal}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500">Aguardando homologação e parecer jurídico de inservibilidade.</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ETAPA 5: Termo de Baixa */}
                      <div className="relative">
                        <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full ${selectedProcesso.etapaAtual >= 5 ? "bg-emerald-500" : "bg-slate-700"} border border-slate-900`} />
                        <h5 className="text-xs font-bold text-slate-200">Etapa 5: Termo de Baixa Ordinária</h5>
                        
                        {selectedProcesso.etapaAtual === 4 ? (
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2 space-y-2 text-center">
                            <p className="text-[11px] text-slate-400 text-left font-mono">
                              O Termo de Baixa efetiva a remoção formal do ativo. Uma cópia deste processo será enviada ao arquivo central.
                            </p>
                            
                            <button
                              onClick={() => {
                                handleAvancarProcesso(selectedProcesso, 5, {
                                  baixa: {
                                    dataBaixa: new Date().toISOString().slice(0, 10),
                                    termoAssinado: "ASSINADO_CONSELHO_FISCAL_" + Math.floor(Math.random() * 10000)
                                  }
                                });
                              }}
                              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold p-2 rounded cursor-pointer transition-all"
                            >
                              Publicar Termo de Baixa e Liberar para Destinação
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10pt] text-slate-400">
                            {selectedProcesso.baixa ? (
                              <div className="bg-slate-950/40 p-2 rounded border border-slate-800 text-[11px] font-mono">
                                <p><strong className="text-slate-300">Homologado em:</strong> {new Date(selectedProcesso.baixa.dataBaixa).toLocaleDateString("pt-BR")}</p>
                                <p><strong className="text-slate-300">Chave Digital Doc:</strong> {selectedProcesso.baixa.termoAssinado}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500">Aguardando assinatura administrativa.</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ETAPA 6: Destinação Final */}
                      <div className="relative">
                        <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full ${selectedProcesso.etapaAtual >= 6 ? "bg-emerald-500" : "bg-slate-700"} border border-slate-900`} />
                        <h5 className="text-xs font-bold text-slate-200">Etapa 6: Destinação Final do Ativo</h5>
                        
                        {selectedProcesso.etapaAtual === 5 ? (
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2 space-y-2">
                            <span className="text-[10px] text-slate-400 block font-mono">Assinale qual destino final será aplicado ao bem desabrigado.</span>
                            
                            <div>
                              <label className="block text-[9px] text-slate-400 uppercase font-mono">Modalidade</label>
                              <select
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-100"
                                value={destinacaoTipo}
                                onChange={(e: any) => setDestinacaoTipo(e.target.value)}
                              >
                                <option value="Doação">Doação (Escola Pública, OSC, Câmaras)</option>
                                <option value="Leilão">Leilão Público Ordinário</option>
                                <option value="Transferência">Transferência para Outra Autarquia</option>
                                <option value="Reciclagem">Reciclagem de Sucatas</option>
                                <option value="Descarte ambiental">Descarte Ecológico Certificado</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-100"
                                placeholder="Receptor / Instituente"
                                value={destinacaoReceptora}
                                onChange={(e) => setDestinacaoReceptora(e.target.value)}
                              />
                              <input
                                type="text"
                                className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-100"
                                placeholder="Servidor Fiscal de Entrega"
                                value={destinacaoResponsavel}
                                onChange={(e) => setDestinacaoResponsavel(e.target.value)}
                              />
                            </div>

                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-100"
                              placeholder="Observações complementares gerais..."
                              value={destinacaoObservacoes}
                              onChange={(e) => setDestinacaoObservacoes(e.target.value)}
                            />

                            <button
                              onClick={() => {
                                if (!destinacaoResponsavel || !destinacaoReceptora) {
                                  alert("Preencha o nome do servidor encarregado e da instituição receptora para formalidade jurídica.");
                                  return;
                                }
                                // Aqui dispararemos a redução e desvinculação oficial do bem no banco patrimonial!
                                handleAvancarProcesso(selectedProcesso, 6, {
                                  destinacao: {
                                    tipo: destinacaoTipo,
                                    data: new Date().toISOString().slice(0, 10),
                                    responsavel: destinacaoResponsavel,
                                    empresaReceptora: destinacaoReceptora,
                                    comprovantes: [],
                                    observacoes: destinacaoObservacoes
                                  }
                                });
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold p-1.5 rounded cursor-pointer transition-all"
                            >
                              Aplicar Medida Destinatária (Baixar Bem do Inventário)
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10pt] text-slate-400">
                            {selectedProcesso.destinacao ? (
                              <div className="bg-slate-950/40 p-2 rounded border border-slate-800 text-[11px] font-mono">
                                <p><strong className="text-slate-300">Medida Adoptada:</strong> {selectedProcesso.destinacao.tipo}</p>
                                <p><strong className="text-slate-300">Donatário/Comprador:</strong> {selectedProcesso.destinacao.empresaReceptora}</p>
                                <p><strong className="text-slate-300">Fisc. Responsável:</strong> {selectedProcesso.destinacao.responsavel}</p>
                              </div>
                            ) : (
                              <span className="text-slate-500">Aguardando destinação de componentes.</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ETAPA 7: Finalizado */}
                      <div className="relative">
                        <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full ${selectedProcesso.etapaAtual >= 7 ? "bg-emerald-500" : "bg-slate-700"} border border-slate-900`} />
                        <h5 className="text-xs font-bold text-slate-200">Etapa 7: Conclusão Geral & Arquivamento</h5>
                        
                        {selectedProcesso.etapaAtual === 6 ? (
                          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2 text-center space-y-1">
                            <p className="text-[10px] text-slate-400 font-mono">O bem já foi baixado e inativado no balanço municipal de patrimônio móvel!</p>
                            <button
                              onClick={() => {
                                handleAvancarProcesso(selectedProcesso, 7, {
                                  status: "Finalizado"
                                });
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold p-2 rounded cursor-pointer transition-all"
                            >
                              Ratificar Parecer & Finalizar Processo
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10pt] text-slate-400">
                            {selectedProcesso.etapaAtual === 7 ? (
                              <span className="text-emerald-400 font-bold font-mono">✓ Processo fiscally arquivado sem pendências municipais.</span>
                            ) : (
                              <span className="text-slate-500">Etapa de arquivamento.</span>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* 4. HUB DE GERADOR DE DOCUMENTOS OFICIAIS */}
                  {selectedProcesso.etapaAtual >= 1 && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 mt-4">
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <FileCheck2 className="w-5 h-5" />
                        <h4 className="font-bold text-xs font-mono uppercase tracking-wider">Documentos Administrativos</h4>
                      </div>
                      <p className="text-[10px] text-slate-400">Gere documentos oficiais automaticamente baseados nos dados coletados no processo:</p>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {/* Doc 1 */}
                        <button
                          onClick={() => setActivePrintDocument({ tipo: "caracterizacao", processo: selectedProcesso })}
                          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 p-2.5 rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-500" />
                            <span>1. Caracterização de Bem Inservível</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                        
                        {/* Doc 2 */}
                        <button
                          disabled={selectedProcesso.etapaAtual < 4}
                          onClick={() => setActivePrintDocument({ tipo: "laudo", processo: selectedProcesso })}
                          className={`w-full p-2.5 rounded-lg text-xs font-mono flex items-center justify-between ${
                            selectedProcesso.etapaAtual >= 4
                              ? "bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 cursor-pointer"
                              : "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-red-500" />
                            <span>2. Laudo Técnico Oficial</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>

                        {/* Doc 3 */}
                        <button
                          disabled={selectedProcesso.etapaAtual < 5}
                          onClick={() => setActivePrintDocument({ tipo: "termo_baixa", processo: selectedProcesso })}
                          className={`w-full p-2.5 rounded-lg text-xs font-mono flex items-center justify-between ${
                            selectedProcesso.etapaAtual >= 5
                              ? "bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 cursor-pointer"
                              : "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileX2 className="w-4 h-4 text-emerald-500" />
                            <span>3. Termo de Baixa Patrimonial</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

              {/* STATUS 3: NADA SELECIONADO */}
              {!selectedProcesso && !showNovoProcessoForm && (
                <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 gap-2.5">
                  <ClipboardList className="w-12 h-12 text-slate-700" />
                  <span className="font-bold text-sm">Nenhum dossiê selecionado</span>
                  <p className="text-xs text-slate-500 max-w-xs">Escolha um processo ativo na coluna lateral para gerenciar suas etapas legislativas, assinar vistorias ou emitir termos de baixa.</p>
                </div>
              )}

            </AnimatePresence>
          </div>

        </div>
      )}

      {/* =========================================================================
          ABA 2: COMISSÕES DE AVALIAÇÃO
          ========================================================================= */}
      {activeSubTab === "comissoes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left items-start">
          
          {/* LADO ESQUERDO: LISTA DE COMISSÕES ATIVAS (7/12) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-200 uppercase font-mono tracking-wider">Comissões Nomeadas Ativas</h3>
              
              {isLoading ? (
                <p className="text-slate-500 font-mono text-xs">Carregando dados da comissão de patrimônio...</p>
              ) : comissoes.length === 0 ? (
                <p className="text-slate-500 font-mono text-xs">Nenhuma comissão cadastrada.</p>
              ) : (
                <div className="space-y-4">
                  {comissoes.map(com => (
                    <div key={com.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/30">
                          {com.portaria}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${com.ativa ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-slate-850 text-slate-400"}`}>
                            {com.ativa ? "Ativa" : "Expirada"}
                          </span>
                          <button
                            onClick={() => handleDeleteComissao(com.id)}
                            className="text-red-400 hover:text-red-200 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 font-sans leading-relaxed">{com.descricao}</p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                        <span>Origem Portaria: {new Date(com.dataInicio).toLocaleDateString("pt-BR")}</span>
                        <span>Fim Portaria: {com.dataFim ? new Date(com.dataFim).toLocaleDateString("pt-BR") : "Vigência Indeterminada"}</span>
                      </div>

                      {/* Lista de Membros */}
                      <div className="border-t border-slate-900/80 pt-2 space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold block">Quadro de Membros Nomeados</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {com.membros.map((m, idx) => (
                            <div key={idx} className="bg-slate-900/50 p-2 rounded border border-slate-800/80 text-[11px] font-mono">
                              <p className="font-bold text-slate-200">{m.nome} ({m.funcaoComissao})</p>
                              <p className="text-slate-500 text-[10px]">Matrícula: {m.matricula}</p>
                              <p className="text-slate-500 text-[10px] truncate">Cargo: {m.cargo}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LADO DIREITO: FORMULÁRIO DE NOVA COMISSÃO (5/12) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-sm text-slate-200 uppercase font-mono tracking-tight">Criar Nova Comissão</h3>
                </div>
              </div>

              <form onSubmit={handleCreateComissao} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Decreto / Portaria Municipal</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono"
                    placeholder="PORTARIA Nº 102/2026-DAP"
                    value={formPortaria}
                    onChange={(e) => setFormPortaria(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase">Função da Portaria</label>
                  <textarea
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500"
                    placeholder="Comissão Permanente incumbida de realizar avaliação e controle de bens inservíveis..."
                    value={formComissaoDesc}
                    onChange={(e) => setFormComissaoDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">Início Vigência</label>
                    <input
                      type="date"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                      value={formComissaoDataInicio}
                      onChange={(e) => setFormComissaoDataInicio(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase">Término Vigência</label>
                    <input
                      type="date"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                      value={formComissaoDataFim}
                      onChange={(e) => setFormComissaoDataFim(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submembros Interativos */}
                <div className="border-t border-slate-800 pt-3 space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 block uppercase font-mono">Adicionar Membros Servidores</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                      placeholder="Nome do Servidor"
                      value={membroNome}
                      onChange={(e) => setMembroNome(e.target.value)}
                    />
                    <input
                      type="text"
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                      placeholder="Matrícula"
                      value={membroMatricula}
                      onChange={(e) => setMembroMatricula(e.target.value)}
                    />
                    <input
                      type="text"
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                      placeholder="Cargo Efetivo"
                      value={membroCargo}
                      onChange={(e) => setMembroCargo(e.target.value)}
                    />
                    <select
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
                      value={membroFuncao}
                      onChange={(e: any) => setMembroFuncao(e.target.value)}
                    >
                      <option value="Presidente">Presidente</option>
                      <option value="Membro">Membro Integrante</option>
                      <option value="Suplente">Suplente Juramentado</option>
                      <option value="Secretário">Secretário Administrativo</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMembroTemp}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 p-1.5 rounded text-xs font-bold font-mono cursor-pointer transition-all"
                  >
                    + Vincular Servidor na Lista
                  </button>

                  {/* Quadro de membros temporários */}
                  {membrosTemp.length > 0 && (
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5 max-h-40 overflow-y-auto">
                      <span className="text-[10px] text-slate-500 font-mono block">Membros Acoplados ({membrosTemp.length})</span>
                      {membrosTemp.map((m, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-900 px-2 py-1.5 rounded border border-slate-850 text-[11px] font-mono">
                          <span className="text-slate-300 truncate">{m.nome} ({m.funcaoComissao})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMembroTemp(index)}
                            className="text-red-400 hover:text-red-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg text-xs tracking-tight uppercase cursor-pointer transition-all"
                >
                  Registar Comissão de Baixa Oficial
                </button>
              </form>

            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          ABA 3: ESTATÍSTICAS / BALANÇO TÉCNICO DESFAZIMENTO
          ========================================================================= */}
      {activeSubTab === "estatisticas" && (
        <div className="space-y-6 text-left">
          
          {/* Bento Stats Desfazimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1 */}
            <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Processos Registados</span>
                <ClipboardList className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">{totalProcessos}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Andamento geral de baixas do almoxarifado</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Valor Residual Estimado</span>
                <Scale className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight">R$ {totalResidual?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Estimativa de venda, alienação ou descarte móvel</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Manutenção Evitada</span>
                <Wrench className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <span className="text-2xl font-extrabold text-red-400 font-mono tracking-tight">R$ {totalReparosEvitados?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Gastos técnicos poupados ao evitar reformas fúteis</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Bens Baixados com Sucesso</span>
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <span className="text-2xl font-extrabold text-blue-400 font-mono tracking-tight">{baixadosEst}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Bens já desincorporados fiscalmente</span>
              </div>
            </div>

          </div>

          {/* Gráfico Horizontal de Motivos / Categorias */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 uppercase font-mono tracking-wider">Mapeamento Técnico de Inservibilidade</h3>
            
            <div className="space-y-4.5">
              {[
                { label: "Inservível (Geral)", count: desfazimentos.filter(d => d.classificacao === "Inservível").length, color: "bg-red-500" },
                { label: "Ocioso (Bom estado porem inativo)", count: desfazimentos.filter(d => d.classificacao === "Ocioso").length, color: "bg-amber-500" },
                { label: "Recuperável (Conserto possível)", count: desfazimentos.filter(d => d.classificacao === "Recuperável").length, color: "bg-blue-500" },
                { label: "Antieconômico (Manutenção abusiva)", count: desfazimentos.filter(d => d.classificacao === "Antieconômico").length, color: "bg-purple-500" },
                { label: "Irrecuperável (Inviável consertar)", count: desfazimentos.filter(d => d.classificacao === "Irrecuperável").length, color: "bg-pink-500" },
                { label: "Obsoleto (Defasado tecnologico)", count: desfazimentos.filter(d => d.classificacao === "Obsoleto").length, color: "bg-slate-500" }
              ].map((group, idx) => {
                const percentage = totalProcessos > 0 ? (group.count / totalProcessos) * 105 : 0;
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-300 font-mono">
                      <span>{group.label}</span>
                      <span>{group.count} Itens ({Math.round(totalProcessos > 0 ? (group.count / totalProcessos) * 100 : 0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`${group.color} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dicas Legais Informativas */}
          <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl flex items-start gap-4">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold font-mono text-slate-200 uppercase">Regulamento dos Processos Administrativos de Baixa</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cada baixa efetuada alimenta automaticamente a trilha de auditoria criptográfica do sistema. Conforme exigências do <strong>Tribunal de Contas do Estado (TCE)</strong>, os bens considerados inservíveis não podem ser reincorporados ou redistribuídos a outros setores de forma precária, devendo-se cumprir as etapas de laudo colegiado e destinação final homologada em portaria oficial.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          IMPRESSOR OVERLAY: IMPRESSÃO DE DOCUMENTOS OFICIAIS (PRINT HUB)
          ========================================================================= */}
      {activePrintDocument && (
        <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
          
          {/* Header do Visualizador de Impressão */}
          <div className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-4 mb-6 no-print">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-500" />
              <span className="font-bold text-slate-200 text-sm">Visualizador de Documento Oficial - Impressão Fiscal</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 px-4 rounded text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Documento
              </button>
              <button
                onClick={() => setActivePrintDocument(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 px-4 rounded text-xs cursor-pointer transition-all"
              >
                Retornar ao Painel
              </button>
            </div>
          </div>

          {/* DOCUMENTO OFICIAL FORMATADO PARA IMPRESSÃO (A4 COMPLIANT) */}
          <div
            className="w-full max-w-4xl bg-white text-slate-900 p-12 md:p-16 rounded-lg shadow-2xl relative border border-slate-300 font-serif leading-relaxed text-left"
            id="folha-oficial-municipal-print"
            style={{ minHeight: "297mm", color: "#000" }}
          >
            {/* Linhas decorativas do topo */}
            <div className="border-b-4 border-slate-800 text-center pb-6 space-y-1.5">
              <div className="w-12 h-12 bg-slate-200 border-2 border-slate-950 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs mx-auto mb-2 font-sans select-none">
                BRASIL
              </div>
              <h1 className="text-base font-extrabold tracking-wide uppercase font-sans">SISTEMA CONTROLADOR DE INFRAESTRUTURA PATRIMONIAL</h1>
              <h2 className="text-sm font-semibold tracking-wide uppercase font-sans">SECRETARIA DE ADMINISTRAÇÃO E FINANÇAS MUNICIPAIS</h2>
              <p className="text-[10px] text-slate-600 font-mono tracking-wider">PORTARIA GERAL DE CONTROLE DE BENS E DESINCORPORAÇÃO FISCAL</p>
            </div>

            {/* Corpo do Documento 1: Caracterização de Bem Inservível */}
            {activePrintDocument.tipo === "caracterizacao" && (
              <div className="py-8 space-y-6">
                
                <h3 className="text-center font-bold text-lg underline uppercase font-sans">
                  TERMO DE CARACTERIZAÇÃO E EXAME DE BENS MÓVEIS MUNICIPAIS
                </h3>
                
                <div className="text-right text-xs font-mono text-slate-700">
                  <p>Código Dossiê: DF-{String(activePrintDocument.processo.id).padStart(4, "0")}</p>
                  <p>Data de Geração: {new Date().toLocaleDateString("pt-BR")}</p>
                </div>

                <p className="indent-8 text-sm">
                  Submete-se ao exame da Comissão Colegiada Especial nomeada no âmbito desta administração pública municipal, o bem móvel catalogado sob o número patrimonial <strong className="font-sans text-xs underline">{activePrintDocument.processo.numeroPatrimonial}</strong>, caracterizado originalmente como <strong className="font-bold underline">{activePrintDocument.processo.descricao}</strong>, atualmente alocado no setor correspondente à <strong className="font-bold">{activePrintDocument.processo.localizacaoOriginal}</strong>, para fins de regularização fiscal, depreciação contábil e respectiva baixa administrativa.
                </p>

                <h4 className="font-bold text-xs uppercase font-sans border-b border-slate-400 pb-1 mt-4">1. Elementos Analíticos Iniciais</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-slate-600 block">Classificação Atribuída:</span>
                    <strong>{activePrintDocument.processo.classificacao}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Estado de Conservação Prévio:</span>
                    <strong>{activePrintDocument.processo.estadoConservacaoOriginal}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Custo de Restauro Estimado:</span>
                    <strong>R$ {activePrintDocument.processo.custoEstimadoReparo?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Valor Residual / Descarregado:</span>
                    <strong>R$ {activePrintDocument.processo.valorResidualEstimado?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                <h4 className="font-bold text-xs uppercase font-sans border-b border-slate-400 pb-1 mt-6">2. Opinamento Ministerial Colegiado</h4>
                <p className="indent-8 text-sm">
                  {activePrintDocument.processo.parecerComissao || "O bem móvel preenche as condicionantes de bem inservível, tendo em vista seu estado físico agravado. Propõe-se a continuidade do fluxo regimental de vistoria conclusiva."}
                </p>

                <div className="pt-16 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                  <div className="border-t border-slate-600 pt-2">
                    <p className="font-bold">Engenharia / Setor de Vistoria</p>
                    <p className="text-[10px] text-slate-500">Representação Digitalizada</p>
                  </div>
                  <div className="border-t border-slate-600 pt-2">
                    <p className="font-bold">Presidente da Comissão Especial</p>
                    <p className="text-[10px] text-slate-500">Chave Assinatura: {activePrintDocument.processo.baixa?.termoAssinado || "TCE-MUNIC-AUTH"}</p>
                  </div>
                </div>

              </div>
            )}

            {/* Corpo do Documento 2: Laudo Técnico */}
            {activePrintDocument.tipo === "laudo" && (
              <div className="py-8 space-y-6">
                
                <h3 className="text-center font-bold text-lg underline uppercase font-sans">
                  LAUDO PERICIAL TÉCNICO DE INSERVIBILIDADE Nº {activePrintDocument.processo.laudo?.id || "992"}/2026
                </h3>

                <div className="text-right text-xs font-mono text-slate-700">
                  <p>Código Dossiê: DF-{String(activePrintDocument.processo.id).padStart(4, "0")}</p>
                  <p>Emitido em: {activePrintDocument.processo.laudo?.dataEmissao ? new Date(activePrintDocument.processo.laudo.dataEmissao).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</p>
                </div>

                <p className="indent-8 text-sm">
                  O vistoriador técnico municipal abaixo qualificado, no exercício de suas prerrogativas institucionais e regulatórias, procedeu ao exame pericial sobre o equipamento <strong className="font-sans text-xs underline">{activePrintDocument.processo.numeroPatrimonial} ({activePrintDocument.processo.descricao})</strong>. Foram avaliados quesitos de estrutura, circuitos, desgaste corrosivo e depreciação técnica geral.
                </p>

                <h4 className="font-bold text-xs uppercase font-sans border-b border-slate-400 pb-1 mt-4">1. Diagnóstico Peridial Clínico</h4>
                <p className="text-sm bg-slate-50 p-3 rounded border border-slate-200 italic">
                  "{activePrintDocument.processo.vistoria?.parecerTecnico || "Aparelho apresenta danos na sua placa lógica central decorrente de descargas na rede elétrica local. Inviabilidade econômica de reposição de peças uma vez que o custo orçado atinge margem superior a 60% da cotação de mercado para novo ativo de funcionalidade similar."}"
                </p>

                <h4 className="font-bold text-xs uppercase font-sans border-b border-slate-400 pb-1 mt-6">2. Conclusão Julgadora Sancionada</h4>
                <p className="indent-8 text-sm">
                  {activePrintDocument.processo.laudo?.parecerFinal || "Fica formalizado o Laudo de Inservibilidade considerando o bem como antieconômico e inservível para reuso da administração pública municipal. Ratifica-se integralmente a liberação imediata ao Setor de Doações e Descarregamento de Ativos Gerais."}
                </p>

                <div className="pt-20 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                  <div className="border-t border-slate-600 pt-2">
                    <p className="font-bold">{activePrintDocument.processo.vistoria?.servidorResponsavel || "Vistoriador Encarregado"}</p>
                    <p className="text-[10px] text-slate-500">Chave Assinatura: {activePrintDocument.processo.vistoria?.assinaturaDigital || "SIG-TÉCNICO-MUNIC"}</p>
                  </div>
                  <div className="border-t border-slate-600 pt-2">
                    <p className="font-bold">{activePrintDocument.processo.laudo?.responsavel || "Secretário de Administração/Homologante"}</p>
                    <p className="text-[10px] text-slate-500">Firmação Contábil</p>
                  </div>
                </div>

              </div>
            )}

            {/* Corpo do Documento 3: Termo de Baixa */}
            {activePrintDocument.tipo === "termo_baixa" && (
              <div className="py-8 space-y-6">
                
                <h3 className="text-center font-bold text-lg underline uppercase font-sans">
                  TERMO DE BAIXA E DESINCORPORAÇÃO PATRIMONIAL DEFINITIVA
                </h3>

                <div className="text-right text-xs font-mono text-slate-700">
                  <p>Código Dossiê: DF-{String(activePrintDocument.processo.id).padStart(4, "0")}</p>
                  <p>Data Homologação: {activePrintDocument.processo.baixa?.dataBaixa ? new Date(activePrintDocument.processo.baixa.dataBaixa).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</p>
                </div>

                <p className="indent-8 text-sm">
                  Declara-se para todos os efeitos fiscais e jurídicos a desincorporação física e contábil do patrimônio municipal <strong className="font-sans text-xs underline">{activePrintDocument.processo.numeroPatrimonial}</strong> do Inventário Ativo de Bens Móveis do Município, restando vedada a sua custódia, utilização ou manuseio por qualquer servidor municipal a título precário.
                </p>

                <h4 className="font-bold text-xs uppercase font-sans border-b border-slate-400 pb-1 mt-4">1. Destinação Homologada</h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-slate-600 block">Modalidade da Medida:</span>
                    <strong>{activePrintDocument.processo.destinacao?.tipo || "Descarte / Doação"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Instituição Receptora:</span>
                    <strong>{activePrintDocument.processo.destinacao?.empresaReceptora || "Doações Gerais da Municipalidade"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Servidor de Transferência:</span>
                    <strong>{activePrintDocument.processo.destinacao?.responsavel || "Setor de Almoxarifado Central"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Chave Validadora de Baixa:</span>
                    <strong>{activePrintDocument.processo.baixa?.termoAssinado || "ASSINADO_CONSELHO_MUNIC_2026"}</strong>
                  </div>
                </div>

                <h4 className="font-bold text-xs uppercase font-sans border-b border-slate-400 pb-1 mt-6">2. Efeitos Contábeis Regulatórios</h4>
                <p className="indent-8 text-sm text-justify">
                  Este desfazimento procedeu-se em estrita consonância com os relatórios técnicos que comprovam o esgotamento da vida útil do ativo. O balançamento patrimonial anual do município registrará a inatividade deste código para fins de prestação de contas com a Controladoria Geral e o Tribunal de Contas de âmbito Estadual.
                </p>

                <div className="pt-24 text-center text-xs font-sans max-w-sm mx-auto border-t border-slate-600">
                  <p className="font-bold">PREFEITO MUNICIPAL / SECRETARIA GERAL DE FINANÇAS</p>
                  <p className="text-[10px] text-slate-500">Decreto de Homologação Administrativa</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-1">Selo Eletrônico: {activePrintDocument.processo.baixa?.termoAssinado || "BAIXA_OK_2026"}</p>
                </div>

              </div>
            )}

            {/* Linhas de rodapé da folha oficial */}
            <div className="border-t border-slate-450 pt-3 text-center mt-auto select-none pointer-events-none text-[8px] text-slate-500 font-sans tracking-wide">
              Documento expedido eletronicamente conforme especificações do Tribunal de Contas Municipal. Sistema de Gestão Patrimonial SIGEP.
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
