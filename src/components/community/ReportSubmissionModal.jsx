import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, HelpCircle, Star, Send, Camera } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ReportSubmissionModal({ station, isOpen, onClose, user, token, onReportSuccess, onOpenAuth }) {
  const { lang, t } = useLanguage();
  
  const [connectorStatus, setConnectorStatus] = useState('working');
  const [vehiclesWaiting, setVehiclesWaiting] = useState(0);
  const [observedPrice, setObservedPrice] = useState('');
  const [facilitiesNotes, setFacilitiesNotes] = useState('');
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [safetyRating, setSafetyRating] = useState(5);
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !station) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      onClose();
      onOpenAuth();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          station_osm_id: station.osm_id,
          connector_status: connectorStatus,
          vehicles_waiting: parseInt(vehiclesWaiting, 10),
          observed_price: observedPrice || null,
          facilities_notes: facilitiesNotes || null,
          cleanliness_rating: cleanlinessRating,
          safety_rating: safetyRating,
          photo_url: photoUrl || null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถส่งรายงานได้ กรุณารอสักครู่');
      }

      onReportSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>📋</span>
              <span>{lang === 'th' ? 'รายงานและเช็กอินสภาพตู้ชาร์จ' : 'Report Station Status'}</span>
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{station.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="my-8 text-center space-y-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="font-bold text-sm text-gray-900 dark:text-white">กรุณาเข้าสู่ระบบก่อนทำการรายงานสถานะจุดชาร์จ</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">เพื่อป้องกันข้อความสแปมและยกระดับความเชื่อถือของเครือข่าย EV ประเทศไทย</p>
            <button
              type="button"
              onClick={() => { onClose(); onOpenAuth(); }}
              className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-colors"
            >
              🔐 เปิดหน้าลงชื่อเข้าใช้ / ใช้บัญชี Demo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 rounded-xl border border-rose-300 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Status Selectors */}
            <div>
              <label className="block text-xs font-extrabold mb-2 text-gray-700 dark:text-gray-300">
                สถานะหัวชาร์จปัจจุบัน (Connector Status) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setConnectorStatus('working')}
                  className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                    connectorStatus === 'working' 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-75'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>✅ พร้อมใช้งาน</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setConnectorStatus('faulty')}
                  className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                    connectorStatus === 'faulty' 
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-75'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span>❌ ชำรุด / เสีย</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectorStatus('unknown')}
                  className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                    connectorStatus === 'unknown' 
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-75'
                  }`}
                >
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                  <span>ℹ️ ไม่แน่ชัด / ปิด</span>
                </button>
              </div>
            </div>

            {/* Waiting vehicles */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">จำนวนรถที่จอดคอย (คัน):</label>
                <input
                  type="number" min="0" max="20"
                  value={vehiclesWaiting}
                  onChange={(e) => setVehiclesWaiting(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ค่าบริการที่พบเห็น (ถ้ามี):</label>
                <input
                  type="text"
                  placeholder="เช่น 7.5 บาท/หน่วย หรือ ฟรี"
                  value={observedPrice}
                  onChange={(e) => setObservedPrice(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-sm"
                />
              </div>
            </div>

            {/* Ratings */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-bold mb-1">🧹 ความสะอาด (Cleanliness):</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <button
                      type="button" key={s}
                      onClick={() => setCleanlinessRating(s)}
                      className="text-lg hover:scale-110 transition-transform focus:outline-none"
                    >
                      <span className={s <= cleanlinessRating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}>★</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">🛡️ ความปลอดภัยและแสงสว่าง:</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <button
                      type="button" key={s}
                      onClick={() => setSafetyRating(s)}
                      className="text-lg hover:scale-110 transition-transform focus:outline-none"
                    >
                      <span className={s <= safetyRating ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes & Comments */}
            <div>
              <label className="block text-xs font-bold mb-1">💬 หมายเหตุหรือสิ่งอำนวยความสะดวกบริเวณสถานี:</label>
              <textarea
                rows="2"
                placeholder="เช่น ร้านกาแฟเปิด 24 ชม., ห้องน้ำสะอาด, หรือ หัว CCS2 ตู้ซ้ายมือซ่อมอยู่"
                value={facilitiesNotes}
                onChange={(e) => setFacilitiesNotes(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Photo URL option */}
            <div>
              <label className="block text-xs font-bold mb-1 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-gray-500" />
                <span>URL แนบรูปภาพสถานีจริง (Optional Photo link):</span>
              </label>
              <input
                type="url"
                placeholder="https://example.com/station-photo.jpg"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'กำลังส่งข้อมูลไปยังระบบยืนยันชุมชน...' : 'ยืนยันและส่งรายงานสถานะ (Submit Report)'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
