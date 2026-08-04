import React from 'react';
import { Filter, Zap, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { THAI_PROVINCES } from '../../utils/thaiProvinces';

export default function StationFilter({ 
  selectedProvider, setSelectedProvider,
  selectedProvince, setSelectedProvince,
  selectedConnector, setSelectedConnector,
  minPower, setMinPower,
  searchQuery, setSearchQuery,
  providersList = [],
  totalCount = 0,
  filteredCount = 0,
  onReset
}) {
  const { lang, t } = useLanguage();

  const connectorOptions = [
    { value: 'ALL', label: lang === 'th' ? 'ทุกประเภทหัวชาร์จ' : 'All Connectors' },
    { value: 'CCS2', label: 'CCS2 (DC Fast Charge)' },
    { value: 'Type 2', label: 'Type 2 (AC Normal)' },
    { value: 'CHAdeMO', label: 'CHAdeMO (DC Fast)' },
    { value: 'Tesla', label: 'Tesla Supercharger' }
  ];

  const powerOptions = [
    { value: 0, label: lang === 'th' ? 'ทุกระดับกำลังไฟ' : 'All Power Levels' },
    { value: 22, label: '≥ 22 kW (AC / DC)' },
    { value: 50, label: '≥ 50 kW (DC Fast Charge)' },
    { value: 100, label: '≥ 100 kW (Ultra-Fast Charge)' }
  ];

  // Group 77 provinces by Region
  const regions = ['Central', 'North', 'Northeast', 'East', 'West', 'South'];
  const regionNamesTh = {
    Central: 'ภาคกลาง และ กทม.',
    North: 'ภาคเหนือ',
    Northeast: 'ภาคตะวันออกเฉียงเหนือ (อีสาน)',
    East: 'ภาคตะวันออก',
    West: 'ภาคตะวันตก',
    South: 'ภาคใต้'
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3.5 shadow-sm transition-colors z-20">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 text-sm mr-1">
            <Filter className="w-4 h-4" />
            <span>{lang === 'th' ? 'กรองสถานี:' : 'Filter Stations:'}</span>
          </span>

          {/* Search Box */}
          <input
            type="text"
            placeholder={lang === 'th' ? '🔍 ค้นหาชื่อสถานี...' : '🔍 Search station name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[150px]"
          />

          {/* All 77 Provinces Filter */}
          <select
            value={selectedProvince || 'ALL'}
            onChange={(e) => setSelectedProvince && setSelectedProvince(e.target.value)}
            className="bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800 rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">🗺️ ครบ 77 จังหวัด (76 จังหวัด + กทม.)</option>
            {regions.map((reg) => (
              <optgroup key={reg} label={`--- ${regionNamesTh[reg]} ---`}>
                {THAI_PROVINCES.filter(p => p.region === reg).map(p => (
                  <option key={p.id} value={p.name_th}>
                    📍 {p.name_th} ({p.name_en})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">{lang === 'th' ? '⭐ ทุกผู้ให้บริการ (All Providers)' : '⭐ All Providers'}</option>
            {providersList.map((p, idx) => (
              <option key={idx} value={p}>{p}</option>
            ))}
          </select>

          {/* Connector Filter */}
          <select
            value={selectedConnector}
            onChange={(e) => setSelectedConnector(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {connectorOptions.map((c, idx) => (
              <option key={idx} value={c.value}>{c.label}</option>
            ))}
          </select>

          {/* Power Filter */}
          <select
            value={minPower}
            onChange={(e) => setMinPower(parseInt(e.target.value))}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {powerOptions.map((pw, idx) => (
              <option key={idx} value={pw.value}>{pw.label}</option>
            ))}
          </select>

          {/* Reset Button */}
          {(selectedProvider !== 'ALL' || selectedProvince !== 'ALL' || selectedConnector !== 'ALL' || minPower !== 0 || searchQuery !== '') && (
            <button
              onClick={onReset}
              className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-bold flex items-center gap-1 text-gray-700 dark:text-gray-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{lang === 'th' ? 'ล้างค่า' : 'Reset'}</span>
            </button>
          )}
        </div>

        <div className="text-gray-600 dark:text-gray-400 font-semibold w-full md:w-auto text-right">
          <span>{lang === 'th' ? 'แสดง:' : 'Showing:'} </span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">{filteredCount}</strong> / {totalCount} {lang === 'th' ? 'แห่ง' : 'stations'}
        </div>

      </div>
    </div>
  );
}

