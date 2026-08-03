import React, { useState, useEffect } from 'react';
import { LongdoMap } from 'longdomap-react';
import { mockStations } from './MockData';
import { getDistance } from 'geolib';
import { MapPin, Navigation, Zap, Clock, X, Filter, Calculator, Gift } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [calcAmount, setCalcAmount] = useState('200');
  const [topupCount, setTopupCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [showGacha, setShowGacha] = useState(false);
  const [gachaResult, setGachaResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [realStations, setRealStations] = useState([]);
  const [isFetchingReal, setIsFetchingReal] = useState(false);

  // Fetch Real Stations from OpenStreetMap Overpass API via Vite Proxy (no CORS!)
  useEffect(() => {
    const fetchRealStations = async () => {
      setIsFetchingReal(true);
      try {
        const query = `[out:json][timeout:30];node["amenity"="charging_station"](5.6,97.3,20.5,105.7);out body;`;
        
        // Use Vite proxy /overpass → rewrites to https://overpass-api.de/api
        // This avoids CORS completely as the request goes server→server
        const res = await fetch(`/overpass/interpreter?data=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        console.log(`✅ Loaded ${data.elements?.length} EV stations from OSM`);
        
        if (data.elements && data.elements.length > 0) {
          const mapped = data.elements.map((node) => {
            const tags = node.tags || {};
            const name = tags['name:th'] || tags['name'] || tags['operator'] || tags['brand'] || 'สถานีชาร์จรถไฟฟ้า EV';
            const network = tags['operator'] || tags['brand'] || tags['operator:th'] || 'เครือข่ายตู้ชาร์จสาธารณะ';
            
            let plugs = [];
            const hasCCS = tags['socket:type2_combo'] || name.includes('PEA') || name.includes('PTT') || name.includes('EleXA') || name.includes('MG') || name.includes('Arun');
            const hasType2 = tags['socket:type2'] || tags['socket:type2_combo'] || name.includes('EA Anywhere') || name.includes('Evolt') || name.includes('MEA');
            const hasCHAdeMO = tags['socket:chademo'] || name.includes('PEA') || name.includes('PTT') || name.includes('Nissan');

            if (hasCCS) {
              plugs.push({ id: `${node.id}_ccs1`, type: 'CCS2', power: '120 kW', category: 'DC Fast', status: Math.random() > 0.3 ? 'available' : 'in_use', statusTime: 'พร้อมใช้งาน' });
              plugs.push({ id: `${node.id}_ccs2`, type: 'CCS2', power: '120 kW', category: 'DC Fast', status: Math.random() > 0.4 ? 'available' : 'in_use', statusTime: 'พร้อมใช้งาน' });
            }
            if (hasCHAdeMO) {
              plugs.push({ id: `${node.id}_cha`, type: 'CHAdeMO', power: '50 kW', category: 'DC Fast', status: Math.random() > 0.5 ? 'available' : 'in_use', statusTime: 'พร้อมใช้งาน' });
            }
            if (hasType2 || plugs.length === 0) {
              plugs.push({ id: `${node.id}_t2`, type: 'Type 2', power: '22 kW', category: 'AC Normal', status: 'available', statusTime: 'พร้อมใช้งาน' });
            }

            const hasAvailable = plugs.some(p => p.status === 'available');
            return {
              id: `osm_${node.id}`, name,
              lat: node.lat, lng: node.lon,
              plugs, status: hasAvailable ? 'available' : 'in_use',
              network, openHours: tags['opening_hours'] || '24/7 เปิดบริการ',
              address: tags['addr:full'] || tags['addr:street'] || tags['addr:province'] || `${name} ประเทศไทย`,
            };
          });
          setRealStations(mapped);
        } else {
          throw new Error("No elements returned");
        }
      } catch (err) {
        console.warn("⚠️ Using mock data:", err.message);
        setRealStations(mockStations);
      } finally {
        setIsFetchingReal(false);
      }
    };
    fetchRealStations();
  }, []);





  // Simulate Real-time WebSocket Updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealStations(prev => prev.map(station => {
        if (Math.random() < 0.05) {
          const newStatus = station.status === 'available' ? 'in_use' : 'available';
          return {
            ...station,
            status: newStatus,
            plugs: station.plugs.map((p, idx) => idx === 0 ? { ...p, status: newStatus } : p),
            statusTime: `อัปเดตล่าสุด: ${new Date().toLocaleTimeString('th-TH')}`
          };
        }
        return station;
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Display real or mock stations
  const displayStations = React.useMemo(() => {
    if (realStations.length > 0) return realStations;
    // While loading, show empty (spinner shown in UI)
    return [];
  }, [realStations]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to Nakhon Phanom
          setUserLocation({ lat: 17.40, lng: 104.78 });
        }
      );
    } else {
      // Fallback
      setUserLocation({ lat: 17.40, lng: 104.78 });
    }
  }, []);

  const handleNavigate = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const getDistanceText = (station) => {
    if (!userLocation) return "Calculating...";
    const distanceMeters = getDistance(
      { latitude: userLocation.lat, longitude: userLocation.lng },
      { latitude: station.lat, longitude: station.lng }
    );
    
    // Estimate 40 km/h average speed
    const estimatedMinutes = Math.ceil(distanceMeters / 666);
    const timeText = estimatedMinutes > 0 ? `(ขับรถ ~${estimatedMinutes} นาที)` : `(ใกล้มาก)`;

    if (distanceMeters < 1000) {
      return `${distanceMeters} m ${timeText}`;
    }
    return `${(distanceMeters / 1000).toFixed(1)} km ${timeText}`;
  };

  const filteredStations = displayStations.filter(station => {
    if (filterType === 'All') return true;
    if (filterType === 'Available') return station.status === 'available';
    if (filterType === 'DC Fast') return station.plugs.some(p => p.type === 'CCS2' || p.type === 'CHAdeMO');
    return true;
  });

  const [mapInstance, setMapInstance] = useState(null);

  const handleMapLoad = (map) => {
    setMapInstance(map);
    // Listen to overlay click
    map.Event.bind('overlayClick', (overlay) => {
      if (overlay.stationData) {
        setSelectedStation(overlay.stationData);
      }
    });
  };

  useEffect(() => {
    if (!mapInstance || !window.longdo) return;
    
    mapInstance.Overlays.clear();

    // Add User Location Marker
    if (userLocation) {
      const userMarker = new window.longdo.Marker(
        { lon: userLocation.lng, lat: userLocation.lat },
        {
          html: `<div style="background-color: #3B82F6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
          weight: window.longdo.OverlayWeight.Top
        }
      );
      mapInstance.Overlays.add(userMarker);
      mapInstance.location({ lon: userLocation.lng, lat: userLocation.lat }, true);
    }

    // Add Station Markers
    filteredStations.forEach(station => {
      let color = '#10B981'; // available
      if (station.status === 'in_use') color = '#EF4444';
      if (station.status === 'offline') color = '#9CA3AF';
      
      const marker = new window.longdo.Marker(
        { lon: station.lng, lat: station.lat },
        {
          html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
          weight: window.longdo.OverlayWeight.Normal
        }
      );
      // Bind data to the marker instance for the click handler
      marker.stationData = station;
      mapInstance.Overlays.add(marker);
    });

  }, [mapInstance, filteredStations, userLocation, isFetchingReal]);

  return (
    <div className="relative w-full h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
      
      {/* Top Header / Search bar mock */}
      <div className="absolute top-0 w-full flex justify-center z-[1000] p-4 pointer-events-none">
        <div className="w-full max-w-[340px] bg-white rounded-2xl shadow-lg p-2.5 flex items-center justify-between pointer-events-auto">
          <div className="flex flex-col px-1">
            <div className="flex items-center text-gray-500">
              <Zap className="text-brand-primary w-5 h-5 mr-1" />
              <span className="font-extrabold text-gray-800 text-lg tracking-tight">PlugPayGo</span>
            </div>
            <span className="text-[10px] text-gray-500 mt-[-2px] font-medium leading-none">ค้นหา คำนวณ จ่าย ครบจบทุกทริป EV</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGacha(true)}
              className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm border border-amber-200 hover:bg-amber-200 transition"
            >
              <Gift className="w-4 h-4" />
              <span>{points} Pts</span>
            </button>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Filter Dropdown */}
        {isFilterOpen && (
          <div className="mt-2 bg-white rounded-2xl shadow-lg p-4 pointer-events-auto flex gap-2 overflow-x-auto">
            {['All', 'Available', 'DC Fast'].map(type => (
              <button 
                key={type}
                onClick={() => { setFilterType(type); setIsFilterOpen(false); }}
                className={clsx(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition",
                  filterType === type ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-700"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 z-0 relative">
        <LongdoMap
          id="longdo-map"
          apiKey="4e766166d1d8a08bc2824b64a48686da"
          mapObj={handleMapLoad}
          zoom={13}
          location={userLocation ? { lon: userLocation.lng, lat: userLocation.lat } : { lon: 100.5, lat: 13.75 }}
          height="100%"
        />
      </div>

      {/* Bottom Sheet */}
      <div className={clsx(
        "absolute bottom-0 w-full bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-[1000] transition-transform duration-300 ease-in-out",
        selectedStation ? "translate-y-0" : "translate-y-full"
      )}>
        {selectedStation && (
          <div className="p-6 pb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedStation.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{selectedStation.network}</p>
              </div>
              <button 
                onClick={() => setSelectedStation(null)}
                className="p-2 bg-gray-100 rounded-full text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-brand-primary" />
                <span className="font-medium text-brand-primary">{getDistanceText(selectedStation)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{selectedStation.openHours}</span>
              </div>
            </div>

            {/* Connectors Section (PugEV Style) */}
            <div className="bg-gray-50/80 rounded-2xl p-4 mb-6 border border-gray-100 shadow-inner">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-brand-primary" />
                  หัวชาร์จทั้งหมด
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {selectedStation.plugs.filter(p => p.status === 'available').length}/{selectedStation.plugs.length} ว่าง
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedStation.plugs.map((plug, idx) => {
                  const isCCS = plug.type.includes('CCS');
                  const isType2 = plug.type.includes('Type');
                  const isCHAdeMO = plug.type.includes('CHAdeMO');

                  let badgeBg = 'bg-gray-100 text-gray-700 border-gray-200';
                  let iconColor = 'text-gray-500';
                  let typeLabel = plug.type;
                  let categoryLabel = plug.category || (isCCS || isCHAdeMO ? 'DC Fast' : 'AC Normal');

                  if (isCCS) {
                    badgeBg = 'bg-amber-50 text-amber-900 border-amber-200/60';
                    iconColor = 'text-amber-500';
                  } else if (isType2) {
                    badgeBg = 'bg-sky-50 text-sky-900 border-sky-200/60';
                    iconColor = 'text-sky-500';
                  } else if (isCHAdeMO) {
                    badgeBg = 'bg-purple-50 text-purple-900 border-purple-200/60';
                    iconColor = 'text-purple-500';
                  }

                  return (
                    <div 
                      key={idx} 
                      className={clsx(
                        "flex justify-between items-center p-3 rounded-xl border transition shadow-sm",
                        badgeBg
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100 shrink-0">
                          <Zap className={clsx("w-5 h-5 fill-current", iconColor)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-gray-900 text-base leading-none">{typeLabel}</p>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 text-gray-600">
                              {categoryLabel}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-gray-500 mt-1">กำลังไฟสูงสุด: <span className="text-gray-800">{plug.power}</span></p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={clsx(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs",
                          plug.status === 'available' ? "bg-emerald-500 text-white" :
                          plug.status === 'in_use' ? "bg-rose-500 text-white" : "bg-gray-400 text-white"
                        )}>
                          <span className={clsx(
                            "w-1.5 h-1.5 rounded-full bg-white",
                            plug.status === 'available' && "animate-ping"
                          )} />
                          {plug.status === 'available' ? 'ว่างพร้อมชาร์จ' : plug.status === 'in_use' ? 'มีรถชาร์จอยู่' : 'ปิดปรับปรุง'}
                        </span>
                        {plug.statusTime && (
                          <p className="text-[10px] text-gray-400 mt-1">{plug.statusTime}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculator & Payment */}
            <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100">
              <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" /> 
                เลือกจำนวนเงินที่ต้องการชาร์จ
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <select 
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-emerald-900 appearance-none"
                  >
                    <option value="50">50 บาท</option>
                    <option value="100">100 บาท</option>
                    <option value="150">150 บาท</option>
                    <option value="200">200 บาท</option>
                    <option value="300">300 บาท</option>
                    <option value="500">500 บาท</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                <div className="flex-1 bg-white border border-emerald-200 rounded-lg py-2 px-3 text-center">
                  <span className="font-bold text-emerald-600 text-lg">
                    {calcAmount ? (Number(calcAmount) / 7.5).toFixed(1) : 0}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">kWh</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-emerald-100 text-sm flex justify-between items-center shadow-sm mb-3">
                <span className="text-gray-600">วิ่งได้ระยะทางประมาณ:</span>
                <div>
                  <span className="font-bold text-emerald-700 text-lg">
                    {calcAmount ? Math.round((Number(calcAmount) / 7.5) / 0.15) : 0}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">กิโลเมตร</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  const newCount = topupCount + 1;
                  setTopupCount(newCount);
                  if (newCount % 2 === 0) {
                    setPoints(points + 5);
                    alert(`ชำระเงิน ${calcAmount} บาท สำเร็จ!\n🎉 ยินดีด้วย! คุณเติมเงินครบ 2 ครั้ง ได้รับ 5 คะแนนสำหรับหมุนตู้ Gacha!`);
                  } else {
                    alert(`ชำระเงิน ${calcAmount} บาท สำเร็จ!\n⚡ เติมอีก 1 ครั้งเพื่อรับ 5 คะแนนไปหมุน Gacha!`);
                  }
                }}
                className="w-full bg-[#113566] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {/* Bank / QR Icon Mock */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                โอนจ่ายผ่านธนาคาร (Thai QR Payment)
              </button>
            </div>

            <button 
              onClick={() => handleNavigate(selectedStation.lat, selectedStation.lng)}
              className="w-full bg-brand-primary text-white font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Navigation className="w-5 h-5" />
              Navigate with Google Maps
            </button>
          </div>
        )}
      </div>

      {/* Gacha Modal */}
      {showGacha && (
        <div className="absolute inset-0 z-[2000] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => { if(!isSpinning) { setShowGacha(false); setGachaResult(null); } }}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 z-50"
              disabled={isSpinning}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-gradient-to-b from-amber-200 to-amber-100 p-6 text-center">
              <h2 className="text-2xl font-bold text-amber-900 mt-2">วงล้อเสี่ยงโชค</h2>
              <div className="mt-2 inline-block bg-white/60 px-4 py-1 rounded-full text-amber-900 font-bold shadow-sm">
                คะแนนของคุณ: {points}
              </div>
            </div>
            
            <div className="p-6 text-center bg-gray-50 relative overflow-hidden">
              
              {/* Spinning Wheel UI */}
              <div className="relative w-56 h-56 mx-auto my-4">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-gray-800 z-10 drop-shadow-md"></div>
                
                <div 
                  className="w-full h-full rounded-full border-4 border-white shadow-lg overflow-hidden relative transition-transform duration-[3000ms] ease-[cubic-bezier(0.25,0.1,0.15,1)]"
                  style={{ 
                    transform: `rotate(${wheelRotation}deg)`,
                    background: `conic-gradient(
                      #ef4444 0deg 60deg, 
                      #f97316 60deg 120deg, 
                      #eab308 120deg 180deg, 
                      #22c55e 180deg 240deg, 
                      #3b82f6 240deg 300deg, 
                      #a855f7 300deg 360deg
                    )`
                  }}
                >
                  {[
                    { name: "1000฿", color: "#ef4444" },
                    { name: "500฿", color: "#f97316" },
                    { name: "300฿", color: "#eab308" },
                    { name: "100฿", color: "#22c55e" },
                    { name: "10฿", color: "#3b82f6" },
                    { name: "5฿", color: "#a855f7" }
                  ].map((prize, i) => (
                    <div 
                      key={i} 
                      className="absolute w-full h-full text-white font-bold text-sm drop-shadow-md"
                      style={{ transform: `rotate(${i * 60 + 30}deg)` }}
                    >
                      <div className="pt-4 text-center text-lg">{prize.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {gachaResult ? (
                <div className="animate-in zoom-in duration-300 mt-4">
                  <h3 className="text-xl font-bold text-gray-800">🎉 ยินดีด้วย! 🎉</h3>
                  <p className="text-emerald-600 font-bold text-lg">ได้รับเครดิตชาร์จฟรี: {gachaResult.name}</p>
                  <button 
                    onClick={() => setGachaResult(null)}
                    className="mt-4 w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300"
                  >
                    ตกลง
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    if (points >= 5 && !isSpinning) {
                      setPoints(points - 5);
                      setIsSpinning(true);
                      
                      const prizes = [
                        { name: "1000 บาท", icon: "💰" }, // 0
                        { name: "500 บาท", icon: "💵" }, // 1
                        { name: "300 บาท", icon: "💴" }, // 2
                        { name: "100 บาท", icon: "💶" }, // 3
                        { name: "10 บาท", icon: "🪙" },  // 4
                        { name: "5 บาท", icon: "🪙" }    // 5
                      ];
                      
                      // For a realistic gacha, lower prizes should be more common, but let's just random it
                      // Let's skew it so 10 and 5 baht are much more common
                      const rand = Math.random();
                      let prizeIndex = 5; // default 5 Baht
                      if (rand > 0.99) prizeIndex = 0; // 1% chance for 1000
                      else if (rand > 0.95) prizeIndex = 1; // 4% chance for 500
                      else if (rand > 0.85) prizeIndex = 2; // 10% chance for 300
                      else if (rand > 0.60) prizeIndex = 3; // 25% chance for 100
                      else if (rand > 0.30) prizeIndex = 4; // 30% chance for 10
                      else prizeIndex = 5; // 30% chance for 5

                      const sliceCenter = prizeIndex * 60 + 30;
                      const targetRotation = 360 - sliceCenter;
                      const extraSpins = 5 * 360;
                      const currentBase = Math.floor(wheelRotation / 360) * 360;
                      const newRotation = currentBase + extraSpins + targetRotation;

                      setWheelRotation(newRotation);

                      setTimeout(() => {
                        setIsSpinning(false);
                        setGachaResult(prizes[prizeIndex]);
                      }, 3000);
                    }
                  }}
                  disabled={points < 5 || isSpinning}
                  className={clsx(
                    "mt-4 w-full font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 text-lg",
                    points >= 5 && !isSpinning
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/30" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  )}
                >
                  {isSpinning ? "กำลังหมุน..." : points >= 5 ? "หมุนวงล้อ (5 Pts)" : "คะแนนไม่พอ"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
