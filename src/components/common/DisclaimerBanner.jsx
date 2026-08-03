import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function DisclaimerBanner() {
  const [closed, setClosed] = useState(false);
  const { t } = useLanguage();

  if (closed) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs sm:text-sm transition-colors">
      <div className="flex items-center gap-2 max-w-[92%]">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="font-medium">{t('disclaimer')}</span>
      </div>
      <button 
        onClick={() => setClosed(true)} 
        className="p-1 hover:bg-amber-500/20 rounded text-amber-800 dark:text-amber-300 transition-colors shrink-0"
        aria-label="Close disclaimer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
