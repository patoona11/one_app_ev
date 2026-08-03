import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function Badge({ type = 'osm', text = '', className = '', timestamp = null }) {
  const { lang, t } = useLanguage();

  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300';
  let label = t('source_osm');

  if (type === 'provider') {
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300';
    label = t('source_provider');
  } else if (type === 'community' || type === 'user') {
    badgeColor = 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300';
    label = t('source_community');
  } else if (type === 'estimate') {
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300';
    label = t('source_estimate');
  } else if (type === 'admin') {
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300';
    label = lang === 'th' ? 'ยืนยันโดยแอดมิน (Verified Admin)' : 'Verified by Admin';
  } else if (type === 'cached') {
    badgeColor = 'bg-gray-200 text-gray-800 border-gray-400 dark:bg-gray-800 dark:text-gray-300';
    label = lang === 'th' ? 'ข้อมูลแคชสำรอง (Cached Data)' : 'Cached Data';
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${badgeColor} ${className}`} title={timestamp ? `อัปเดตล่าสุด: ${timestamp}` : 'แหล่งที่มาข้อมูลตรวจสอบได้'}>
      <span>●</span>
      <span>{text || label}</span>
      {timestamp && <span className="opacity-75 text-[9px]">({new Date(timestamp).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US')})</span>}
    </span>
  );
}
