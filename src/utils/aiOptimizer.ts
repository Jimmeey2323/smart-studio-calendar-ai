
import { ClassData, ScheduledClass, TrainerStats, DaySchedule } from '../types/calendar';

export class AIOptimizer {
  private classData: ClassData[];
  private apiKey: string;

  constructor(classData: ClassData[], apiKey: string) {
    this.classData = classData;
    this.apiKey = apiKey;
  }

  // Analyze class performance and get top performing classes
  getTopPerformingClasses(): { [key: string]: { avgCheckedIn: number, bestTrainers: string[] } } {
    const classGroups: { [key: string]: ClassData[] } = {};
    
    this.classData.forEach(classItem => {
      const key = classItem.unique1 || classItem.cleanedClass;
      if (!classGroups[key]) classGroups[key] = [];
      classGroups[key].push(classItem);
    });

    const performance: { [key: string]: { avgCheckedIn: number, bestTrainers: string[] } } = {};
    
    Object.entries(classGroups).forEach(([className, classes]) => {
      const avgCheckedIn = classes.reduce((sum, c) => sum + c.checkedIn, 0) / classes.length;
      
      if (avgCheckedIn > 5) {
        const trainerPerformance: { [trainer: string]: number[] } = {};
        
        classes.forEach(c => {
          if (!trainerPerformance[c.teacherName]) trainerPerformance[c.teacherName] = [];
          trainerPerformance[c.teacherName].push(c.checkedIn);
        });

        const bestTrainers = Object.entries(trainerPerformance)
          .map(([trainer, checkins]) => ({
            trainer,
            avg: checkins.reduce((a, b) => a + b, 0) / checkins.length
          }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 5)
          .map(t => t.trainer);

        performance[className] = { avgCheckedIn, bestTrainers };
      }
    });

    return performance;
  }

  // Smart scheduling algorithm
  async smartSchedule(location: string): Promise<DaySchedule[]> {
    const topClasses = this.getTopPerformingClasses();
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
      
      // Populate with top performing classes
      Object.entries(topClasses).forEach(([className, data]) => {
        if (data.bestTrainers.length > 0) {
          const randomSlot = Math.floor(Math.random() * daySchedule.timeSlots.length);
          if (!daySchedule.timeSlots[randomSlot].isRestricted) {
            daySchedule.timeSlots[randomSlot].classes.push({
              id: `${day}-${randomSlot}-${className}`,
              name: className,
              trainer: data.bestTrainers[0],
              time: daySchedule.timeSlots[randomSlot].time,
              duration: 60,
              predictedCheckIn: Math.round(data.avgCheckedIn)
            });
          }
        }
      });
      
      schedule.push(daySchedule);
    });
    
    return schedule;
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
    const trainerClasses = this.classData.filter(c => c.teacherName === trainer);
    if (trainerClasses.length === 0) return 0;
    return trainerClasses.reduce((sum, c) => sum + c.checkedIn, 0) / trainerClasses.length;
  }

  private getTrainerSpecialties(trainer: string): string[] {
    const trainerClasses = this.classData.filter(c => c.teacherName === trainer);
    const classTypes = [...new Set(trainerClasses.map(c => c.cleanedClass))];
    return classTypes.slice(0, 3);
  }
}
