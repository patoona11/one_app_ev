import React, { useState } from 'react';
import { X, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('admin@appev.th');
  const [password, setPassword] = useState('admin12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เข้าสู่ระบบล้มเหลว');
      }

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const useQuickLogin = (m, p) => {
    setEmail(m);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            <span>ยืนยันตัวตน / เข้าสู่ระบบ</span>
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Test Demo Accounts */}
        <div className="mt-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg p-3 text-xs">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> บัญชีตัวอย่างพร้อมใช้งาน (Demo Quick Access):
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => useQuickLogin('admin@appev.th', 'admin12345')}
              className="px-2.5 py-1 bg-emerald-600 text-white font-medium rounded hover:bg-emerald-500 transition-colors"
            >
              👑 บัญชี Admin (ตรวจสอบ/จัดการระบบ)
            </button>
            <button
              type="button"
              onClick={() => useQuickLogin('somchai@ev.th', 'user12345')}
              className="px-2.5 py-1 bg-blue-600 text-white font-medium rounded hover:bg-blue-500 transition-colors"
            >
              🚗 บัญชีผู้ใช้ทั่วไป (รายงานจุดชาร์จ)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950 text-rose-600 text-xs p-3 rounded-lg border border-rose-300">
              ⚠️ {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1">อีเมล (Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl shadow transition-colors text-sm"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
          </button>
        </form>
      </div>
    </div>
  );
}
