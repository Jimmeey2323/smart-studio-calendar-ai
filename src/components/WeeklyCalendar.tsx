import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Download, Settings, Zap, Brain, TrendingUp, Users, MapPin, Clock, ChevronLeft, ChevronRight, Eye, EyeOff, Filter, Star, Award } from 'lucide-react';
import { ClassData, ScheduledClass, OptimizationSuggestion, TopPerformingClass, CustomTeacher } from '../types';
import ClassModal from './ClassModal';
import DayViewModal from './DayViewModal';
import SmartOptimizer from './SmartOptimizer';
import EnhancedOptimizerModal from './EnhancedOptimizerModal';
import { exportScheduleToCSV, exportScheduleToPDF } from '../utils/exportUtils';
import { aiService } from '../utils/aiService';

interface WeeklyCalendarProps {
  csvData: ClassData[];
  scheduledClasses: ScheduledClass[];
  onClassUpdate: (updatedClass: ScheduledClass) => void;
  onClassDelete: (classToDelete: ScheduledClass) => void;
  onClassAdd: (newClass: ScheduledClass) => void;
  customTeachers?: CustomTeacher[];
  isDarkMode?: boolean;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  csvData,
  scheduledClasses,
  onClassUpdate,
  onClassDelete,
  onClassAdd,
  customTeachers = [],
  isDarkMode = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [isSmartOptimizerOpen, setIsSmartOptimizerOpen] = useState(false);
  const [isEnhancedOptimizerOpen, setIsEnhancedOptimizerOpen] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [topClasses, setTopClasses] = useState<TopPerformingClass[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    showTopPerformers: false,
    showPrivateClasses: false,
    showRegularClasses: true,
    selectedTeacher: '',
    selectedClassFormat: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
      const time = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const location = 'Kwality House, Kemps Corner';

      const recommendations = await aiService.generateRecommendations(csvData, dayOfWeek, time, location);
      console.log('AI Recommendations:', recommendations);

      const topClassesData = csvData.reduce((acc: any, item) => {
        const key = `${item.cleanedClass}-${item.location}-${item.dayOfWeek}-${item.classTime}-${item.teacherName}`;
        if (!acc[key]) {
          acc[key] = {
            classFormat: item.cleanedClass,
            location: item.location,
            day: item.dayOfWeek,
            time: item.classTime,
            teacher: item.teacherName,
            avgParticipants: 0,
            avgRevenue: 0,
            frequency: 0,
            totalParticipants: 0,
            totalRevenue: 0
          };
        }
        acc[key].totalParticipants += item.participants;
        acc[key].totalRevenue += item.totalRevenue;
        acc[key].frequency++;
        return acc;
      }, {});

      const topClassesArray = Object.values(topClassesData).map((item: any) => ({
        ...item,
        avgParticipants: item.totalParticipants / item.frequency,
        avgRevenue: item.totalRevenue / item.frequency
      })).sort((a: any, b: any) => b.avgParticipants - a.avgParticipants).slice(0, 5);

      setTopClasses(topClassesArray);
    };

