import { pushModuleHoursToCloud } from './firebaseSync';

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
    conductedHours: 0,
    targetHours: 38,
    weeklyHours: 3,
    venue: 'LT2 / NCC',
    credits: 3,
    coordinator: 'Dr. K.M.S.Y. Konara',
    email: 'konara@eie.ruh.ac.lk',
    teachers: ['Dr. K.M.S.Y. Konara', 'Mr. Neel Karunasena', 'Mr. Pavithran Sathiyamoorthi'],
    gradingScheme: [
      {
        category: 'Continuous Assessments (CA)',
        weight: '50%',
        components: [
          { name: 'Take Home Assignment', weight: '5%' },
          { name: 'Tutorial Assessment', weight: '5%' },
          { name: 'Laboratories (4 Labs)', weight: '20%' },
          { name: 'In-class Assessment', weight: '20%' }
        ]
      },
      {
        category: 'End Semester Examination',
        weight: '50%',
        components: [
          { name: 'Written Examination', weight: '50%' }
        ]
      }
    ],
    passConditions: [
      {
        title: 'Continuous Assessment Minimum',
        criteria: 'Earn at least 35% (i.e. 17.5 / 50 marks) of Continuous Assessment marks',
        minPercentage: '35%',
        minMarks: '17.5 / 50 Marks'
      },
      {
        title: 'End Semester Examination Minimum',
        criteria: 'Achieve at least 35% (i.e. 17.5 / 50 marks) allocated for End Semester Examination',
        minPercentage: '35%',
        minMarks: '17.5 / 50 Marks'
      },
      {
        title: 'Overall Module Minimum',
        criteria: 'Obtain an overall aggregate score of at least 40% (i.e. 40 / 100 total marks)',
        minPercentage: '40%',
        minMarks: '40 / 100 Marks'
      }
    ]
  },
  {
    code: 'EE3202',
    title: 'Data Structures and Algorithms',
    conductedHours: 0,
    targetHours: 28,
    weeklyHours: 3,
    venue: 'LT1 / LT2',
    credits: 2,
    coordinator: 'Dr. Kushan Sudheera',
    email: 'kushan@eie.ruh.ac.lk',
    teachers: ['Dr. Kushan Sudheera'],
    gradingScheme: [
      {
        category: 'Continuous Assessments (CA)',
        weight: '60%',
        components: [
          { name: 'Mini Project', weight: '25%' },
          { name: 'In-class Assessment', weight: '35%' }
        ]
      },
      {
        category: 'End Semester Examination',
        weight: '40%',
        components: [
          { name: 'Written Examination', weight: '40%' }
        ]
      }
    ],
    passConditions: [
      {
        title: 'Continuous Assessment Minimum',
        criteria: 'Earn at least 35% (i.e. 21 / 60 marks) of Continuous Assessment marks',
        minPercentage: '35%',
        minMarks: '21 / 60 Marks'
      },
      {
        title: 'End Semester Examination Minimum',
        criteria: 'Achieve at least 35% (i.e. 14 / 40 marks) allocated for End Semester Examination',
        minPercentage: '35%',
        minMarks: '14 / 40 Marks'
      },
      {
        title: 'Overall Module Minimum',
        criteria: 'Obtain an overall aggregate score of at least 40% (i.e. 40 / 100 total marks)',
        minPercentage: '40%',
        minMarks: '40 / 100 Marks'
      }
    ]
  },
  {
    code: 'EE3203',
    title: 'Electrical and Electronic Measurements',
    conductedHours: 0,
    targetHours: 25,
    weeklyHours: 2,
    venue: 'NCC',
    credits: 2,
    coordinator: 'Dr. Geeth Priyankara',
    email: 'geeth@eie.ruh.ac.lk',
    teachers: ['Dr. Geeth Priyankara', 'Mr. Chamod Dissanayake'],
    gradingScheme: [
      {
        category: 'Continuous Assessments (CA)',
        weight: '40%',
        components: [
          { name: 'Laboratories', weight: '15%' },
          { name: 'Take Home Assignment', weight: '5%' },
          { name: 'In-class Assessment', weight: '20%' }
        ]
      },
      {
        category: 'End Semester Examination',
        weight: '60%',
        components: [
          { name: 'Written Examination', weight: '60%' }
        ]
      }
    ],
    passConditions: [
      {
        title: 'Continuous Assessment Minimum',
        criteria: 'Earn at least 35% (i.e. 14 / 40 marks) of Continuous Assessment marks',
        minPercentage: '35%',
        minMarks: '14 / 40 Marks'
      },
      {
        title: 'End Semester Examination Minimum',
        criteria: 'Achieve at least 35% (i.e. 21 / 60 marks) allocated for End Semester Examination',
        minPercentage: '35%',
        minMarks: '21 / 60 Marks'
      },
      {
        title: 'Overall Module Minimum',
        criteria: 'Obtain an overall aggregate score of at least 40% (i.e. 40 / 100 total marks)',
        minPercentage: '40%',
        minMarks: '40 / 100 Marks'
      }
    ]
  },
  {
    code: 'EE3304',
    title: 'Engineering Electromagnetism',
    conductedHours: 0,
    targetHours: 42,
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
    conductedHours: 0,
    targetHours: 27,
    weeklyHours: 2,
    venue: 'LT1',
    credits: 2,
    coordinator: 'Ms. Tashma Silva',
    email: 'tashmas@eie.ruh.ac.lk',
    teachers: ['Ms. Tashma Silva'],
    gradingScheme: [
      {
        category: 'Continuous Assessments (CA)',
        weight: '50%',
        components: [
          { name: 'In-class tests', weight: '20%' },
          { name: 'Mini project', weight: '20%' },
          { name: 'Take home assignment', weight: '5%' },
          { name: 'Field Visit', weight: '5%' }
        ]
      },
      {
        category: 'End Semester Examination',
        weight: '50%',
        components: [
          { name: 'Written Examination', weight: '50%' }
        ]
      }
    ],
    passConditions: [
      {
        title: 'Continuous Assessment Minimum',
        criteria: 'Earn at least 35% (i.e. 17.5 / 50 marks) of Continuous Assessment marks',
        minPercentage: '35%',
        minMarks: '17.5 / 50 Marks'
      },
      {
        title: 'End Semester Examination Minimum',
        criteria: 'Achieve at least 35% (i.e. 17.5 / 50 marks) allocated for End Semester Examination',
        minPercentage: '35%',
        minMarks: '17.5 / 50 Marks'
      }
    ]
  },
  {
    code: 'EE3306',
    title: 'Signals and Systems',
    conductedHours: 0,
    targetHours: 42,
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
    conductedHours: 0,
    targetHours: 42,
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
    conductedHours: 0,
    targetHours: 42,
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
    targetHours: 42,
    weeklyHours: 3,
    venue: 'AUD',
    credits: 3,
    coordinator: 'Eng. Ms. H. A. Danusi Saumyadi',
    email: '',
    teachers: ['Eng. Ms. H. A. Danusi Saumyadi', 'Dr. Praneeth Wijesinghe'],
    gradingScheme: defaultGradingScheme
  }
];

