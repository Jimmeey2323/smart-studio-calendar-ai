
import React from 'react';
import { ClassData, ScheduledClass } from '../types';

interface DayViewModalWithThemeProps {
  isOpen: boolean;
  onClose: () => void;
  day: string;
  location: string;
  csvData: ClassData[];
  scheduledClasses: ScheduledClass[];
  onSlotClick: (day: string, time: string, location: string) => void;
  theme: any;
}

const DayViewModalWithTheme: React.FC<DayViewModalWithThemeProps> = ({
  isOpen,
  onClose,
  day,
  location,
  csvData,
  scheduledClasses,
  onSlotClick,
  theme
}) => {
  if (!isOpen) return null;

  // Filter classes for this specific day and location
  const dayClasses = scheduledClasses.filter(
    cls => cls.day === day && cls.location === location
  );

  // Time slots from 7:00 to 21:00
  const timeSlots = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (let minutes = 0; minutes < 60; minutes += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${theme?.isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{day} - {location}</h2>
          <button
            onClick={onClose}
            className={`${theme?.isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} text-xl font-bold`}
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2">
          {timeSlots.map(time => {
            const existingClass = dayClasses.find(cls => cls.time === time);
            
            return (
              <div
                key={time}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  existingClass
                    ? `${theme?.isDark ? 'bg-blue-900 border-blue-700' : 'bg-blue-100 border-blue-300'}`
                    : `${theme?.isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`
                }`}
                onClick={() => onSlotClick(day, time, location)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{time}</span>
                  {existingClass && (
                    <div className="text-sm">
                      <span className="font-semibold">{existingClass.classFormat}</span>
                      <span className="ml-2 text-gray-600">
                        {existingClass.teacherFirstName} {existingClass.teacherLastName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayViewModalWithTheme;
