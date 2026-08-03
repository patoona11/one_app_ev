import axios from 'axios';
import db from '../../database/db.js';

// Helper for sleeping during exponential backoff
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class OverpassService {
  constructor() {
    this.endpoints = (process.env.OVERPASS_ENDPOINTS || 'https://overpass.openstreetmap.fr/api,https://overpass-api.de/api,https://overpass.kumi.systems/api').split(',');
    this.query = `
[out:json][timeout:120];
area["ISO3166-1"="TH"][admin_level=2]->.th;
(
  node["amenity"="charging_station"](area.th);
  way["amenity"="charging_station"](area.th);
  relation["amenity"="charging_station"](area.th);
);
out center tags;
    `.trim();
  }

  // Parse raw OSM element strictly without inventing or inferring values
  parseOsmElement(el) {
    const tags = el.tags || {};
    const osmType = el.type; // node, way, or relation
    const osmId = el.id.toString();
    const uniqueId = `${osmType}_${osmId}`;

    // Coordinates: nodes have lat/lon, ways/relations return center object from Overpass 'out center tags'
    const lat = el.lat !== undefined ? el.lat : (el.center?.lat);
    const lng = el.lon !== undefined ? el.lon : (el.center?.lon);

    if (lat === undefined || lng === undefined) return null;

    // Thailand coordinates boundary validation (approx: Lat 5.5 to 20.6, Lng 97.2 to 105.9)
    if (lat < 5.5 || lat > 20.6 || lng < 97.2 || lng > 105.9) {
      return null;
    }

    // Name determination priority: name:th → name → brand → operator → "EV Charging Station" / "สถานีชาร์จรถไฟฟ้า EV"
    const name = tags['name:th'] || tags['name'] || tags['brand'] || tags['operator'] || 'สถานีชาร์จรถไฟฟ้า EV';

    // Provider identification from brand, operator, or network
    const rawProvider = tags['brand'] || tags['operator'] || tags['network'] || 'ไม่ระบุผู้ให้บริการ (Unspecified Provider)';
    
    // Clean Provider Name matching known Thailand providers or keeping exact tag value
    let provider = rawProvider;
    const pUpper = rawProvider.toUpperCase();
    if (pUpper.includes('PTT') || pUpper.includes('PLUZ') || pUpper === 'EV STATION' || pUpper === 'OR') provider = 'PTT EV Station PluZ';
    else if (pUpper.includes('PEA') || pUpper.includes('VOLTA') || pUpper.includes('PROVINCIAL ELECTRICITY')) provider = 'PEA VOLTA';
    else if (pUpper.includes('EA ') || pUpper.includes('EA ANYWHERE') || pUpper === 'EA' || pUpper === 'E ANYWHERE') provider = 'EA Anywhere';
    else if (pUpper.includes('ELEX') || pUpper.includes('EGAT')) provider = 'EleXA by EGAT';
    else if (pUpper.includes('EVOLT') || pUpper.includes('EOSVOLT')) provider = 'Evolt';
    else if (pUpper.includes('MG')) provider = 'MG Super Charge';
    else if (pUpper.includes('TESLA')) provider = 'Tesla Supercharger';
    else if (pUpper.includes('SHELL')) provider = 'Shell Recharge';
    else if (pUpper.includes('ON-ION') || pUpper.includes('ONION')) provider = 'On-ion (OR)';
    else if (pUpper.includes('GINKA')) provider = 'Ginka EV';
    else if (pUpper.includes('BYD') || pUpper.includes('REVER') || pUpper.includes('REVERT')) provider = 'BYD / Rêver Automotive';
    else if (pUpper.includes('SPARK')) provider = 'Spark EV';
    else if (pUpper.includes('MEA') || pUpper.includes('METROPOLITAN')) provider = 'MEA EV';
    else if (pUpper.includes('CHARGE+')) provider = 'Charge+';
    else if (pUpper.includes('ALTERVIM')) provider = 'Altervim SuperCharge';

    // Read connector types exclusively from relevant OSM tags
    const connectors = [];
    if (tags['socket:type2'] || tags['socket:type2:output']) {
      connectors.push({ type: 'Type 2', count: parseInt(tags['socket:type2_capacity'] || tags['socket:type2'] || tags['capacity'] || 1, 10) });
    }
    if (tags['socket:type2_combo'] || tags['socket:type2_combo:output']) {
      connectors.push({ type: 'CCS2', count: parseInt(tags['socket:type2_combo_capacity'] || tags['socket:type2_combo'] || tags['capacity'] || 1, 10) });
    }
    if (tags['socket:chademo'] || tags['socket:chademo:output']) {
      connectors.push({ type: 'CHAdeMO', count: parseInt(tags['socket:chademo_capacity'] || tags['socket:chademo'] || tags['capacity'] || 1, 10) });
    }
    if (tags['socket:tesla_supercharger'] || tags['socket:tesla_supercharger:output']) {
      connectors.push({ type: 'Tesla Supercharger', count: parseInt(tags['socket:tesla_supercharger_capacity'] || tags['capacity'] || 1, 10) });
    }
    if (tags['socket:type1'] || tags['socket:type1_combo']) {
      connectors.push({ type: 'Type 1 / CCS1', count: parseInt(tags['capacity'] || 1, 10) });
    }

    // Power output calculation exclusively from tags - NEVER infer from provider brand!
    let powerOutputKw = null;
    const rawOutput = tags['charging_station:output'] || tags['socket:type2_combo:output'] || tags['socket:chademo:output'] || tags['socket:type2:output'];
    if (rawOutput) {
      const match = rawOutput.match(/([0-9.]+)/);
      if (match && match[1]) {
        powerOutputKw = parseFloat(match[1]);
      }
    }

    // Traceability URL
    const osmUrl = `https://www.openstreetmap.org/${osmType}/${osmId}`;

    // Address & Province parsing
    const address = tags['addr:full'] || tags['addr:street'] || tags['addr:place'] || tags['description'] || 'ไม่มีข้อมูลที่อยู่ (No address provided)';
    let province = tags['addr:province'] || tags['addr:state'] || 'ไม่ระบุจังหวัด (Unspecified Province)';
    if (address && !tags['addr:province']) {
      // Basic detection for Bangkok or provinces in text if tag is missing
      if (address.includes('กรุงเทพ') || address.includes('Bangkok')) province = 'กรุงเทพมหานคร';
      else if (address.includes('เชียงใหม่') || address.includes('Chiang Mai')) province = 'เชียงใหม่';
      else if (address.includes('ภูเก็ต') || address.includes('Phuket')) province = 'ภูเก็ต';
      else if (address.includes('ชลบุรี') || address.includes('Chon Buri') || address.includes('พัทยา')) province = 'ชลบุรี';
      else if (address.includes('ขอนแก่น')) province = 'ขอนแก่น';
      else if (address.includes('ระยอง')) province = 'ระยอง';
      else if (address.includes('นครราชสีมา') || address.includes('โคราช')) province = 'นครราชสีมา';
    }

    return {
      osm_id: uniqueId,
      osm_type: osmType,
      name,
      lat,
      lng,
      provider,
      connectors_json: JSON.stringify(connectors.length > 0 ? connectors : [{ type: 'ไม่ระบุประเภท (Unspecified Connector)', count: 1 }]),
      power_output_kw: powerOutputKw,
      price_info: tags['fee:description'] || tags['charge'] || tags['fee'] === 'yes' ? 'มีค่าบริการ (Fee applies - โปรดตรวจสอบกับผู้ให้บริการ)' : (tags['fee'] === 'no' ? 'ไม่มีค่าบริการ (Free of charge)' : null),
      open_hours: tags['opening_hours'] || 'ไม่มีข้อมูลเวลาเปิด-ปิด (No business hours data available)',
      address,
      province,
      osm_url: osmUrl,
      raw_tags_json: JSON.stringify(tags)
    };
  }

  // Fetch from Overpass API with Retry and Exponential Backoff
  async fetchRealStationsFromAPI() {
    let attempt = 0;
    const maxAttempts = 3;

    for (const endpoint of this.endpoints) {
      attempt++;
      try {
        console.log(`📡 [OverpassProxy] Fetching EV station data from ${endpoint} (Attempt ${attempt})...`);
        const response = await axios.post(`${endpoint.trim()}/interpreter`, `data=${encodeURIComponent(this.query)}`, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'App_EV_Thailand_Production/1.0 (Contact: support@appev.th)'
          },
          timeout: 45000
        });

        if (response.status === 200 && response.data?.elements) {
          const elements = response.data.elements;
          const deduplicateMap = new Map();

          elements.forEach(el => {
            const parsed = this.parseOsmElement(el);
            if (parsed && !deduplicateMap.has(parsed.osm_id)) {
              deduplicateMap.set(parsed.osm_id, parsed);
            }
          });

          const verifiedStations = Array.from(deduplicateMap.values());
          console.log(`✅ [OverpassProxy] Success! Retrieved & deduplicated ${verifiedStations.length} EV stations across Thailand.`);

          // Update cache in database
          this.saveToCache(verifiedStations);

          return {
            stations: verifiedStations,
            source: 'OpenStreetMap',
            isCached: false,
            lastUpdated: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn(`⚠️ [OverpassProxy] Failed on ${endpoint}: ${err.message}`);
        const backoffTime = Math.pow(2, attempt) * 1000;
        if (attempt < maxAttempts) {
          await sleep(backoffTime);
        }
      }
    }

    throw new Error('All Overpass endpoints unreachable or timed out.');
  }

  // Save stations to SQLite cache
  saveToCache(stations) {
    try {
      const insert = db.prepare(`
        INSERT OR REPLACE INTO stations_cache 
        (osm_id, osm_type, name, lat, lng, provider, connectors_json, power_output_kw, price_info, open_hours, address, province, osm_url, raw_tags_json, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const transaction = db.transaction((list) => {
        for (const s of list) {
          insert.run(
            s.osm_id, s.osm_type, s.name, s.lat, s.lng, s.provider, s.connectors_json,
            s.power_output_kw, s.price_info, s.open_hours, s.address, s.province, s.osm_url, s.raw_tags_json
          );
        }
      });

      transaction(stations);
      console.log(`💾 [OverpassProxy] Successfully saved ${stations.length} stations into local Database cache.`);
    } catch (dbErr) {
      console.error(`❌ [OverpassProxy] Database caching failed:`, dbErr.message);
    }
  }

  // Get stations from API or Fallback to Cache
  async getStations(forceRefresh = false) {
    // Check existing cache
    const countRow = db.prepare('SELECT COUNT(*) as cnt, MAX(last_updated) as latest FROM stations_cache').get();
    const isCacheFresh = countRow.latest && (new Date() - new Date(countRow.latest + 'Z')) < (4 * 60 * 60 * 1000); // 4 hours

    if (countRow.cnt > 0 && !forceRefresh && isCacheFresh) {
      console.log(`🚀 [OverpassProxy] Returning ${countRow.cnt} stations from fresh database cache (Last update: ${countRow.latest})`);
      const rows = db.prepare('SELECT * FROM stations_cache').all();
      return {
        stations: this.formatCachedRows(rows),
        source: 'OpenStreetMap (Cached Data)',
        isCached: true,
        lastUpdated: countRow.latest + 'Z',
        notice: 'ข้อมูลถูกเก็บในแคชเพื่อลดการใช้ทรัพยากร API (Cached data to optimize rate limits)'
      };
    }

    try {
      return await this.fetchRealStationsFromAPI();
    } catch (error) {
      console.error(`❌ [OverpassProxy] External API failure: ${error.message}`);
      // NEVER silently replace with mock data. Fallback to cached data if available.
      if (countRow.cnt > 0) {
        const rows = db.prepare('SELECT * FROM stations_cache').all();
        return {
          stations: this.formatCachedRows(rows),
          source: 'OpenStreetMap (Cached Data)',
          isCached: true,
          lastUpdated: countRow.latest + 'Z',
          warning: 'ไม่สามารถติดต่อ Overpass API ได้ แสดงข้อมูลสำรองจากแคชล่าสุด (Cached Data due to API fallback)'
        };
      } else {
        // If no cache is available, throw error to display exact warning message required by prompt
        throw new Error('Charging-station data is currently unavailable.');
      }
    }
  }

  formatCachedRows(rows) {
    return rows.map(r => {
      // Attach latest verified community reports summary if available
      const reports = db.prepare(`
        SELECT connector_status, verified_status, verified_at_bkk, observed_price, photo_url, confirm_count 
        FROM community_reports 
        WHERE station_osm_id = ? 
        ORDER BY created_at DESC LIMIT 3
      `).all(r.osm_id);

      return {
        ...r,
        connectors: JSON.parse(r.connectors_json),
        raw_tags: r.raw_tags_json ? JSON.parse(r.raw_tags_json) : {},
        community_reports: reports
      };
    });
  }
}

export default new OverpassService();
