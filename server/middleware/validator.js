import { z } from 'zod';

// Schema Validation to protect against XSS, SQLi, and malformed inputs
export const reportSchema = z.object({
  station_osm_id: z.string().min(1, 'ต้องระบุรหัสสถานี (Station OSM ID required)'),
  connector_status: z.enum(['working', 'faulty', 'unknown'], { 
    errorMap: () => ({ message: 'สถานะหัวชาร์จต้องเป็น working, faulty หรือ unknown เท่านั้น' }) 
  }),
  vehicles_waiting: z.number().int().min(0, 'จำนวนรถคอยต้องไม่ติดลบ').default(0),
  station_open: z.boolean().default(true),
  observed_price: z.string().max(200).optional().nullable(),
  connector_types_found: z.string().max(200).optional().nullable(),
  photo_url: z.string().url('URL รูปภาพไม่ถูกต้อง').optional().nullable().or(z.literal('')),
  cleanliness_rating: z.number().int().min(1).max(5).default(5),
  safety_rating: z.number().int().min(1).max(5).default(5),
  facilities_notes: z.string().max(1000, 'บันทึกสิ่งอำนวยความสะดวกต้องไม่เกิน 1000 ตัวอักษร').optional().nullable(),
  user_lat: z.number().optional().nullable(),
  user_lng: z.number().optional().nullable(),
});

export const routeRequestSchema = z.object({
  origin: z.object({ lat: z.number(), lng: z.number() }),
  destination: z.object({ lat: z.number(), lng: z.number() }),
  waypoints: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
  strategy: z.enum(['fastest', 'energy_efficient', 'lowest_risk']).default('fastest'),
  vehicle: z.object({
    batteryCapacity: z.number().min(10).max(200).default(60),
    consumptionRate: z.number().min(5).max(40).default(16), // kWh/100 km
    initialSoc: z.number().min(0).max(100).default(100),
    reserveSoc: z.number().min(0).max(80).default(20),
    maxChargingPowerKw: z.number().min(3).max(400).default(120),
    compatibleConnectors: z.array(z.string()).default(['CCS2', 'Type 2'])
  }).optional()
});

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'ข้อมูลนำเข้าไม่ถูกต้อง (Input Validation Error)', 
          details: err.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      }
      return res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง (Bad Request)' });
    }
  };
}
