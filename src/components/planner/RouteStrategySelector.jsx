import React from 'react';
import { Zap, ShieldCheck, Leaf } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function RouteStrategySelector({ selected, onSelect }) {
  const { t, lang } = useLanguage();

  const strategies = [
    {
      id: 'fastest',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: lang === 'th' ? 'เร็วที่สุด (Fastest Route)' : 'Fastest Route',
      desc: lang === 'th' ? 'ใช้เส้นทางหลักที่มีเวลาเดินทางสั้นที่สุด เหมาะสำหรับผู้ต้องการความรวดเร็ว' : 'Prioritizes highway routing for minimum travel duration.'
    },
    {
      id: 'energy_efficient',
      icon: <Leaf className="w-5 h-5 text-emerald-500" />,
      title: lang === 'th' ? 'ประหยัดพลังงานที่สุด (Energy-Efficient)' : 'Most Energy-Efficient',
      desc: lang === 'th' ? 'ค้นหาเส้นทางระยะสั้นและความชันต่ำเพื่อลดการใช้ไฟ (kWh/100km) สูงสุด' : 'Optimizes path to reduce total kWh energy consumption.'
    },
    {
      id: 'lowest_risk',
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      title: lang === 'th' ? 'ความเสี่ยงจุดชาร์จต่ำสุด (Lowest Charging Risk)' : 'Lowest Charging Risk',
      desc: lang === 'th' ? 'เลือกเส้นทางและแนะนำเฉพาะตู้ชาร์จกำลังสูงที่ผู้ใช้ยืนยันสถานะการทำงานจริงแล้ว' : 'Selects corridors with redundant high-power & community-verified stations.'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
      {strategies.map((st) => (
        <div
          key={st.id}
          onClick={() => onSelect(st.id)}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between shadow-sm ${
            selected === st.id
              ? 'border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/20'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-lg">{st.icon}</div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">{st.title}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{st.desc}</p>
        </div>
      ))}
    </div>
  );
}
