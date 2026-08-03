import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const dictionary = {
  th: {
    app_title: 'App_EV Thailand',
    subtitle: 'แพลตฟอร์มเดินทางและชาร์จรถยนต์ไฟฟ้าแห่งประเทศไทย',
    tab_planner: '📍 วางแผนทริป (Smart Planner)',
    tab_map: '🗺️ แผนที่จุดชาร์จจริง (EV Map)',
    tab_community: '👥 ชุมชนและรายงาน (Community)',
    tab_analytics: '📊 แดชบอร์ดสถิติ (Analytics)',
    btn_login: 'เข้าสู่ระบบ / ยืนยันตัวตน',
    btn_logout: 'ออกจากระบบ',
    disclaimer: 'คำเตือน: ข้อมูลสถานีชาร์จนำมาจาก OpenStreetMap และรายงานจากผู้ใช้ ซึ่งอาจไม่สมบูรณ์หรือมีการเปลี่ยนแปลง โปรดติดต่อตรวจสอบสถานะจริงกับผู้ให้บริการก่อนเริ่มเดินทาง',
    source_osm: 'OpenStreetMap',
    source_provider: 'Provider API',
    source_community: 'Community Report',
    source_estimate: 'Estimate / ค่าประมาณ',
    no_data: 'ไม่มีข้อมูล (No data available)',
    insufficient_info: 'ข้อมูลกำลังไฟไม่เพียงพอสำหรับการคำนวณที่แม่นยำ',
    nav_google_maps: 'นำทางด้วย Google Maps',
    view_osm: 'ตรวจสอบแหล่งที่มาบน OpenStreetMap',
    planner_title: 'EV Smart Trip Planner (ระบบวางแผนเส้นทางและคำนวณจุดชาร์จ)',
    strategy_fastest: '⚡ เร็วที่สุด (Fastest)',
    strategy_efficient: '🌱 ประหยัดพลังงานที่สุด (Most Energy-Efficient)',
    strategy_risk: '🛡️ ความเสี่ยงจุดชาร์จต่ำสุด (Lowest Charging Risk)'
  },
  en: {
    app_title: 'App_EV Thailand',
    subtitle: 'Integrated Electric-Vehicle Travel & Charging Platform of Thailand',
    tab_planner: '📍 Smart Trip Planner',
    tab_map: '🗺️ Real EV Station Map',
    tab_community: '👥 Community Verification',
    tab_analytics: '📊 Analytics Dashboard',
    btn_login: 'Sign In / Authenticate',
    btn_logout: 'Sign Out',
    disclaimer: 'Notice: OpenStreetMap data is community-maintained and may be incomplete or outdated. Always verify station status directly with the charging provider before travelling.',
    source_osm: 'OpenStreetMap',
    source_provider: 'Provider API',
    source_community: 'Community Report',
    source_estimate: 'Estimate',
    no_data: 'No data available.',
    insufficient_info: 'Insufficient information to calculate reliably.',
    nav_google_maps: 'Navigate with Google Maps',
    view_osm: 'View source on OpenStreetMap',
    planner_title: 'EV Smart Trip Planner & Route Charging Intelligence',
    strategy_fastest: '⚡ Fastest Route',
    strategy_efficient: '🌱 Most Energy-Efficient',
    strategy_risk: '🛡️ Lowest Charging Risk'
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('th'); // Thai is default as per spec

  const t = (key) => dictionary[lang][key] || key;
  const toggleLang = () => setLang(prev => prev === 'th' ? 'en' : 'th');

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
