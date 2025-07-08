
export interface ClassData {
  variantName: string;
  classDate: string;
  location: string;
  payrate: string;
  totalRevenue: number;
  participants: number;
  checkedIn: number;
  time: number;
  teacherFirstName: string;
  teacherLastName: string;
  teacherName: string;
  dayOfWeek: string;
  classTime: string;
  cleanedClass: string;
  unique1: string;
  unique2: string;
}

export interface ScheduledClass {
  id: string;
  name: string;
  trainer: string;
  time: string;
  duration: number;
  participants?: number;
  isLocked?: boolean;
  isTrainerLocked?: boolean;
  isPrivate?: boolean;
  memberName?: string;
  predictedCheckIn?: number;
  historicalPerformance?: number;
}

export interface TrainerStats {
  name: string;
  totalHours: number;
  classCount: number;
  averageCheckIn: number;
  specialties: string[];
  currentWeekHours: number;
  isOverloaded: boolean;
}

export interface TimeSlot {
  time: string;
  classes: ScheduledClass[];
  isRestricted: boolean;
}

export interface DaySchedule {
  day: string;
  date: string;
  timeSlots: TimeSlot[];
}

export interface StudioConfig {
  name: string;
  capacity: number;
  location: string;
}
