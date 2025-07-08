import { ClassData, ScheduledClass, TeacherHours, CustomTeacher, AIRecommendation, HistoricClassRow } from '../types';

// Studio capacity definitions
export const STUDIO_CAPACITIES = {
  'Kwality House, Kemps Corner': 2,
  'Supreme HQ, Bandra': 3,
  'Kenkere House': 2
} as const;

// Time slot definitions with 15-minute intervals
export const ALL_TIME_SLOTS = [  
  '07:00', '07:15', '07:30', '07:45',
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45',
  '20:00', '20:15', '20:30', '20:45'
];

// Shift definitions
export const MORNING_SHIFT_START = '07:00';
export const MORNING_SHIFT_END = '12:00';
export const EVENING_SHIFT_START = '16:00';
export const EVENING_SHIFT_END = '20:00';

// Priority teachers and constraints
const PRIORITY_TEACHERS = ['Anisha', 'Vivaran', 'Mrigakshi', 'Pranjali', 'Atulan', 'Cauveri', 'Rohan','Reshma','Richard','Karan','Karanvir'];
const NEW_TRAINERS = ['Kabir', 'Simonelle', 'Karan'];
const NEW_TRAINER_FORMATS = ['Studio Barre 57', 'Studio Barre 57 (Express)', 'Studio powerCycle', 'Studio powerCycle (Express)', 'Studio Cardio Barre'];
const INACTIVE_TEACHERS = ['Nishanth', 'Saniya'];

// Priority class formats for strategic scheduling
const PRIORITY_CLASS_FORMATS = [
  'Studio Barre 57', 
  'Studio powerCycle', 
  'Studio Mat 57', 
  'Studio FIT', 
  'Studio Cardio Barre', 
  'Studio Amped Up!', 
  'Studio Cardio Barre Plus', 
  'Studio Back Body Blaze'
];

// Express class time slots for working professionals
const EXPRESS_TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', // Early morning
  '17:30', '18:00', '18:30', '19:00', '19:30' // Early evening
];

// Sunday class limits
const SUNDAY_CLASS_LIMITS = {
  'Kwality House, Kemps Corner': 5,
  'Supreme HQ, Bandra': 7,
  'Kenkere House': 6
};

/**
 * Check if a teacher is inactive/excluded
 */
function isInactiveTeacher(teacherName: string): boolean {
  return INACTIVE_TEACHERS.some(inactive => 
    teacherName.toLowerCase().includes(inactive.toLowerCase())
  );
}

/**
 * Get maximum parallel classes allowed for a location
 */
export function getMaxParallelClasses(location: string): number {
  return STUDIO_CAPACITIES[location as keyof typeof STUDIO_CAPACITIES] || 1;
}

/**
 * Get all 15-minute intervals that a class occupies
 */
export function getOccupiedTimeSlots(startTime: string, duration: string): string[] {
  const durationHours = parseFloat(duration);
  const durationMinutes = Math.round(durationHours * 60);
  
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  
  const occupiedSlots: string[] = [];
  
  // Generate 15-minute intervals for the entire duration
  for (let i = 0; i < durationMinutes; i += 15) {
    const currentMinutes = startMinutes + i;
    const currentHours = Math.floor(currentMinutes / 60);
    const currentMins = currentMinutes % 60;
    
    const timeSlot = `${currentHours.toString().padStart(2, '0')}:${currentMins.toString().padStart(2, '0')}`;
    occupiedSlots.push(timeSlot);
  }
  
  return occupiedSlots;
}

/**
 * Check if a class can be assigned to a studio without exceeding capacity
 */
