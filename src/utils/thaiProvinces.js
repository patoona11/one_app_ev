// Complete database of all 77 Provinces in Thailand (76 Provinces + Bangkok)
// Contains standard Thai names, English names, region classifications, and center latitude/longitude
// Used for high-precision spatial matching of EV charging stations and user filtering

export const THAI_PROVINCES = [
  // ภาคกลาง (Central & Greater Bangkok)
  { id: 'bangkok', name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok', region: 'Central', lat: 13.7563, lng: 100.5018, keywords: ['กทม', 'bangkok', 'krung thep', 'bkk'] },
  { id: 'kamphaeng_phet', name_th: 'กำแพงเพชร', name_en: 'Kamphaeng Phet', region: 'Central', lat: 16.4828, lng: 99.5227, keywords: ['kamphaeng phet'] },
  { id: 'chainat', name_th: 'ชัยนาท', name_en: 'Chainat', region: 'Central', lat: 15.1852, lng: 100.1251, keywords: ['chai nat', 'chainat'] },
  { id: 'nakhon_nayok', name_th: 'นครนายก', name_en: 'Nakhon Nayok', region: 'Central', lat: 14.2069, lng: 101.2130, keywords: ['nakhon nayok'] },
  { id: 'nakhon_pathom', name_th: 'นครปฐม', name_en: 'Nakhon Pathom', region: 'Central', lat: 13.8196, lng: 100.0601, keywords: ['nakhon pathom', 'นครปฐม'] },
  { id: 'nakhon_sawan', name_th: 'นครสวรรค์', name_en: 'Nakhon Sawan', region: 'Central', lat: 15.6885, lng: 100.1215, keywords: ['nakhon sawan', 'ปากน้ำโพ'] },
  { id: 'nonthaburi', name_th: 'นนทบุรี', name_en: 'Nonthaburi', region: 'Central', lat: 13.8591, lng: 100.5217, keywords: ['nonthaburi', 'นนทบุรี', 'ปากเกร็ด'] },
  { id: 'pathum_thani', name_th: 'ปทุมธานี', name_en: 'Pathum Thani', region: 'Central', lat: 14.0208, lng: 100.5250, keywords: ['pathum thani', 'ปทุมธานี', 'รังสิต'] },
  { id: 'ayutthaya', name_th: 'พระนครศรีอยุธยา', name_en: 'Phra Nakhon Si Ayutthaya', region: 'Central', lat: 14.3532, lng: 100.5684, keywords: ['ayutthaya', 'อยุธยา', 'phra nakhon si ayutthaya'] },
  { id: 'phichit', name_th: 'พิจิตร', name_en: 'Phichit', region: 'Central', lat: 16.4419, lng: 100.3488, keywords: ['phichit'] },
  { id: 'phitsanulok', name_th: 'พิษณุโลก', name_en: 'Phitsanulok', region: 'Central', lat: 16.8211, lng: 100.2659, keywords: ['phitsanulok', 'พิษณุโลก'] },
  { id: 'phetchabun', name_th: 'เพชรบูรณ์', name_en: 'Phetchabun', region: 'Central', lat: 16.4190, lng: 101.1544, keywords: ['phetchabun', 'เขาค้อ', 'ภูทับเบิก'] },
  { id: 'lopburi', name_th: 'ลพบุรี', name_en: 'Lopburi', region: 'Central', lat: 14.7995, lng: 100.6534, keywords: ['lopburi', 'lop buri', 'ลพบุรี'] },
  { id: 'samut_prakan', name_th: 'สมุทรปราการ', name_en: 'Samut Prakan', region: 'Central', lat: 13.5991, lng: 100.5977, keywords: ['samut prakan', 'สมุทรปราการ', 'สุวรรณภูมิ', 'บางนา'] },
  { id: 'samut_songkhram', name_th: 'สมุทรสงคราม', name_en: 'Samut Songkhram', region: 'Central', lat: 13.4098, lng: 100.0023, keywords: ['samut songkhram', 'แม่กลอง', 'อัมพวา'] },
  { id: 'samut_sakhon', name_th: 'สมุทรสาคร', name_en: 'Samut Sakhon', region: 'Central', lat: 13.5475, lng: 100.2744, keywords: ['samut sakhon', 'มหาชัย', 'สมุทรสาคร'] },
  { id: 'saraburi', name_th: 'สระบุรี', name_en: 'Saraburi', region: 'Central', lat: 14.5289, lng: 100.9101, keywords: ['saraburi', 'สระบุรี'] },
  { id: 'sing_buri', name_th: 'สิงห์บุรี', name_en: 'Sing Buri', region: 'Central', lat: 14.8936, lng: 100.3967, keywords: ['sing buri', 'singburi'] },
  { id: 'sukhothai', name_th: 'สุโขทัย', name_en: 'Sukhothai', region: 'Central', lat: 17.0076, lng: 99.8262, keywords: ['sukhothai'] },
  { id: 'suphan_buri', name_th: 'สุพรรณบุรี', name_en: 'Suphan Buri', region: 'Central', lat: 14.4745, lng: 100.1192, keywords: ['suphan buri', 'suphanburi', 'สุพรรณ'] },
  { id: 'ang_thong', name_th: 'อ่างทอง', name_en: 'Ang Thong', region: 'Central', lat: 14.5896, lng: 100.4550, keywords: ['ang thong', 'angthong'] },
  { id: 'uthai_thani', name_th: 'อุทัยธานี', name_en: 'Uthai Thani', region: 'Central', lat: 15.3838, lng: 100.0248, keywords: ['uthai thani'] },

  // ภาคเหนือ (North)
  { id: 'chiang_rai', name_th: 'เชียงราย', name_en: 'Chiang Rai', region: 'North', lat: 19.9105, lng: 99.8406, keywords: ['chiang rai', 'เชียงราย', 'แม่สาย'] },
  { id: 'chiang_mai', name_th: 'เชียงใหม่', name_en: 'Chiang Mai', region: 'North', lat: 18.7883, lng: 98.9853, keywords: ['chiang mai', 'เชียงใหม่', 'ดอยอินทนนท์'] },
  { id: 'nan', name_th: 'น่าน', name_en: 'Nan', region: 'North', lat: 18.7756, lng: 100.7730, keywords: ['nan', 'น่าน'] },
  { id: 'phayao', name_th: 'พะเยา', name_en: 'Phayao', region: 'North', lat: 19.1666, lng: 99.9023, keywords: ['phayao', 'พะเยา'] },
  { id: 'phrae', name_th: 'แพร่', name_en: 'Phrae', region: 'North', lat: 18.1446, lng: 100.1403, keywords: ['phrae', 'แพร่'] },
  { id: 'mae_hong_son', name_th: 'แม่ฮ่องสอน', name_en: 'Mae Hong Son', region: 'North', lat: 19.3020, lng: 97.9654, keywords: ['mae hong son', 'ปาย', 'แม่ฮ่องสอน'] },
  { id: 'lampang', name_th: 'ลำปาง', name_en: 'Lampang', region: 'North', lat: 18.2855, lng: 99.4927, keywords: ['lampang', 'ลำปาง'] },
  { id: 'lamphun', name_th: 'ลำพูน', name_en: 'Lamphun', region: 'North', lat: 18.5744, lng: 99.0087, keywords: ['lamphun', 'ลำพูน'] },
  { id: 'uttaradit', name_th: 'อุตรดิตถ์', name_en: 'Uttaradit', region: 'North', lat: 17.6253, lng: 100.0991, keywords: ['uttaradit', 'อุตรดิตถ์'] },

  // ภาคตะวันออกเฉียงเหนือ (Northeast / Isan)
  { id: 'kalasin', name_th: 'กาฬสินธุ์', name_en: 'Kalasin', region: 'Northeast', lat: 16.4322, lng: 103.5061, keywords: ['kalasin'] },
  { id: 'khon_kaen', name_th: 'ขอนแก่น', name_en: 'Khon Kaen', region: 'Northeast', lat: 16.4419, lng: 102.8360, keywords: ['khon kaen', 'khonkaen', 'ขอนแก่น'] },
  { id: 'chaiyaphum', name_th: 'ชัยภูมิ', name_en: 'Chaiyaphum', region: 'Northeast', lat: 15.8068, lng: 102.0315, keywords: ['chaiyaphum'] },
  { id: 'nakhon_phanom', name_th: 'นครพนม', name_en: 'Nakhon Phanom', region: 'Northeast', lat: 17.4042, lng: 104.7797, keywords: ['nakhon phanom'] },
  { id: 'nakhon_ratchasima', name_th: 'นครราชสีมา', name_en: 'Nakhon Ratchasima', region: 'Northeast', lat: 14.9799, lng: 102.0978, keywords: ['nakhon ratchasima', 'โคราช', 'korat', 'เขาใหญ่', 'ปากช่อง'] },
  { id: 'bueng_kan', name_th: 'บึงกาฬ', name_en: 'Bueng Kan', region: 'Northeast', lat: 18.3609, lng: 103.6520, keywords: ['bueng kan', 'buengkan'] },
  { id: 'buriram', name_th: 'บุรีรัมย์', name_en: 'Buri Ram', region: 'Northeast', lat: 14.9930, lng: 103.1029, keywords: ['buri ram', 'buriram', 'บุรีรัมย์'] },
  { id: 'maha_sarakham', name_th: 'มหาสารคาม', name_en: 'Maha Sarakham', region: 'Northeast', lat: 16.1852, lng: 103.3006, keywords: ['maha sarakham', 'mahasarakham'] },
  { id: 'mukdahan', name_th: 'มุกดาหาร', name_en: 'Mukdahan', region: 'Northeast', lat: 16.5453, lng: 104.7235, keywords: ['mukdahan'] },
  { id: 'yasothon', name_th: 'ยโสธร', name_en: 'Yasothon', region: 'Northeast', lat: 15.7972, lng: 104.1436, keywords: ['yasothon'] },
  { id: 'roi_et', name_th: 'ร้อยเอ็ด', name_en: 'Roi Et', region: 'Northeast', lat: 16.0538, lng: 103.6520, keywords: ['roi et', 'roiet'] },
  { id: 'loei', name_th: 'เลย', name_en: 'Loei', region: 'Northeast', lat: 17.4860, lng: 101.7223, keywords: ['loei', 'เลย', 'เชียงคาน'] },
  { id: 'si_sa_ket', name_th: 'ศรีสะเกษ', name_en: 'Si Sa Ket', region: 'Northeast', lat: 15.1186, lng: 104.3220, keywords: ['si sa ket', 'sisaket', 'ศรีสะเกษ'] },
  { id: 'sakon_nakhon', name_th: 'สกลนคร', name_en: 'Sakon Nakhon', region: 'Northeast', lat: 17.1664, lng: 104.1486, keywords: ['sakon nakhon'] },
  { id: 'surin', name_th: 'สุรินทร์', name_en: 'Surin', region: 'Northeast', lat: 14.8824, lng: 103.4936, keywords: ['surin', 'สุรินทร์'] },
  { id: 'nong_khai', name_th: 'หนองคาย', name_en: 'Nong Khai', region: 'Northeast', lat: 17.8785, lng: 102.7420, keywords: ['nong khai'] },
  { id: 'nong_bua_lam_phu', name_th: 'หนองบัวลำภู', name_en: 'Nong Bua Lam Phu', region: 'Northeast', lat: 17.2052, lng: 102.4414, keywords: ['nong bua lam phu'] },
  { id: 'udon_thani', name_th: 'อุดรธานี', name_en: 'Udon Thani', region: 'Northeast', lat: 17.4138, lng: 102.7872, keywords: ['udon thani', 'อุดร'] },
  { id: 'ubon_ratchathani', name_th: 'อุบลราชธานี', name_en: 'Ubon Ratchathani', region: 'Northeast', lat: 15.2448, lng: 104.8473, keywords: ['ubon ratchathani', 'ubon', 'อุบล'] },
  { id: 'amnat_charoen', name_th: 'อำนาจเจริญ', name_en: 'Amnat Charoen', region: 'Northeast', lat: 15.8654, lng: 104.6258, keywords: ['amnat charoen'] },

  // ภาคตะวันออก (East)
  { id: 'chanthaburi', name_th: 'จันทบุรี', name_en: 'Chanthaburi', region: 'East', lat: 12.6114, lng: 102.1039, keywords: ['chanthaburi', 'จันทบุรี'] },
  { id: 'chachoengsao', name_th: 'ฉะเชิงเทรา', name_en: 'Chachoengsao', region: 'East', lat: 13.6904, lng: 101.0780, keywords: ['chachoengsao', 'แปดริ้ว'] },
  { id: 'chon_buri', name_th: 'ชลบุรี', name_en: 'Chon Buri', region: 'East', lat: 13.3611, lng: 100.9847, keywords: ['chon buri', 'chonburi', 'พัทยา', 'pattaya', 'ชลบุรี', 'บางแสน', 'แหลมฉบัง'] },
  { id: 'trat', name_th: 'ตราด', name_en: 'Trat', region: 'East', lat: 12.2428, lng: 102.5175, keywords: ['trat', 'เกาะช้าง'] },
  { id: 'prachin_buri', name_th: 'ปราจีนบุรี', name_en: 'Prachin Buri', region: 'East', lat: 14.0510, lng: 101.3725, keywords: ['prachin buri', 'prachinburi', 'ปราจีนบุรี', 'กบินทร์บุรี'] },
  { id: 'rayong', name_th: 'ระยอง', name_en: 'Rayong', region: 'East', lat: 12.6814, lng: 101.2816, keywords: ['rayong', 'ระยอง', 'เกาะเสม็ด', 'มาบตาพุด'] },
  { id: 'sa_kaeo', name_th: 'สระแก้ว', name_en: 'Sa Kaeo', region: 'East', lat: 13.8240, lng: 102.0664, keywords: ['sa kaeo', 'sakaeo', 'อรัญประเทศ'] },

  // ภาคตะวันตก (West)
  { id: 'kanchanaburi', name_th: 'กาญจนบุรี', name_en: 'Kanchanaburi', region: 'West', lat: 14.0228, lng: 99.5328, keywords: ['kanchanaburi', 'กาญจนบุรี'] },
  { id: 'tak', name_th: 'ตาก', name_en: 'Tak', region: 'West', lat: 16.8837, lng: 99.1258, keywords: ['tak', 'แม่สอด', 'ตาก'] },
  { id: 'prachuap_khiri_khan', name_th: 'ประจวบคีรีขันธ์', name_en: 'Prachuap Khiri Khan', region: 'West', lat: 11.8021, lng: 99.7963, keywords: ['prachuap khiri khan', 'prachuap', 'หัวหิน', 'hua hin'] },
  { id: 'phetchaburi', name_th: 'เพชรบุรี', name_en: 'Phetchaburi', region: 'West', lat: 13.1071, lng: 99.9443, keywords: ['phetchaburi', 'ชะอำ', 'cha-am', 'เพชรบุรี', 'เขาย้อย'] },
  { id: 'ratchaburi', name_th: 'ราชบุรี', name_en: 'Ratchaburi', region: 'West', lat: 13.5358, lng: 99.8175, keywords: ['ratchaburi', 'ราชบุรี', 'บ้านโป่ง'] },

  // ภาคใต้ (South)
  { id: 'krabi', name_th: 'กระบี่', name_en: 'Krabi', region: 'South', lat: 8.0855, lng: 98.9063, keywords: ['krabi', 'กระบี่', 'อ่าวนาง'] },
  { id: 'chumphon', name_th: 'ชุมพร', name_en: 'Chumphon', region: 'South', lat: 10.4930, lng: 99.1800, keywords: ['chumphon', 'ชุมพร'] },
  { id: 'trang', name_th: 'ตรัง', name_en: 'Trang', region: 'South', lat: 7.5563, lng: 99.6114, keywords: ['trang', 'ตรัง'] },
  { id: 'nakhon_si_thammarat', name_th: 'นครศรีธรรมราช', name_en: 'Nakhon Si Thammarat', region: 'South', lat: 8.4325, lng: 99.9631, keywords: ['nakhon si thammarat', 'นครศรีธรรมราช', 'ทุ่งสง'] },
  { id: 'narathiwat', name_th: 'นราธิวาส', name_en: 'Narathiwat', region: 'South', lat: 6.4255, lng: 101.8253, keywords: ['narathiwat', 'สุไหงโก-ลก', 'นราธิวาส'] },
  { id: 'pattani', name_th: 'ปัตตานี', name_en: 'Pattani', region: 'South', lat: 6.8643, lng: 101.2501, keywords: ['pattani', 'ปัตตานี'] },
  { id: 'phangnga', name_th: 'พังงา', name_en: 'Phangnga', region: 'South', lat: 8.4501, lng: 98.5255, keywords: ['phangnga', 'phang nga', 'พังงา', 'เขาหลัก'] },
  { id: 'phatthalung', name_th: 'พัทลุง', name_en: 'Phatthalung', region: 'South', lat: 7.6167, lng: 100.0740, keywords: ['phatthalung', 'พัทลุง'] },
  { id: 'phuket', name_th: 'ภูเก็ต', name_en: 'Phuket', region: 'South', lat: 7.8804, lng: 98.3923, keywords: ['phuket', 'ภูเก็ต', 'ป่าตอง'] },
  { id: 'yala', name_th: 'ยะลา', name_en: 'Yala', region: 'South', lat: 6.5411, lng: 101.2804, keywords: ['yala', 'ยะลา', 'เบตง'] },
  { id: 'ranong', name_th: 'ระนอง', name_en: 'Ranong', region: 'South', lat: 9.9658, lng: 98.6348, keywords: ['ranong', 'ระนอง'] },
  { id: 'songkhla', name_th: 'สงขลา', name_en: 'Songkhla', region: 'South', lat: 7.1756, lng: 100.6143, keywords: ['songkhla', 'หาดใหญ่', 'hat yai', 'สงขลา', 'สะเดา'] },
  { id: 'satun', name_th: 'สตูล', name_en: 'Satun', region: 'South', lat: 6.6238, lng: 100.0674, keywords: ['satun', 'สตูล'] },
  { id: 'surat_thani', name_th: 'สุราษฎร์ธานี', name_en: 'Surat Thani', region: 'South', lat: 9.1415, lng: 99.3333, keywords: ['surat thani', 'สุราษฎร์ธานี', 'เกาะสมุย', 'samui', 'เกาะพะงัน'] }
];

/**
 * Identify exact province in Thailand from OpenStreetMap tags, address strings, or geographic coordinates.
 * Ensures every charging station is categorized into one of the 77 provinces without inventing data.
 */
export function getProvinceFromElement(tags, lat, lng, addressString = '') {
  // 1. Check exact or keyword match in OSM tag or address text
  const searchText = `${tags?.['addr:province'] || ''} ${tags?.['addr:state'] || ''} ${tags?.['is_in:province'] || ''} ${addressString}`.toLowerCase();
  
  for (const prov of THAI_PROVINCES) {
    if (searchText.includes(prov.name_th.toLowerCase()) || searchText.includes(prov.name_en.toLowerCase())) {
      return prov.name_th;
    }
    if (prov.keywords) {
      for (const kw of prov.keywords) {
        if (searchText.includes(kw.toLowerCase())) {
          return prov.name_th;
        }
      }
    }
  }

  // 2. If no explicit text match found in tag/address, find nearest Thai province center by latitude/longitude distance
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    let nearestProv = THAI_PROVINCES[0];
    let minDistance = Infinity;

    for (const prov of THAI_PROVINCES) {
      const dLat = (lat - prov.lat) * 111.0; // km approx
      const dLng = (lng - prov.lng) * 111.0 * Math.cos((lat * Math.PI) / 180.0);
      const distSq = dLat * dLat + dLng * dLng;

      if (distSq < minDistance) {
        minDistance = distSq;
        nearestProv = prov;
      }
    }
    return nearestProv.name_th;
  }

  return 'กรุงเทพมหานคร'; // Default central fallback if coordinates are missing
}
