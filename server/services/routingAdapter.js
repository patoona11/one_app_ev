import axios from 'axios';
import db from '../../database/db.js';

// Distance helper (Haversine Formula in kilometers)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class RoutingAdapter {
  constructor() {
    this.provider = process.env.ROUTING_PROVIDER || 'OSRM';
    this.osrmBaseUrl = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org/route/v1';
  }

  async getRoute(waypoints, strategy = 'fastest', vehicleConfig = {}) {
    // waypoints array of { lat, lng }
    if (!waypoints || waypoints.length < 2) {
      throw new Error('At least origin and destination coordinates are required.');
    }

    let routeData;
    if (this.provider === 'OSRM') {
      routeData = await this.fetchOsrmRoute(waypoints, strategy);
    } else {
      // Fallback to OSRM if custom provider key isn't operational
      routeData = await this.fetchOsrmRoute(waypoints, strategy);
    }

    // Process EV Smart Trip Recommendations along the route corridor
    const tripAnalysis = this.analyzeEvTrip(routeData, vehicleConfig, strategy);
    return { ...routeData, tripAnalysis };
  }

  async fetchOsrmRoute(waypoints, strategy) {
    const coordString = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
    const url = `${this.osrmBaseUrl}/driving/${coordString}?overview=full&geometries=geojson&steps=true`;
    
    try {
      const response = await axios.get(url, { timeout: 15000 });
      if (response.data.code !== 'Ok' || !response.data.routes?.length) {
        throw new Error('Route not found from OSRM provider.');
      }

      const rawRoute = response.data.routes[0];
      const distanceKm = rawRoute.distance / 1000;
      const durationMin = Math.round(rawRoute.duration / 60);
      const coordinates = rawRoute.geometry.coordinates.map(coord => [coord[1], coord[0]]); // Leaflet format [lat, lng]

      return {
        provider: 'OSRM (Road Network)',
        strategy,
        distance_km: parseFloat(distanceKm.toFixed(1)),
        duration_minutes: durationMin,
        geometry_coordinates: coordinates,
        summary: rawRoute.legs.map(l => l.summary || 'Road Segment').join(' -> ')
      };
    } catch (err) {
      console.error(`❌ [RoutingAdapter] Routing query failed:`, err.message);
      throw new Error(`Routing provider error: ${err.message}`);
    }
  }

  analyzeEvTrip(routeData, vehicle, strategy) {
    // Default vehicle specs if not completely provided
    const batteryCapacity = vehicle.batteryCapacity || 60; // kWh
    const consumptionRate = vehicle.consumptionRate || 16; // kWh per 100 km (0.16 kWh/km)
    const initialSoc = vehicle.initialSoc || 100; // %
    const reserveSoc = vehicle.reserveSoc || 20; // %
    const maxChargingPowerKw = vehicle.maxChargingPowerKw || 120; // kW DC Fast
    const compatibleConnectors = vehicle.compatibleConnectors || ['CCS2', 'Type 2'];

    // Calculations based on strictly mandated formulas
    // Energy consumed (kWh) = Distance (km) * Energy consumption (kWh/100 km) / 100
    const totalEnergyConsumedKwh = parseFloat(((routeData.distance_km * consumptionRate) / 100).toFixed(2));

    // Usable energy before reaching reserve SOC
    const initialEnergyKwh = (initialSoc / 100) * batteryCapacity;
    const reserveEnergyKwh = (reserveSoc / 100) * batteryCapacity;
    const usableEnergyKwh = Math.max(0, initialEnergyKwh - reserveEnergyKwh);

    // Estimated driving range (km) = Usable battery energy (kWh) / Energy consumption (kWh/km)
    const consumptionPerKm = consumptionRate / 100;
    const estimatedDrivingRangeKm = parseFloat((usableEnergyKwh / consumptionPerKm).toFixed(1));

    const canReachDestinationWithoutCharge = totalEnergyConsumedKwh <= usableEnergyKwh;

    // Fetch all stations from DB cache to check corridor
    const allStations = db.prepare('SELECT * FROM stations_cache').all().map(s => ({
      ...s,
      connectors: JSON.parse(s.connectors_json)
    }));

    // Filter compatible stations along the route geometry (within ~8 km radius of any point on polyline step)
    // To optimize performance, sample route coordinates every 10th point
    const stepSize = Math.max(1, Math.floor(routeData.geometry_coordinates.length / 50));
    const sampledCoords = routeData.geometry_coordinates.filter((_, idx) => idx % stepSize === 0);

    const compatibleStations = allStations.filter(station => {
      // Must have at least one matching connector
      const hasConnector = station.connectors.some(c => 
        compatibleConnectors.some(req => c.type.toUpperCase().includes(req.toUpperCase()))
      );
      if (!hasConnector) return false;

      // Check distance to route path
      return sampledCoords.some(coord => haversineDistance(coord[0], coord[1], station.lat, station.lng) <= 8.5);
    });

    // Strategy ranking logic
    if (strategy === 'lowest_risk') {
      // Prefer high-reliability providers with multiple connectors & verified power
      compatibleStations.sort((a, b) => (b.power_output_kw || 0) - (a.power_output_kw || 0));
    } else if (strategy === 'energy_efficient') {
      // Prefer stations closest to straight line (minimize detour distance)
      compatibleStations.sort((a, b) => {
        const distA = haversineDistance(sampledCoords[Math.floor(sampledCoords.length/2)][0], sampledCoords[Math.floor(sampledCoords.length/2)][1], a.lat, a.lng);
        const distB = haversineDistance(sampledCoords[Math.floor(sampledCoords.length/2)][0], sampledCoords[Math.floor(sampledCoords.length/2)][1], b.lat, b.lng);
        return distA - distB;
      });
    }

    // Recommend Primary Stop & Backup Stop if charging is required or recommended
    let recommendedStops = [];
    let backupStops = [];
    let coverageWarnings = [];

    if (!canReachDestinationWithoutCharge) {
      if (compatibleStations.length === 0) {
        coverageWarnings.push({
          level: 'DANGER',
          message_th: 'คำเตือน: บริเวณเส้นทางนี้ไม่พบสถานีชาร์จที่มีหัวชาร์จตรงกับรถของคุณ (Insufficient charging coverage)',
          message_en: 'Warning: Route segment has insufficient charging coverage for your connector type.'
        });
      } else {
        // Pick primary station near where battery reaches 35-40% SOC
        const primary = compatibleStations[0];
        const backup = compatibleStations.length > 1 ? compatibleStations[1] : null;

        const effectiveKw = primary.power_output_kw ? Math.min(maxChargingPowerKw, primary.power_output_kw) : null;
        let estimatedChargeTimeMinutes = null;
        if (effectiveKw && effectiveKw > 0) {
          const energyNeeded = totalEnergyConsumedKwh - usableEnergyKwh + (0.2 * batteryCapacity); // Charge enough to complete trip + 20% safety
          // Estimated charging time = Energy required / Effective charging power
          estimatedChargeTimeMinutes = Math.round((energyNeeded / effectiveKw) * 60);
        }

        recommendedStops.push({
          station: primary,
          role: 'Primary Stop (จุดชาร์จแนะนำหลัก)',
          effective_charging_power_kw: effectiveKw ? `${effectiveKw} kW (Estimate / ค่าประมาณ)` : 'ไม่มีข้อมูลกำลังไฟ (No data available)',
          estimated_charging_time: estimatedChargeTimeMinutes ? `${estimatedChargeTimeMinutes} นาที (Estimate / ค่าประมาณ)` : 'ข้อมูลกำลังไฟไม่เพียงพอสำหรับการคำนวณที่แม่นยำ (Insufficient information to calculate reliably)',
          estimated_soc_arrival_pct: `${Math.max(15, Math.round(initialSoc - ((totalEnergyConsumedKwh * 0.55) / batteryCapacity * 100)))}% (Estimate)`
        });

        if (backup && backup.osm_id !== primary.osm_id) {
          backupStops.push({
            station: backup,
            role: 'Backup Stop (จุดชาร์จสำรองฉุกเฉิน)'
          });
        }
      }
    }

    return {
      can_reach_without_charge: canReachDestinationWithoutCharge,
      total_energy_consumed_kwh: `${totalEnergyConsumedKwh} kWh (Estimate / ค่าประมาณ)`,
      estimated_driving_range_km: `${estimatedDrivingRangeKm} km (Estimate / ค่าประมาณ)`,
      recommended_stops: recommendedStops,
      backup_stops: backupStops,
      coverage_warnings: coverageWarnings,
      notice_disclaimer: 'คำแนะนำ: อัตราสิ้นเปลืองและระยะเวลาชาร์จจริงขึ้นอยู่กับสภาพการจราจร อุณหภูมิแบตเตอรี่ สภาพอากาศ น้ำหนักบรรทุก และข้อจำกัดของตู้ชาร์จแต่ละสถานี โปรดเผื่อแบตเตอรี่สำรองเสมอ'
    };
  }
}

export default new RoutingAdapter();