export function canAssignClassToStudio(
  currentSchedule: ScheduledClass[],
  proposedClass: { day: string; time: string; location: string; duration: string },
  location: string
): boolean {
  const maxCapacity = getMaxParallelClasses(location);
  if (!maxCapacity) return false;

  const occupiedSlots = getOccupiedTimeSlots(proposedClass.time, proposedClass.duration);
  
  // Check each occupied time slot
  for (const slot of occupiedSlots) {
    const conflictingClasses = currentSchedule.filter(cls => {
      if (cls.location !== location || cls.day !== proposedClass.day) return false;
      
      const classOccupiedSlots = getOccupiedTimeSlots(cls.time, cls.duration);
      return classOccupiedSlots.includes(slot);
    });
    
    if (conflictingClasses.length >= maxCapacity) {
      console.log(`⚠️ Studio capacity exceeded at ${location} on ${proposedClass.day} at ${slot}: ${conflictingClasses.length}/${maxCapacity} studios occupied`);
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a trainer has conflicts with the proposed class
 */
export function hasTrainerConflict(
  currentSchedule: ScheduledClass[],
  proposedClass: { day: string; time: string; teacherFirstName: string; teacherLastName: string; duration: string; location: string }
): boolean {
  const teacherName = `${proposedClass.teacherFirstName} ${proposedClass.teacherLastName}`;
  const occupiedSlots = getOccupiedTimeSlots(proposedClass.time, proposedClass.duration);
  
  // Check for time conflicts
  for (const slot of occupiedSlots) {
    const conflictingClass = currentSchedule.find(cls => {
      if (cls.day !== proposedClass.day) return false;
      if (`${cls.teacherFirstName} ${cls.teacherLastName}` !== teacherName) return false;
      
      const classOccupiedSlots = getOccupiedTimeSlots(cls.time, cls.duration);
      return classOccupiedSlots.includes(slot);
    });
    
    if (conflictingClass) {
      console.log(`⚠️ Trainer time conflict for ${teacherName} at ${proposedClass.day} ${slot}`);
      return true;
    }
  }
  
  // Check for location conflicts (one location per day)
  const sameTeacherSameDay = currentSchedule.filter(cls => 
    cls.day === proposedClass.day && 
    `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName
  );
  
  if (sameTeacherSameDay.length > 0 && sameTeacherSameDay[0].location !== proposedClass.location) {
    console.log(`⚠️ Trainer location conflict for ${teacherName}: already assigned to ${sameTeacherSameDay[0].location} on ${proposedClass.day}`);
    return true;
  }
  
  return false;
}

/**
 * Get shift type for a given time
 */
export function getShiftType(time: string): 'morning' | 'evening' | 'afternoon' {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 16 && hour <= 20) return 'evening';
  return 'afternoon';
}

/**
 * Check consecutive classes for a trainer
 */
export function getConsecutiveClassCount(
  schedule: ScheduledClass[],
  teacherName: string,
  day: string,
  time: string
): number {
  const teacherDayClasses = schedule
    .filter(cls => 
      cls.day === day && 
      `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  
  if (teacherDayClasses.length === 0) return 1;
  
  // Find position where new class would be inserted
  let insertIndex = 0;
  for (let i = 0; i < teacherDayClasses.length; i++) {
    if (time > teacherDayClasses[i].time) {
      insertIndex = i + 1;
    } else {
      break;
    }
  }
  
  // Check consecutive count around insertion point
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  
  // Create temporary array with new class inserted
  const tempClasses = [...teacherDayClasses];
  tempClasses.splice(insertIndex, 0, {
    id: 'temp',
    day,
    time,
    location: '',
    classFormat: '',
    teacherFirstName: teacherName.split(' ')[0],
    teacherLastName: teacherName.split(' ').slice(1).join(' '),
    duration: '1'
  });
  
  // Calculate consecutive classes
  for (let i = 1; i < tempClasses.length; i++) {
    const prevEndTime = addMinutesToTime(tempClasses[i-1].time, parseFloat(tempClasses[i-1].duration) * 60);
    const currentStartTime = tempClasses[i].time;
    
    if (Math.abs(timeToMinutes(currentStartTime) - timeToMinutes(prevEndTime)) <= 15) {
      currentConsecutive++;
    } else {
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      currentConsecutive = 1;
    }
  }
  
  return Math.max(maxConsecutive, currentConsecutive);
}

/**
 * Convert time string to minutes
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Add minutes to a time string
 */
function addMinutesToTime(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get daily class count for a trainer
 */
export function getDailyClassCount(
  schedule: ScheduledClass[],
  teacherName: string,
  day: string
): number {
  return schedule.filter(cls => 
    cls.day === day && 
    `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName
  ).length;
}

/**
 * Get trainer's assigned shift for a day
 */
export function getTrainerShiftForDay(
  schedule: ScheduledClass[],
  teacherName: string,
  day: string
): 'morning' | 'evening' | null {
  const dayClasses = schedule.filter(cls => 
    cls.day === day && 
    `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName
  );
  
  if (dayClasses.length === 0) return null;
  
  const shifts = dayClasses.map(cls => getShiftType(cls.time));
  const morningClasses = shifts.filter(s => s === 'morning').length;
  const eveningClasses = shifts.filter(s => s === 'evening').length;
  
  if (morningClasses > 0 && eveningClasses === 0) return 'morning';
  if (eveningClasses > 0 && morningClasses === 0) return 'evening';
  
  return null; // Mixed shifts
}

/**
 * Count trainers assigned to a specific shift at a location
 */
export function getTrainersInShift(
  schedule: ScheduledClass[],
  location: string,
  day: string,
  shiftType: 'morning' | 'evening'
): Set<string> {
  const trainers = new Set<string>();
  
  schedule
    .filter(cls => 
      cls.location === location && 
      cls.day === day && 
      getShiftType(cls.time) === shiftType
    )
    .forEach(cls => {
      trainers.add(`${cls.teacherFirstName} ${cls.teacherLastName}`);
    });
  
  return trainers;
}

/**
 * Check if a time slot has historical data
 */
export function hasHistoricalData(
  csvData: ClassData[],
  location: string,
  day: string,
  time: string
): boolean {
  return csvData.some(item => 
    item.location === location &&
    item.dayOfWeek === day &&
    item.classTime.includes(time.slice(0, 5)) &&
    !isInactiveTeacher(item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`)
  );
}

/**
 * Get the best class/teacher combination for a specific slot based on historical data
 */
export function getBestSlotRecommendation(
  csvData: ClassData[],
  location: string,
  day: string,
  time: string
): { classFormat: string; teacher: string; avgCheckedIn: number } | null {
  const slotData = csvData.filter(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    return item.location === location &&
      item.dayOfWeek === day &&
      item.classTime.includes(time.slice(0, 5)) &&
      !item.cleanedClass.toLowerCase().includes('hosted') &&
      !isInactiveTeacher(teacherName);
  });

  if (slotData.length === 0) return null;

  // Group by class format and teacher combination
  const combinations: Record<string, { checkedIn: number; count: number }> = {};

  slotData.forEach(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    const key = `${item.cleanedClass}|${teacherName}`;
    if (!combinations[key]) {
      combinations[key] = { checkedIn: 0, count: 0 };
    }
    combinations[key].checkedIn += item.checkedIn;
    combinations[key].count += 1;
  });

  // Find the best combination
  const bestCombination = Object.entries(combinations)
    .map(([key, stats]) => {
      const [classFormat, teacher] = key.split('|');
      return {
        classFormat,
        teacher,
        avgCheckedIn: parseFloat((stats.checkedIn / stats.count).toFixed(1))
      };
    })
    .sort((a, b) => b.avgCheckedIn - a.avgCheckedIn)[0];

  return bestCombination || null;
}

/**
 * Get detailed historic analysis for a specific time slot
 */
export function getDetailedHistoricAnalysis(
  csvData: ClassData[],
  location: string,
  day: string,
  time: string
): {
  totalClasses: number;
  totalCheckedIn: number;
  totalParticipants: number;
  emptyClasses: number;
  nonEmptyClasses: number;
  avgAttendanceWithEmpty: number;
  avgAttendanceWithoutEmpty: number;
  totalRevenue: number;
  revenuePerClass: number;
  avgLateCancels: number;
  avgNonPaidCustomers: number;
  totalTips: number;
  tipsPerClass: number;
  avgFillRate: number;
  revenuePerSeat: number;
  lateCancelRate: number;
  nonPaidRate: number;
  adjustedScore: number;
  topTeacherRecommendations: Array<{
    teacher: string;
    weightedAvg: number;
    classCount: number;
  }>;
} | null {
  const slotData = csvData.filter(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    return item.location === location &&
      item.dayOfWeek === day &&
      item.classTime.includes(time.slice(0, 5)) &&
      !item.cleanedClass.toLowerCase().includes('hosted') &&
      !isInactiveTeacher(teacherName);
  });

  if (slotData.length === 0) return null;

  const totalClasses = slotData.length;
  const totalCheckedIn = slotData.reduce((sum, item) => sum + item.checkedIn, 0);
  const totalParticipants = slotData.reduce((sum, item) => sum + item.participants, 0);
  const emptyClasses = slotData.filter(item => item.checkedIn === 0).length;
  const nonEmptyClasses = totalClasses - emptyClasses;
  const totalRevenue = slotData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalLateCancels = slotData.reduce((sum, item) => sum + item.lateCancellations, 0);
  const totalNonPaidCustomers = slotData.reduce((sum, item) => sum + item.nonPaidCustomers, 0);
  const totalTips = slotData.reduce((sum, item) => sum + item.tip, 0);

  // Calculate averages
  const avgAttendanceWithEmpty = parseFloat((totalCheckedIn / totalClasses).toFixed(2));
  const avgAttendanceWithoutEmpty = nonEmptyClasses > 0 ? 
    parseFloat((slotData.filter(item => item.checkedIn > 0).reduce((sum, item) => sum + item.checkedIn, 0) / nonEmptyClasses).toFixed(2)) : 0;
  const revenuePerClass = parseFloat((totalRevenue / totalClasses).toFixed(2));
  const avgLateCancels = parseFloat((totalLateCancels / totalClasses).toFixed(2));
  const avgNonPaidCustomers = parseFloat((totalNonPaidCustomers / totalClasses).toFixed(2));
  const tipsPerClass = parseFloat((totalTips / totalClasses).toFixed(2));
  
  // Calculate rates
  const avgFillRate = totalParticipants > 0 ? parseFloat(((totalCheckedIn / totalParticipants) * 100).toFixed(2)) : 0;
  const revenuePerSeat = totalCheckedIn > 0 ? parseFloat((totalRevenue / totalCheckedIn).toFixed(2)) : 0;
  const lateCancelRate = totalParticipants > 0 ? parseFloat(((totalLateCancels / totalParticipants) * 100).toFixed(2)) : 0;
  const nonPaidRate = totalParticipants > 0 ? parseFloat(((totalNonPaidCustomers / totalParticipants) * 100).toFixed(2)) : 0;

  // Calculate adjusted score (weighted performance metric)
  const adjustedScore = parseFloat((
    (avgAttendanceWithEmpty * 0.4) + 
    (revenuePerClass / 100 * 0.3) + 
    ((100 - lateCancelRate) / 100 * 0.2) + 
    (avgFillRate / 100 * 0.1)
  ).toFixed(2));

  // Get top teacher recommendations with weighted averages (excluding inactive teachers)
  const teacherStats: Record<string, { checkedIn: number; revenue: number; count: number }> = {};
  
  slotData.forEach(item => {
    const teacher = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    if (!isInactiveTeacher(teacher)) {
      if (!teacherStats[teacher]) {
        teacherStats[teacher] = { checkedIn: 0, revenue: 0, count: 0 };
      }
      teacherStats[teacher].checkedIn += item.checkedIn;
      teacherStats[teacher].revenue += item.totalRevenue;
      teacherStats[teacher].count += 1;
    }
  });

  const topTeacherRecommendations = Object.entries(teacherStats)
    .map(([teacher, stats]) => ({
      teacher,
      weightedAvg: parseFloat((
        (stats.checkedIn / stats.count * 0.6) + 
        (stats.revenue / stats.count / 1000 * 0.4)
      ).toFixed(2)),
      classCount: stats.count
    }))
    .sort((a, b) => b.weightedAvg - a.weightedAvg)
    .slice(0, 3);

  return {
    totalClasses,
    totalCheckedIn,
    totalParticipants,
    emptyClasses,
    nonEmptyClasses,
    avgAttendanceWithEmpty,
    avgAttendanceWithoutEmpty,
    totalRevenue,
    revenuePerClass,
    avgLateCancels,
    avgNonPaidCustomers,
    totalTips,
    tipsPerClass,
    avgFillRate,
    revenuePerSeat,
    lateCancelRate,
    nonPaidRate,
    adjustedScore,
    topTeacherRecommendations
  };
}

/**
 * Enhanced intelligent schedule generation with proper constraints and 15-hour optimization
 */
export async function generateIntelligentSchedule(
  csvData: ClassData[],
  customTeachers: CustomTeacher[] = [],
  options: {
    prioritizeTopPerformers?: boolean;
    balanceShifts?: boolean;
    optimizeTeacherHours?: boolean;
    respectTimeRestrictions?: boolean;
    minimizeTrainersPerShift?: boolean;
    optimizationType?: 'revenue' | 'attendance' | 'balanced';
    iteration?: number;
    targetDay?: string;
    targetTeacherHours?: number;
    fillEmptySlotsOnly?: boolean;
    existingSchedule?: ScheduledClass[];
    priorityClassFormats?: string[];
    mustIncludeClasses?: string[];
  } = {}
): Promise<ScheduledClass[]> {
  console.log('🚀 Enhanced AI: Starting intelligent schedule generation with comprehensive constraints...');
  
  const {
    prioritizeTopPerformers = true,
    balanceShifts = true,
    optimizeTeacherHours = true,
    respectTimeRestrictions = true,
    minimizeTrainersPerShift = true,
    optimizationType = 'balanced',
    iteration = 0,
    targetDay,
    targetTeacherHours = 15,
    fillEmptySlotsOnly = false,
    existingSchedule = [],
    priorityClassFormats = [],
    mustIncludeClasses = []
  } = options;

  console.log(`📋 Priority class formats: ${priorityClassFormats.join(', ')}`);
  console.log(`⭐ Must-include classes: ${mustIncludeClasses.join(', ')}`);

  const optimizedClasses: ScheduledClass[] = fillEmptySlotsOnly ? [...existingSchedule] : [];
  const teacherHours: Record<string, number> = {};
  const teacherDailyHours: Record<string, Record<string, number>> = {};
  const teacherShiftAssignments: Record<string, Record<string, 'morning' | 'evening' | null>> = {};
  
  // Initialize tracking structures
  const allTeachers = getUniqueTeachers(csvData, customTeachers);
  allTeachers.forEach(teacher => {
    teacherHours[teacher] = 0;
    teacherDailyHours[teacher] = {};
    teacherShiftAssignments[teacher] = {};
    
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
      teacherDailyHours[teacher][day] = 0;
      teacherShiftAssignments[teacher][day] = null;
    });
  });

  // Calculate existing teacher hours if filling empty slots only
  if (fillEmptySlotsOnly) {
    existingSchedule.forEach(cls => {
      const teacher = `${cls.teacherFirstName} ${cls.teacherLastName}`;
      if (!isInactiveTeacher(teacher)) {
        teacherHours[teacher] = (teacherHours[teacher] || 0) + parseFloat(cls.duration);
        if (!teacherDailyHours[teacher]) teacherDailyHours[teacher] = {};
        teacherDailyHours[teacher][cls.day] = (teacherDailyHours[teacher][cls.day] || 0) + parseFloat(cls.duration);
      }
    });
  }

  const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];
  const days = targetDay ? [targetDay] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Enhanced time slots including all 15-minute intervals
  const allAvailableTimeSlots = ALL_TIME_SLOTS.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    // Include morning (7-12) and evening (16-21) slots
    return (hour >= 7 && hour <= 11) || (hour >= 16 && hour <= 20);
  });

  // Phase 1: Fill existing slots with best historical combinations
  console.log('📊 Phase 1: Filling slots with best historical data combinations...');
  
  // Phase 1a: Ensure must-include classes are scheduled first
  if (mustIncludeClasses.length > 0) {
    console.log('⭐ Phase 1a: Scheduling must-include priority classes...');
    
    for (const mustIncludeClass of mustIncludeClasses) {
      // Find best slots for this must-include class
      const classData = csvData.filter(item => {
        const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
        return item.cleanedClass === mustIncludeClass && 
               !isInactiveTeacher(teacherName) &&
               (item.avgAttendanceWithEmpty || item.checkedIn) >= 5; // Good performance threshold
      });
      
      if (classData.length === 0) continue;
      
      // Sort by performance (use avgAttendanceWithEmpty if available, otherwise checkedIn)
      classData.sort((a, b) => {
        const aPerf = a.avgAttendanceWithEmpty || a.checkedIn;
        const bPerf = b.avgAttendanceWithEmpty || b.checkedIn;
        return bPerf - aPerf;
      });
      
      // Try to schedule the best performing instances of this class
      for (const classItem of classData.slice(0, 3)) { // Try top 3 instances
        const location = classItem.location;
        const day = classItem.dayOfWeek;
        const timeSlot = classItem.classTime.slice(0, 5);
        
        // Skip if slot is already filled
        const existingClass = optimizedClasses.find(cls => 
          cls.location === location && cls.day === day && cls.time === timeSlot
        );
        if (existingClass) continue;
        
        const teacherName = classItem.teacherName || `${classItem.teacherFirstName} ${classItem.teacherLastName}`;
        if (isInactiveTeacher(teacherName)) continue;
        
        const teacherFirstName = teacherName.split(' ')[0] || '';
        const teacherLastName = teacherName.split(' ').slice(1).join(' ') || '';
        const duration = getClassDuration(mustIncludeClass);
        
        const proposedClass = {
          day,
          time: timeSlot,
          location,
          duration,
          teacherFirstName,
          teacherLastName
        };
        
        // Apply all constraint checks
        if (!canAssignClassToStudio(optimizedClasses, proposedClass, location)) continue;
        if (hasTrainerConflict(optimizedClasses, proposedClass)) continue;
        if (getConsecutiveClassCount(optimizedClasses, teacherName, day, timeSlot) > 2) continue;
        if (getDailyClassCount(optimizedClasses, teacherName, day) >= 4) continue;
        
        const newWeeklyHours = (teacherHours[teacherName] || 0) + parseFloat(duration);
        const isNewTrainer = NEW_TRAINERS.some(name => teacherName.includes(name));
        const maxWeeklyHours = isNewTrainer ? 10 : targetTeacherHours;
        
        if (newWeeklyHours > maxWeeklyHours) continue;
        
        const newDailyHours = (teacherDailyHours[teacherName]?.[day] || 0) + parseFloat(duration);
        if (newDailyHours > 4) continue;
        
        // Schedule the must-include class
        const scheduledClass: ScheduledClass = {
          id: `must-include-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          day,
          time: timeSlot,
          location,
          classFormat: mustIncludeClass,
          teacherFirstName,
          teacherLastName,
          duration,
          participants: Math.round(classItem.avgAttendanceWithEmpty || classItem.checkedIn),
          isTopPerformer: (classItem.avgAttendanceWithEmpty || classItem.checkedIn) >= 6.0,
          isPriorityClass: true
        };
        
        optimizedClasses.push(scheduledClass);
        
        // Update tracking
        teacherHours[teacherName] = newWeeklyHours;
        if (!teacherDailyHours[teacherName]) {
          teacherDailyHours[teacherName] = {};
        }
        teacherDailyHours[teacherName][day] = newDailyHours;
        
        console.log(`⭐ Must-include: ${mustIncludeClass} with ${teacherName} at ${location} on ${day} ${timeSlot}`);
        break; // Move to next must-include class
      }
    }
  }
  
  for (const location of locations) {
    for (const day of days) {
      // Apply Sunday class limits
      if (day === 'Sunday') {
        const maxSundayClasses = SUNDAY_CLASS_LIMITS[location as keyof typeof SUNDAY_CLASS_LIMITS] || 6;
        
        const existingSundayClasses = optimizedClasses.filter(cls => 
          cls.location === location && cls.day === 'Sunday'
        ).length;
        
        if (existingSundayClasses >= maxSundayClasses) continue;
      }

      // Get all time slots that have historical data OR are available for scheduling
      const historicalTimeSlots = [...new Set(
        csvData
          .filter(item => {
            const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
            return item.location === location && 
                   item.dayOfWeek === day && 
                   !isInactiveTeacher(teacherName);
          })
          .map(item => item.classTime.slice(0, 5))
      )];

      // Combine historical slots with all available slots for comprehensive coverage
      const allSlotsToCheck = [...new Set([...historicalTimeSlots, ...allAvailableTimeSlots])].sort();

      for (const timeSlot of allSlotsToCheck) {
        // Skip if slot is already filled
        const existingClass = optimizedClasses.find(cls => 
          cls.location === location && cls.day === day && cls.time === timeSlot
        );
        if (existingClass) continue;

        // Get best recommendation for this slot, prioritizing priority classes
        let bestRecommendation = getBestSlotRecommendationWithPriority(csvData, location, day, timeSlot, priorityClassFormats);
        
        // If no historical data, use top performing classes for this location/day
        if (!bestRecommendation) {
          const topClasses = getTopPerformingClasses(csvData.filter(item => {
            const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
            return item.location === location && 
                   item.dayOfWeek === day && 
                   !isInactiveTeacher(teacherName);
          }), 3.0);
          
          // Prioritize classes from priority list
          const prioritizedTopClasses = topClasses.sort((a, b) => {
            const aIsPriority = priorityClassFormats.includes(a.classFormat);
            const bIsPriority = priorityClassFormats.includes(b.classFormat);
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
            return b.avgParticipants - a.avgParticipants;
          });
          
          if (prioritizedTopClasses.length > 0) {
            const randomClass = prioritizedTopClasses[Math.floor(Math.random() * Math.min(3, prioritizedTopClasses.length))];
            bestRecommendation = {
              classFormat: randomClass.classFormat,
              teacher: randomClass.teacher,
              avgCheckedIn: randomClass.avgParticipants
            };
          }
        }

        if (!bestRecommendation || bestRecommendation.avgCheckedIn < 3) continue;

        // Skip hosted classes
        if (bestRecommendation.classFormat.toLowerCase().includes('hosted')) continue;

        // Skip recovery classes in first half of week
        if (['Monday', 'Tuesday', 'Wednesday'].includes(day) && 
            bestRecommendation.classFormat.toLowerCase().includes('recovery')) {
          continue;
        }

        // Skip inactive teachers
        if (isInactiveTeacher(bestRecommendation.teacher)) continue;

        const teacherFirstName = bestRecommendation.teacher.split(' ')[0] || '';
        const teacherLastName = bestRecommendation.teacher.split(' ').slice(1).join(' ') || '';
        const duration = getClassDuration(bestRecommendation.classFormat);

        // Apply all constraint checks
        const proposedClass = {
          day,
          time: timeSlot,
          location,
          duration,
          teacherFirstName,
          teacherLastName
        };

        // Check constraints
        if (!canAssignClassToStudio(optimizedClasses, proposedClass, location)) continue;
        if (hasTrainerConflict(optimizedClasses, proposedClass)) continue;
        if (getConsecutiveClassCount(optimizedClasses, bestRecommendation.teacher, day, timeSlot) > 2) continue;
        if (getDailyClassCount(optimizedClasses, bestRecommendation.teacher, day) >= 4) continue;

        const newWeeklyHours = (teacherHours[bestRecommendation.teacher] || 0) + parseFloat(duration);
        const isNewTrainer = NEW_TRAINERS.some(name => bestRecommendation.teacher.includes(name));
        const maxWeeklyHours = isNewTrainer ? 10 : targetTeacherHours;
        
        if (newWeeklyHours > maxWeeklyHours) continue;

        const newDailyHours = (teacherDailyHours[bestRecommendation.teacher]?.[day] || 0) + parseFloat(duration);
        if (newDailyHours > 4) continue;

        // Schedule the class
        const scheduledClass: ScheduledClass = {
          id: `enhanced-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          day,
          time: timeSlot,
          location,
          classFormat: bestRecommendation.classFormat,
          teacherFirstName,
          teacherLastName,
          duration,
          participants: Math.round(bestRecommendation.avgCheckedIn),
          isTopPerformer: bestRecommendation.avgCheckedIn >= 6.0,
          isPriorityClass: priorityClassFormats.includes(bestRecommendation.classFormat)
        };

        optimizedClasses.push(scheduledClass);
        
        // Update tracking
        teacherHours[bestRecommendation.teacher] = newWeeklyHours;
        if (!teacherDailyHours[bestRecommendation.teacher]) {
          teacherDailyHours[bestRecommendation.teacher] = {};
        }
        teacherDailyHours[bestRecommendation.teacher][day] = newDailyHours;

        console.log(`✅ Enhanced: ${bestRecommendation.classFormat} with ${bestRecommendation.teacher} at ${location} on ${day} ${timeSlot}`);
      }
    }
  }

  console.log(`✅ Enhanced AI: Generated ${optimizedClasses.length} classes with comprehensive constraints`);
  return optimizedClasses;
}

/**
 * Get the best class/teacher combination for a specific slot with priority class consideration
 */
function getBestSlotRecommendationWithPriority(
  csvData: ClassData[],
  location: string,
  day: string,
  time: string,
  priorityClassFormats: string[] = []
): { classFormat: string; teacher: string; avgCheckedIn: number } | null {
  const slotData = csvData.filter(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    return item.location === location &&
      item.dayOfWeek === day &&
      item.classTime.includes(time.slice(0, 5)) &&
      !item.cleanedClass.toLowerCase().includes('hosted') &&
      !isInactiveTeacher(teacherName);
  });

  if (slotData.length === 0) return null;

  // Group by class format and teacher combination
  const combinations: Record<string, { checkedIn: number; count: number; isPriority: boolean }> = {};

  slotData.forEach(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    const key = `${item.cleanedClass}|${teacherName}`;
    const isPriority = priorityClassFormats.includes(item.cleanedClass);
    
    if (!combinations[key]) {
      combinations[key] = { checkedIn: 0, count: 0, isPriority };
    }
    combinations[key].checkedIn += item.avgAttendanceWithEmpty || item.checkedIn;
    combinations[key].count += 1;
  });

  // Find the best combination, prioritizing priority classes
  const bestCombination = Object.entries(combinations)
    .map(([key, stats]) => {
      const [classFormat, teacher] = key.split('|');
      return {
        classFormat,
        teacher,
        avgCheckedIn: parseFloat((stats.checkedIn / stats.count).toFixed(1)),
        isPriority: stats.isPriority
      };
    })
    .sort((a, b) => {
      // First sort by priority status
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      // Then by performance
      return b.avgCheckedIn - a.avgCheckedIn;
    })[0];

  return bestCombination || null;
}
/**
 * Fill empty slots with best recommendations - Enhanced version that adds 5 new classes per call
 */
export async function fillEmptySlots(
  csvData: ClassData[],
  currentSchedule: ScheduledClass[],
  customTeachers: CustomTeacher[] = []
): Promise<ScheduledClass[]> {
  console.log('🔄 Enhanced Fill: Adding 5 new classes to maximize trainer hours...');
  
  const enhancedSchedule = [...currentSchedule];
  const teacherHours = calculateTeacherHours(currentSchedule);
  const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Enhanced time slots including all 15-minute intervals
  const allAvailableTimeSlots = ALL_TIME_SLOTS.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    return (hour >= 7 && hour <= 11) || (hour >= 16 && hour <= 20);
  });

  let classesAdded = 0;
  const targetNewClasses = 5;

  // Find teachers who can take more hours (prioritize those under 15 hours)
  const availableTeachers = Object.entries(teacherHours)
    .filter(([teacher, hours]) => {
      if (isInactiveTeacher(teacher)) return false;
      const isNewTrainer = NEW_TRAINERS.some(name => teacher.includes(name));
      const maxHours = isNewTrainer ? 10 : 15;
      return hours < maxHours - 0.5; // Leave some buffer
    })
    .sort((a, b) => a[1] - b[1]); // Sort by current hours (ascending)

  console.log(`📊 Found ${availableTeachers.length} teachers available for additional hours`);

  // Try to add classes for each available teacher
  for (const [teacherName, currentHours] of availableTeachers) {
    if (classesAdded >= targetNewClasses) break;

    const isNewTrainer = NEW_TRAINERS.some(name => teacherName.includes(name));
    const maxHours = isNewTrainer ? 10 : 15;
    const availableHours = maxHours - currentHours;

    if (availableHours < 0.5) continue;

    // Find best class formats for this teacher from historical data
    const teacherClasses = csvData.filter(item => {
      const itemTeacher = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
      return itemTeacher === teacherName && 
             item.checkedIn >= 4 && 
             !item.cleanedClass.toLowerCase().includes('hosted');
    });

    if (teacherClasses.length === 0) continue;

    // Get teacher's best performing formats
    const formatStats = teacherClasses.reduce((acc, item) => {
      if (!acc[item.cleanedClass]) {
        acc[item.cleanedClass] = { checkedIn: 0, count: 0 };
      }
      acc[item.cleanedClass].checkedIn += item.checkedIn;
      acc[item.cleanedClass].count += 1;
      return acc;
    }, {} as Record<string, { checkedIn: number; count: number }>);

    const bestFormats = Object.entries(formatStats)
      .map(([format, stats]) => ({
        format,
        avgCheckedIn: stats.checkedIn / stats.count
      }))
      .sort((a, b) => b.avgCheckedIn - a.avgCheckedIn)
      .slice(0, 3);

    // Try to schedule classes for this teacher
    for (const location of locations) {
      if (classesAdded >= targetNewClasses) break;

      for (const day of days) {
        if (classesAdded >= targetNewClasses) break;

        // Check if teacher already has classes this day
        const teacherDayClasses = enhancedSchedule.filter(cls => 
          cls.day === day && 
          `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName
        );

        if (teacherDayClasses.length >= 4) continue; // Max 4 classes per day

        // Check if teacher is already assigned to a different location this day
        if (teacherDayClasses.length > 0 && teacherDayClasses[0].location !== location) continue;

        for (const timeSlot of allAvailableTimeSlots) {
          if (classesAdded >= targetNewClasses) break;

          // Check if slot is available
          const existingClass = enhancedSchedule.find(cls => 
            cls.location === location && cls.day === day && cls.time === timeSlot
          );
          if (existingClass) continue;

          // Try each of the teacher's best formats
          for (const { format, avgCheckedIn } of bestFormats) {
            if (classesAdded >= targetNewClasses) break;

            // Skip recovery classes in first half of week
            if (['Monday', 'Tuesday', 'Wednesday'].includes(day) && 
                format.toLowerCase().includes('recovery')) {
              continue;
            }

            // Check format restrictions for new trainers
            if (isNewTrainer && !NEW_TRAINER_FORMATS.includes(format)) continue;

            const teacherFirstName = teacherName.split(' ')[0] || '';
            const teacherLastName = teacherName.split(' ').slice(1).join(' ') || '';
            const duration = getClassDuration(format);

            const proposedClass = {
              day,
              time: timeSlot,
              location,
              duration,
              teacherFirstName,
              teacherLastName
            };

            // Apply all constraint checks
            if (!canAssignClassToStudio(enhancedSchedule, proposedClass, location)) continue;
            if (hasTrainerConflict(enhancedSchedule, proposedClass)) continue;
            if (getConsecutiveClassCount(enhancedSchedule, teacherName, day, timeSlot) > 2) continue;

            const newWeeklyHours = currentHours + parseFloat(duration);
            if (newWeeklyHours > maxHours) continue;

            const dailyHours = teacherDayClasses.reduce((sum, cls) => sum + parseFloat(cls.duration), 0) + parseFloat(duration);
            if (dailyHours > 4) continue;

            // Schedule the class
            const scheduledClass: ScheduledClass = {
              id: `fill-additional-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              day,
              time: timeSlot,
              location,
              classFormat: format,
              teacherFirstName,
              teacherLastName,
              duration,
              participants: Math.round(avgCheckedIn),
              isTopPerformer: avgCheckedIn >= 6.0
            };

            enhancedSchedule.push(scheduledClass);
            classesAdded++;

            console.log(`✅ Additional: ${format} with ${teacherName} at ${location} on ${day} ${timeSlot} (${classesAdded}/${targetNewClasses})`);
            
            // Update current hours for this teacher
            teacherHours[teacherName] = newWeeklyHours;
            break; // Move to next time slot
          }
        }
      }
    }
  }

  console.log(`✅ Enhanced Fill: Added ${classesAdded} new classes to maximize trainer utilization`);
  return enhancedSchedule;
}

// Existing utility functions with enhanced formatting

export function getTopPerformingClasses(
  data: ClassData[], 
  minAvgCheckedIn: number = 5.0, 
  includeRevenue: boolean = false
): Array<{
  classFormat: string;
  location: string;
  day: string;
  time: string;
  teacher: string;
  avgParticipants: number;
  avgRevenue: number;
  frequency: number;
}> {
  const classStats: Record<string, {
    checkedIn: number;
    revenue: number;
    count: number;
    teachers: Record<string, number>;
  }> = {};

  data.forEach(item => {
    if (!item.cleanedClass || item.cleanedClass.toLowerCase().includes('hosted')) return;
    
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    if (isInactiveTeacher(teacherName)) return; // Skip inactive teachers
    
    const key = `${item.cleanedClass}|${item.location}|${item.dayOfWeek}|${item.classTime}`;
    
    if (!classStats[key]) {
      classStats[key] = {
        checkedIn: 0,
        revenue: 0,
        count: 0,
        teachers: {}
      };
    }
    
    classStats[key].checkedIn += item.checkedIn; // Use checkedIn instead of participants
    classStats[key].revenue += item.totalRevenue;
    classStats[key].count += 1;
    
    classStats[key].teachers[teacherName] = (classStats[key].teachers[teacherName] || 0) + item.checkedIn;
  });

  return Object.entries(classStats)
    .map(([key, stats]) => {
      const [classFormat, location, day, time] = key.split('|');
      const avgParticipants = parseFloat((stats.checkedIn / stats.count).toFixed(1));
      const avgRevenue = stats.revenue / stats.count;
      
      const bestTeacher = Object.entries(stats.teachers)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      return {
        classFormat,
        location,
        day,
        time,
        teacher: bestTeacher,
        avgParticipants,
        avgRevenue,
        frequency: stats.count
      };
    })
    .filter(item => item.avgParticipants >= minAvgCheckedIn)
    .sort((a, b) => b.avgParticipants - a.avgParticipants);
}

export function getClassAverageForSlot(
  data: ClassData[],
  classFormat: string,
  location: string,
  day: string,
  time: string,
  teacher?: string
): { average: number; count: number } {
  const filteredData = data.filter(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    if (isInactiveTeacher(teacherName)) return false; // Skip inactive teachers
    
    const matchesBasic = item.cleanedClass === classFormat &&
                        item.location === location &&
                        item.dayOfWeek === day &&
                        item.classTime.includes(time.slice(0, 5));
    
    if (!matchesBasic) return false;
    
    if (teacher) {
      const itemTeacher = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
      return itemTeacher === teacher;
    }
    
    return true;
  });

  if (filteredData.length === 0) {
    return { average: 0, count: 0 };
  }

  const totalCheckedIn = filteredData.reduce((sum, item) => sum + item.checkedIn, 0); // Use checkedIn
  const average = parseFloat((totalCheckedIn / filteredData.length).toFixed(1));

  return { average, count: filteredData.length };
}

export function getBestTeacherForClass(
  data: ClassData[],
  classFormat: string,
  location: string,
  day: string,
  time: string
): string | null {
  const classData = data.filter(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    return item.cleanedClass === classFormat &&
      item.location === location &&
      item.dayOfWeek === day &&
      item.classTime.includes(time.slice(0, 5)) &&
      !isInactiveTeacher(teacherName);
  });

  if (classData.length === 0) return null;

  const teacherStats: Record<string, { checkedIn: number; count: number }> = {};

  classData.forEach(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    if (!teacherStats[teacherName]) {
      teacherStats[teacherName] = { checkedIn: 0, count: 0 };
    }
    teacherStats[teacherName].checkedIn += item.checkedIn; // Use checkedIn
    teacherStats[teacherName].count += 1;
  });

  const bestTeacher = Object.entries(teacherStats)
    .map(([teacher, stats]) => ({
      teacher,
      avgCheckedIn: parseFloat((stats.checkedIn / stats.count).toFixed(1))
    }))
    .sort((a, b) => b.avgCheckedIn - a.avgCheckedIn)[0];

  return bestTeacher?.teacher || null;
}

export function getUniqueTeachers(data: ClassData[], customTeachers: CustomTeacher[] = []): string[] {
  const teachersFromData = new Set<string>();
  
  data.forEach(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    if (teacherName && teacherName.trim() !== '' && !isInactiveTeacher(teacherName)) {
      teachersFromData.add(teacherName.trim());
    }
  });

  const teachersFromCustom = customTeachers
    .filter(teacher => !isInactiveTeacher(`${teacher.firstName} ${teacher.lastName}`))
    .map(teacher => `${teacher.firstName} ${teacher.lastName}`);

  const allTeachers = [...Array.from(teachersFromData), ...teachersFromCustom];
  
  return [...new Set(allTeachers)]
    .filter(teacher => !isInactiveTeacher(teacher))
    .sort();
}

export function getClassDuration(classFormat: string): string {
  if (classFormat.toLowerCase().includes('express')) return '0.75';
  if (classFormat.toLowerCase().includes('recovery')) return '0.5'; // Changed to 30 minutes
  if (classFormat.toLowerCase().includes('foundations')) return '0.75';
  return '1';
}

export function calculateTeacherHours(scheduledClasses: ScheduledClass[]): TeacherHours {
  const teacherHours: TeacherHours = {};
  
  scheduledClasses.forEach(cls => {
    const teacherName = `${cls.teacherFirstName} ${cls.teacherLastName}`;
    if (!isInactiveTeacher(teacherName)) {
      const duration = parseFloat(cls.duration);
      teacherHours[teacherName] = parseFloat(((teacherHours[teacherName] || 0) + duration).toFixed(1));
    }
  });
  
  return teacherHours;
}

export function validateTeacherHours(
  existingClasses: ScheduledClass[],
  newClass: ScheduledClass
): { isValid: boolean; error?: string; warning?: string; canOverride?: boolean } {
  const teacherName = `${newClass.teacherFirstName} ${newClass.teacherLastName}`;
  
  // Check if teacher is inactive
  if (isInactiveTeacher(teacherName)) {
    return {
      isValid: false,
      error: `${teacherName} is inactive and cannot be assigned to classes`,
      canOverride: false
    };
  }
  
  const isNewTrainer = NEW_TRAINERS.some(name => teacherName.includes(name));
  const maxHours = isNewTrainer ? 10 : 15;
  
  const currentHours = existingClasses
    .filter(cls => `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName)
    .reduce((sum, cls) => sum + parseFloat(cls.duration), 0);
  
  const newTotalHours = parseFloat((currentHours + parseFloat(newClass.duration)).toFixed(1));
  
  // Check consecutive classes
  const consecutiveCount = getConsecutiveClassCount(existingClasses, teacherName, newClass.day, newClass.time);
  if (consecutiveCount > 2) {
    return {
      isValid: false,
      error: `${teacherName} would have ${consecutiveCount} consecutive classes (max 2 allowed)`,
      canOverride: false
    };
  }
  
  // Check daily class count
  const dailyCount = getDailyClassCount(existingClasses, teacherName, newClass.day) + 1;
  if (dailyCount > 4) {
    return {
      isValid: false,
      error: `${teacherName} would have ${dailyCount} classes on ${newClass.day} (max 4 allowed)`,
      canOverride: false
    };
  }
  
  // Check studio capacity
  const proposedClass = {
    day: newClass.day,
    time: newClass.time,
    location: newClass.location,
    duration: newClass.duration
  };
  
  if (!canAssignClassToStudio(existingClasses, proposedClass, newClass.location)) {
    return {
      isValid: false,
      error: `Studio capacity exceeded at ${newClass.location} for ${newClass.day} ${newClass.time}`,
      canOverride: false
    };
  }
  
  if (newTotalHours > maxHours) {
    return {
      isValid: false,
      error: `${teacherName} would exceed ${maxHours}h limit (${newTotalHours}h total)`,
      canOverride: true
    };
  }
  
  if (newTotalHours > maxHours - 2) {
    return {
      isValid: true,
      warning: `${teacherName} approaching ${maxHours}h limit (${newTotalHours}h total)`
    };
  }
  
  return { isValid: true };
}

export function getAvailableTimeSlots(day: string): string[] {
  return ALL_TIME_SLOTS.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    
    // Morning slots
    if (hour >= 7 && hour <= 11) return true;
    
    // Evening slots
    if (hour >= 16 && hour <= 20) return true;
    
    return false;
  });
}

export function getRestrictedTimeSlots(): string[] {
  return ALL_TIME_SLOTS.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 12 && hour < 16;
  });
}

export function isTimeRestricted(time: string, day: string): boolean {
  const hour = parseInt(time.split(':')[0]);
  
  // Weekend exceptions
  if (day === 'Saturday' || day === 'Sunday') {
    return hour >= 12 && hour < 16; // 12 PM - 4 PM restricted on weekends
  }
  
  // Weekday restrictions
  return hour >= 12 && hour < 17; // 12 PM - 5 PM restricted on weekdays
}

export function getTimeSlotsWithData(data: ClassData[], location: string): Set<string> {
  const timeSlotsWithData = new Set<string>();
  
  data
    .filter(item => {
      const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
      return item.location === location && !isInactiveTeacher(teacherName);
    })
    .forEach(item => {
      const time = item.classTime.slice(0, 5); // Get HH:MM format
      timeSlotsWithData.add(time);
    });
  
  return timeSlotsWithData;
}

export function getClassesAtTimeSlot(
  scheduledClasses: ScheduledClass[],
  day: string,
  time: string,
  location: string
): ScheduledClass[] {
  return scheduledClasses.filter(cls =>
    cls.day === day &&
    cls.time === time &&
    cls.location === location
  );
}

export function getClassCounts(scheduledClasses: ScheduledClass[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  scheduledClasses.forEach(cls => {
    counts[cls.classFormat] = (counts[cls.classFormat] || 0) + 1;
  });
  
  return counts;
}

export function getClassFormatsForDay(scheduledClasses: ScheduledClass[], day: string): Record<string, number> {
  const counts: Record<string, number> = {};
  
  scheduledClasses
    .filter(cls => cls.day === day)
    .forEach(cls => {
      counts[cls.classFormat] = (counts[cls.classFormat] || 0) + 1;
    });
  
  return counts;
}

export function isClassAllowedAtLocation(classFormat: string, location: string): boolean {
  const lowerFormat = classFormat.toLowerCase();
  
  if (location === 'Supreme HQ, Bandra') {
    // Only PowerCycle classes allowed at Supreme HQ
    if (lowerFormat.includes('powercycle') || lowerFormat.includes('power cycle')) {
      return true;
    }
    // Explicitly forbidden formats
    if (lowerFormat.includes('hiit') || lowerFormat.includes('amped up')) {
      return false;
    }
    // Allow other formats for now (can be restricted later)
    return true;
  } else {
    // Other locations: no PowerCycle
    return !lowerFormat.includes('powercycle') && !lowerFormat.includes('power cycle');
  }
}

export function getTeacherSpecialties(data: ClassData[], teacherName: string): string[] {
  if (isInactiveTeacher(teacherName)) return []; // Return empty for inactive teachers
  
  const teacherClasses = data.filter(item => {
    const itemTeacher = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    return itemTeacher === teacherName;
  });

  const specialtyStats: Record<string, { checkedIn: number; count: number }> = {};

  teacherClasses.forEach(item => {
    if (!specialtyStats[item.cleanedClass]) {
      specialtyStats[item.cleanedClass] = { checkedIn: 0, count: 0 };
    }
    specialtyStats[item.cleanedClass].checkedIn += item.checkedIn; // Use checkedIn
    specialtyStats[item.cleanedClass].count += 1;
  });

  return Object.entries(specialtyStats)
    .map(([format, stats]) => ({
      format,
      avgCheckedIn: stats.checkedIn / stats.count
    }))
    .filter(item => item.avgCheckedIn >= 5.0)
    .sort((a, b) => b.avgCheckedIn - a.avgCheckedIn)
    .map(item => item.format)
    .slice(0, 5);
}

export function getDefaultTopClasses(data: ClassData[]): Array<{
  classFormat: string;
  location: string;
  day: string;
  time: string;
  teacher: string;
  avgParticipants: number;
  avgRevenue: number;
}> {
  return getTopPerformingClasses(data, 5.0, true).slice(0, 20);
}

/**
 * Get historical class rows for detailed analysis
 */
export function getHistoricalClassRows(
  data: ClassData[],
  location: string,
  day: string,
  time: string,
  filters?: {
    classFormat?: string;
    teacher?: string;
    minCheckedIn?: number;
  }
): HistoricClassRow[] {
  let filteredData = data.filter(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    return item.location === location &&
      item.dayOfWeek === day &&
      item.classTime.includes(time.slice(0, 5)) &&
      !isInactiveTeacher(teacherName);
  });

  if (filters) {
    if (filters.classFormat) {
      filteredData = filteredData.filter(item => item.cleanedClass === filters.classFormat);
    }
    if (filters.teacher) {
      filteredData = filteredData.filter(item => {
        const itemTeacher = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
        return itemTeacher === filters.teacher;
      });
    }
    if (filters.minCheckedIn !== undefined) {
      filteredData = filteredData.filter(item => item.checkedIn >= filters.minCheckedIn!);
    }
  }

  return filteredData.map(item => ({
    variantName: item.variantName,
    classDate: item.classDate,
    location: item.location,
    payrate: item.payrate,
    totalRevenue: item.totalRevenue,
    basePayout: item.basePayout,
    additionalPayout: item.additionalPayout,
    totalPayout: item.totalPayout,
    tip: item.tip,
    participants: item.participants,
    checkedIn: item.checkedIn,
    comps: item.comps,
    checkedInComps: item.checkedInComps,
    lateCancellations: item.lateCancellations,
    nonPaidCustomers: item.nonPaidCustomers,
    timeHours: item.timeHours,
    teacherFirstName: item.teacherFirstName,
    teacherLastName: item.teacherLastName,
    teacherName: item.teacherName,
    dayOfWeek: item.dayOfWeek,
    classTime: item.classTime,
    cleanedClass: item.cleanedClass,
    unique1: item.unique1,
    unique2: item.unique2
  }));
}