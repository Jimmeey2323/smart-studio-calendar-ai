
import { ClassData } from '../types/calendar';

export interface PerformanceMetrics {
  key: string;
  totalClasses: number;
  totalCheckedIn: number;
  totalParticipants: number;
  avgAttendance: number;
  totalRevenue: number;
  revenuePerClass: number;
  avgFillRate: number;
  adjustedScore: number;
  location: string;
  trainerName: string;
  cleanedClass: string;
  dayOfWeek: string;
  classTime: string;
  popularity: 'Hot' | 'Steady' | 'Cold';
  consistency: 'Stable' | 'Fluctuating';
  rank: number;
}

export class PerformanceAnalyzer {
  private performanceData: PerformanceMetrics[] = [
    {
      key: "Studio Mat 57Saturday0.427083333333333Kwality House, Kemps Corner",
      totalClasses: 25,
      totalCheckedIn: 454,
      totalParticipants: 532,
      avgAttendance: 18.16,
      totalRevenue: 423415.19,
      revenuePerClass: 16936.61,
      avgFillRate: 151.33,
      adjustedScore: 665.3,
      location: "Kwality House, Kemps Corner",
      trainerName: "Karanvir Bhatia",
      cleanedClass: "Studio Mat 57",
      dayOfWeek: "Saturday",
      classTime: "10:15:00",
      popularity: "Hot",
      consistency: "Fluctuating",
      rank: 1
    },
    {
      key: "Studio FITFriday0.375Kwality House, Kemps Corner",
      totalClasses: 26,
      totalCheckedIn: 288,
      totalParticipants: 336,
      avgAttendance: 11.08,
      totalRevenue: 204446.67,
      revenuePerClass: 7863.33,
      avgFillRate: 92.31,
      adjustedScore: 337.84,
      location: "Kwality House, Kemps Corner",
      trainerName: "Anisha Shah",
      cleanedClass: "Studio FIT",
      dayOfWeek: "Friday",
      classTime: "09:00:00",
      popularity: "Steady",
      consistency: "Fluctuating",
      rank: 2
    },
    {
      key: "Studio Back Body BlazeWednesday0.375Kwality House, Kemps Corner",
      totalClasses: 26,
      totalCheckedIn: 275,
      totalParticipants: 342,
      avgAttendance: 10.58,
      totalRevenue: 207301.18,
      revenuePerClass: 7973.12,
      avgFillRate: 88.14,
      adjustedScore: 333.48,
      location: "Kwality House, Kemps Corner",
      trainerName: "Anisha Shah",
      cleanedClass: "Studio Back Body Blaze",
      dayOfWeek: "Wednesday",
      classTime: "09:00:00",
      popularity: "Steady",
      consistency: "Fluctuating",
      rank: 3
    },
    {
      key: "Studio Mat 57Monday0.354166666666667Kwality House, Kemps Corner",
      totalClasses: 26,
      totalCheckedIn: 274,
      totalParticipants: 360,
      avgAttendance: 10.54,
      totalRevenue: 198869.79,
      revenuePerClass: 7648.84,
      avgFillRate: 87.82,
      adjustedScore: 315.89,
      location: "Kwality House, Kemps Corner",
      trainerName: "Anisha Shah",
      cleanedClass: "Studio Mat 57",
      dayOfWeek: "Monday",
      classTime: "08:30:00",
      popularity: "Steady",
      consistency: "Stable",
      rank: 4
    },
    {
      key: "Studio Barre 57Sunday0.479166666666667Kwality House, Kemps Corner",
      totalClasses: 25,
      totalCheckedIn: 245,
      totalParticipants: 292,
      avgAttendance: 9.8,
      totalRevenue: 209675.54,
      revenuePerClass: 8387.02,
      avgFillRate: 81.67,
      adjustedScore: 324.89,
      location: "Kwality House, Kemps Corner",
      trainerName: "Rohan Dahima",
      cleanedClass: "Studio Barre 57",
      dayOfWeek: "Sunday",
      classTime: "11:30:00",
      popularity: "Steady",
      consistency: "Fluctuating",
      rank: 5
    },
    {
      key: "Studio Mat 57Wednesday0.802083333333333Kwality House, Kemps Corner",
      totalClasses: 26,
      totalCheckedIn: 243,
      totalParticipants: 301,
      avgAttendance: 9.35,
      totalRevenue: 226674.75,
      revenuePerClass: 8718.26,
      avgFillRate: 77.88,
      adjustedScore: 348.75,
      location: "Kwality House, Kemps Corner",
      trainerName: "Karanvir Bhatia",
      cleanedClass: "Studio Mat 57",
      dayOfWeek: "Wednesday",
      classTime: "19:15:00",
      popularity: "Steady",
      consistency: "Fluctuating",
      rank: 6
    },
    {
      key: "Studio FITTuesday0.802083333333333Kwality House, Kemps Corner",
      totalClasses: 26,
      totalCheckedIn: 239,
      totalParticipants: 275,
      avgAttendance: 9.19,
      totalRevenue: 225987.67,
      revenuePerClass: 8691.83,
      avgFillRate: 76.6,
      adjustedScore: 352.87,
      location: "Kwality House, Kemps Corner",
      trainerName: "Anisha Shah",
      cleanedClass: "Studio FIT",
      dayOfWeek: "Tuesday",
      classTime: "19:15:00",
      popularity: "Steady",
      consistency: "Fluctuating",
      rank: 7
    },
    {
      key: "Studio powerCycleSunday0.416666666666667Supreme HQ, Bandra",
      totalClasses: 26,
      totalCheckedIn: 221,
      totalParticipants: 292,
      avgAttendance: 8.5,
      totalRevenue: 208003.88,
      revenuePerClass: 8000.15,
      avgFillRate: 60.71,
      adjustedScore: 312.18,
      location: "Supreme HQ, Bandra",
      trainerName: "Cauveri Vikrant",
      cleanedClass: "Studio powerCycle",
      dayOfWeek: "Sunday",
      classTime: "10:00:00",
      popularity: "Steady",
      consistency: "Fluctuating",
      rank: 8
    },
    {
      key: "Studio Cardio Barre (Express)Wednesday0.3125Kwality House, Kemps Corner",
      totalClasses: 26,
      totalCheckedIn: 219,
      totalParticipants: 242,
      avgAttendance: 8.42,
      totalRevenue: 183845.5,
      revenuePerClass: 7070.98,
      avgFillRate: 70.19,
      adjustedScore: 295.4,
      location: "Kwality House, Kemps Corner",
      trainerName: "Anisha Shah",
      cleanedClass: "Studio Cardio Barre (Express)",
      dayOfWeek: "Wednesday",
      classTime: "07:30:00",
      popularity: "Steady",
      consistency: "Stable",
      rank: 9
    },
    {
      key: "Studio FITMonday0.8125Supreme HQ, Bandra",
      totalClasses: 26,
      totalCheckedIn: 214,
      totalParticipants: 287,
      avgAttendance: 8.23,
      totalRevenue: 95683.05,
      revenuePerClass: 3680.12,
      avgFillRate: 58.79,
      adjustedScore: 167.95,
      location: "Supreme HQ, Bandra",
      trainerName: "Mrigakshi Jaiswal",
      cleanedClass: "Studio FIT",
      dayOfWeek: "Monday",
      classTime: "19:30:00",
      popularity: "Steady",
      consistency: "Stable",
      rank: 10
    }
  ];

