import { pushAssessmentsToCloud } from './firebaseSync';

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
      if (Array.isArray(parsed)) {
        const missing = initialAssessments.filter(i => !parsed.some(p => String(p.id) === String(i.id)));
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

export const addAssessment = ({ moduleCode, title, type, date, time, venue, weight, notes }) => {
  const current = getStoredAssessments();
  const newItem = {
    id: `${moduleCode.toLowerCase()}-${Date.now()}`,
    moduleCode,
    title,
    type: type || 'Continuous Assessment',
    date: date || 'To Be Announced',
    time: time || '',
    venue: venue || '',
    weight: weight || '',
    status: 'Scheduled',
    notes: notes || ''
  };
  const updated = [newItem, ...current];
  saveStoredAssessments(updated);
  return updated;
};

export const removeAssessment = (id) => {
  const current = getStoredAssessments();
  const updated = current.filter(item => item.id !== id);
  saveStoredAssessments(updated);
  return updated;
};
