import React from 'react';
import { X, MapPin, Navigation, Zap, Clock, DollarSign, ExternalLink, ShieldCheck, Users, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Badge from '../common/Badge';

export default function StationDetailsModal({ station, onClose, onOpenReport, user }) {
  const { lang, t } = useLanguage();
  if (!station) return null;

  const openGoogleMapsNav = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  // Extract latest community verification report if available
  const latestReport = station.community_reports && station.community_reports.length > 0 ? station.community_reports[0] : null;

  let verificationColor = 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300';
  let statusLabel = 'Not yet verified (ยังไม่มีผู้ยืนยันในวันนี้)';
  let verificationIcon = <AlertTriangle className="w-4 h-4 text-amber-500" />;

  if (latestReport) {
    if (latestReport.verified_status === 'Verified by an administrator') {
      verificationColor = 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200';
      statusLabel = 'Verified by an administrator (ยืนยันโดยผู้ดูแลระบบ)';
      verificationIcon = <ShieldCheck className="w-4 h-4 text-rose-500" />;
    } else if (latestReport.verified_status === 'Confirmed by multiple users' || latestReport.confirm_count >= 2) {
      verificationColor = 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200';
      statusLabel = 'Confirmed by multiple users (ยืนยันโดยผู้ใช้หลายคน)';
      verificationIcon = <ShieldCheck className="w-4 h-4 text-emerald-500" />;
    } else if (latestReport.verified_status === 'Provider-supplied data') {
      verificationColor = 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200';
      statusLabel = 'Provider-supplied data (ข้อมูลตรงจากผู้ให้บริการ)';
      verificationIcon = <Zap className="w-4 h-4 text-blue-500" />;
    } else {
      verificationColor = 'bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200';
      statusLabel = `User report (${latestReport.connector_status === 'working' ? '✅ พร้อมใช้' : latestReport.connector_status === 'faulty' ? '⚠️ ชำรุด' : 'ℹ️ ไม่แน่ชัด'})`;
      verificationIcon = <Users className="w-4 h-4 text-purple-500" />;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-800 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-black rounded-lg">
                {station.provider}
              </span>
              <Badge type="osm" text="OpenStreetMap Real Data" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
              {station.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{station.address} ({station.province})</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 transition-colors"
            aria-label="Close station modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Community Verification Banner */}
        <div className={`my-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${verificationColor}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white dark:bg-gray-900/80 rounded-lg shadow-sm">{verificationIcon}</div>
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider opacity-85">สถานะการตรวจสอบชุมชน (Community Verification)</p>
              <p className="text-sm font-black mt-0.5">{statusLabel}</p>
            </div>
          </div>
          {latestReport && latestReport.verified_at_bkk && (
            <span className="text-[11px] font-semibold opacity-80 shrink-0 bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
              🕐 {latestReport.verified_at_bkk}
            </span>
          )}
        </div>

        {/* Station Technical Details */}
        <div className="space-y-4 text-sm">
          
          {/* Connectors & Power */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/80 space-y-3">
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span>ข้อมูลหัวชาร์จและกำลังไฟฟ้า (Connectors & Output)</span>
            </h4>

            <div className="flex flex-wrap gap-2">
              {station.connectors && station.connectors.length > 0 ? (
                station.connectors.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-emerald-500/30 rounded-xl text-xs font-extrabold text-emerald-700 dark:text-emerald-400 shadow-sm flex items-center gap-1.5">
                    <span>⚡ {c.type}</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-full text-[10px]">{c.count || 1} หัว</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">ไม่มีข้อมูลหัวชาร์จที่ระบุในแท็ก (No specific connector tags found)</span>
              )}
            </div>

            <div className="text-xs pt-1 flex items-center justify-between border-t border-gray-200 dark:border-gray-700/60">
              <span className="text-gray-600 dark:text-gray-400">กำลังไฟสูงสุด (Power Output):</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {station.power_output_kw ? `${station.power_output_kw} kW (ระบุใน OSM Tag)` : 'ไม่มีข้อมูลกำลังไฟ (No data available - ไม่คาดเดาจากชื่อแบรนด์)'}
              </span>
            </div>
          </div>

          {/* Business Hours & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/80">
              <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>เวลาให้บริการ (Hours)</span>
              </p>
              <p className="font-bold text-xs text-gray-800 dark:text-gray-200 mt-1">{station.open_hours || 'ไม่มีข้อมูล (No business hours data)'}</p>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/80">
              <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>ค่าบริการ (Price Info)</span>
              </p>
              <p className="font-bold text-xs text-gray-800 dark:text-gray-200 mt-1">{station.price_info || 'ไม่ระบุค่าบริการ (โปรดตรวจสอบกับแอปผู้ให้บริการ)'}</p>
            </div>
          </div>

        </div>

        {/* Footer Action Buttons */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => openGoogleMapsNav(station.lat, station.lng)}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 px-4 rounded-xl shadow-md transition-colors text-xs flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            <span>{t('nav_google_maps')}</span>
          </button>

          <button
            onClick={() => { onClose(); onOpenReport(station); }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-4 rounded-xl shadow-md transition-colors text-xs flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'th' ? 'รายงาน / เช็กอินสถานี' : 'Report / Verify Status'}</span>
          </button>

          <a
            href={station.osm_url} target="_blank" rel="noopener noreferrer"
            className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors border border-gray-300 dark:border-gray-700"
            title="ตรวจสอบข้อมูลดิบบน OpenStreetMap"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Traceability Footer */}
        <p className="text-[10px] text-gray-400 text-center mt-4">
          ID: {station.osm_id} | พิกัด: {station.lat.toFixed(4)}, {station.lng.toFixed(4)} | แหล่งที่มา: OpenStreetMap (ODbL)
        </p>

      </div>
    </div>
  );
}
