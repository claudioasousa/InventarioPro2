import React, { useState } from "react";
import { Shield, Key, Mail, Landmark, HelpCircle, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: any) => void;
  onLoginAttempt: (email: string, pass: string) => Promise<any>;
  onPasswordRecovery: (email: string) => Promise<string>;
}

export default function LoginScreen({
  onLoginSuccess,
  onLoginAttempt,
  onPasswordRecovery
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isRecovery) {
        if (!recoveryEmail) {
          throw new Error("Preencha o e-mail cadastrado.");
        }
        const msg = await onPasswordRecovery(recoveryEmail);
        setSuccessMsg(msg);
        setRecoveryEmail("");
      } else {
        if (!email || !password) {
          throw new Error("Insira as credenciais de acesso patrimonial.");
        }
        const data = await onLoginAttempt(email, password);
        onLoginSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o sistema municipal.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickMail: string, quickPass: string) => {
    setEmail(quickMail);
    setPassword(quickPass);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100" id="login-screen-v2">
      {/* Metade Esquerda: Apresentação Institucional */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-16 bg-cover bg-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/60 via-slate-950 to-slate-950 border-r border-slate-800/60 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/30 border border-blue-500/50 rounded-xl">
            <Landmark className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-left">
            <h1 className="font-extrabold text-lg tracking-wider text-white">
              SIGEP <span className="text-blue-500 underline decoration-2">MUNICIPAL</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400 tracking-widest">SISTEMA INTEGRADO DE PATRIMÔNIO</p>
          </div>
        </div>

        <div className="my-12 text-left space-y-4">
          <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full">
            Órgão Municipal Eletrônico
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Gestão Ativa de <br />
            <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
              Bens Patrimoniais Móveis
            </span>
          </h2>
          <p className="text-slate-400 text-sm max-w-md">
            Módulo oficial de registro de tombamentos, remanejamentos físicos, auditorias eletrônicas e emissão de laudos de inservibilidade da máquina pública municipal.
          </p>
        </div>

        <div className="text-left text-xs text-slate-500 font-mono border-t border-slate-900 pt-4 flex justify-between items-center">
          <span>SIGEP Municipal © 2026</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-blue-500/80" /> Criptografia ForteAtiva
          </span>
        </div>
      </div>

      {/* Metade Direita: O Formulário */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-16 bg-slate-900/40 relative">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl relative">
          
          <div className="mb-6 text-left">
            <h3 className="text-2xl font-bold text-white">
              {isRecovery ? "Recuperação de Acesso" : "Autenticação Oficial"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isRecovery 
                ? "Disparar token de redefinição de segurança patrimonial"
                : "Insira suas credenciais governamentais ativas"
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 text-red-300 text-xs rounded-lg text-left font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg text-left flex gap-2 items-start">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isRecovery ? (
              <>
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-slate-300">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 py-0 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.nome@patrimonio.gov.br"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/80 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300">Assinatura Digital (Senha)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecovery(true);
                        setError("");
                        setSuccessMsg("");
                      }}
                      className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 py-0 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/80 font-medium"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">Digite seu e-mail cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 py-0 text-slate-500" />
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="exemplo@patrimonio.gov.br"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/80 transition-all font-medium"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/80 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
              id="btn-login-submit"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : isRecovery ? (
                "Enviar Token de Segurança"
              ) : (
                "Verificar Assinatura e Entrar"
              )}
            </button>
          </form>

          {isRecovery && (
            <button
              onClick={() => {
                setIsRecovery(false);
                setError("");
                setSuccessMsg("");
              }}
              className="mt-4 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer block mx-auto underline"
            >
              Voltar ao Login tradicional
            </button>
          )}

          {/* Seção Governamental: Perfis de Carga de Testes */}
          {!isRecovery && (
            <div className="mt-8 pt-6 border-t border-slate-800/80 text-left">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500/80 block mb-3 font-semibold">
                ▲ Demonstração / Credenciais de Teste Rápido
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("admin@patrimonio.gov.br", "admin123")}
                  className="bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-[10px] text-slate-300 p-2 rounded text-center transition-all cursor-pointer truncate"
                  title="Administrador Geral"
                  id="btn-quick-admin"
                >
                  <div className="font-semibold text-white">ADMIN</div>
                  <div className="text-[8px] text-slate-500 truncate">Total Controle</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("operador@patrimonio.gov.br", "operador123")}
                  className="bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-[10px] text-slate-300 p-2 rounded text-center transition-all cursor-pointer truncate"
                  title="Operador Seccional"
                  id="btn-quick-operador"
                >
                  <div className="font-semibold text-white">OPERADOR</div>
                  <div className="text-[8px] text-slate-500 truncate">Cadastro & Transf</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin("consulta@patrimonio.gov.br", "consulta123")}
                  className="bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-[10px] text-slate-300 p-2 rounded text-center transition-all cursor-pointer truncate"
                  title="Consulta Fiscal"
                  id="btn-quick-consulta"
                >
                  <div className="font-semibold text-white">AUDITORIA</div>
                  <div className="text-[8px] text-slate-500 truncate">Apenas Visualiza</div>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