  getTopPerformingClasses(limit: number = 20): PerformanceMetrics[] {
    return this.performanceData
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .slice(0, limit);
  }

  getClassesByLocation(location: string): PerformanceMetrics[] {
    return this.performanceData.filter(c => 
      c.location.includes(location.split(',')[0]) || 
      c.location.includes(location.split(' ')[0])
    );
  }

  getClassesByTrainer(trainerName: string): PerformanceMetrics[] {
    return this.performanceData.filter(c => c.trainerName === trainerName);
  }

  getOptimalTimeSlots(location: string): string[] {
    const locationClasses = this.getClassesByLocation(location);
    const timeSlotPerformance: { [time: string]: number } = {};
    
    locationClasses.forEach(c => {
      if (!timeSlotPerformance[c.classTime]) {
        timeSlotPerformance[c.classTime] = 0;
      }
      timeSlotPerformance[c.classTime] += c.adjustedScore;
    });

    return Object.entries(timeSlotPerformance)
      .sort(([, a], [, b]) => b - a)
      .map(([time]) => time)
      .slice(0, 10);
  }

  getBestTrainerForClass(className: string, location: string): string {
    const classInstances = this.performanceData.filter(c => 
      c.cleanedClass.includes(className) && 
      (c.location.includes(location.split(',')[0]) || c.location.includes(location.split(' ')[0]))
    );
    
    if (classInstances.length === 0) return 'Anisha Shah';
    
    const trainerPerformance: { [trainer: string]: number[] } = {};
    classInstances.forEach(c => {
      if (!trainerPerformance[c.trainerName]) {
        trainerPerformance[c.trainerName] = [];
      }
      trainerPerformance[c.trainerName].push(c.adjustedScore);
    });

    const bestTrainer = Object.entries(trainerPerformance)
      .map(([trainer, scores]) => ({
        trainer,
        avgScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore)[0];

    return bestTrainer?.trainer || 'Anisha Shah';
  }
}
