export const initialModuleHours = [
  { code: 'EE3203', title: 'Electrical & Electronic Measurements', conductedHours: 2, targetHours: 30, weeklyHours: 2, venue: 'NCC' },
  { code: 'EE3202', title: 'Data Structures and Algorithms', conductedHours: 3, targetHours: 45, weeklyHours: 3, venue: 'LT1 / LT2' },
  { code: 'EE3304', title: 'Engineering Electromagnetism', conductedHours: 2, targetHours: 45, weeklyHours: 3, venue: 'NLH2 / NCC' },
  { code: 'IS3301', title: 'Complex Analysis & Math Transforms', conductedHours: 2, targetHours: 45, weeklyHours: 3, venue: 'AUD' },
  { code: 'EE3306', title: 'Signals and Systems', conductedHours: 1, targetHours: 45, weeklyHours: 3, venue: 'LT2 / NCC' },
  { code: 'IS3321', title: 'Fundamentals of Management', conductedHours: 2, targetHours: 45, weeklyHours: 3, venue: 'AUD' },
  { code: 'EE3205', title: 'Power and Energy', conductedHours: 2, targetHours: 30, weeklyHours: 2, venue: 'LT1' },
  { code: 'EE3301', title: 'Analog Electronics', conductedHours: 1, targetHours: 45, weeklyHours: 3, venue: 'LT2 / NCC' },
  { code: 'IS3322', title: 'Society and the Engineers', conductedHours: 0, targetHours: 45, weeklyHours: 3, venue: 'AUD' }
];

export const getStoredModuleHours = () => {
  const local = localStorage.getItem('mis_module_hours');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      return initialModuleHours;
    }
  }
  return initialModuleHours;
};

export const saveStoredModuleHours = (hoursArray) => {
  localStorage.setItem('mis_module_hours', JSON.stringify(hoursArray));
};

export const resetToInitialHours = () => {
  localStorage.setItem('mis_module_hours', JSON.stringify(initialModuleHours));
  return initialModuleHours;
};
