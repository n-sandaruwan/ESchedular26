export const initialAssessments = [
  // EE3205 - Power and Energy Assessment Breakdown
  {
    id: 'ee3205-ict',
    moduleCode: 'EE3205',
    title: 'In-Class Tests',
    type: 'Continuous Assessment',
    date: 'To Be Announced',
    time: '20% Total Weight',
    venue: 'LT1',
    weight: '20%',
    status: 'Scheduled',
    notes: 'In-class tests [20%] (CA Minimum Cutoff: 35%)'
  },
  {
    id: 'ee3205-mp',
    moduleCode: 'EE3205',
    title: 'Mini Project',
    type: 'Continuous Assessment',
    date: 'To Be Announced',
    time: '20% Total Weight',
    venue: 'LT1 / Laboratory',
    weight: '20%',
    status: 'Scheduled',
    notes: 'Mini project [20%] (CA Minimum Cutoff: 35%)'
  },
  {
    id: 'ee3205-tha',
    moduleCode: 'EE3205',
    title: 'Take Home Assignment',
    type: 'Continuous Assessment',
    date: 'To Be Announced',
    time: '5% Total Weight',
    venue: 'Online / Class',
    weight: '5%',
    status: 'Scheduled',
    notes: 'Take home assignment [5%]'
  },
  {
    id: 'ee3205-fv',
    moduleCode: 'EE3205',
    title: 'Field Visit',
    type: 'Continuous Assessment',
    date: 'To Be Announced',
    time: '5% Total Weight',
    venue: 'Field Site',
    weight: '5%',
    status: 'Scheduled',
    notes: 'Field Visit [5%]'
  },
  {
    id: 'ee3205-ese',
    moduleCode: 'EE3205',
    title: 'End Semester Written Examination',
    type: 'End Semester Exam',
    date: 'To Be Announced',
    time: '50% Total Weight',
    venue: 'Main Examination Hall',
    weight: '50%',
    status: 'Scheduled',
    notes: 'Written Examination [50%] (Minimum Cutoff: 35% / 17.5 Marks)'
  },

  // IS3301 - Mathematics Assessment Breakdown provided by user
  {
    id: 'is3301-tha1',
    moduleCode: 'IS3301',
    title: 'Take Home Assignments (2)',
    type: 'Continuous Assessment',
    date: 'To Be Announced',
    time: '20% Total Weight',
    venue: 'Online / Class',
    weight: '20%',
    status: 'Scheduled',
    notes: 'Take Home Assignments (2) [20%]'
  },
  {
    id: 'is3301-ica1',
    moduleCode: 'IS3301',
    title: 'In-Class Assessments (2)',
    type: 'Continuous Assessment',
    date: 'To Be Announced',
    time: '20% Total Weight',
    venue: 'Auditorium (AUD)',
    weight: '20%',
    status: 'Scheduled',
    notes: 'In class Assessments (2) [20%]'
  },
  {
    id: 'is3301-ese',
    moduleCode: 'IS3301',
    title: 'End Semester Written Examination',
    type: 'End Semester Exam',
    date: 'To Be Announced',
    time: '60% Total Weight',
    venue: 'Main Examination Hall',
    weight: '60%',
    status: 'Scheduled',
    notes: 'Written Examination [60%]'
  }
];

export const getStoredAssessments = () => {
  const local = localStorage.getItem('mis_module_assessments');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const missing = initialAssessments.filter(i => !parsed.some(p => p.id === i.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem('mis_module_assessments', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    } catch (e) {
      return initialAssessments;
    }
  }
  return initialAssessments;
};

import { pushAssessmentsToCloud } from './firebaseSync';

export const saveStoredAssessments = (assessmentsArray) => {
  localStorage.setItem('mis_module_assessments', JSON.stringify(assessmentsArray));
  pushAssessmentsToCloud(assessmentsArray);
};

export const toggleAssessmentStatus = (id, newStatus) => {
  const current = getStoredAssessments();
  const updated = current.map(item => {
    if (item.id === id) {
      return { ...item, status: newStatus };
    }
    return item;
  });
  saveStoredAssessments(updated);
  return updated;
};
