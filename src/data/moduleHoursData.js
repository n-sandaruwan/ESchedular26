const defaultGradingScheme = [
  {
    category: 'Continuous Assessments',
    weight: '40%',
    components: [
      { name: 'Mid Semester Exam / Quizzes', weight: '20%' },
      { name: 'Lab Reports & Coursework', weight: '20%' }
    ]
  },
  {
    category: 'End Semester Examination',
    weight: '60%',
    components: [
      { name: 'Final Written Examination', weight: '60%' }
    ]
  }
];

export const initialModuleHours = [
  {
    code: 'EE3301',
    title: 'Analog Electronics',
    conductedHours: 1,
    targetHours: 45,
    weeklyHours: 3,
    venue: 'LT2 / NCC',
    credits: 3,
    coordinator: 'Dr. K.M.S.Y. Konara',
    email: 'konara@eie.ruh.ac.lk',
    teachers: ['Dr. K.M.S.Y. Konara', 'Mr. Neel Karunasena', 'Mr. Pavithran Sathiyamoorthi'],
    gradingScheme: defaultGradingScheme
  },
  {
    code: 'EE3202',
    title: 'Data Structures and Algorithms',
    conductedHours: 3,
    targetHours: 45,
    weeklyHours: 3,
    venue: 'LT1 / LT2',
    credits: 2,
    coordinator: 'Dr. Kushan Sudheera',
    email: 'kushan@eie.ruh.ac.lk',
    teachers: ['Dr. Kushan Sudheera'],
    gradingScheme: defaultGradingScheme
  },
  {
    code: 'EE3203',
    title: 'Electrical and Electronic Measurements',
    conductedHours: 2,
    targetHours: 30,
    weeklyHours: 2,
    venue: 'NCC',
    credits: 2,
    coordinator: 'Dr. Geeth Priyankara',
    email: 'geeth@eie.ruh.ac.lk',
    teachers: ['Dr. Geeth Priyankara', 'Mr. Chamod Dissanayake'],
    gradingScheme: defaultGradingScheme
  },
  {
    code: 'EE3304',
    title: 'Engineering Electromagnetism',
    conductedHours: 2,
    targetHours: 45,
    weeklyHours: 3,
    venue: 'NLH2 / NCC',
    credits: 3,
    coordinator: 'Mr. D. S. De Silva',
    email: 'saman@eie.ruh.ac.lk',
    teachers: ['Mr. D. S. De Silva'],
    gradingScheme: defaultGradingScheme
  },
  {
    code: 'EE3205',
    title: 'Power and Energy',
    conductedHours: 2,
    targetHours: 30,
    weeklyHours: 2,
    venue: 'LT1',
    credits: 2,
    coordinator: 'Ms. Tashma Silva',
    email: 'tashmas@eie.ruh.ac.lk',
    teachers: ['Ms. Tashma Silva'],
    gradingScheme: defaultGradingScheme
  },
  {
    code: 'EE3306',
    title: 'Signals and Systems',
    conductedHours: 1,
    targetHours: 45,
    weeklyHours: 3,
    venue: 'LT2 / NCC',
    credits: 3,
    coordinator: 'Dr. C.K.W. Seneviratne',
    email: 'chatura@eie.ruh.ac.lk',
    teachers: ['Dr. C.K.W. Seneviratne', 'Dr. Kaveen Liyanage'],
    gradingScheme: defaultGradingScheme
  },
  {
    code: 'IS3301',
    title: 'Complex Analysis and Mathematical Transforms',
    conductedHours: 2,
    targetHours: 45,
    weeklyHours: 3,
    venue: 'AUD',
    credits: 3,
    coordinator: 'Dr. Kumudu Seneviratna',
    email: 'seneviratna@is.ruh.ac.lk',
    teachers: ['Dr. Kumudu Seneviratna'],
    gradingScheme: [
      {
        category: 'Continuous Assessments',
        weight: '40%',
        components: [
          { name: 'Take Home Assignments (2)', weight: '20%' },
          { name: 'In-class Assessments (2)', weight: '20%' }
        ]
      },
      {
        category: 'End Semester Examination',
        weight: '60%',
        components: [
          { name: 'Written Examination', weight: '60%' }
        ]
      }
    ]
  },
  {
    code: 'IS3321',
    title: 'Fundamentals of Management for Engineers',
    conductedHours: 2,
    targetHours: 45,
    weeklyHours: 3,
    venue: 'AUD',
    credits: 3,
    coordinator: 'Mrs. Ranjika Lalani Perera',
    email: 'ranjika@is.ruh.ac.lk',
    teachers: ['Mrs. Ranjika Lalani Perera'],
    gradingScheme: defaultGradingScheme
  },
  {
    code: 'IS3322',
    title: 'Society and the Engineers',
    conductedHours: 0,
    targetHours: 45,
    weeklyHours: 3,
    venue: 'AUD',
    credits: 3,
    coordinator: 'Eng. Ms. H. A. Danusi Saumyadi',
    email: '',
    teachers: ['Eng. Ms. H. A. Danusi Saumyadi', 'Dr. Praneeth Wijesinghe'],
    gradingScheme: defaultGradingScheme
  }
];

export const getStoredModuleHours = () => {
  const local = localStorage.getItem('mis_module_hours');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return initialModuleHours.map(init => {
          const match = parsed.find(p => p.code === init.code);
          if (match) {
            return {
              ...init,
              conductedHours: match.conductedHours !== undefined ? match.conductedHours : init.conductedHours,
              targetHours: match.targetHours || init.targetHours,
              weeklyHours: match.weeklyHours || init.weeklyHours,
              venue: match.venue || init.venue
            };
          }
          return init;
        });
      }
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
