import { ClassData, ScheduledClass, TrainerStats, DaySchedule } from '../types/calendar';
import { PerformanceAnalyzer, PerformanceMetrics } from './performanceAnalyzer';

export class AIOptimizer {
  private classData: ClassData[];
  private apiKey: string;
  private performanceAnalyzer: PerformanceAnalyzer;

  constructor(classData: ClassData[], apiKey: string) {
    this.classData = classData;
    this.apiKey = apiKey;
    this.performanceAnalyzer = new PerformanceAnalyzer();
  }

  // Get top performing classes from real data
  getTopPerformingClasses(): { [key: string]: { avgCheckedIn: number, bestTrainers: string[], adjustedScore: number } } {
    const topClasses = this.performanceAnalyzer.getTopPerformingClasses(15);
    const performance: { [key: string]: { avgCheckedIn: number, bestTrainers: string[], adjustedScore: number } } = {};
    
    topClasses.forEach(classData => {
      const className = classData.cleanedClass;
      if (!performance[className]) {
        performance[className] = {
          avgCheckedIn: classData.avgAttendance,
          bestTrainers: [classData.trainerName],
          adjustedScore: classData.adjustedScore
        };
      } else {
        // Add trainer if not already present
        if (!performance[className].bestTrainers.includes(classData.trainerName)) {
          performance[className].bestTrainers.push(classData.trainerName);
        }
      }
    });

    return performance;
  }

  // Smart scheduling algorithm using performance data
  async smartSchedule(location: string): Promise<DaySchedule[]> {
    const topClasses = this.performanceAnalyzer.getClassesByLocation(location);
    const schedule: DaySchedule[] = [];
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = this.generateTimeSlots();
    
    days.forEach(day => {
      const daySchedule: DaySchedule = {
        day,
        date: this.getDateForDay(day),
        timeSlots: timeSlots.map(time => ({
          time,
          classes: [],
          isRestricted: this.isRestrictedTime(time)
        }))
      };
      
      // Get classes that historically performed well on this day
      const dayClasses = topClasses.filter(c => c.dayOfWeek === day);
      
      dayClasses.slice(0, 8).forEach((classData, index) => {
        const targetTimeSlot = daySchedule.timeSlots.find(slot => 
          slot.time === classData.classTime && !slot.isRestricted
        );
        
        if (targetTimeSlot) {
          targetTimeSlot.classes.push({
            id: `${day}-${classData.classTime}-${classData.cleanedClass}`,
            name: classData.cleanedClass,
            trainer: classData.trainerName,
            time: classData.classTime,
            duration: 60,
            predictedCheckIn: Math.round(classData.avgAttendance),
            historicalPerformance: classData.adjustedScore
          });
        } else {
          // Find the best available slot if exact time not available
          const availableSlot = daySchedule.timeSlots.find(slot => 
            !slot.isRestricted && slot.classes.length === 0
          );
          
          if (availableSlot) {
            availableSlot.classes.push({
              id: `${day}-${availableSlot.time}-${classData.cleanedClass}`,
              name: classData.cleanedClass,
              trainer: classData.trainerName,
              time: availableSlot.time,
              duration: 60,
              predictedCheckIn: Math.round(classData.avgAttendance),
              historicalPerformance: classData.adjustedScore
            });
          }
        }
      });
      
      schedule.push(daySchedule);
    });
    
    return schedule;
  }

