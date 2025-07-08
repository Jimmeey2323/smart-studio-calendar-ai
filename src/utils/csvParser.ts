
import { ClassData } from '../types/calendar';

export const parseCSV = (csvText: string): ClassData[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: any = {};
    
    headers.forEach((header, index) => {
      const key = header.toLowerCase().replace(/\s+/g, '');
      obj[key] = values[index] || '';
    });
    
    return {
      variantName: obj.variantname || '',
      classDate: obj.classdate || '',
      location: obj.location || '',
      payrate: obj.payrate || '',
      totalRevenue: parseFloat(obj.totalrevenue) || 0,
      participants: parseInt(obj.participants) || 0,
      checkedIn: parseInt(obj.checkedin) || 0,
      time: parseFloat(obj['time(h)']) || 0,
      teacherFirstName: obj.teacherfirstname || '',
      teacherLastName: obj.teacherlastname || '',
      teacherName: obj.teachername || '',
      dayOfWeek: obj.dayoftheweek || '',
      classTime: obj.classtime || '',
      cleanedClass: obj.cleanedclass || '',
      unique1: obj.unique1 || '',
      unique2: obj.unique2 || ''
    };
  });
};

export const loadClassData = async (): Promise<ClassData[]> => {
  try {
    const response = await fetch('/Classes.csv');
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error loading class data:', error);
    return [];
  }
};
