export const initialAssessments = [
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
