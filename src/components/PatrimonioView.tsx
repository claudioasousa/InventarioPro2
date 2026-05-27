import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Printer,
  QrCode,
  ArrowLeftRight,
  Upload,
  AlertTriangle,
  FolderLock,
  RotateCcw,
  Check,
  FileCheck2,
  X,
  Camera,
  Landmark,
  Image as ImageIcon
} from "lucide-react";
import { Patrimonio, Sector, Category } from "../types";

interface PatrimonioViewProps {
  patrimonios: Patrimonio[];
  sectors: Sector[];
  categories: Category[];
  userPerfil: string;
  onAddPatrimonio: (data: Partial<Patrimonio>) => Promise<any>;
  onEditPatrimonio: (id: number, data: Partial<Patrimonio> & { motivoMovimentacao?: string }) => Promise<any>;
  onDeletePatrimonio: (id: number) => Promise<any>;
  onImportExcel: (list: any[]) => Promise<any>;
  onTransfer: (patrimonioId: number, sectorId: number, motive: string) => Promise<any>;
}

export default function PatrimonioView({
  patrimonios,
  sectors,
  categories,
  userPerfil,
  onAddPatrimonio,
  onEditPatrimonio,
  onDeletePatrimonio,
  onImportExcel,
  onTransfer
}: PatrimonioViewProps) {
  // Estados de Filtros e Busca
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Estados de Controle de Modais / Gaveta
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Patrimonio | null>(null);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [tagItem, setTagItem] = useState<Patrimonio | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<Patrimonio | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Estados do Formulário de Bem
  const [formData, setFormData] = useState({
    numeroPatrimonial: "",
    tombamento: "",
    descricao: "",
    categoriaId: "",
    quantidade: 1,
    estadoConservacao: "Ótimo",
    localizacaoAtual: "",
    setorId: "",
    dataAquisicao: new Date().toISOString().slice(0, 10),
    valorEstimado: 0,
    observacoes: "",
    fotoUrl: "",
    ativo: true,
    motivoMovimentacao: "" // Usado apenas no edit se o setor mudar
  });

  // Estados de Importação Excel / CSV
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState("");

  // Estados de Transferência Rápida
  const [transferSectorId, setTransferSectorId] = useState("");
  const [transferMotive, setTransferMotive] = useState("");

  // Estados de Scanner QR Code
  const [scannerManualCode, setScannerManualCode] = useState("");
  const [scannerStatus, setScannerStatus] = useState("");

  // Mensagens do Sistema
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Filtragem de Bens no lado do Client (complemento de robustez)
  const filteredPatrimonios = patrimonios.filter(item => {
    const textMatch =
      item.numeroPatrimonial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tombamento && item.tombamento.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.localizacaoAtual && item.localizacaoAtual.toLowerCase().includes(searchTerm.toLowerCase()));

    const sectorMatch = selectedSector ? item.setorId === Number(selectedSector) : true;
    const categoryMatch = selectedCategory ? item.categoriaId === Number(selectedCategory) : true;
    const stateMatch = selectedState ? item.estadoConservacao === selectedState : true;
    
    let statusMatch = true;
    if (selectedStatus === "active") statusMatch = item.ativo;
    if (selectedStatus === "inactive") statusMatch = !item.ativo;

    return textMatch && sectorMatch && categoryMatch && stateMatch && statusMatch;
  });

  // Limpar Filtros
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSector("");
    setSelectedCategory("");
    setSelectedState("");
    setSelectedStatus("");
  };

  // Upload e Conversão pra Base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, fotoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Lógica de Salvamento / Envio do Form
  const triggerOpenForm = (item: Patrimonio | null = null) => {
    setErrorMsg("");
    if (item) {
      setEditingItem(item);
      setFormData({
        numeroPatrimonial: item.numeroPatrimonial,
        tombamento: item.tombamento || "",
        descricao: item.descricao,
        categoriaId: String(item.categoriaId),
        quantidade: item.quantidade,
        estadoConservacao: item.estadoConservacao,
        localizacaoAtual: item.localizacaoAtual || "",
        setorId: String(item.setorId),
        dataAquisicao: item.dataAquisicao.slice(0, 10),
        valorEstimado: item.valorEstimado,
        observacoes: item.observacoes || "",
        fotoUrl: item.fotoUrl || "",
        ativo: item.ativo,
        motivoMovimentacao: ""
      });
    } else {
      setEditingItem(null);
      // Gera número sucessor aproximado
      const nextNum = `PM2026-${String(patrimonios.length + 101).padStart(4, "0")}`;
      setFormData({
        numeroPatrimonial: nextNum,
        tombamento: `TMB-${Math.floor(100000 + Math.random() * 900000)}`,
        descricao: "",
        categoriaId: categories[0]?.id ? String(categories[0].id) : "",
        quantidade: 1,
        estadoConservacao: "Ótimo",
        localizacaoAtual: "",
        setorId: sectors[0]?.id ? String(sectors[0].id) : "",
        dataAquisicao: new Date().toISOString().slice(0, 10),
        valorEstimado: 0,
        observacoes: "",
        fotoUrl: "",
        ativo: true,
        motivoMovimentacao: ""
      });
    }
    setIsFormOpen(true);
  };

  const [errorMsg, setErrorMsg] = useState("");
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      if (!formData.descricao || !formData.setorId || !formData.categoriaId) {
        throw new Error("Por favor, preencha os campos obrigatórios identificados.");
      }

      if (editingItem) {
        // Se mudou de setor no Edit, exige justificativa
        if (Number(formData.setorId) !== editingItem.setorId && !formData.motivoMovimentacao) {
          throw new Error("Justificativa de remanejamento físico exigida!");
        }

        await onEditPatrimonio(editingItem.id, {
          ...formData,
          categoriaId: Number(formData.categoriaId),
          setorId: Number(formData.setorId),
          valorEstimado: Number(formData.valorEstimado),
          quantidade: Number(formData.quantidade)
        });
        showToast(`Bem Móvel ${formData.numeroPatrimonial} atualizado.`);
      } else {
        await onAddPatrimonio({
          ...formData,
          categoriaId: Number(formData.categoriaId),
          setorId: Number(formData.setorId),
          valorEstimado: Number(formData.valorEstimado),
          quantidade: Number(formData.quantidade)
        });
        showToast(`Bem Móvel ${formData.numeroPatrimonial} incorporado ao tesouro municipal.`);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro operacional no cadastro do patrimônio.");
    }
  };

  // Exclusão Segura
  const handleDeleteTrigger = async (id: number, code: string) => {
    if (confirm(`CONFIRMAR BAIXA PERMANENTE? Esta ação irá expurgar o bem patrimonial N° ${code} de toda a malha eletrônica e gerará auditoria nacional rígida.`)) {
      try {
        await onDeletePatrimonio(id);
        showToast(`Baixa física homologada para o tombamento ${code}.`);
      } catch (err: any) {
        showToast(err.message, "error");
      }
    }
  };

  // QR Code Tag trigger
  const handleOpenTag = (item: Patrimonio) => {
    setTagItem(item);
    setIsTagOpen(true);
  };

  // Impressão Nativa Browser
  const triggerPrint = () => {
    window.print();
  };

  // Simulador de planilha Excel CSV
  const handleExcelImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus("");
    try {
      if (!importText.trim()) throw new Error("Insira as linhas de importação.");
      
      const lines = importText.split("\n");
      const listToImport: any[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes("patrimonial")) return; // pula cabeçalho se houver
        const cols = line.split(",");
        if (cols.length >= 2) {
          listToImport.push({
            numeroPatrimonial: cols[0]?.trim(),
            tombamento: cols[1]?.trim() || null,
            descricao: cols[2]?.trim(),
            categoriaId: Number(cols[3]?.trim()) || 1,
            estadoConservacao: cols[4]?.trim() || "Bom",
            localizacaoAtual: cols[5]?.trim() || "Setor",
            setorId: Number(cols[6]?.trim()) || 1,
            valorEstimado: Number(cols[7]?.trim()) || 0,
            dataAquisicao: cols[8]?.trim() || new Date().toISOString().slice(0, 10)
          });
        }
      });

      if (listToImport.length === 0) throw new Error("Formato inválido. Siga as orientações.");

      const result = await onImportExcel(listToImport);
      showToast(result.message);
      setIsImportOpen(false);
      setImportText("");
    } catch (err: any) {
      setImportStatus(err.message || "Falha na decodificação estruturada do arquivo.");
    }
  };

  // Transferência Unificada Rápida
  const handleTransferTrigger = (item: Patrimonio) => {
    setTransferItem(item);
    setTransferSectorId("");
    setTransferMotive("");
    setIsTransferOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItem || !transferSectorId || !transferMotive) return;

    try {
      if (Number(transferSectorId) === transferItem.setorId) {
        throw new Error("O setor destino não pode ser idêntico ao atual.");
      }
      await onTransfer(transferItem.id, Number(transferSectorId), transferMotive);
      showToast(`Termo de remanejamento gerado para eletrônico ${transferItem.numeroPatrimonial}.`, "success");
      setIsTransferOpen(false);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Simulador de Câmera de Leitura QR Code
  const handleQRScannerTrigger = () => {
    setScannerManualCode("");
    setScannerStatus("");
    setIsScannerOpen(true);
  };

  const handleQRScannerCheck = () => {
    setScannerStatus("");
    const code = scannerManualCode.trim().toUpperCase();
    if (!code) return;

    const match = patrimonios.find(p => p.numeroPatrimonial === code || p.tombamento === code);
    if (match) {
      setScannerStatus("sucesso");
      showToast(`Bem localizado: ${match.numeroPatrimonial} - ${match.descricao}`);
      // Fecha scanner e ativa filtro de busca imediata
      setSearchTerm(match.numeroPatrimonial);
      setIsScannerOpen(false);
    } else {
      setScannerStatus("erro");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // Coisas divertidas de QR e Barcode para colocar na etiqueta patrimonial
  const generateCrestMock = () => (
    <div className="w-10 h-10 border border-slate-700 rounded-full flex items-center justify-center p-1 bg-slate-900 shrink-0">
      <Landmark className="w-6 h-6 text-amber-500" />
    </div>
  );

  return (
    <div className="space-y-6 text-left" id="patrimonio-view-main">
      
      {/* Toast flutuante eletrônico */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl border text-sm max-w-sm flex gap-3 items-start animate-bounce ${
          toastType === "success" 
            ? "bg-slate-900 border-emerald-500/50 text-emerald-300"
            : "bg-slate-900 border-red-500/50 text-red-300"
        }`}>
          <div className={`p-1 rounded-md ${toastType === "success" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold block">Aviso do Servidor</span>
            <span className="text-xs text-slate-300">{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-blue-500" />
            Inventário Geral de Bens Móveis
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestão ativa, emissão de termos públicos, busca instantânea e geração de laudos físicos e fiscais.
          </p>
        </div>

        {/* Ações Rápidas */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleQRScannerTrigger}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Escanear QR Code Patrimonial via Imagem ou Código"
            id="btn-scan-qr"
          >
            <Camera className="w-4 h-4 text-amber-400" /> Escanear QR
          </button>

          {userPerfil !== "Consulta" && (
            <>
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                id="btn-import-xls"
              >
                <Upload className="w-4 h-4 text-emerald-400" /> Importar Planilha
              </button>

              <button
                onClick={() => triggerOpenForm(null)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-900/10 cursor-pointer"
                id="btn-create-patrimonio"
              >
                <Plus className="w-4 h-4" /> Cadastrar Novo Bem
              </button>
            </>
          )}
        </div>
      </div>

      {/* Barra de Filtros e Busca Inteligente */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Caixa de Texto Busca Inteligente */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 py-0 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por Código Patrimonial, Tombamento, Modelo ou Localização..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/80 font-medium font-sans"
              id="input-patrimonio-search"
            />
          </div>

          {/* Botões de expansão */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showFilters || selectedSector || selectedCategory || selectedState || selectedStatus
                  ? "bg-blue-950/40 border-blue-500/50 text-blue-300"
                  : "bg-slate-850 border-slate-800 text-slate-400 hover:text-white"
              }`}
              id="btn-toggle-filters"
            >
              <Filter className="w-4 h-4" /> Filtros Avançados
            </button>

            {(searchTerm || selectedSector || selectedCategory || selectedState || selectedStatus) && (
              <button
                onClick={resetFilters}
                className="p-2.5 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-500 rounded-lg text-xs"
                title="Redefinir Filtros"
                id="btn-reset-filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Filtros Ocultáveis */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800 animate-fadeIn">
            
            {/* Setor */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Secretaria / Repartição</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-medium"
                id="filter-sector-select"
              >
                <option value="">-- Todos os Setores --</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Categoria Patrimonial</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-medium"
                id="filter-category-select"
              >
                <option value="">-- Todas as Categorias --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Estado de Conservação */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Estado Físico do Bem</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-medium"
                id="filter-state-select"
              >
                <option value="">-- Todos os Estados --</option>
                <option value="Ótimo">Ótimo</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Ruim">Ruim</option>
                <option value="Inservível">Inservível (Baixa)</option>
              </select>
            </div>

            {/* Situação Municipal */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Situação Cadastral</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-medium"
                id="filter-status-select"
              >
                <option value="">-- Todas as Situações --</option>
                <option value="active">Bem Ativo (Em Uso)</option>
                <option value="inactive">Bem Inativo (Desincorporado)</option>
              </select>
            </div>

          </div>
        )}
      </div>

      {/* Lista Dinâmica de Bens */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {filteredPatrimonios.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-4">
            <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto" id="no-assets-warning-logo" />
            <div>
              <p className="font-bold text-sm text-slate-300">Nenhum bem governamental localizado</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Tente ajustar seus termos de busca ou filtros ao lado para encontrar outros registros municipais.</p>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-800 border border-slate-700 hover:text-white rounded-lg text-xs"
              id="btn-clear-empty-results"
            >
              Exibir Todos os Bens
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-950/40">
                  <th className="p-4 font-semibold">Tombamento / Código</th>
                  <th className="p-4 font-semibold">Descrição do Bem Móvel</th>
                  <th className="p-4 font-semibold">Localização & Repartição</th>
                  <th className="p-4 font-semibold">Condição</th>
                  <th className="p-4 font-semibold text-right">Avaliação Real</th>
                  <th className="p-4 font-semibold text-center no-print">Ações de Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredPatrimonios.map(item => {
                  const sLabel = sectors.find(s => s.id === item.setorId)?.sigla || "S/D";
                  const sNome = sectors.find(s => s.id === item.setorId)?.nome || "Não definido";
                  const cLabel = categories.find(c => c.id === item.categoriaId)?.nome || "Geral";

                  let stateBadgeColor = "bg-slate-800 border-slate-700 text-slate-300";
                  if (item.estadoConservacao === "Ótimo") stateBadgeColor = "bg-emerald-950/60 border-emerald-950 text-emerald-400";
                  if (item.estadoConservacao === "Bom") stateBadgeColor = "bg-blue-950/60 border-blue-950 text-blue-400";
                  if (item.estadoConservacao === "Regular") stateBadgeColor = "bg-amber-950/60 border-amber-900 text-amber-400";
                  if (item.estadoConservacao === "Ruim") stateBadgeColor = "bg-orange-950/60 border-orange-900 text-orange-400";
                  if (item.estadoConservacao === "Inservível") stateBadgeColor = "bg-red-950/60 border-red-900 text-red-400";

                  return (
                    <tr key={item.id} className="hover:bg-slate-850/45 transition-colors group">
                      
                      {/* Código de barras / Numero */}
                      <td className="p-4 font-mono">
                        <div className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
                          {item.numeroPatrimonial}
                          {!item.ativo && (
                            <span className="text-[8px] bg-red-950/40 border border-red-500/30 text-red-500 font-semibold uppercase px-1 rounded">
                              Baixado
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.tombamento}</div>
                      </td>

                      {/* Descricao */}
                      <td className="p-4 max-w-sm">
                        <div className="font-semibold text-slate-100 line-clamp-1 group-hover:text-blue-400 transition-colors" title={item.descricao}>
                          {item.descricao}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <span className="bg-slate-800 px-1.5 rounded">{cLabel}</span>
                          <span>Adquirido: {new Date(item.dataAquisicao).toLocaleDateString("pt-BR")}</span>
                          {item.quantidade > 1 && <span className="font-bold text-amber-500/80">Qtd: {item.quantidade}x</span>}
                        </div>
                      </td>

                      {/* Repartição / Setor */}
                      <td className="p-4 text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-400 bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-900/30 font-mono text-[10px]" title={sNome}>
                            {sLabel}
                          </span>
                          <span className="truncate max-w-[150px] text-xs" title={item.localizacaoAtual}>
                            {item.localizacaoAtual || "Saguão Principal"}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] ${stateBadgeColor}`}>
                          {item.estadoConservacao}
                        </span>
                      </td>

                      {/* Valoração */}
                      <td className="p-4 text-right font-mono font-bold text-slate-200">
                        {formatCurrency(item.valorEstimado)}
                        {item.quantidade > 1 && (
                          <div className="text-[9px] text-slate-500 font-normal">
                            Tot: {formatCurrency(item.valorEstimado * item.quantidade)}
                          </div>
                        )}
                      </td>

                      {/* Ações de Controle */}
                      <td className="p-4 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          
                          {/* Imprimir Etiqueta */}
                          <button
                            onClick={() => handleOpenTag(item)}
                            className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700/80 rounded transition-all"
                            title="Visualizar Chapa / Etiqueta QR"
                            id={`btn-label-patrimonio-${item.id}`}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {userPerfil !== "Consulta" && (
                            <>
                              {/* Relação Transferência rápida */}
                              <button
                                onClick={() => handleTransferTrigger(item)}
                                className="p-1 px-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 border border-transparent rounded transition-all"
                                title="Lançar Guia de Transferência"
                                id={`btn-transfer-patrimonio-${item.id}`}
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>

                              {/* Editar */}
                              <button
                                onClick={() => triggerOpenForm(item)}
                                className="p-1 px-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 border border-transparent rounded transition-all"
                                title="Editar Metadados"
                                id={`btn-edit-patrimonio-${item.id}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Cancelamento / Baixa */}
                              {userPerfil === "Administrador" && (
                                <button
                                  onClick={() => handleDeleteTrigger(item.id, item.numeroPatrimonial)}
                                  className="p-1 px-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-transparent rounded transition-all"
                                  title="Baixar Permanentemente"
                                  id={`btn-delete-patrimonio-${item.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: FORMULÁRIO DE CADASTRO / EDIÇÃO ================= */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative my-8 animate-fadeIn">
            
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
              id="btn-close-form"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 text-left">
              <h3 className="text-lg font-bold text-white">
                {editingItem ? "Atualizar Ficha Informativa do Bem" : "Adicionar Bem Móvel ao Tesouro"}
              </h3>
              <p className="text-xs text-slate-400">
                Lançamento formal com validadores de tombo eletrônico municipal.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 text-red-300 text-xs rounded-lg font-medium text-left">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
              
              <div className="grid grid-cols-2 gap-3">
                {/* Código Patrimonial */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Cód Patrimônio *</label>
                  <input
                    type="text"
                    value={formData.numeroPatrimonial}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroPatrimonial: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40 font-semibold"
                    required
                  />
                </div>

                {/* Chapa/Tombamento alternativo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Chapa Tombamento (Opcional)</label>
                  <input
                    type="text"
                    value={formData.tombamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, tombamento: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
                    placeholder="TMB-999333"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Descrição do Ativo *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Notebook Lenovo ThinkPad L14 Intel i7 16GB RAM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
                  required
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Categoria */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Categoria *</label>
                  <select
                    value={formData.categoriaId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoriaId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-medium"
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Setor */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Setor Responsável *</label>
                  <select
                    value={formData.setorId}
                    onChange={(e) => setFormData(prev => ({ ...prev, setorId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-medium"
                    required
                  >
                    <option value="">Selecione...</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Depósito ou Sala física específica */}
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Sala / Sublocalização</label>
                  <input
                    type="text"
                    value={formData.localizacaoAtual}
                    onChange={(e) => setFormData(prev => ({ ...prev, localizacaoAtual: e.target.value }))}
                    placeholder="Bloco 3 - Sala 204"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Quantidade */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Qtd Física *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                {/* Data aquisicao */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Acomodação *</label>
                  <input
                    type="date"
                    value={formData.dataAquisicao}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataAquisicao: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none font-mono"
                    required
                  />
                </div>

                {/* Valor Estimado */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Valor Unitário (R$)*</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorEstimado}
                    onChange={(e) => setFormData(prev => ({ ...prev, valorEstimado: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                {/* Conservação */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Conservação *</label>
                  <select
                    value={formData.estadoConservacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, estadoConservacao: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-semibold"
                    required
                  >
                    <option value="Ótimo">Ótimo</option>
                    <option value="Bom">Bom</option>
                    <option value="Regular">Regular</option>
                    <option value="Ruim">Ruim</option>
                    <option value="Inservível">Inservível</option>
                  </select>
                </div>
              </div>

              {/* Justificativa OBRIGATÓRIA se alterou setor em edição */}
              {editingItem && Number(formData.setorId) !== editingItem.setorId && (
                <div className="p-3 bg-amber-955/30 border border-amber-500/40 rounded-lg space-y-1 pb-4">
                  <label className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider font-mono block">
                    ⚠ Justificativa Pública de Remanejamento Físico *
                  </label>
                  <p className="text-[9px] text-amber-500/90 mb-2">
                    Você alterou o setor responsável oficial deste patrimônio. Justifique o motivo legal do transporte físico para manter o compliance administrativo.
                  </p>
                  <input
                    type="text"
                    value={formData.motivoMovimentacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, motivoMovimentacao: e.target.value }))}
                    placeholder="Ex: Doação por cooperação técnica / Remanejamento por obsolescência"
                    className="w-full bg-slate-950 border border-amber-500/40 text-xs text-white rounded-lg p-2 focus:outline-emerald-500"
                    required
                  />
                </div>
              )}

              {/* Upload de Foto */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono block">Anexar Fotografia de Auditoria</label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded flex items-center justify-center overflow-hidden shrink-0">
                    {formData.fotoUrl ? (
                      <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 text-left text-[11px] text-slate-400">
                    <span className="block font-medium">Selecione uma imagem (.png, .jpg)</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Sera hospedada inline usando codificação Base64.</span>
                  </div>
                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded text-xs font-semibold cursor-pointer">
                    Escolher Foto
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Observações Internas (Laudos de Entrada)</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white h-20 focus:outline-none"
                  placeholder="Informações periciais complementares, termo de doação ou licitação originária..."
                />
              </div>

              {/* Ativo Status */}
              <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-lg border border-slate-800/60">
                <input
                  type="checkbox"
                  id="form-ativo-check"
                  checked={formData.ativo}
                  onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-slate-800 rounded focus:ring-blue-500"
                />
                <label htmlFor="form-ativo-check" className="text-xs font-semibold text-slate-300 cursor-pointer text-left">
                  Tombamento Homologado e Ativo
                  <span className="block text-[10px] font-normal text-slate-500">Mantenha marcado se o bem móvel estiver formalmente ativo no município.</span>
                </label>
              </div>

              {/* Botão Salvar */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer mt-4 active:scale-[0.99]"
                id="btn-form-save"
              >
                <FileCheck2 className="w-4 h-4" />
                {editingItem ? "Atualizar Assinatura do Registro" : "Homologar e Selar Tombamento"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: VISUALIZAR E IMPRIMIR ETIQUETA / TAG PATRIMONIAL ================= */}
      {isTagOpen && tagItem && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-black p-6 rounded-2xl w-full max-w-sm shadow-2xl relative border border-slate-300 no-print">
            
            <button
              onClick={() => setIsTagOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-black cursor-pointer"
              id="btn-close-tag-modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Etiqueta Área imprimível */}
            <div className="my-6 p-4 border-2 border-dashed border-slate-400 rounded-xl bg-slate-50 text-left" id="printable-plate-area">
              <div className="flex items-start gap-3 border-b-2 border-slate-800 pb-3 mb-3">
                {generateCrestMock()}
                <div>
                  <h4 className="text-xs font-extrabold tracking-tight">PREFEITURA MUNICIPAL</h4>
                  <p className="text-[9px] font-mono font-medium text-slate-500">REPARTIÇÃO DE PATRIMÔNIO DIGITAL</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="text-[10px] text-slate-500 font-mono">TOMBAMENTO PATRIMONIAL</div>
                <div className="text-lg font-black tracking-wider text-slate-950 font-mono -mt-1 select-all">{tagItem.numeroPatrimonial}</div>
                
                <div className="text-[10px] text-slate-500 font-mono mt-2">DESCRIÇÃO DO BEM</div>
                <div className="text-xs text-slate-800 font-bold leading-tight">{tagItem.descricao}</div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[8px] text-slate-500 font-mono block">SECRETARIA</span>
                    <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-1 rounded font-mono">
                      {sectors.find(s => s.id === tagItem.setorId)?.sigla || "PM"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-500 font-mono block">VALORAÇÃO</span>
                    <span className="text-[10px] font-extrabold font-mono">{formatCurrency(tagItem.valorEstimado)}</span>
                  </div>
                </div>
              </div>

              {/* Representação Vetorial de QR de Alta Fidelidade */}
              <div className="bg-white p-3 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
                <div className="font-mono text-[9px] text-slate-500 space-y-1 text-left">
                  <span className="block font-black text-black">Acesso Autônomo QR</span>
                  <span className="block">Aponte para validar chapa</span>
                  <span className="block font-bold">Chapa: {tagItem.tombamento}</span>
                </div>
                {/* SVG mock representativo de QR code estático */}
                <svg className="w-16 h-16 shrink-0 border border-slate-300 p-1" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white" />
                  {/* Position detection markers */}
                  <rect x="5" y="5" width="25" height="25" fill="black" />
                  <rect x="10" y="10" width="15" height="15" fill="white" />
                  <rect x="12.5" y="12.5" width="10" height="10" fill="black" />

                  <rect x="70" y="5" width="25" height="25" fill="black" />
                  <rect x="75" y="10" width="15" height="15" fill="white" />
                  <rect x="77.5" y="12.5" width="10" height="10" fill="black" />

                  <rect x="5" y="70" width="25" height="25" fill="black" />
                  <rect x="10" y="75" width="15" height="15" fill="white" />
                  <rect x="12.5" y="77.5" width="10" height="10" fill="black" />
                  
                  {/* Random pixels to simulate QR data */}
                  <rect x="40" y="10" width="8" height="8" fill="black" />
                  <rect x="52" y="5" width="12" height="6" fill="black" />
                  <rect x="44" y="24" width="8" height="15" fill="black" />
                  <rect x="80" y="40" width="15" height="8" fill="black" />
                  <rect x="40" y="45" width="25" height="5" fill="black" />
                  <rect x="5" y="40" width="18" height="6" fill="black" />
                  <rect x="55" y="55" width="10" height="10" fill="black" />
                  <rect x="70" y="70" width="25" height="25" fill="black" />
                  <rect x="75" y="75" width="15" height="15" fill="white" />
                  <rect x="80" y="80" width="5" height="5" fill="black" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={triggerPrint}
                className="w-full bg-slate-900 text-white hover:bg-black font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer"
                id="btn-print-tag"
              >
                <Printer className="w-4 h-4" /> Enviar para Impressora de Etiquetas
              </button>
              <p className="text-[10px] text-slate-500 text-center leading-tight">
                Emite chapa anti-violação acrílica com selo municipal em alta resolução para colar no bem de TI ou móvel físico.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: ESQUELETO DE IMPORTAÇÃO CSV / EXCEL ================= */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative text-left animate-fadeIn">
            
            <button
              onClick={() => setIsImportOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
              id="btn-close-import-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                Importar Lista de Bens (Spreadsheet)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Substitua planilhas do governo enviando as linhas de bens estruturadas.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 space-y-1">
              <span className="font-extrabold text-amber-500 block mb-1">📋 MODELO FORMATO CSV ACEITO (Corte e Cole abaixo):</span>
              <span className="block italic text-slate-500">codigo_patrimonio, tombamento_alternativo, descricao, categoria_id, conservacao, sala_fisica, setor_id, valor_real</span>
              <span className="block text-slate-400 bg-slate-900 p-1.5 rounded select-all">PM2026-0501, TMB-491740, Impressora Laser Brother 2540, 1, Ótimo, Gabinete Executivo, 1, 1499.0</span>
              <span className="block text-slate-400 bg-slate-900 p-1.5 rounded select-all">PM2026-0502, TMB-281057, Cadeira de Escritório Azul, 2, Bom, Sala TI, 4, 850.0</span>
            </div>

            {importStatus && (
              <div className="mt-3 p-2 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded select-none font-medium">
                {importStatus}
              </div>
            )}

            <form onSubmit={handleExcelImportSubmit} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Linhas CSV para Processamento Eletrônico</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole aqui suas linhas, uma por linha..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-3 rounded-lg text-xs h-36 focus:outline-none focus:border-blue-500/40 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                id="btn-import-submit"
              >
                <FileCheck2 className="w-4 h-4" /> Descodificar e Importar Ativos
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: ESQUELETO DE REMANEJAMENTO / TRANSFERÊNCIA RÁPIDA ================= */}
      {isTransferOpen && transferItem && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative text-left animate-fadeIn">
            
            <button
              onClick={() => setIsTransferOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
              id="btn-close-transfer-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-blue-500" />
                Termo de Transferência e Remanejamento
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Mudança física e de governabilidade do tombamento eletrônico.
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-1.5 mb-4">
              <div>BEM SELECIONADO: <span className="font-extrabold text-white">{transferItem.numeroPatrimonial}</span></div>
              <div className="text-slate-400 line-clamp-1">{transferItem.descricao}</div>
              <div>Origem Atual: <span className="font-black text-amber-400">{sectors.find(s => s.id === transferItem.setorId)?.sigla} - {sectors.find(s => s.id === transferItem.setorId)?.nome}</span></div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              
              {/* Setor de Destino */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Repartição / Secretaria de Destino *</label>
                <select
                  value={transferSectorId}
                  onChange={(e) => setTransferSectorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/40 font-semibold"
                  required
                >
                  <option value="">Selecione o Destino...</option>
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>
                  ))}
                </select>
              </div>

              {/* Motivo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Motivo Formal do Transporte *</label>
                <input
                  type="text"
                  value={transferMotive}
                  onChange={(e) => setTransferMotive(e.target.value)}
                  placeholder="Ex: Reforço de servidores em virtude de ampliação de leitos SESAU."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                id="btn-transfer-submit"
              >
                <Check className="w-4 h-4" /> Lançar Transferência com Assinatura
              </button>

            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: SIMULADOR DE SCANNER QR CODE ================= */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative text-left">
            
            <button
              onClick={() => setIsScannerOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
              id="btn-close-scanner-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 text-center">
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-amber-400 animate-pulse" />
                Simulador de Câmera de Leitura
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Aponte a câmera do smartphone municipal ou insira a chapa do patrimônio móvel.
              </p>
            </div>

            {/* Quadro visual que simula laser de leitura */}
            <div className="h-44 bg-slate-950 border-2 border-slate-700 rounded-xl relative overflow-hidden flex items-center justify-center mb-4">
              <div className="w-40 h-40 border-2 border-dashed border-blue-500/40 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-600/70" />
              </div>
              {/* Laser pulsante simulado pelo index.css */}
              <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-lg shadow-red-500/80 scanner-laser top-0" />
            </div>

            {scannerStatus === "sucesso" && (
              <div className="p-2 mb-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-center font-bold text-xs rounded select-none">
                ✔ Bem Identificado no Servidor!
              </div>
            )}

            {scannerStatus === "erro" && (
              <div className="p-2 mb-3 bg-red-950/40 border border-red-500/30 text-red-400 text-center font-bold text-xs rounded select-none">
                ✖ Tombamento não localizado ou inconsistente.
              </div>
            )}

            {/* Suporte de simulação manual para facilitação de testes */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">💡 Códigos para TESTE RÁPIDO (Corte/Cole abaixo):</span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setScannerManualCode("PM2026-0001")}
                    className="p-1 px-1.5 bg-slate-950 rounded text-[9px] text-slate-300 font-mono cursor-pointer border border-slate-800"
                  >
                    PM2026-0001
                  </button>
                  <button
                    onClick={() => setScannerManualCode("PM2026-0004")}
                    className="p-1 px-1.5 bg-slate-950 rounded text-[9px] text-slate-300 font-mono cursor-pointer border border-slate-800"
                  >
                    PM2026-0004
                  </button>
                  <button
                    onClick={() => setScannerManualCode("PM2026-0005")}
                    className="p-1 px-1.5 bg-slate-950 rounded text-[9px] text-slate-300 font-mono cursor-pointer border border-slate-800"
                  >
                    PM2026-0005
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannerManualCode}
                  onChange={(e) => setScannerManualCode(e.target.value)}
                  placeholder="Ex: PM2026-0001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white uppercase font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleQRScannerCheck}
                  className="px-4 bg-blue-600 hover:bg-blue-500 whitespace-nowrap text-white rounded-lg text-xs font-semibold cursor-pointer"
                  id="btn-scanner-sim-check"
                >
                  Validar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
