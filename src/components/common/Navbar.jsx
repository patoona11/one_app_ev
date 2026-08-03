import React, { useState } from 'react';
import { Zap, Globe, Moon, Sun, User, LogOut, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout }) {
  const { lang, toggleLang, t } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();

  const navItems = [
    { id: 'planner', label: t('tab_planner') },
    { id: 'map', label: t('tab_map') },
    { id: 'community', label: t('tab_community') },
    { id: 'analytics', label: t('tab_analytics') },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('planner')}>
          <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-md shadow-emerald-500/20">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none tracking-tight">
              App_EV <span className="text-emerald-500">Thailand</span>
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 hidden sm:block">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 text-gray-700 dark:text-gray-200 transition-colors"
            title="Switch Language (TH/EN)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Dark Mode"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Authentication Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
              <span className="text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                {user.role === 'admin' && <Shield className="w-3.5 h-3.5 text-rose-500" />}
                {user.name.split(' ')[0]} ({user.role})
              </span>
              <button
                onClick={onLogout}
                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                title={t('btn_logout')}
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="ml-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>{lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <div className="md:hidden flex border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 px-2 justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center py-1 px-2 rounded text-[11px] font-medium transition-all ${
              activeTab === item.id
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
