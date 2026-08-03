import React, { useState, useEffect } from 'react';
import { RefreshCw, MapPin, Zap, ShieldAlert, AlertTriangle, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import StationFilter from './StationFilter';
import StationDetailsModal from './StationDetailsModal';
import Badge from '../common/Badge';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Helper for changing map view when station selected
function SetViewOnClick({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 14, { animate: true });
    }
  }, [coords, map]);
  return null;
}

// Generate color coded marker icon per provider brand
function getProviderPinIcon(provider = '') {
  let color = '#10b981'; // default emerald
  const p = provider.toUpperCase();
  if (p.includes('PTT')) color = '#3b82f6'; // Blue
  else if (p.includes('PEA')) color = '#8b5cf6'; // Purple
  else if (p.includes('EA ANYWHERE')) color = '#f59e0b'; // Amber
  else if (p.includes('ELEXA') || p.includes('EGAT')) color = '#06b6d4'; // Cyan
  else if (p.includes('TESLA')) color = '#ef4444'; // Red
  else if (p.includes('MG')) color = '#f97316'; // Orange

  return new L.DivIcon({
    className: 'ev-station-marker',
    html: `<div style="background-color: ${color}; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; cursor: pointer;">⚡</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
}

export default function StationMap({ onOpenReport, user }) {
  const { lang, t } = useLanguage();
  
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filtering states
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [selectedConnector, setSelectedConnector] = useState('ALL');
  const [minPower, setMinPower] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [focusCoords, setFocusCoords] = useState(null);

  const fetchStations = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/stations${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        // Obey mandatory requirement: display exact text if data unavailable
        throw new Error(data.error || 'Charging-station data is currently unavailable.');
      }

      setStations(data.stations || []);
      setIsCached(data.isCached || false);
      setLastUpdated(data.lastUpdated || null);
    } catch (err) {
      setError(err.message || 'Charging-station data is currently unavailable.');
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Compute unique list of providers
  const providersList = Array.from(new Set(stations.map(s => s.provider).filter(Boolean))).sort();

  // Filter stations logic
  const filteredStations = stations.filter(s => {
    if (selectedProvider !== 'ALL' && s.provider !== selectedProvider) return false;
    
    if (selectedConnector !== 'ALL') {
      const hasConn = s.connectors?.some(c => c.type && c.type.toUpperCase().includes(selectedConnector.toUpperCase()));
      if (!hasConn) return false;
    }

    if (minPower > 0) {
      if (!s.power_output_kw || s.power_output_kw < minPower) return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = s.name && s.name.toLowerCase().includes(q);
      const matchProv = s.province && s.province.toLowerCase().includes(q);
      const matchAddr = s.address && s.address.toLowerCase().includes(q);
      if (!matchName && !matchProv && !matchAddr) return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setSelectedProvider('ALL');
    setSelectedConnector('ALL');
    setMinPower(0);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden relative bg-gray-50 dark:bg-gray-950">
      
      {/* Filter Toolbar */}
      <StationFilter
        selectedProvider={selectedProvider} setSelectedProvider={setSelectedProvider}
        selectedConnector={selectedConnector} setSelectedConnector={setSelectedConnector}
        minPower={minPower} setMinPower={setMinPower}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        providersList={providersList}
        totalCount={stations.length}
        filteredCount={filteredStations.length}
        onReset={handleResetFilters}
      />

      {/* Data Source & Status Header Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-2 shadow-xs z-10">
        <div className="flex items-center gap-2">
          <span className="font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'th' ? 'แผนที่ตู้ชาร์จ EV ประเทศไทย (Real OpenStreetMap):' : 'Thailand EV Station Map:'}</span>
          </span>
          {isCached ? (
            <Badge type="cached" text={lang === 'th' ? 'ข้อมูลแคชจากระบบ (Cached Data)' : 'Cached Data'} timestamp={lastUpdated} />
          ) : (
            <Badge type="osm" text="Real-time OpenStreetMap" timestamp={lastUpdated} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStations(true)}
            disabled={loading}
            className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 dark:text-emerald-200 font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'กำลังดึงข้อมูล...' : 'รีเฟรชข้อมูล (Sync OSM)'}</span>
          </button>
        </div>
      </div>

      {/* Map Content Area */}
      <div className="flex-1 w-full h-full relative">
        
        {/* Loading Spinner Over Map */}
        {loading && (
          <div className="absolute inset-0 z-40 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xs flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-center space-y-3 max-w-sm">
              <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
              <p className="font-bold text-sm text-gray-800 dark:text-gray-100">
                {lang === 'th' ? '⏳ กำลังเชื่อมต่อฐานข้อมูลจริง OpenStreetMap...' : 'Connecting to OpenStreetMap real-world feed...'}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                ไม่มีการสร้างข้อมูลสมมุติ หรือ Mockup ตามนโยบายการเดินทางปลอดภัย
              </p>
            </div>
          </div>
        )}

        {/* Error Fallback Notice Required by Prompt */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-rose-600 text-white p-4 rounded-2xl shadow-xl max-w-md w-full text-center border border-rose-400 flex flex-col items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-white" />
            <p className="font-extrabold text-base">{error}</p>
            <p className="text-xs text-rose-100">
              {lang === 'th' 
                ? 'ข้อมูลสถานีชาร์จไม่สามารถใช้งานได้ในขณะนี้ กรุณาตรวจสอบสัญญานอินเทอร์เน็ตหรือติดต่อเซิร์ฟเวอร์ใหม่อีกครั้ง' 
                : 'Charging-station data is currently unavailable.'}
            </p>
            <button
              onClick={() => fetchStations(false)}
              className="mt-1 px-4 py-1.5 bg-white text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-50 transition-colors shadow"
            >
              ลองใหม่อีกครั้ง (Retry)
            </button>
          </div>
        )}

        {/* Leaflet Map Rendering */}
        <MapContainer
          center={[13.7563, 100.5018]} // Bangkok Default
          zoom={6}
          style={{ width: '100%', height: '100%' }}
          maxZoom={18}
          minZoom={5}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors — Thailand EV Network'
          />

          {focusCoords && <SetViewOnClick coords={focusCoords} />}

          {/* Render Filtered Station Markers */}
          {filteredStations.map((st) => (
            <Marker
              key={st.osm_id}
              position={[st.lat, st.lng]}
              icon={getProviderPinIcon(st.provider)}
              eventHandlers={{
                click: () => {
                  setSelectedStation(st);
                  setFocusCoords([st.lat, st.lng]);
                }
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {st.provider}
                  </span>
                  <h4 className="font-bold text-sm text-gray-900 mt-1.5 mb-1">{st.name}</h4>
                  <p className="text-[11px] text-gray-600 mb-2">{st.address} ({st.province})</p>
                  <button
                    onClick={() => setSelectedStation(st)}
                    className="w-full bg-emerald-600 text-white font-bold text-xs py-1.5 rounded-lg hover:bg-emerald-500 transition-colors shadow-xs"
                  >
                    🔍 ดูรายละเอียดและตรวจสอบสภาพตู้
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

      </div>

      {/* Station Details & Verification Modal */}
      {selectedStation && (
        <StationDetailsModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onOpenReport={onOpenReport}
          user={user}
        />
      )}
    </div>
  );
}
