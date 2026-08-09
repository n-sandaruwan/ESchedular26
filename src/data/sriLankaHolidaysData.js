// Official Sri Lanka Mercantile, Public & Poya Holidays List (2026)
export const sriLankaHolidays2026 = [
  { date: '2026-01-03', name: 'Duruthu Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-01-15', name: 'Tamil Thai Pongal Day', type: 'Public Holiday', isPoya: false, icon: '☀️' },
  { date: '2026-02-01', name: 'Navam Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-02-04', name: 'Independence Day', type: 'Public Holiday', isPoya: false, icon: '🇱🇰' },
  { date: '2026-02-15', name: 'Mahasivarathri Day', type: 'Public Holiday', isPoya: false, icon: '🕉️' },
  { date: '2026-03-02', name: 'Medin Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-03-21', name: 'Id-Ul-Fitre (Ramazan Festival Day)', type: 'Public Holiday', isPoya: false, icon: '☪️' },
  { date: '2026-04-01', name: 'Bak Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-04-03', name: 'Good Friday', type: 'Public Holiday', isPoya: false, icon: '✝️' },
  { date: '2026-04-13', name: 'Day prior to Sinhala & Tamil New Year Day', type: 'Public Holiday', isPoya: false, icon: '🎊' },
  { date: '2026-04-14', name: 'Sinhala & Tamil New Year Day', type: 'Public Holiday', isPoya: false, icon: '🎉' },
  { date: '2026-05-01', name: 'Vesak Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-05-02', name: 'Day following Vesak Full Moon Poya Day', type: 'Public Holiday', isPoya: false, icon: '🌕' },
  { date: '2026-05-28', name: 'Id-Ul-Allah (Hadji Festival Day)', type: 'Public Holiday', isPoya: false, icon: '☪️' },
  { date: '2026-05-30', name: 'Adhi Poson Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-06-29', name: 'Poson Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-07-29', name: 'Esala Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-08-26', name: 'Milad-Un-Nabi (Holy Prophet\'s Birthday)', type: 'Public Holiday', isPoya: false, icon: '☪️' },
  { date: '2026-08-27', name: 'Nikini Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-09-26', name: 'Binara Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-10-25', name: 'Vap Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-11-08', name: 'Deepawali Festival Day', type: 'Public Holiday', isPoya: false, icon: '🪔' },
  { date: '2026-11-24', name: 'Ill Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-12-23', name: 'Unduwap Full Moon Poya Day', type: 'Public Holiday', isPoya: true, icon: '🌕' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'Public Holiday', isPoya: false, icon: '🎄' }
];

export const getHolidayForDate = (dateStr) => {
  return sriLankaHolidays2026.find(h => h.date === dateStr);
};
