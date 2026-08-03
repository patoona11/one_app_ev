import React, { useState, useEffect } from 'react';
import { ShieldCheck, ThumbsUp, ThumbsDown, User, CheckCircle2, AlertTriangle, HelpCircle, RefreshCw, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Badge from '../common/Badge';
import ReportSubmissionModal from './ReportSubmissionModal';

export default function ReportList({ user, token, onOpenAuth }) {
  const { lang, t } = useLanguage();

  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  // Load list of stations first to select and view reports
  const loadStationsAndReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stations');
      const data = await res.json();
      const list = data.stations || [];
      setStations(list);

      if (list.length > 0 && !selectedStation) {
        setSelectedStation(list[0]);
        await fetchReports(list[0].osm_id);
      } else if (selectedStation) {
        await fetchReports(selectedStation.osm_id);
      }
    } catch (e) {
      console.error('Failed loading reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async (stationOsmId) => {
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(stationOsmId)}`);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      setReports([]);
    }
  };

  useEffect(() => {
    loadStationsAndReports();
  }, []);

  const handleSelectStation = async (st) => {
    setSelectedStation(st);
    await fetchReports(st.osm_id);
  };

  // Confirm or dispute report
  const handleVote = async (reportId, voteType) => {
    if (!user || !token) {
      onOpenAuth();
      return;
    }

    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voteType })
      });
      const data = await res.json();
      if (data.success) {
        setNotice(voteType === 'confirm' ? '🤝 ขอบคุณที่ช่วยยืนยันความถูกต้องของข้อมูล' : '⚖️ ขอบคุณที่ช่วยคัดกรองข้อมูลที่ไม่ตรงความจริง');
        if (selectedStation) await fetchReports(selectedStation.osm_id);
        setTimeout(() => setNotice(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin override status
  const handleAdminVerify = async (reportId, newStatus) => {
    if (!user || user.role !== 'admin' || !token) return;
    try {
      const res = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ statusLabel: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setNotice(`🛡️ Admin Verified: อัปเดตสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`);
        if (selectedStation) await fetchReports(selectedStation.osm_id);
        setTimeout(() => setNotice(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-gray-800 dark:text-gray-100 h-[calc(100vh-70px)] overflow-y-auto pb-20">
      
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4 flex flex-wrap justify-between items-end gap-3">
        <div>
          <h2 className="text-2xl font-black text-purple-600 dark:text-purple-400 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7" />
            <span>{lang === 'th' ? 'ระบบตรวจสอบสถานะโดยชุมชน (Community Verification)' : 'Community Verification System'}</span>
            <Badge type="community" text="Peer Review & Admin Approved" className="ml-2" />
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {lang === 'th' 
              ? 'ร่วมเป็นส่วนหนึ่งในเครือข่ายสังคม EV ไทย แจ้งสถานะจริง ยืนยันความถูกต้อง และตรวจสอบประวัติการรายงานพร้อมป้ายสถานะมาตรฐาน' 
              : 'Empowering EV drivers to accurately verify station conditions with standardized labels and Asia/Bangkok time formatting.'}
          </p>
        </div>

        <button
          onClick={() => setReportModalOpen(true)}
          disabled={!selectedStation}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <span>✍️ รายงานสถานะสถานีที่เลือก</span>
        </button>
      </div>

      {notice && (
        <div className="mb-4 p-3.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 rounded-xl font-bold text-sm border border-emerald-400 shadow-xs animate-fadeIn">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Station selector list */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm h-[620px] flex flex-col">
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-800 pb-2 flex justify-between items-center">
            <span>🔍 เลือกระดับสถานีที่ต้องการดูรายงาน:</span>
            <button onClick={loadStationsAndReports} className="p-1 text-gray-500 hover:text-emerald-500">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {stations.map(st => (
              <div
                key={st.osm_id}
                onClick={() => handleSelectStation(st)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedStation?.osm_id === st.osm_id
                    ? 'border-2 border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-xs font-bold'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded">
                    {st.provider}
                  </span>
                </div>
                <p className="text-sm mt-1 text-gray-900 dark:text-white line-clamp-1">{st.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{st.province}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Reports feed & verification history */}
        <div className="lg:col-span-8 space-y-4">
          
          {selectedStation && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">สถานีที่ถูกเลือก (Selected Station):</span>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">{selectedStation.name}</h3>
                  <p className="text-xs text-gray-500">{selectedStation.address} ({selectedStation.province})</p>
                </div>
                <a
                  href={selectedStation.osm_url} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
                >
                  🔗 ดูข้อมูล OSM
                </a>
              </div>

              <h4 className="font-extrabold text-base mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <span>💬 ประวัติการรายงานและตรวจสอบสภาพตู้ ({reports.length} รายการ)</span>
              </h4>

              {loading ? (
                <div className="py-12 text-center text-gray-500">⏳ กำลังโหลดรายงานชุมชน...</div>
              ) : reports.length === 0 ? (
                <div className="py-10 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-70" />
                  <p className="font-extrabold text-sm text-gray-800 dark:text-gray-200">ยังไม่มีประวัติการแจ้งสถานะของสถานีนี้</p>
                  <p className="text-xs text-gray-500 mt-1">มาร่วมเป็นคนแรกที่ช่วยเช็กอินและแจ้งสภาพจริงให้เพื่อนร่วมทางทราบ</p>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-colors"
                  >
                    🚀 เพิ่มรายงานสถานะ
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((rep) => {
                    let badgeStyles = 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300';
                    let label = rep.verified_status;
                    if (rep.verified_status === 'Verified by an administrator') badgeStyles = 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950/80 dark:text-rose-200 font-extrabold';
                    else if (rep.verified_status === 'Confirmed by multiple users') badgeStyles = 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-200 font-bold';
                    else if (rep.verified_status === 'Provider-supplied data') badgeStyles = 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-950/80 dark:text-blue-200 font-bold';

                    return (
                      <div key={rep.id} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300 text-sm">
                              {rep.user_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{rep.user_name}</p>
                              <p className="text-[10px] text-gray-500">🕐 {rep.verified_at_bkk}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${badgeStyles}`}>
                            <span>●</span>
                            <span>{label}</span>
                          </span>
                        </div>

                        {/* Status Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500">สภาพหัวชาร์จ:</p>
                            <p className="font-black mt-0.5 flex items-center gap-1">
                              {rep.connector_status === 'working' ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-600 dark:text-emerald-400">พร้อมใช้งาน</span></> :
                               rep.connector_status === 'faulty' ? <><AlertTriangle className="w-4 h-4 text-rose-500" /> <span className="text-rose-600 dark:text-rose-400">ชำรุด / เสีย</span></> :
                               <><HelpCircle className="w-4 h-4 text-amber-500" /> <span className="text-amber-600 dark:text-amber-400">ไม่แน่ชัด</span></>}
                            </p>
                          </div>

                          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500">รถจอดคอย:</p>
                            <p className="font-extrabold mt-0.5">{rep.vehicles_waiting || 0} คัน</p>
                          </div>

                          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500">ความสะอาด / ปลอดภัย:</p>
                            <p className="font-extrabold text-amber-500 mt-0.5">★ {rep.cleanliness_rating}/5 | 🛡️ {rep.safety_rating}/5</p>
                          </div>

                          <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-gray-500">ราคาที่พบเห็น:</p>
                            <p className="font-bold mt-0.5">{rep.observed_price || 'ตามราคาแอป provider'}</p>
                          </div>
                        </div>

                        {rep.facilities_notes && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
                            <strong>📝 บันทึกสิ่งอำนวยความสะดวก:</strong> {rep.facilities_notes}
                          </p>
                        )}

                        {/* Peer review voting & Admin actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200 dark:border-gray-700/60 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVote(rep.id, 'confirm')}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-emerald-300 dark:border-emerald-800"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>ยืนยันข้อมูล ({rep.confirm_count || 0})</span>
                            </button>
                            
                            <button
                              onClick={() => handleVote(rep.id, 'dispute')}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-rose-300 dark:border-rose-800"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>ไม่ถูกต้อง ({rep.dispute_count || 0})</span>
                            </button>
                          </div>

                          {/* Admin Moderation Buttons */}
                          {user?.role === 'admin' && (
                            <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-300 dark:border-rose-800">
                              <span className="font-black text-rose-700 dark:text-rose-300 flex items-center gap-1 text-[10px]">
                                <Shield className="w-3 h-3" /> Admin Mod:
                              </span>
                              <button
                                onClick={() => handleAdminVerify(rep.id, 'Verified by an administrator')}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black rounded"
                              >
                                ยืนยันโดย Admin
                              </button>
                              <button
                                onClick={() => handleAdminVerify(rep.id, 'Provider-supplied data')}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded"
                              >
                                ตั้งเป็น Provider Data
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ReportSubmissionModal
        station={selectedStation}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        user={user}
        token={token}
        onOpenAuth={onOpenAuth}
        onReportSuccess={(res) => {
          setNotice('🎉 ส่งรายงานและอัปเดตสถานะในชุมชน EV เรียบร้อยแล้ว');
          if (selectedStation) fetchReports(selectedStation.osm_id);
        }}
      />
    </div>
  );
}
