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
      const res = await loginUser({ email: loginEmail, password: loginPassword });
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
              <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                PK Notes Access
              </h3>
              <p className="text-[11px] text-neutral-400">
                Obsidian Vault & AI Workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-100 dark:border-neutral-800 text-xs font-semibold">
          <button
            onClick={() => { setTab('request'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              tab === 'request'
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            1. Request Edit Access
          </button>
          <button
            onClick={() => { setTab('login'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              tab === 'login'
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            2. Sign In (Approved Users)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'request' ? (
            isSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                  ส่งคำขอเข้าใช้งานสำเร็จแล้ว!
                </h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                  คำขอของคุณถูกส่งไปยัง <b>PK Brain</b> แล้ว เมื่อแอดมิน Phakaphol กด Approve คุณจะสามารถนำ Email และ Password นี้มา Login เข้าใช้งานได้ทันทีครับ
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setTab('login');
                  }}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition-colors mt-2"
                >
                  ไปที่หน้า Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
                <p className="text-neutral-500 text-[11px] leading-relaxed">
                  กรอกข้อมูลเพื่อขอสิทธิ์แก้ไขโน้ตและใช้งาน AI เจ้าของ (Phakaphol) จะเป็นผู้อนุมัติผ่าน PK Brain เท่านั้น
                </p>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">ชื่อ-นามสกุล / ชื่อเล่น</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">ตั้งรหัสผ่านสำหรับเข้าสู่ระบบ</label>
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
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">เหตุผลที่ขอสิทธิ์เข้าใช้งาน</label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="เช่น ช่วยสรุปโน้ตวิชา KMUTT, ศึกษางาน SCB QA..."
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-neutral-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-2 cursor-pointer"
                >
                  <Send size={13} />
                  <span>{loading ? 'กำลังส่งคำขอ...' : 'ส่งคำขอเข้าใช้งาน (Send Request)'}</span>
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
              <div className="mb-2">
                <span className="text-neutral-500 text-[11px] leading-relaxed">
                  เข้าสู่ระบบด้วย Email และ Password ที่ได้รับการอนุมัติจาก <b>PK Brain</b> แล้วเท่านั้น
                </span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. approved@gmail.com"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-2 cursor-pointer"
              >
                <KeyRound size={13} />
                <span>{loading ? 'กำลังตรวจสอบสิทธิ์...' : 'Sign In'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
