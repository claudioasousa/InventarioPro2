import React, { useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import { Sector, Category } from "../types";

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

  const showGlobalMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

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

  return (
    <div className="space-y-6 text-left" id="configuracoes-view-main">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500 animate-spin" />
          Configurações, Repartições & Segurança Pública
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Gerenciamento operacional da hierarquia governamental e controle preventivo de cópia de segurança eletrônica.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Adicionar Novo Setor */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
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

      {/* Seção Extra: Backup System (item 11) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
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
              <label className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-semibold text-red-400 flex items-center gap-1.5 cursor-pointer" title="Fazer Upload de backup JSON salvo anteriormente">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-400 bg-slate-950/40 p-4 rounded-lg border border-slate-855">
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

    </div>
  );
}
