
import React from 'react';
import { DaySchedule, ScheduledClass } from '../types/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Users, Clock } from 'lucide-react';

interface WeeklyCalendarProps {
  schedule: DaySchedule[];
  location: string;
  onTimeSlotClick: (day: string, time: string) => void;
  onClassClick: (classItem: ScheduledClass) => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  schedule,
  location,
  onTimeSlotClick,
  onClassClick
}) => {
  const timeSlots = schedule[0]?.timeSlots.map(slot => slot.time) || [];
  
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {location} - Weekly Schedule
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header */}
          <div className="grid grid-cols-8 bg-gray-50">
            <div className="p-3 font-semibold text-gray-600 border-b border-r">Time</div>
            {schedule.map(day => (
              <div key={day.day} className="p-3 font-semibold text-gray-800 border-b border-r text-center">
                <div>{day.day}</div>
                <div className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 border-b">
              <div className={`p-3 font-medium border-r ${
                schedule[0]?.timeSlots.find(slot => slot.time === time)?.isRestricted 
                  ? 'bg-red-50 text-red-600' 
                  : 'bg-gray-50 text-gray-700'
              }`}>
                {time}
              </div>
              
              {schedule.map(day => {
                const slot = day.timeSlots.find(s => s.time === time);
                return (
                  <div 
                    key={`${day.day}-${time}`}
                    className={`p-2 border-r min-h-[80px] cursor-pointer transition-colors hover:bg-blue-50 ${
                      slot?.isRestricted ? 'bg-red-25 opacity-50' : ''
                    }`}
                    onClick={() => !slot?.isRestricted && onTimeSlotClick(day.day, time)}
                  >
                    {slot?.classes.map(classItem => (
                      <div
                        key={classItem.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClassClick(classItem);
                        }}
                        className={`
                          mb-1 p-2 rounded-lg text-xs cursor-pointer transition-all hover:scale-105 shadow-sm
                          ${classItem.isPrivate 
                            ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white' 
                            : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
                          }
                        `}
                      >
                        <div className="font-semibold truncate flex items-center gap-1">
                          {classItem.isLocked && <Lock className="w-3 h-3" />}
                          {classItem.name}
                        </div>
                        <div className="text-blue-100 truncate">{classItem.trainer}</div>
                        {classItem.predictedCheckIn && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3" />
                            <span>{classItem.predictedCheckIn}</span>
                          </div>
                        )}
                        {classItem.isPrivate && classItem.memberName && (
                          <div className="text-pink-100 text-xs">Private: {classItem.memberName}</div>
                        )}
                      </div>
                    ))}
                    
                    {slot?.isRestricted && (
                      <div className="text-center text-red-500 text-xs font-medium">
                        Restricted Hours
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