    fetchData();
  }, [csvData]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timesOfDay = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00'
  ];

  const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];

  const handleSlotClick = (day: string, time: string, location: string) => {
    setSelectedDay(day);
    setSelectedTime(time);
    setSelectedLocation(location);
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleClassClick = (cls: ScheduledClass) => {
    setSelectedDay(cls.day);
    setSelectedTime(cls.time);
    setSelectedLocation(cls.location);
    setEditingClass(cls);
    setIsModalOpen(true);
  };

  const handleClassSave = (savedClass: ScheduledClass) => {
    if (editingClass) {
      onClassUpdate(savedClass);
    } else {
      onClassAdd(savedClass);
    }
    setIsModalOpen(false);
    setEditingClass(null);
  };

  const handleClassDelete = (classToDelete: ScheduledClass) => {
    onClassDelete(classToDelete);
    setIsModalOpen(false);
    setEditingClass(null);
  };

  const handleDayView = (day: string, location: string) => {
    setSelectedDay(day);
    setSelectedLocation(location);
    setIsDayViewOpen(true);
  };

  const handleOptimize = async () => {
    const suggestions = await aiService.optimizeSchedule(csvData, scheduledClasses);
    setOptimizationSuggestions(suggestions);
    setIsSmartOptimizerOpen(true);
  };

  const handleApplySuggestion = (suggestion: OptimizationSuggestion) => {
    if (suggestion.type === 'teacher_change' && suggestion.originalClass && suggestion.suggestedClass) {
      onClassUpdate(suggestion.suggestedClass);
    }
    setOptimizationSuggestions(optimizationSuggestions.filter(s => s !== suggestion));
  };

  const handleExportCSV = () => {
    exportScheduleToCSV(scheduledClasses);
  };

  const handleExportPDF = () => {
    exportScheduleToPDF(scheduledClasses);
  };

  const toggleFilter = (filterKey: string) => {
    setFilterOptions(prev => ({ ...prev, [filterKey]: !prev[filterKey] }));
  };

  const filteredClasses = scheduledClasses.filter(cls => {
    if (filterOptions.showTopPerformers && !cls.isTopPerformer) return false;
    if (filterOptions.showPrivateClasses && !cls.isPrivate) return false;
    if (!filterOptions.showRegularClasses && cls.isPrivate) return false;
    if (filterOptions.selectedTeacher && `${cls.teacherFirstName} ${cls.teacherLastName}` !== filterOptions.selectedTeacher) return false;
    if (filterOptions.selectedClassFormat && cls.classFormat !== filterOptions.selectedClassFormat) return false;
    return true;
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-purple-500" />
            <h1 className="text-2xl font-semibold">Weekly Schedule</h1>
          </div>
          <div className="space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export PDF
            </button>
            <button
              onClick={handleOptimize}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <Zap className="h-4 w-4 mr-2 inline" />
              Smart Optimize
            </button>
            <button
              onClick={() => setIsEnhancedOptimizerOpen(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Brain className="h-4 w-4 mr-2 inline" />
              Enhanced Optimize
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2 inline" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} mb-4`}>
            <h3 className="text-lg font-semibold mb-2">Filter Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-500"
                    checked={filterOptions.showTopPerformers}
                    onChange={() => toggleFilter('showTopPerformers')}
                  />
                  <span className="ml-2">Show Top Performers</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-500"
                    checked={filterOptions.showPrivateClasses}
                    onChange={() => toggleFilter('showPrivateClasses')}
                  />
                  <span className="ml-2">Show Private Classes</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-purple-500"
                    checked={filterOptions.showRegularClasses}
                    onChange={() => toggleFilter('showRegularClasses')}
                  />
                  <span className="ml-2">Show Regular Classes</span>
                </label>
              </div>
              <div>
                <label htmlFor="teacherFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter by Teacher:
                </label>
                <select
                  id="teacherFilter"
                  className={`mt-1 block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  value={filterOptions.selectedTeacher}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, selectedTeacher: e.target.value }))}
                >
                  <option value="">All Teachers</option>
                  {[...new Set(scheduledClasses.map(cls => `${cls.teacherFirstName} ${cls.teacherLastName}`))]
                    .sort()
                    .map(teacher => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="classFormatFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter by Class Format:
                </label>
                <select
                  id="classFormatFilter"
                  className={`mt-1 block w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  value={filterOptions.selectedClassFormat}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, selectedClassFormat: e.target.value }))}
                >
                  <option value="">All Formats</option>
                  {[...new Set(scheduledClasses.map(cls => cls.classFormat))]
                    .sort()
                    .map(format => (
                      <option key={format} value={format}>{format}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
          <thead className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} sticky top-0 z-10`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Time
              </th>
              {daysOfWeek.map(day => (
                <th key={day} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
            {timesOfDay.map(time => (
              <tr key={time}>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {time}
                </td>
                {daysOfWeek.map(day => (
                  <td key={`${day}-${time}`} className="px-6 py-4 whitespace-nowrap text-sm">
                    {locations.map(location => {
                      const classesInSlot = filteredClasses.filter(
                        cls => cls.day === day && cls.time === time && cls.location === location
                      );

                      if (classesInSlot.length === 0) {
                        return (
                          <button
                            key={location}
                            onClick={() => handleSlotClick(day, time, location)}
                            className={`block w-full py-2 px-3 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            <Plus className="h-4 w-4 inline mr-1" />
                            <span className="text-xs">{location.split(',')[0]}</span>
                          </button>
                        );
                      }

                      return classesInSlot.map(cls => (
                        <div key={cls.id} className="mb-1">
                          <button
                            onClick={() => handleClassClick(cls)}
                            className={`block w-full py-2 px-3 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'} ${cls.isTopPerformer ? 'font-semibold' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm">{cls.classFormat}</div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {cls.teacherFirstName} {cls.teacherLastName}
                                </div>
                              </div>
                              {cls.isTopPerformer && <Star className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </button>
                        </div>
                      ));
                    })}
                    {locations.length > 0 && (
                      <button
                        onClick={() => handleDayView(day, locations[0])}
                        className={`block w-full py-1 px-2 rounded-lg text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        <span className="text-xs">View All</span>
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        csvData={csvData}
        day={selectedDay}
        time={selectedTime}
        location={selectedLocation}
        existingClass={editingClass}
        onSave={handleClassSave}
        onDelete={handleClassDelete}
        customTeachers={customTeachers}
        isDarkMode={isDarkMode}
      />

      <DayViewModal
        isOpen={isDayViewOpen}
        onClose={() => setIsDayViewOpen(false)}
        day={selectedDay}
        location={selectedLocation}
        csvData={csvData}
        scheduledClasses={scheduledClasses}
        onSlotClick={handleSlotClick}
      />

      <SmartOptimizer
        isOpen={isSmartOptimizerOpen}
        onClose={() => setIsSmartOptimizerOpen(false)}
        suggestions={optimizationSuggestions}
        onApply={handleApplySuggestion}
        isDarkMode={isDarkMode}
      />

      <EnhancedOptimizerModal
        isOpen={isEnhancedOptimizerOpen}
        onClose={() => setIsEnhancedOptimizerOpen(false)}
        csvData={csvData}
        currentSchedule={scheduledClasses}
        onOptimize={(optimizedSchedule) => {
          optimizedSchedule.forEach(updatedClass => {
            const existingClassIndex = scheduledClasses.findIndex(cls => cls.id === updatedClass.id);
            if (existingClassIndex !== -1) {
              onClassUpdate(updatedClass);
            } else {
              onClassAdd(updatedClass);
            }
          });
        }}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default WeeklyCalendar;
