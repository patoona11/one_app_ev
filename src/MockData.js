export const mockStations = [
  {
    id: 1,
    name: "PEA VOLTA - Nakhon Phanom",
    network: "PEA VOLTA",
    lat: 17.4085,
    lng: 104.7832,
    status: "available",
    plugs: [
      { type: "CCS2", power: "120kW", status: "available", statusTime: "Now" },
      { type: "CHAdeMO", power: "50kW", status: "in_use", statusTime: "Wait ~20 mins" },
      { type: "Type 2", power: "22kW", status: "available", statusTime: "Now" }
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
      { type: "CCS2", power: "120kW", status: "in_use", statusTime: "Wait ~45 mins" },
      { type: "CCS2", power: "120kW", status: "in_use", statusTime: "Wait ~10 mins" }
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
      { type: "Type 2", power: "22kW", status: "available", statusTime: "Now" },
      { type: "Type 2", power: "22kW", status: "available", statusTime: "Now" }
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
      { type: "CCS2", power: "120kW", status: "offline", statusTime: "Maintenance" }
    ],
    address: "MG Showroom, Nakhon Phanom",
    openHours: "08:00 - 17:00"
  }
];
