import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Info,
  Server,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bankingApi } from '../services/api';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Field validation states
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [testAccounts, setTestAccounts] = useState<any[]>([]);

  // Load test accounts for convenience
  useEffect(() => {
    bankingApi.getTestAccounts().then((data) => {
      if (data && data.accounts) {
        setTestAccounts(data.accounts);
      }
    }).catch(() => {
      // fallback test accounts
      setTestAccounts([
        { username: 'aarav_patel', role: 'CUSTOMER', description: 'Retail Banking Customer (ACC-1002341)' },
        { username: 'teller_ops', role: 'TELLER', description: 'Branch Operations Officer' },
        { username: 'compliance_officer', role: 'COMPLIANCE_OFFICER', description: 'Chief AML & Risk Compliance Officer' },
        { username: 'admin_operator', role: 'ADMIN', description: 'Platform Operations SRE / Administrator' }
      ]);
    });
  }, []);

  const validate = () => {
    const errs: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errs.username = 'Please enter your username or registered email address.';
    }
    if (!password) {
      errs.password = 'Please enter your account password.';
    } else if (password.length < 4) {
      errs.password = 'Password must be at least 4 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(username.trim(), password, rememberMe);
      setSuccessMsg(`Welcome back, ${user.username}! Access granted.`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid username or password. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrors({});
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#070d1e] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Background Ambient Glow & Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.1),transparent_40%)] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(56, 189, 248, 0.25) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Header / Branding Bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-sky-950/40 bg-[#091124]/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/30 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-md shadow-sky-500/10">
            <Cpu className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>WRENCH WISE</span>
                <span className="text-sky-400 font-normal">AI BANKING</span>
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono tracking-wide">
                SIMULATED BANKING
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Operations Console &bull; Multi-Agent Architecture
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTestAccounts(!showTestAccounts)}
            className="text-xs px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-500/30 hover:border-sky-400/60 text-sky-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Demo Test Accounts</span>
            <span className="sm:hidden">Accounts</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="relative rounded-2xl bg-[#0b142c]/90 border border-sky-900/50 backdrop-blur-xl shadow-2xl shadow-sky-950/60 p-6 sm:p-8">
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

            {/* Header Titles */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-400 mb-3 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-sky-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
              <p className="text-sm text-slate-400 mt-1">Banking Operations Console</p>
            </div>

            {/* Simulated Banner Notice */}
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Simulated Banking Environment:</span>{' '}
                Authorized operations personnel only. Authenticate with your platform credentials to access the banking operations dashboard.
              </div>
            </div>

            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address or Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="username-input"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors({ ...errors, username: undefined });
                    }}
                    placeholder="e.g. aarav_patel or admin_operator"
                    className={`w-full bg-[#070e22] border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition ${
                      errors.username
                        ? 'border-rose-500/80 focus:border-rose-400'
                        : 'border-slate-700/70 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30'
                    }`}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs text-rose-400">{errors.username}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-sky-400 hover:text-sky-300 transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    placeholder="Enter account password"
                    className={`w-full bg-[#070e22] border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition ${
                      errors.password
                        ? 'border-rose-500/80 focus:border-rose-400'
                        : 'border-slate-700/70 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-400">{errors.password}</p>
                )}
              </div>

              {/* Remember Me Toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-[#070e22] text-sky-500 focus:ring-sky-400/30 cursor-pointer"
                  />
                  <span>Remember Me on this browser</span>
                </label>
              </div>

              {/* Submit Button with Loading Indicator */}
              <button
                id="sign-in-button"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Authenticating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Accordion */}
            {showTestAccounts && (
              <div className="mt-6 pt-5 border-t border-slate-800 animate-in fade-in">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Quick Demo Credentials:
                  </span>
                  <span className="text-[10px] text-slate-400">Click to autofill</span>
                </div>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('admin_operator', 'Admin@2026!')}
                    className="w-full text-left p-2 rounded-lg bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/40 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sky-200">admin_operator</div>
                      <div className="text-[10px] text-slate-400">Platform SRE / Administrator</div>
                    </div>
                    <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded">
                      Admin@2026!
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickAccount('compliance_officer', 'Compliance@2026!')}
                    className="w-full text-left p-2 rounded-lg bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/40 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sky-200">compliance_officer</div>
                      <div className="text-[10px] text-slate-400">AML & Risk Compliance Officer</div>
                    </div>
                    <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded">
                      Compliance@2026!
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuickAccount('aarav_patel', 'Patel@2026!')}
                    className="w-full text-left p-2 rounded-lg bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/40 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sky-200">aarav_patel</div>
                      <div className="text-[10px] text-slate-400">Retail Banking Customer</div>
                    </div>
                    <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded">
                      Patel@2026!
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0d1633] border border-sky-800/60 p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-sky-400 mb-3">
              <KeyRound className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-white">Password Recovery</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              In this simulated banking environment, passwords are encrypted with bcrypt and cannot be retrieved in plaintext. 
              Please contact the platform administrator or use one of the pre-configured accounts:
            </p>
            <div className="p-3 rounded-lg bg-navy-950/80 border border-slate-700/60 space-y-1.5 text-xs font-mono text-slate-300 mb-5">
              <div><strong className="text-sky-300">admin_operator:</strong> Admin@2026!</div>
              <div><strong className="text-sky-300">compliance_officer:</strong> Compliance@2026!</div>
              <div><strong className="text-sky-300">aarav_patel:</strong> Patel@2026!</div>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-sky-500/20 border border-sky-400/40 hover:bg-sky-500/30 text-sky-300 font-semibold text-xs transition cursor-pointer"
            >
              Close & Return to Sign In
            </button>
          </div>
        </div>
      )}

      {/* Footer Notice */}
      <footer className="relative z-10 w-full border-t border-sky-950/40 bg-[#091124]/60 px-6 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Wrench Wise AI Banking &bull; Simulated Real-Time Architecture with Multi-Agent Automation</span>
        <span className="font-mono text-[11px] text-slate-400">BCBS 238 &bull; FATF Recommendation 16 &bull; Production Blueprint</span>
      </footer>
    </div>
  );
};