  // Optimize for maximum trainer utilization
  maxOutTrainers(schedule: DaySchedule[]): DaySchedule[] {
    const optimized = JSON.parse(JSON.stringify(schedule));
    const trainerHours: { [trainer: string]: number } = {};
    
    // Calculate current trainer hours
    optimized.forEach(day => {
      day.timeSlots.forEach(slot => {
        slot.classes.forEach(classItem => {
          trainerHours[classItem.trainer] = (trainerHours[classItem.trainer] || 0) + 1;
        });
      });
    });
    
    // Add more classes for trainers under 15 hours
    const topClasses = this.performanceAnalyzer.getTopPerformingClasses(10);
    const underutilizedTrainers = Object.entries(trainerHours)
      .filter(([, hours]) => hours < 15)
      .map(([trainer]) => trainer);
    
    underutilizedTrainers.forEach(trainer => {
      const trainerClasses = topClasses.filter(c => c.trainerName === trainer);
      if (trainerClasses.length > 0) {
        const additionalClassesNeeded = Math.min(15 - trainerHours[trainer], 5);
        
        for (let i = 0; i < additionalClassesNeeded; i++) {
          const classToAdd = trainerClasses[i % trainerClasses.length];
          
          // Find an empty slot
          for (const day of optimized) {
            const emptySlot = day.timeSlots.find(slot => 
              !slot.isRestricted && slot.classes.length === 0
            );
            
            if (emptySlot) {
              emptySlot.classes.push({
                id: `${day.day}-${emptySlot.time}-${classToAdd.cleanedClass}-extra`,
                name: classToAdd.cleanedClass,
                trainer: trainer,
                time: emptySlot.time,
                duration: 60,
                predictedCheckIn: Math.round(classToAdd.avgAttendance),
                historicalPerformance: classToAdd.adjustedScore
              });
              break;
            }
          }
        }
      }
    });
    
    return optimized;
  }

  // Optimize for equal distribution
  optimizeSlots(schedule: DaySchedule[]): DaySchedule[] {
    const optimized = JSON.parse(JSON.stringify(schedule));
    
    optimized.forEach(day => {
      const morningSlots = day.timeSlots.filter(slot => 
        !slot.isRestricted && this.isMorningSlot(slot.time)
      );
      const eveningSlots = day.timeSlots.filter(slot => 
        !slot.isRestricted && this.isEveningSlot(slot.time)
      );
      
      const allClasses = day.timeSlots.flatMap(slot => slot.classes);
      
      // Clear existing classes
      day.timeSlots.forEach(slot => slot.classes = []);
      
      // Redistribute classes equally
      allClasses.forEach((classItem, index) => {
        const targetSlots = index % 2 === 0 ? morningSlots : eveningSlots;
        if (targetSlots.length > 0) {
          const slotIndex = index % targetSlots.length;
          targetSlots[slotIndex].classes.push(classItem);
        }
      });
    });
    
    return optimized;
  }

  // Calculate trainer hours and stats
  calculateTrainerStats(schedule: DaySchedule[]): TrainerStats[] {
    const trainerHours: { [trainer: string]: number } = {};
    const trainerClasses: { [trainer: string]: ScheduledClass[] } = {};
    
    schedule.forEach(day => {
      day.timeSlots.forEach(slot => {
        slot.classes.forEach(classItem => {
          if (!trainerHours[classItem.trainer]) {
            trainerHours[classItem.trainer] = 0;
            trainerClasses[classItem.trainer] = [];
          }
          trainerHours[classItem.trainer] += classItem.duration / 60;
          trainerClasses[classItem.trainer].push(classItem);
        });
      });
    });
    
    return Object.entries(trainerHours).map(([trainer, hours]) => ({
      name: trainer,
      totalHours: hours,
      classCount: trainerClasses[trainer].length,
      averageCheckIn: this.getTrainerAverageCheckIn(trainer),
      specialties: this.getTrainerSpecialties(trainer),
      currentWeekHours: hours,
      isOverloaded: hours >= 15
    }));
  }

  private generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 7; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 21) slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }

  private isRestrictedTime(time: string): boolean {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 13 && hour < 16;
  }

  private isMorningSlot(time: string): boolean {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 7 && hour < 13;
  }

  private isEveningSlot(time: string): boolean {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 16 && hour <= 21;
  }

  private getDateForDay(day: string): string {
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
    const diff = targetDay - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
  }

  private getTrainerAverageCheckIn(trainer: string): number {
    const performanceData = this.performanceAnalyzer.getClassesByTrainer(trainer);
    if (performanceData.length === 0) return 0;
    return performanceData.reduce((sum, c) => sum + c.avgAttendance, 0) / performanceData.length;
  }

  private getTrainerSpecialties(trainer: string): string[] {
    const performanceData = this.performanceAnalyzer.getClassesByTrainer(trainer);
    const classTypes = [...new Set(performanceData.map(c => c.cleanedClass))];
    return classTypes.slice(0, 3);
  }
}
