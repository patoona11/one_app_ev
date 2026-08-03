export const mockStations = [
  {
    id: 1,
    name: "PEA VOLTA - Nakhon Phanom",
    network: "PEA VOLTA",
    lat: 17.4085,
    lng: 104.7832,
    status: "available",
    plugs: [
      { type: "CCS2", power: "120 kW", category: "DC Fast", status: "available", statusTime: "พร้อมใช้งาน" },
      { type: "CHAdeMO", power: "50 kW", category: "DC Fast", status: "in_use", statusTime: "ประมาณ 20 นาที" },
      { type: "Type 2", power: "22 kW", category: "AC Normal", status: "available", statusTime: "พร้อมใช้งาน" }
    ],
    address: "Mueang Nakhon Phanom District, Nakhon Phanom 48000",
    openHours: "24 Hours"
  },
  {
    id: 2,
    name: "PTT EV Station PluZ - Bypass Nakhon Phanom",
    network: "PTT EV Station PluZ",
    lat: 17.3950,
    lng: 104.7700,
    status: "in_use",
    plugs: [
      { type: "CCS2", power: "120 kW", category: "DC Fast", status: "in_use", statusTime: "ประมาณ 45 นาที" },
      { type: "CCS2", power: "120 kW", category: "DC Fast", status: "in_use", statusTime: "ประมาณ 10 นาที" }
    ],
    address: "Bypass Road, Nakhon Phanom",
    openHours: "06:00 - 22:00"
  },
  {
    id: 3,
    name: "EA Anywhere - Big C Nakhon Phanom",
    network: "EA Anywhere",
    lat: 17.4150,
    lng: 104.7780,
    status: "available",
    plugs: [
      { type: "Type 2", power: "22 kW", category: "AC Normal", status: "available", statusTime: "พร้อมใช้งาน" },
      { type: "Type 2", power: "22 kW", category: "AC Normal", status: "available", statusTime: "พร้อมใช้งาน" }
    ],
    address: "Big C Supercenter, Nakhon Phanom",
    openHours: "10:00 - 21:00"
  },
  {
    id: 4,
    name: "MG Super Charge - Nakhon Phanom",
    network: "MG Super Charge",
    lat: 17.3900,
    lng: 104.7850,
    status: "offline",
    plugs: [
      { type: "CCS2", power: "120 kW", category: "DC Fast", status: "offline", statusTime: "ปิดปรับปรุงระบบ" }
    ],
    address: "MG Showroom, Nakhon Phanom",
    openHours: "08:00 - 17:00"
  }
];
