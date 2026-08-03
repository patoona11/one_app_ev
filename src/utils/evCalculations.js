// EV Trip & Battery Energy Calculations according to official specifications

/**
 * Energy consumed (kWh) = Distance (km) * Energy consumption (kWh/100 km) / 100
 */
export function calculateEnergyConsumed(distanceKm, consumptionKwhPer100Km) {
  if (!distanceKm || !consumptionKwhPer100Km) return null;
  const value = (distanceKm * consumptionKwhPer100Km) / 100;
  return {
    value: parseFloat(value.toFixed(2)),
    label: 'Estimate / ค่าประมาณ',
    display: `${value.toFixed(2)} kWh (Estimate)`
  };
}

/**
 * Estimated driving range (km) = Usable battery energy (kWh) / Energy consumption (kWh/km)
 */
export function calculateDrivingRange(usableEnergyKwh, consumptionKwhPer100Km) {
  if (!usableEnergyKwh || !consumptionKwhPer100Km || consumptionKwhPer100Km <= 0) return null;
  const consumptionPerKm = consumptionKwhPer100Km / 100;
  const range = usableEnergyKwh / consumptionPerKm;
  return {
    value: parseFloat(range.toFixed(1)),
    label: 'Estimate / ค่าประมาณ',
    display: `${range.toFixed(1)} km (Estimate)`
  };
}

/**
 * Effective charging power = Minimum of vehicle's max charging power and station's available power
 */
export function calculateEffectiveChargingPower(vehicleMaxKw, stationOutputKw) {
  if (!vehicleMaxKw) return null;
  if (!stationOutputKw || isNaN(stationOutputKw)) {
    return {
      value: null,
      isKnown: false,
      display: 'ไม่มีข้อมูลกำลังไฟสถานี (No station power data available)'
    };
  }
  const effectiveKw = Math.min(vehicleMaxKw, stationOutputKw);
  return {
    value: effectiveKw,
    isKnown: true,
    label: 'Estimate / ค่าประมาณ',
    display: `${effectiveKw} kW (Estimate / ค่าประมาณ)`
  };
}

/**
 * Estimated charging time = Energy required (kWh) / Effective charging power (kW) -> returned in minutes
 */
export function calculateChargingTimeMinutes(energyRequiredKwh, effectivePowerKw) {
  if (!energyRequiredKwh || !effectivePowerKw || effectivePowerKw <= 0 || isNaN(effectivePowerKw)) {
    return {
      value: null,
      canCalculate: false,
      display: 'ข้อมูลกำลังไฟไม่เพียงพอสำหรับการคำนวณที่แม่นยำ (Insufficient information to calculate reliably)'
    };
  }
  const hours = energyRequiredKwh / effectivePowerKw;
  const minutes = Math.round(hours * 60);
  return {
    value: minutes,
    canCalculate: true,
    label: 'Estimate / ค่าประมาณ',
    display: `~${minutes} นาที / mins (Estimate / ค่าประมาณ)`
  };
}

export const POPULAR_EV_PRESETS = [
  { name: 'BYD Atto 3 (Extended)', battery: 60.5, consumption: 15.5, maxChargeKw: 88, connectors: ['CCS2', 'Type 2'] },
  { name: 'Tesla Model 3 RWD', battery: 60.0, consumption: 14.0, maxChargeKw: 170, connectors: ['CCS2', 'Type 2'] },
  { name: 'Tesla Model Y Long Range', battery: 78.1, consumption: 16.5, maxChargeKw: 250, connectors: ['CCS2', 'Type 2'] },
  { name: 'MG ZS EV (50.3 kWh)', battery: 50.3, consumption: 17.0, maxChargeKw: 75, connectors: ['CCS2', 'Type 2'] },
  { name: 'Deepal S07 Long Range', battery: 80.0, consumption: 16.8, maxChargeKw: 130, connectors: ['CCS2', 'Type 2'] },
  { name: 'Hyundai Ioniq 5 (72.6 kWh)', battery: 72.6, consumption: 16.2, maxChargeKw: 220, connectors: ['CCS2', 'Type 2'] },
  { name: 'Neta V-II', battery: 36.1, consumption: 13.8, maxChargeKw: 45, connectors: ['CCS2', 'Type 2'] },
  { name: 'กำหนดสเปกรถด้วยตนเอง (Custom Override)', battery: 65.0, consumption: 16.0, maxChargeKw: 120, connectors: ['CCS2', 'Type 2', 'CHAdeMO'] }
];

export const THAILAND_CITIES_PRESETS = [
  { name: 'กรุงเทพมหานคร (Bangkok)', lat: 13.7563, lng: 100.5018 },
  { name: 'เชียงใหม่ (Chiang Mai)', lat: 18.7883, lng: 98.9853 },
  { name: 'พัทยา ชลบุรี (Pattaya)', lat: 12.9276, lng: 100.8771 },
  { name: 'หัวหิน ประจวบคีรีขันธ์ (Hua Hin)', lat: 12.5684, lng: 99.9577 },
  { name: 'นครราชสีมา (Nakhon Ratchasima)', lat: 14.9707, lng: 102.0978 },
  { name: 'ขอนแก่น (Khon Kaen)', lat: 16.4322, lng: 102.8236 },
  { name: 'ภูเก็ต (Phuket)', lat: 7.8804, lng: 98.3923 },
  { name: 'หาดใหญ่ สงขลา (Hat Yai)', lat: 7.0087, lng: 100.4747 },
  { name: 'ระยอง (Rayong)', lat: 12.6814, lng: 101.2816 }
];
