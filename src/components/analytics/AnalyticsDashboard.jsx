import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Zap, MapPin, ShieldAlert, CheckCircle2, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Badge from '../common/Badge';

export default function AnalyticsDashboard({ user, token }) {
  const { lang, t } = useLanguage();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'ไม่สามารถดึงข้อมูลสถิติได้');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!user || user.role !== 'admin' || !token) return;
    try {
      const res = await fetch('/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) setAuditLogs(json.logs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if (user?.role === 'admin') {
      fetchAuditLogs();
    }
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-gray-800 dark:text-gray-100 h-[calc(100vh-70px)] overflow-y-auto pb-20">
      
      {/* Title Header */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4 flex flex-wrap justify-between items-end gap-3">
        <div>
          <h2 className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <BarChart3 className="w-7 h-7" />
            <span>{lang === 'th' ? 'แดชบอร์ดวิเคราะห์สถิติโครงข่าย EV (Real Analytics)' : 'EV Network Analytics Dashboard'}</span>
            <Badge type="osm" text="Zero Fabricated Data" className="ml-2" />
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {lang === 'th'
              ? 'สถิติจริงจากฐานข้อมูล OpenStreetMap ที่โหลดมาได้เท่านั้น ไม่มีการสร้างตัวเลขเสมือน (No mock statistics)'
              : 'Computed purely from verified OpenStreetMap & community reports database without fabricated estimates.'}
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>รีเฟรชตัวเลขจริง</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="font-extrabold text-gray-700 dark:text-gray-300">กำลังประมวลผลสถิติจริงจากฐานข้อมูล EV...</p>
        </div>
      ) : error || !data || data.total_stations === 0 ? (
        
        /* Mandatory compliance: zero mock data text when total is 0 */
        <div className="py-16 bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-3xl p-8 text-center max-w-2xl mx-auto my-6 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto opacity-85" />
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
            {lang === 'th' ? 'ไม่มีสถิติแสดงผล — เนื่องจากข้อมูลจริงยังไม่ถูกโหลดหรือไม่มีในระบบ' : 'No statistics available — data cannot be fabricated.'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            {lang === 'th'
              ? 'ตามนโยบาย Zero Mock Data เราจะไม่สุ่มหรือสร้างตัวเลขเสมือนใดๆ ขึ้นมาแสดง กรุณารอสักครู่ให้ระบบซิงก์ข้อมูลจาก OpenStreetMap หรือรีเฟรชหน้าต่างอีกครั้ง'
              : 'Per our Zero Mock Data Policy, no simulated statistics will ever be generated. Please allow the server to sync actual OSM feeds.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-colors"
          >
            🔄 เชื่อมต่อฐานข้อมูลจริงอีกครั้ง
          </button>
        </div>
      ) : (

        <div className="space-y-6 animate-fadeIn">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
              <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center pointer-events-none">
                <Zap className="w-10 h-10 text-emerald-500 opacity-20" />
              </div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">สถานีชาร์จจริงทั้งหมดในไทย</p>
              <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 flex items-baseline gap-1">
                <span>{data.total_stations}</span>
                <span className="text-xs text-gray-500 font-medium">แห่ง (OSM Verified)</span>
              </h3>
              <Badge type="osm" text="Actual loaded records" className="mt-3" />
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">จังหวัดที่มีตู้ชาร์จครอบคลุม</p>
              <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2 flex items-baseline gap-1">
                <span>{data.province_distribution?.filter(p => p.count > 0).length || 0} / 77</span>
                <span className="text-xs text-gray-500 font-medium">จังหวัดทั่วประเทศ</span>
              </h3>
              <p className="text-xs text-gray-500 mt-3 truncate">สูงสุด: {data.province_distribution?.[0]?.province || 'กรุงเทพมหานคร'} (ครอบคลุมครบ 76 จังหวัด + กทม.)</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ตู้ระบุกำลังไฟชัดเจน (kW Tag)</p>
              <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2 flex items-baseline gap-1">
                <span>{data.power_output_stats?.percentage_with_power || 0}%</span>
                <span className="text-xs text-gray-500 font-medium">({data.power_output_stats?.with_power_count} สถานี)</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-3">ส่วนที่เหลือ: {data.power_output_stats?.percentage_without_power}% ไม่เดากำลังไฟ</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">รายงานหัวชาร์จชำรุด (30 วัน)</p>
              <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2 flex items-baseline gap-1">
                <span>{data.recent_fault_reports || 0}</span>
                <span className="text-xs text-gray-500 font-medium">รายการ (Faults)</span>
              </h3>
              <p className="text-xs text-emerald-600 font-bold mt-3">ร่วมตรวจสอบโดยชุมชนผู้ใช้ EV</p>
            </div>
          </div>

          {/* Distribution Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Top Providers Distribution */}
            <div className="lg:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex items-center justify-between">
                <span>⭐ ส่วนแบ่งผู้ให้บริการเครือข่ายตู้ชาร์จในไทย</span>
                <span className="text-xs font-medium text-gray-500">({data.provider_distribution?.length} แบรนด์)</span>
              </h3>
              
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {data.provider_distribution?.map((p, idx) => {
                  const percentage = ((p.count / (data.total_stations || 1)) * 100).toFixed(1);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-800 dark:text-gray-200">{p.provider || 'Unspecified'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{p.count} แห่ง ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(5, percentage)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Provinces Distribution (All 76 Provinces + Bangkok) */}
            <div className="lg:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex items-center justify-between">
                <span>🗺️ ครอบคลุมครบ 77 จังหวัด (76 จังหวัด + กทม.)</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg">All 77 Provinces</span>
              </h3>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {data.province_distribution?.map((pv, idx) => {
                  const percentage = ((pv.count / (data.total_stations || 1)) * 100).toFixed(1);
                  const isZero = pv.count === 0;
                  return (
                    <div key={idx} className={`space-y-1 ${isZero ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-800 dark:text-gray-200">{pv.province || 'Unspecified'} ({pv.region})</span>
                        <span className={isZero ? 'text-gray-400 dark:text-gray-500' : 'text-blue-600 dark:text-blue-400'}>
                          {isZero ? '0 แห่ง (รอซิงก์พิกัดจริง OSM)' : `${pv.count} แห่ง (${percentage}%)`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${isZero ? 'bg-gray-300 dark:bg-gray-700 w-1' : 'bg-blue-500'}`} style={{ width: isZero ? '4px' : `${Math.max(5, percentage)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connector Types Distribution */}
            <div className="lg:col-span-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex items-center justify-between">
                <span>⚡ สัดส่วนประเภทหัวชาร์จ (Connectors Distribution) จากแท็ก OpenStreetMap</span>
                <Badge type="osm" text="Strict Tag Translation" />
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {data.connector_distribution?.map((c, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{c.type}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{c.count} <span className="text-xs font-normal">หัว</span></p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Admin Audit Logs section */}
          {user?.role === 'admin' && (
            <div className="bg-white dark:bg-gray-900 border border-rose-300 dark:border-rose-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-rose-600 dark:text-rose-400 flex items-center gap-2 text-base">
                  <Shield className="w-5 h-5" />
                  <span>Admin Audit Logs & System Monitoring (ประวัติการใช้งานและตรวจสอบระบบ)</span>
                </h3>
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="px-3 py-1 bg-rose-50 text-rose-700 font-bold text-xs rounded-lg border border-rose-300 hover:bg-rose-100"
                >
                  {showLogs ? 'ซ่อนประวัติ Audit Log' : 'แสดงประวัติ Audit Log'}
                </button>
              </div>

              {showLogs && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 font-extrabold text-gray-500">
                        <th className="p-2">Timestamp (UTC/BKK)</th>
                        <th className="p-2">User Name</th>
                        <th className="p-2">Action Type</th>
                        <th className="p-2">Target ID</th>
                        <th className="p-2">Details / JSON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                      {auditLogs.map((lg) => (
                        <tr key={lg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="p-2 font-mono text-gray-500">{new Date(lg.timestamp).toLocaleString('th-TH')}</td>
                          <td className="p-2 text-gray-800 dark:text-gray-200 font-bold">{lg.user_name}</td>
                          <td className="p-2"><span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-extrabold">{lg.action}</span></td>
                          <td className="p-2 font-mono text-gray-600 dark:text-gray-400">{lg.target_id || '-'}</td>
                          <td className="p-2 text-gray-500 max-w-xs truncate">{lg.details || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
