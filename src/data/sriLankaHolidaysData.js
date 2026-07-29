// Official Sri Lanka Mercantile, Public & Poya Holidays List (2026)
export const sriLankaHolidays2026 = [
  // July 2026
  { date: '2026-07-29', name: 'Esala Full Moon Poya Day', type: 'Poya / Dept Holiday', icon: '🌕' },
  
  // August 2026
  { date: '2026-08-27', name: 'Nikini Full Moon Poya Day', type: 'Poya Holiday', icon: '🌕' },

  // September 2026
  { date: '2026-09-25', name: 'Milad-un-Nabi & Binara Poya Day', type: 'Public & Poya', icon: '☪️' },

  // October 2026
  { date: '2026-10-25', name: 'Vap Full Moon Poya Day', type: 'Poya Holiday', icon: '🌕' },

  // November 2026
  { date: '2026-11-08', name: 'Deepavali Festival', type: 'Public Holiday', icon: '🪔' },
  { date: '2026-11-23', name: 'Ill Full Moon Poya Day', type: 'Poya Holiday', icon: '🌕' },

  // December 2026
  { date: '2026-12-23', name: 'Unduvap Full Moon Poya Day', type: 'Poya Holiday', icon: '🌕' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'Public Holiday', icon: '🎄' }
];

export const getHolidayForDate = (dateStr) => {
  return sriLankaHolidays2026.find(h => h.date === dateStr);
};
