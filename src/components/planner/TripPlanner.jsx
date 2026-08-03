import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Zap, Battery, ShieldAlert, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import RouteStrategySelector from './RouteStrategySelector';
import Badge from '../common/Badge';
import { POPULAR_EV_PRESETS, THAILAND_CITIES_PRESETS, calculateEnergyConsumed, calculateDrivingRange } from '../../utils/evCalculations';

// Leaflet Map components for visual rendering of planned trip
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom station icon for planner
const createStationIcon = (color = '#10b981') => new L.DivIcon({
  className: 'custom-ev-pin',
  html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 10px; color: white;">⚡</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function TripPlanner() {
  const { lang, t } = useLanguage();
  
  // Trip route inputs
  const [originIdx, setOriginIdx] = useState(0); // Bangkok
  const [destIdx, setDestIdx] = useState(1); // Chiang Mai
  const [strategy, setStrategy] = useState('fastest');
  
  // EV specs & parameters
  const [selectedEvIdx, setSelectedEvIdx] = useState(0); // BYD Atto 3
  const [batteryCapacity, setBatteryCapacity] = useState(POPULAR_EV_PRESETS[0].battery);
  const [consumptionRate, setConsumptionRate] = useState(POPULAR_EV_PRESETS[0].consumption);
  const [initialSoc, setInitialSoc] = useState(100);
  const [reserveSoc, setReserveSoc] = useState(20);
  const [maxChargingPowerKw, setMaxChargingPowerKw] = useState(POPULAR_EV_PRESETS[0].maxChargeKw);
  
  // Calculation states
  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handleEvSelection = (idx) => {
    setSelectedEvIdx(idx);
    const preset = POPULAR_EV_PRESETS[idx];
    setBatteryCapacity(preset.battery);
    setConsumptionRate(preset.consumption);
    setMaxChargingPowerKw(preset.maxChargeKw);
  };

  const handlePlanRoute = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRouteResult(null);

    const origin = THAILAND_CITIES_PRESETS[originIdx];
    const dest = THAILAND_CITIES_PRESETS[destIdx];

    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: dest.lat, lng: dest.lng },
          strategy,
          vehicle: {
            batteryCapacity,
            consumptionRate,
            initialSoc,
            reserveSoc,
            maxChargingPowerKw,
            compatibleConnectors: POPULAR_EV_PRESETS[selectedEvIdx].connectors
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถประมวลผลเส้นทางได้');
      }
      setRouteResult(data.route);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run initial default route calculation automatically on mount
  useEffect(() => {
    handlePlanRoute({ preventDefault: () => {} });
  }, []);

  const openGoogleMapsNav = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-gray-800 dark:text-gray-100 h-[calc(100vh-80px)] overflow-y-auto pb-20">
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Navigation className="w-7 h-7" />
          <span>{lang === 'th' ? 'EV Smart Trip Planner (ระบบคำนวณทริปและจุดชาร์จ)' : 'EV Smart Trip Planner'}</span>
          <Badge type="estimate" text="Powered by OSRM & Real OSM Stations" className="ml-2" />
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
          {lang === 'th' ? 'ระบบวางแผนการเดินทางรถยนต์ไฟฟ้าระดับ Production คำนวณพลังงาน แนะนำจุดชาร์จ และประเมินเวลาอย่างซื่อสัตย์โปร่งใส' : 'Production-grade routing calculation estimating energy consumption and discovering verified charging stops along your journey.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Input Form & Vehicle Parameters */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-5">
          <h3 className="font-bold text-base flex items-center gap-2 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            <span>{lang === 'th' ? '1. กำหนดจุดต้นทางและปลายทาง (Thailand Corridor)' : '1. Route & Destinations'}</span>
          </h3>

          <form onSubmit={handlePlanRoute} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">จุดเริ่มต้น (Origin)</label>
                <select 
                  value={originIdx} 
                  onChange={(e) => setOriginIdx(parseInt(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {THAILAND_CITIES_PRESETS.map((city, idx) => (
                    <option key={idx} value={idx}>{city.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">จุดปลายทาง (Destination)</label>
                <select 
                  value={destIdx} 
                  onChange={(e) => setDestIdx(parseInt(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {THAILAND_CITIES_PRESETS.map((city, idx) => (
                    <option key={idx} value={idx}>{city.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <h3 className="font-bold text-base flex items-center gap-2 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pt-3 pb-2">
              <Battery className="w-5 h-5 text-emerald-500" />
              <span>{lang === 'th' ? '2. สเปกแบตเตอรี่รถยนต์ EV (Vehicle Specs)' : '2. EV Battery & Specs'}</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">เลือกรุ่นรถ (EV Model Presets)</label>
              <select 
                value={selectedEvIdx} 
                onChange={(e) => handleEvSelection(parseInt(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {POPULAR_EV_PRESETS.map((ev, idx) => (
                  <option key={idx} value={idx}>{ev.name} ({ev.battery} kWh | {ev.consumption} kWh/100km)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">แบตเตอรี่ (kWh)</label>
                <input 
                  type="number" step="0.1" 
                  value={batteryCapacity} 
                  onChange={(e) => setBatteryCapacity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">กินไฟ (kWh/100km)</label>
                <input 
                  type="number" step="0.1" 
                  value={consumptionRate} 
                  onChange={(e) => setConsumptionRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">ชาร์จสูงสุด (kW)</label>
                <input 
                  type="number" 
                  value={maxChargingPowerKw} 
                  onChange={(e) => setMaxChargingPowerKw(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">แบตเตอรี่เริ่มต้น (% Initial SOC)</label>
                <input 
                  type="range" min="10" max="100" 
                  value={initialSoc} 
                  onChange={(e) => setInitialSoc(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-emerald-600">{initialSoc}%</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">สำรองขั้นต่ำ (% Min Reserve)</label>
                <input 
                  type="range" min="5" max="50" 
                  value={reserveSoc} 
                  onChange={(e) => setReserveSoc(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-600">{reserveSoc}%</span>
              </div>
            </div>

            <h3 className="font-bold text-base text-gray-900 dark:text-white pt-2">
              {lang === 'th' ? '3. เลือกกลยุทธ์เส้นทาง (Strategy)' : '3. Routing Strategy'}
            </h3>
            <RouteStrategySelector selected={strategy} onSelect={setStrategy} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">⏳ กำลังคำนวณและค้นหาจุดชาร์จจริง...</span>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  <span>{lang === 'th' ? 'คำนวณเส้นทางและจุดแวะชาร์จ (Calculate Trip)' : 'Calculate Trip & Charging Stops'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Route Summary, Map Visualization & Recommended Stops */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-200 p-4 rounded-2xl border border-rose-300 shadow-sm">
              <p className="font-bold">❌ เกิดข้อผิดพลาด:</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {routeResult && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Trip Summary Dashboard Card */}
              <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 rounded-2xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-500/40 pb-3 mb-4 gap-2">
                  <div>
                    <h3 className="text-lg font-black tracking-wide flex items-center gap-1.5">
                      <span>{THAILAND_CITIES_PRESETS[originIdx].name.split(' ')[0]}</span>
                      <ChevronRight className="w-5 h-5 opacity-80" />
                      <span>{THAILAND_CITIES_PRESETS[destIdx].name.split(' ')[0]}</span>
                    </h3>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      {lang === 'th' ? `กลยุทธ์: ${strategy === 'fastest' ? 'เร็วที่สุด' : strategy === 'energy_efficient' ? 'ประหยัดสุด' : 'เสี่ยงต่ำสุด'}` : `Strategy: ${strategy}`} | {routeResult.provider}
                    </p>
                  </div>
                  <Badge type="estimate" text="Estimate / คำนวณจากถนนจริง" className="bg-white/20 text-white border-white/30" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                    <p className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">ระยะทางรวม</p>
                    <p className="text-xl font-extrabold mt-1">{routeResult.distance_km} <span className="text-sm font-normal">km</span></p>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                    <p className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">เวลาเดินทางประมาณ</p>
                    <p className="text-xl font-extrabold mt-1">~{Math.floor(routeResult.duration_minutes / 60)} ชม. {routeResult.duration_minutes % 60} น.</p>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                    <p className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">ใช้พลังงาน</p>
                    <p className="text-base font-extrabold mt-1">{routeResult.tripAnalysis?.total_energy_consumed_kwh}</p>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                    <p className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">ระยะขับขี่ (แบตใช้ได้)</p>
                    <p className="text-base font-extrabold mt-1">{routeResult.tripAnalysis?.estimated_driving_range_km}</p>
                  </div>
                </div>

                {/* Reachability Alert */}
                <div className="mt-4 p-3 bg-white/15 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                  {routeResult.tripAnalysis?.can_reach_without_charge ? (
                    <span className="flex items-center gap-2 font-bold text-emerald-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                      <span>✨ รถสามารถขับถึงปลายทางได้โดยไม่ต้องแวะชาร์จ (แบตไม่ต่ำกว่า {reserveSoc}%)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 font-bold text-amber-200">
                      <Zap className="w-5 h-5 text-amber-300 shrink-0" />
                      <span>⚠️ แบตเตอรี่ไม่เพียงพอตลอดทั้งเส้นทาง จำเป็นต้องแวะชาร์จระหว่างทาง (ดูข้อเสนอแนะนำด้านล่าง)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Warnings from Trip Analysis */}
              {routeResult.tripAnalysis?.coverage_warnings?.map((w, idx) => (
                <div key={idx} className="p-4 bg-amber-50 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-700 rounded-xl flex items-center gap-3 text-amber-900 dark:text-amber-200 text-sm shadow-sm">
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold">{lang === 'th' ? w.message_th : w.message_en}</p>
                    <p className="text-xs mt-0.5 opacity-85">โปรดวางแผนจุดชาร์จสำรองและตรวจสอบสภาพเครื่องชาร์จผ่านปุ่มติดต่อผู้ให้บริการก่อนออกเดินทางเสมอ</p>
                  </div>
                </div>
              ))}

              {/* Recommended Charging Stops */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-500 fill-current" />
                    <span>{lang === 'th' ? 'จุดชาร์จที่แนะนำระหว่างเส้นทาง (Verified Stops)' : 'Recommended Charging Stops'}</span>
                  </span>
                  <Badge type="osm" text="OpenStreetMap Real Data" />
                </h3>

                {routeResult.tripAnalysis?.recommended_stops?.length > 0 ? (
                  <div className="space-y-4">
                    {routeResult.tripAnalysis.recommended_stops.map((stop, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 max-w-lg">
                          <span className="inline-block bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                            {stop.role}
                          </span>
                          <h4 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                            <span>{stop.station.name}</span>
                            <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded">
                              {stop.station.provider}
                            </span>
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{stop.station.address} ({stop.station.province})</p>
                          
                          {/* Calculation explanation and estimate badge */}
                          <div className="pt-2 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-800 mt-2">
                            <div>
                              <span className="text-gray-500">กำลังไฟชาร์จที่มีผล (Effective kW):</span>{' '}
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stop.effective_charging_power_kw}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">ระยะเวลาชาร์จที่ประเมิน:</span>{' '}
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stop.estimated_charging_time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button
                            onClick={() => openGoogleMapsNav(stop.station.lat, stop.station.lng)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>{lang === 'th' ? 'นำทางด้วย Google Maps' : 'Navigate'}</span>
                          </button>
                          <a
                            href={stop.station.osm_url} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors border border-gray-300 dark:border-gray-700 text-center"
                          >
                            <span>ตรวจสอบบน OpenStreetMap</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    {routeResult.tripAnalysis?.can_reach_without_charge 
                      ? '✅ ไม่มีความจำเป็นต้องแวะชาร์จนเนื่องจากแบตเตอรี่เพียงพอ' 
                      : 'ℹ️ ไม่พบสถานีชาร์จที่มีหัวชาร์จตรงกับรถของคุณในอาณาบริเวณเส้นทางนี้'}
                  </p>
                )}

                {/* Backup Stops */}
                {routeResult.tripAnalysis?.backup_stops?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">🛡️ จุดชาร์จสำรองฉุกเฉินบนเส้นทาง:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {routeResult.tripAnalysis.backup_stops.map((b, bIdx) => (
                        <div key={bIdx} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{b.station.name}</p>
                            <p className="text-[10px] text-gray-500">{b.station.provider} ({b.station.province})</p>
                          </div>
                          <button
                            onClick={() => openGoogleMapsNav(b.station.lat, b.station.lng)}
                            className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 rounded-lg font-bold transition-colors"
                            title="นำทางสำรอง"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Leaflet Route Visualization */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm h-72 sm:h-96 relative">
                <div className="absolute top-3 right-3 z-[400] bg-white/90 dark:bg-gray-900/90 px-3 py-1.5 rounded-xl text-xs font-semibold shadow border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>© OpenStreetMap contributors — Data available under ODbL</span>
                </div>

                <MapContainer
                  center={[ (THAILAND_CITIES_PRESETS[originIdx].lat + THAILAND_CITIES_PRESETS[destIdx].lat)/2, (THAILAND_CITIES_PRESETS[originIdx].lng + THAILAND_CITIES_PRESETS[destIdx].lng)/2 ]}
                  zoom={7}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />

                  {/* Origin Marker */}
                  <Marker position={[THAILAND_CITIES_PRESETS[originIdx].lat, THAILAND_CITIES_PRESETS[originIdx].lng]}>
                    <Popup>
                      <strong className="text-emerald-700">จุดต้นทาง:</strong><br />
                      {THAILAND_CITIES_PRESETS[originIdx].name}
                    </Popup>
                  </Marker>

                  {/* Destination Marker */}
                  <Marker position={[THAILAND_CITIES_PRESETS[destIdx].lat, THAILAND_CITIES_PRESETS[destIdx].lng]}>
                    <Popup>
                      <strong className="text-blue-700">ปลายทาง:</strong><br />
                      {THAILAND_CITIES_PRESETS[destIdx].name}
                    </Popup>
                  </Marker>

                  {/* Polyline Route Path */}
                  {routeResult.geometry_coordinates && (
                    <Polyline 
                      positions={routeResult.geometry_coordinates} 
                      color={strategy === 'fastest' ? '#f59e0b' : strategy === 'energy_efficient' ? '#10b981' : '#3b82f6'} 
                      weight={5} 
                      opacity={0.85} 
                    />
                  )}

                  {/* Recommended Stop Markers on Map */}
                  {routeResult.tripAnalysis?.recommended_stops?.map((stop, sIdx) => (
                    <Marker key={sIdx} position={[stop.station.lat, stop.station.lng]} icon={createStationIcon('#10b981')}>
                      <Popup>
                        <div className="p-1 min-w-[180px]">
                          <p className="text-xs font-bold text-emerald-700">📍 {stop.role}</p>
                          <h4 className="font-bold text-sm my-1">{stop.station.name}</h4>
                          <p className="text-[11px] text-gray-600">ผู้ให้บริการ: {stop.station.provider}</p>
                          <button
                            onClick={() => openGoogleMapsNav(stop.station.lat, stop.station.lng)}
                            className="mt-2 w-full bg-blue-600 text-white py-1 rounded text-[11px] font-bold"
                          >
                            นำทางด้วย Google Maps
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Mandatory Notice Disclaimer */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">📢 หมายเหตุและคำแนะนำทางด้านความปลอดภัยของข้อมูล (Transparency & Safety Notice):</p>
                <p>{routeResult.tripAnalysis?.notice_disclaimer}</p>
                <p className="mt-1">ทุกผลลัพธ์การคำนวณถูกกำกับว่า <strong>“Estimate / ค่าประมาณ”</strong> เสมอ กรุณาตรวจสอบสถานะตู้ชาร์จผ่านโทรศัพท์หรือเว็บไซต์ทางการของผู้ให้บริการก่อนเริ่มเส้นทาง</p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