const getRawDailyLogs = () => {
  const local = localStorage.getItem('mis_daily_logs');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {}
  }
  return [];
};

export const getStoredModuleHours = () => {
  const dailyLogs = getRawDailyLogs();
  const semesterLogs = Array.isArray(dailyLogs) ? dailyLogs.filter(l => l.date >= '2026-07-27') : [];

  let base = initialModuleHours;
  const local = localStorage.getItem('mis_module_hours');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        base = initialModuleHours.map(init => {
          const match = parsed.find(p => p.code === init.code);
          if (match) {
            return {
              ...init,
              targetHours: init.targetHours,
              weeklyHours: match.weeklyHours || init.weeklyHours,
              venue: match.venue || init.venue,
              gradingScheme: init.gradingScheme,
              passConditions: init.passConditions
            };
          }
          return init;
        });
      }
    } catch (e) {
      base = initialModuleHours;
    }
  }

  // Compute conductedHours dynamically from daily logs (July 27th onwards)
  return base.map(m => {
    const loggedHours = semesterLogs
      .filter(l => l.module === m.code)
      .reduce((sum, l) => sum + (Number(l.hours) || 0), 0);

    return {
      ...m,
      conductedHours: loggedHours
    };
  });
};

export const saveStoredModuleHours = (hoursArray) => {
  localStorage.setItem('mis_module_hours', JSON.stringify(hoursArray));
  pushModuleHoursToCloud(hoursArray);
};

export const recalculateModuleHoursFromLogs = () => {
  const updatedHours = getStoredModuleHours();
  saveStoredModuleHours(updatedHours);
  return updatedHours;
};

export const resetToInitialHours = () => {
  localStorage.setItem('mis_module_hours', JSON.stringify(initialModuleHours));
  pushModuleHoursToCloud(initialModuleHours);
  return initialModuleHours;
};
