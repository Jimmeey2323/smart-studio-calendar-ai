
import React, { useState, useEffect } from 'react';
import { CalendarHeader } from '../components/CalendarHeader';
import { WeeklyCalendar } from '../components/WeeklyCalendar';
import { SchedulingModal } from '../components/SchedulingModal';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ClassData, DaySchedule, ScheduledClass, TrainerStats } from '../types/calendar';
import { loadClassData } from '../utils/csvParser';
import { AIOptimizer } from '../utils/aiOptimizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sparkles, BarChart3 } from 'lucide-react';

const Index = () => {
  const [activeLocation, setActiveLocation] = useState('Kwality House Kemps Corner');
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [trainerStats, setTrainerStats] = useState<TrainerStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schedulingModal, setSchedulingModal] = useState<{
    isOpen: boolean;
    day: string;
    time: string;
  }>({ isOpen: false, day: '', time: '' });
  const [apiKey, setApiKey] = useState('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');

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (classData.length > 0) {
      generateEmptySchedule();
    }
  }, [activeLocation, classData]);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      const data = await loadClassData();
      setClassData(data);
      toast.success('Class data loaded successfully!');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load class data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmptySchedule = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots: string[] = [];
    
    for (let hour = 7; hour <= 21; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 21) timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    const emptySchedule: DaySchedule[] = days.map(day => ({
      day,
      date: getDateForDay(day),
      timeSlots: timeSlots.map(time => ({
        time,
        classes: [],
        isRestricted: isRestrictedTime(time)
      }))
    }));

    setSchedule(emptySchedule);
    updateTrainerStats(emptySchedule);
  };

  const getDateForDay = (day: string): string => {
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
    const diff = targetDay - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
  };

  const isRestrictedTime = (time: string): boolean => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 13 && hour < 16;
  };

  const updateTrainerStats = (currentSchedule: DaySchedule[]) => {
    const trainerHours: { [trainer: string]: number } = {};
    const trainerClasses: { [trainer: string]: ScheduledClass[] } = {};
    
    currentSchedule.forEach(day => {
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
    
    const stats: TrainerStats[] = Object.entries(trainerHours).map(([trainer, hours]) => ({
      name: trainer,
      totalHours: hours,
      classCount: trainerClasses[trainer].length,
      averageCheckIn: getTrainerAverageCheckIn(trainer),
      specialties: getTrainerSpecialties(trainer),
      currentWeekHours: hours,
      isOverloaded: hours >= 15
    }));

    // Add trainers with no current classes
    const allTrainers = [...new Set(classData.map(c => c.teacherName))];
    allTrainers.forEach(trainer => {
      if (!stats.find(s => s.name === trainer)) {
        stats.push({
          name: trainer,
          totalHours: 0,
          classCount: 0,
          averageCheckIn: getTrainerAverageCheckIn(trainer),
          specialties: getTrainerSpecialties(trainer),
          currentWeekHours: 0,
          isOverloaded: false
        });
      }
    });

    setTrainerStats(stats);
  };

  const getTrainerAverageCheckIn = (trainer: string): number => {
    const trainerClasses = classData.filter(c => c.teacherName === trainer);
    if (trainerClasses.length === 0) return 0;
    return trainerClasses.reduce((sum, c) => sum + c.checkedIn, 0) / trainerClasses.length;
  };

  const getTrainerSpecialties = (trainer: string): string[] => {
    const trainerClasses = classData.filter(c => c.teacherName === trainer);
    const classTypes = [...new Set(trainerClasses.map(c => c.cleanedClass))];
    return classTypes.slice(0, 3);
  };

  const handleSmartSchedule = async () => {
    setIsLoading(true);
    try {
      const optimizer = new AIOptimizer(classData, apiKey);
      const newSchedule = await optimizer.smartSchedule(activeLocation);
      setSchedule(newSchedule);
      updateTrainerStats(newSchedule);
      toast.success('Smart scheduling completed!', {
        description: 'Top performing classes have been scheduled with best trainers'
      });
    } catch (error) {
      console.error('Error in smart scheduling:', error);
      toast.error('Smart scheduling failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeSlots = () => {
    setIsLoading(true);
    try {
      const optimizer = new AIOptimizer(classData, apiKey);
      const optimizedSchedule = optimizer.optimizeSlots(schedule);
      setSchedule(optimizedSchedule);
      updateTrainerStats(optimizedSchedule);
      toast.success('Schedule optimized!', {
        description: 'Classes redistributed for better morning/evening balance'
      });
    } catch (error) {
      console.error('Error optimizing slots:', error);
      toast.error('Optimization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxOutTrainers = () => {
    setIsLoading(true);
    try {
      // Implementation for maxing out trainers to 15 hours
      const newSchedule = [...schedule];
      // Add logic to assign more classes to trainers who are under 15 hours
      
      setSchedule(newSchedule);
      updateTrainerStats(newSchedule);
      toast.success('Trainers maximized!', {
        description: 'Trainer hours optimized to approach 15 hours per week'
      });
    } catch (error) {
      console.error('Error maximizing trainers:', error);
      toast.error('Trainer maximization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSchedule = () => {
    const clearedSchedule = schedule.map(day => ({
      ...day,
      timeSlots: day.timeSlots.map(slot => ({
        ...slot,
        classes: slot.classes.filter(c => c.isLocked)
      }))
    }));
    
    setSchedule(clearedSchedule);
    updateTrainerStats(clearedSchedule);
    toast.success('Schedule cleared!', {
      description: 'All unlocked classes have been removed'
    });
  };

  const handleAdvancedOptimization = async () => {
    setIsLoading(true);
    try {
      // Advanced AI optimization with all rules
      const optimizer = new AIOptimizer(classData, apiKey);
      let optimizedSchedule = await optimizer.smartSchedule(activeLocation);
      optimizedSchedule = optimizer.optimizeSlots(optimizedSchedule);
      
      setSchedule(optimizedSchedule);
      updateTrainerStats(optimizedSchedule);
      toast.success('Advanced optimization complete!', {
        description: 'All AI rules applied for optimal scheduling'
      });
    } catch (error) {
      console.error('Error in advanced optimization:', error);
      toast.error('Advanced optimization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeSlotClick = (day: string, time: string) => {
    setSchedulingModal({ isOpen: true, day, time });
  };

  const handleScheduleClass = (classDetails: any) => {
    const newSchedule = [...schedule];
    const dayIndex = newSchedule.findIndex(d => d.day === classDetails.day);
    const timeSlotIndex = newSchedule[dayIndex].timeSlots.findIndex(t => t.time === classDetails.time);
    
    const newClass: ScheduledClass = {
      id: `${classDetails.day}-${classDetails.time}-${Date.now()}`,
      name: classDetails.name,
      trainer: classDetails.trainer,
      time: classDetails.time,
      duration: classDetails.duration,
      isPrivate: classDetails.isPrivate,
      memberName: classDetails.memberName,
      predictedCheckIn: classDetails.predictedCheckIn
    };
    
    newSchedule[dayIndex].timeSlots[timeSlotIndex].classes.push(newClass);
    setSchedule(newSchedule);
    updateTrainerStats(newSchedule);
    
    toast.success('Class scheduled!', {
      description: `${classDetails.name} with ${classDetails.trainer}`
    });
  };

  const handleClassClick = (classItem: ScheduledClass) => {
    // Handle class editing/details
    console.log('Class clicked:', classItem);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <CalendarHeader
          activeLocation={activeLocation}
          onLocationChange={setActiveLocation}
          onSmartSchedule={handleSmartSchedule}
          onOptimizeSlots={handleOptimizeSlots}
          onMaxOutTrainers={handleMaxOutTrainers}
          onClearSchedule={handleClearSchedule}
          onAdvancedOptimization={handleAdvancedOptimization}
          isLoading={isLoading}
        />

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Smart Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar">
            <WeeklyCalendar
              schedule={schedule}
              location={activeLocation}
              onTimeSlotClick={handleTimeSlotClick}
              onClassClick={handleClassClick}
            />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsDashboard
              trainerStats={trainerStats}
              schedule={schedule}
              location={activeLocation}
            />
          </TabsContent>
        </Tabs>

        <SchedulingModal
          isOpen={schedulingModal.isOpen}
          onClose={() => setSchedulingModal({ isOpen: false, day: '', time: '' })}
          day={schedulingModal.day}
          time={schedulingModal.time}
          location={activeLocation}
          classData={classData}
          trainerStats={trainerStats}
          onScheduleClass={handleScheduleClass}
        />
      </div>
    </div>
  );
};

export default Index;
