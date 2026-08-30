import React, { useState } from 'react';
import { Lock, UserCheck, KeyRound, X, Send, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { requestAccess, loginUser } from '../lib/api';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess
}) {
  const [tab, setTab] = useState('request'); // 'request' or 'login'
  
  // Request Access Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [usePin, setUsePin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await requestAccess(name, email, password, reason);
      setIsSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await loginUser(
        usePin ? { pin: adminPin } : { email: loginEmail, password: loginPassword }
      );
      if (res.success && res.user) {
        onLoginSuccess(res.user, res.token);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                Protected Workspace
              </h3>
              <p className="text-[11px] text-neutral-400">
                Phakaphol's Obsidian Vault
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center px-4 pt-3 gap-2 border-b border-neutral-100 dark:border-neutral-800 text-xs">
          <button
            onClick={() => { setTab('request'); setErrorMsg(''); }}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              tab === 'request'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <UserCheck size={14} />
            <span>Request Edit Access</span>
          </button>

          <button
            onClick={() => { setTab('login'); setErrorMsg(''); }}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              tab === 'login'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <KeyRound size={14} />
            <span>Sign In</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'request' ? (
            isSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                  Request Submitted!
                </h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  Your request has been forwarded to <strong>Phakaphol (Admin)</strong>. Once approved in PK Brain, you can log in with your email and password.
                </p>
                <button
                  onClick={() => { setTab('login'); setIsSubmitted(false); }}
                  className="mt-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 transition-colors"
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
                <p className="text-neutral-500 text-[11px] leading-relaxed">
                  To edit or create notes in this Obsidian vault, please request access. Phakaphol will review and approve your request in PK Brain.
                </p>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Desired Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Reason / Note to Admin</label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Collaborating on SCB QA automation notes..."
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-2"
                >
                  <Send size={13} />
                  <span>{loading ? 'Submitting...' : 'Send Request to Admin'}</span>
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-neutral-500 text-[11px]">Sign in with approved credentials</span>
                <button
                  type="button"
                  onClick={() => setUsePin(!usePin)}
                  className="text-rose-500 hover:underline text-[11px] font-mono"
                >
                  {usePin ? 'Use Email / Password' : 'Admin Master PIN'}
                </button>
              </div>

              {usePin ? (
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Admin Master PIN</label>
                  <input
                    type="password"
                    required
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="Enter Master PIN"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400 font-mono tracking-widest text-center"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. approved@example.com"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-2"
              >
                <KeyRound size={13} />
                <span>{loading ? 'Authenticating...' : 'Sign In & Unlock Editor'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
