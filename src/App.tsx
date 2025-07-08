
import React, { useState, useEffect } from 'react';
import { Upload, Calendar, Brain, Users, Clock, AlertTriangle, Settings, Star, Lock, Unlock, Plus, Download, Eye, Printer, RotateCcw, RotateCw, Trash2, Filter, BarChart3, TrendingUp, MapPin, UserPlus, Sun, Moon, Zap, Target, Sparkles, Palette } from 'lucide-react';
import CSVUpload from './components/CSVUpload';
import WeeklyCalendar from './components/WeeklyCalendar';
import ClassModal from './components/ClassModal';
import TeacherHourTracker from './components/TeacherHourTracker';
import SmartOptimizer from './components/SmartOptimizer';
import AISettings from './components/AISettings';
import ExportModal from './components/ExportModal';
import StudioSettings from './components/StudioSettings';
import MonthlyView from './components/MonthlyView';
import YearlyView from './components/YearlyView';
import AnalyticsView from './components/AnalyticsView';
import DailyAIOptimizer from './components/DailyAIOptimizer';
import EnhancedOptimizerModal from './components/EnhancedOptimizerModal';
import ThemeSelector from './components/ThemeSelector';
import { ClassData, ScheduledClass, TeacherHours, CustomTeacher, TeacherAvailability, PriorityClass } from './types';
import { getTopPerformingClasses, getClassDuration, calculateTeacherHours, getClassCounts, validateTeacherHours, getTeacherSpecialties, getClassAverageForSlot, getBestTeacherForClass, generateIntelligentSchedule, getDefaultTopClasses, fillEmptySlots } from './utils/classUtils';
import { aiService } from './utils/aiService';
import { saveCSVData, loadCSVData, saveScheduledClasses, loadScheduledClasses, saveCustomTeachers, loadCustomTeachers, saveTeacherAvailability, loadTeacherAvailability } from './utils/dataStorage';
import { loadCSVFiles, getPriorityClassFormats, getPriorityClassSchedules, isPriorityClass, getMustIncludeClasses, getBestTrainerForClass, getOptimalScheduleForClass } from './utils/csvLoader';

// Minimalist theme definitions with black/white backgrounds
const THEMES = {
  dark: {
    name: 'Dark Minimalist',
    bg: 'bg-black',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    card: 'bg-gray-900 border-gray-800',
    cardHover: 'hover:bg-gray-800',
    button: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700',
    buttonPrimary: 'bg-white text-black hover:bg-gray-100',
    accent: 'text-gray-300',
    border: 'border-gray-800'
  },
  light: {
    name: 'Light Minimalist',
    bg: 'bg-white',
    text: 'text-black',
    textSecondary: 'text-gray-600',
    card: 'bg-gray-50 border-gray-200',
    cardHover: 'hover:bg-gray-100',
    button: 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-300',
    buttonPrimary: 'bg-black text-white hover:bg-gray-800',
    accent: 'text-gray-700',
    border: 'border-gray-200'
  },
  darkPurple: {
    name: 'Dark Purple',
    bg: 'bg-black',
    text: 'text-white',
    textSecondary: 'text-purple-300',
    card: 'bg-gray-900 border-purple-900',
    cardHover: 'hover:bg-gray-800',
    button: 'bg-purple-900 hover:bg-purple-800 text-white border border-purple-800',
    buttonPrimary: 'bg-purple-600 text-white hover:bg-purple-500',
    accent: 'text-purple-400',
    border: 'border-purple-900'
  },
  lightBlue: {
    name: 'Light Blue',
    bg: 'bg-white',
    text: 'text-black',
    textSecondary: 'text-blue-600',
    card: 'bg-blue-50 border-blue-200',
    cardHover: 'hover:bg-blue-100',
    button: 'bg-blue-100 hover:bg-blue-200 text-black border border-blue-300',
    buttonPrimary: 'bg-blue-600 text-white hover:bg-blue-500',
    accent: 'text-blue-700',
    border: 'border-blue-200'
  },
  darkGreen: {
    name: 'Dark Green',
    bg: 'bg-black',
    text: 'text-white',
    textSecondary: 'text-green-300',
    card: 'bg-gray-900 border-green-900',
    cardHover: 'hover:bg-gray-800',
    button: 'bg-green-900 hover:bg-green-800 text-white border border-green-800',
    buttonPrimary: 'bg-green-600 text-white hover:bg-green-500',
    accent: 'text-green-400',
    border: 'border-green-900'
  }
};

function App() {
  const [csvData, setCsvData] = useState<ClassData[]>([]);
  const [priorityClasses, setPriorityClasses] = useState<PriorityClass[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('calendar');
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [scheduleHistory, setScheduleHistory] = useState<ScheduledClass[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string; location: string } | null>(null);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [teacherHours, setTeacherHours] = useState<TeacherHours>({});
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [showEnhancedOptimizer, setShowEnhancedOptimizer] = useState(false);
  const [showDailyOptimizer, setShowDailyOptimizer] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showStudioSettings, setShowStudioSettings] = useState(false);
  const [showTeacherCards, setShowTeacherCards] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isPopulatingTopClasses, setIsPopulatingTopClasses] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isFillingSlots, setIsFillingSlots] = useState(false);
  const [lockedClasses, setLockedClasses] = useState<Set<string>>(new Set());
  const [lockedTeachers, setLockedTeachers] = useState<Set<string>>(new Set());
  const [classesLocked, setClassesLocked] = useState(false);
  const [teachersLocked, setTeachersLocked] = useState(false);
  const [customTeachers, setCustomTeachers] = useState<CustomTeacher[]>([]);
  const [teacherAvailability, setTeacherAvailability] = useState<TeacherAvailability>({});
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('dark');
  const [optimizationIteration, setOptimizationIteration] = useState(0);
  const [allowRestrictedScheduling, setAllowRestrictedScheduling] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    showTopPerformers: true,
    showPrivateClasses: true,
    showRegularClasses: true,
    selectedTeacher: '',
    selectedClassFormat: ''
  });

  const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];

  const views = [
    { id: 'calendar', name: 'Weekly Calendar', icon: Calendar },
    { id: 'monthly', name: 'Monthly View', icon: BarChart3 },
    { id: 'yearly', name: 'Yearly View', icon: TrendingUp },
    { id: 'analytics', name: 'Analytics', icon: Eye }
  ];

  const theme = THEMES[currentTheme];

  // Load data on app initialization
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoadingData(true);
      setLoadingError(null);

      try {
        // Load CSV files first
        console.log('🚀 Initializing app with CSV data...');
        const csvResult = await loadCSVFiles();
        
        if (csvResult.errors.length > 0) {
          console.warn('CSV loading warnings:', csvResult.errors);
          setLoadingError(csvResult.errors.join('; '));
        }

        if (csvResult.scoringData.length > 0) {
          setCsvData(csvResult.scoringData);
          setPriorityClasses(csvResult.priorityClasses);
          
          // Set active tab to first location with data
          const firstLocation = locations.find(loc => 
            csvResult.scoringData.some((item: ClassData) => item.location === loc)
          ) || locations[0];
          setActiveTab(firstLocation);
          
          console.log(`✅ Loaded ${csvResult.scoringData.length} scoring records and ${csvResult.priorityClasses.length} priority classes`);
        } else {
          // Fallback to localStorage if CSV loading fails
          console.log('🔄 Falling back to localStorage data...');
          const savedCsvData = loadCSVData();
          if (savedCsvData.length > 0) {
            setCsvData(savedCsvData);
            const firstLocation = locations.find(loc => 
              savedCsvData.some((item: ClassData) => item.location === loc)
            ) || locations[0];
            setActiveTab(firstLocation);
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoadingError(error instanceof Error ? error.message : 'Unknown error occurred');
        
        // Fallback to localStorage
        const savedCsvData = loadCSVData();
        if (savedCsvData.length > 0) {
          setCsvData(savedCsvData);
          const firstLocation = locations.find(loc => 
            savedCsvData.some((item: ClassData) => item.location === loc)
          ) || locations[0];
          setActiveTab(firstLocation);
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    initializeApp();

    // Load other settings
    const savedProvider = localStorage.getItem('ai_provider');
    const savedKey = localStorage.getItem('ai_key');
    const savedEndpoint = localStorage.getItem('ai_endpoint');
    const savedTheme = localStorage.getItem('app_theme') as keyof typeof THEMES;
    const savedRestrictedSetting = localStorage.getItem('allow_restricted_scheduling');

    // Load AI settings
    if (savedProvider && savedKey && savedEndpoint) {
      aiService.setProvider({
        name: savedProvider,
        key: savedKey,
        endpoint: savedEndpoint
      });
    }

    // Load theme
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }

    // Load restricted scheduling setting
    if (savedRestrictedSetting) {
      setAllowRestrictedScheduling(savedRestrictedSetting === 'true');
    }

    const savedScheduledClasses = loadScheduledClasses();
    const savedCustomTeachers = loadCustomTeachers();
    const savedTeacherAvailability = loadTeacherAvailability();

    if (savedScheduledClasses.length > 0) {
      setScheduledClasses(savedScheduledClasses);
      setTeacherHours(calculateTeacherHours(savedScheduledClasses));
    }

    if (savedCustomTeachers.length > 0) {
      setCustomTeachers(savedCustomTeachers);
    }

    if (Object.keys(savedTeacherAvailability).length > 0) {
      setTeacherAvailability(savedTeacherAvailability);
    }
  }, []);

  // Auto-save data when it changes
  useEffect(() => {
    if (csvData.length > 0) {
      saveCSVData(csvData);
    }
  }, [csvData]);

  useEffect(() => {
    saveScheduledClasses(scheduledClasses);
  }, [scheduledClasses]);

  useEffect(() => {
    saveCustomTeachers(customTeachers);
  }, [customTeachers]);

  useEffect(() => {
    saveTeacherAvailability(teacherAvailability);
  }, [teacherAvailability]);

  // Save to history when schedule changes
  useEffect(() => {
    if (scheduledClasses.length > 0) {
      const newHistory = scheduleHistory.slice(0, historyIndex + 1);
      newHistory.push([...scheduledClasses]);
      setScheduleHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [scheduledClasses]);

  const handleThemeChange = (newTheme: keyof typeof THEMES) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const handleDataUpload = (data: ClassData[]) => {
    console.log('Data uploaded to App:', data.length, 'records');
    setCsvData(data);
    if (data.length > 0) {
      const firstLocation = locations.find(loc => 
        data.some(item => item.location === loc)
      ) || locations[0];
      setActiveTab(firstLocation);
    }
  };

  const handleSlotClick = (day: string, time: string, location: string) => {
    setSelectedSlot({ day, time, location });
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleClassEdit = (classData: ScheduledClass) => {
    setEditingClass(classData);
    setSelectedSlot({ day: classData.day, time: classData.time, location: classData.location });
    setIsModalOpen(true);
  };

  const handleClassSchedule = (classData: ScheduledClass) => {
    if (editingClass) {
      // Update existing class
      setScheduledClasses(prev => 
        prev.map(cls => cls.id === editingClass.id ? classData : cls)
      );
    } else {
      // Validate teacher hours before scheduling
      const validation = validateTeacherHours(scheduledClasses, classData);
      
      if (!validation.isValid && !validation.canOverride) {
        alert(validation.error);
        return;
      }

      // Handle override scenario
      if (validation.canOverride && validation.warning) {
        const proceed = confirm(`${validation.warning}\n\nDo you want to override this limit and proceed anyway?`);
        if (!proceed) return;
      } else if (validation.warning && !validation.canOverride) {
        const proceed = confirm(`${validation.warning}\n\nDo you want to proceed?`);
        if (!proceed) return;
      }

      setScheduledClasses(prev => [...prev, classData]);
    }
    
    // Update teacher hours
    setTeacherHours(calculateTeacherHours(scheduledClasses));
    setIsModalOpen(false);
    setEditingClass(null);
  };

  const handleOptimizedSchedule = (optimizedClasses: ScheduledClass[]) => {
    // Validate all teacher hours in optimized schedule
    const teacherHoursCheck: Record<string, number> = {};
    const invalidTeachers: string[] = [];

    optimizedClasses.forEach(cls => {
      const teacherKey = `${cls.teacherFirstName} ${cls.teacherLastName}`;
      teacherHoursCheck[teacherKey] = parseFloat(((teacherHoursCheck[teacherKey] || 0) + parseFloat(cls.duration || '1')).toFixed(1));
    });

    Object.entries(teacherHoursCheck).forEach(([teacher, hours]) => {
      if (hours > 15) {
        invalidTeachers.push(`${teacher}: ${hours.toFixed(1)}h`);
      }
    });

    if (invalidTeachers.length > 0) {
      const proceed = confirm(`The following teachers would exceed 15 hours:\n${invalidTeachers.join('\n')}\n\nDo you want to override these limits and apply the schedule anyway?`);
      if (!proceed) return;
    }

    setScheduledClasses(optimizedClasses);
    setTeacherHours(teacherHoursCheck);
    setShowOptimizer(false);
    setShowEnhancedOptimizer(false);
    setShowDailyOptimizer(false);
  };

  const handleAutoPopulateTopClasses = async (data: ClassData[] = csvData) => {
    // Validate that data is an array
    if (!Array.isArray(data)) {
      alert('Invalid data format. Please ensure CSV data is properly loaded.');
      return;
    }

    if (data.length === 0) {
      alert('Please upload CSV data first');
      return;
    }

    setIsPopulatingTopClasses(true);

    try {
      console.log('🚀 Starting accurate top classes population using Classes.csv priority data...');
      
      // Clear existing schedule first
      setScheduledClasses([]);
      
      // Get priority class schedules with specific day/time/trainer combinations
      const prioritySchedules = getPriorityClassSchedules(priorityClasses);
      
      console.log(`📋 Found ${prioritySchedules.length} priority class schedules from Classes.csv`);
      
      const newScheduledClasses: ScheduledClass[] = [];
      const trainerTimeSlots = new Map<string, Set<string>>(); // Track trainer availability
      
      // Sort priority schedules by priority (highest first)
      const sortedPrioritySchedules = prioritySchedules.sort((a, b) => b.priority - a.priority);
      
      for (const prioritySchedule of sortedPrioritySchedules) {
        const {
          className,
          dayOfWeek,
          classTime,
          location,
          trainerName,
          mustInclude
        } = prioritySchedule;
        
        // Parse trainer name
        const nameParts = trainerName.split(' ');
        const teacherFirstName = nameParts[0] || '';
        const teacherLastName = nameParts.slice(1).join(' ') || '';
        
        // Create time slot key for conflict checking
        const timeSlotKey = `${trainerName}-${dayOfWeek}-${classTime}`;
        
        // Check for trainer conflicts
        if (!trainerTimeSlots.has(trainerName)) {
          trainerTimeSlots.set(trainerName, new Set());
        }
        
        const trainerSlots = trainerTimeSlots.get(trainerName)!;
        const slotKey = `${dayOfWeek}-${classTime}`;
        
        if (trainerSlots.has(slotKey)) {
          console.log(`⚠️ Skipping ${className} - trainer ${trainerName} already scheduled at ${dayOfWeek} ${classTime}`);
          continue;
        }
        
        // Find matching data from CSV for this specific combination
        const matchingData = data.find(item => 
          item.cleanedClass === className &&
          item.dayOfWeek === dayOfWeek &&
          item.classTime === classTime &&
          item.location === location &&
          item.teacherName === trainerName
        );
        
        if (!matchingData) {
          console.log(`⚠️ No matching CSV data found for ${className} with ${trainerName} on ${dayOfWeek} ${classTime}`);
          continue;
        }
        
        // Create scheduled class with accurate data
        const scheduledClass: ScheduledClass = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          day: dayOfWeek,
          time: classTime,
          location: location,
          classFormat: className,
          teacherFirstName,
          teacherLastName,
          duration: '1', // Default 1 hour
          participants: matchingData.avgAttendanceWithEmpty || 0,
          revenue: matchingData.revenuePerClass || 0,
          isTopPerformer: true,
          isPrivate: false,
          adjustedScore: matchingData.adjustedScore || 0,
          avgAttendance: matchingData.avgAttendanceWithEmpty || 0,
          fillRate: matchingData.avgFillRate || 0
        };
        
        newScheduledClasses.push(scheduledClass);
        trainerSlots.add(slotKey);
        
        console.log(`✅ Scheduled: ${className} with ${trainerName} on ${dayOfWeek} ${classTime} at ${location}`);
      }
      
      console.log(`✅ Top classes population complete: ${newScheduledClasses.length} classes scheduled`);

      if (newScheduledClasses.length > 0) {
        setScheduledClasses(newScheduledClasses);
        setTeacherHours(calculateTeacherHours(newScheduledClasses));
        
        // Calculate summary stats
        const teacherHoursCheck = calculateTeacherHours(newScheduledClasses);
        const totalTeachers = Object.keys(teacherHoursCheck).length;
        const avgRevenue = newScheduledClasses.reduce((sum, cls) => sum + (cls.revenue || 0), 0) / newScheduledClasses.length;
        const avgAttendance = newScheduledClasses.reduce((sum, cls) => sum + (cls.participants || 0), 0) / newScheduledClasses.length;
        
        alert(`✅ Top Classes Populated Successfully!

📊 Results:
• ${newScheduledClasses.length} top-performing classes scheduled
• ${totalTeachers} teachers assigned
• Average revenue per class: ₹${avgRevenue.toFixed(0)}
• Average attendance: ${avgAttendance.toFixed(1)} participants
• All classes scheduled at their optimal day/time from Classes.csv

🎯 Features Applied:
• Exact day/time combinations from Classes.csv
• Best trainer assignments from historical data
• No trainer scheduling conflicts
• Priority-based scheduling (highest performing first)
• Must-include classes prioritized`);
      } else {
        alert('No classes could be scheduled. Please check your Classes.csv data.');
      }

    } catch (error) {
      console.error('Error populating top classes:', error);
      alert('Error populating top classes. Please try again.');
    } finally {
      setIsPopulatingTopClasses(false);
    }
  };

  const handleAutoOptimize = async () => {
    if (csvData.length === 0) {
      alert('Please upload CSV data first');
      return;
    }

    setIsOptimizing(true);

    try {
      console.log(`🚀 Starting optimization iteration #${optimizationIteration + 1} using Scoring.csv data...`);
      
      // Get priority class formats
      const priorityClassFormats = getPriorityClassFormats(priorityClasses);
      const mustIncludeClasses = getMustIncludeClasses(priorityClasses);
      
      // Enhanced AI optimization with iteration-based variation
      const optimizedSchedule = await generateIntelligentSchedule(csvData, customTeachers, {
        prioritizeTopPerformers: true,
        balanceShifts: true,
        optimizeTeacherHours: true,
        respectTimeRestrictions: true,
        minimizeTrainersPerShift: true,
        iteration: optimizationIteration + 1, // Use next iteration number
        optimizationType: optimizationIteration % 3 === 0 ? 'revenue' : optimizationIteration % 3 === 1 ? 'attendance' : 'balanced',
        targetTeacherHours: 15,
        priorityClassFormats,
        mustIncludeClasses: mustIncludeClasses.map(c => c.className)
      });
      
      console.log(`🎯 Optimization iteration #${optimizationIteration + 1} complete: ${optimizedSchedule.length} classes scheduled`);
      
      // Calculate final teacher hours and stats
      const teacherHoursCheck = calculateTeacherHours(optimizedSchedule);
      const teachersAt15h = Object.values(teacherHoursCheck).filter(h => h >= 14.5).length;
      const totalTeachers = Object.keys(teacherHoursCheck).length;
      const totalRevenue = optimizedSchedule.reduce((sum, cls) => sum + (cls.revenue || 0), 0);
      const totalAttendance = optimizedSchedule.reduce((sum, cls) => sum + (cls.participants || 0), 0);

      setOptimizationIteration(prev => prev + 1);
      setScheduledClasses(optimizedSchedule);
      setTeacherHours(teacherHoursCheck);

      const optimizationType = (optimizationIteration) % 3 === 0 ? 'Revenue-Focused' : (optimizationIteration) % 3 === 1 ? 'Attendance-Focused' : 'Balanced';

      // Show optimization results
      alert(`🎯 Optimization Iteration #${optimizationIteration + 1} Complete!

📊 ${optimizationType} Strategy Results:
• ${optimizedSchedule.length} classes scheduled
• ${totalTeachers} teachers utilized
• ${teachersAt15h} teachers at 15h target (${((teachersAt15h/totalTeachers)*100).toFixed(0)}%)
• Total revenue: ₹${totalRevenue.toFixed(0)}
• Total attendance: ${totalAttendance} participants

✅ Features Applied:
• Scoring.csv data utilized for optimization
• Teacher hour maximization
• Class mix balancing
• Performance-based assignments
• Comprehensive constraint compliance`);

    } catch (error) {
      console.error('Error optimizing schedule:', error);
      alert('Error optimizing schedule. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFillAdditionalSlots = async () => {
    if (csvData.length === 0) {
      alert('Please upload CSV data first');
      return;
    }

    setIsFillingSlots(true);

    try {
      console.log('🔄 Filling 5 additional slots to maximize trainer hours...');
      
      // Use enhanced fillEmptySlots to add exactly 5 more classes
      const enhancedSchedule = await fillEmptySlots(csvData, scheduledClasses, customTeachers);
      
      console.log(`✅ Additional slots filled: ${enhancedSchedule.length - scheduledClasses.length} new classes added`);
      
      if (enhancedSchedule.length > scheduledClasses.length) {
        setScheduledClasses(enhancedSchedule);
        setTeacherHours(calculateTeacherHours(enhancedSchedule));
        
        const newClasses = enhancedSchedule.length - scheduledClasses.length;
        const teacherHoursCheck = calculateTeacherHours(enhancedSchedule);
        const teachersAt15h = Object.values(teacherHoursCheck).filter(h => h >= 14.5).length;
        const totalTeachers = Object.keys(teacherHoursCheck).length;
        
        alert(`✅ Additional Slots Filled Successfully!

📊 Results:
• ${newClasses} new classes added (targeting 5 per click)
• ${enhancedSchedule.length} total classes scheduled
• ${teachersAt15h} teachers now at 15h target
• Optimized trainer hour distribution
• Balanced class mix maintained

🎯 Features Applied:
• Best class-teacher combinations used
• Studio availability respected
• Trainer constraints maintained
• Class mix balanced across days
• Inactive teachers excluded
• New trainer restrictions applied`);
      } else {
        alert('All available slots are already optimally filled. No additional classes could be added while respecting constraints.');
      }

    } catch (error) {
      console.error('Error filling additional slots:', error);
      alert('Error filling additional slots. Please try again.');
    } finally {
      setIsFillingSlots(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setScheduledClasses(scheduleHistory[historyIndex - 1]);
      setTeacherHours(calculateTeacherHours(scheduleHistory[historyIndex - 1]));
    }
  };

  const handleRedo = () => {
    if (historyIndex < scheduleHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setScheduledClasses(scheduleHistory[historyIndex + 1]);
      setTeacherHours(calculateTeacherHours(scheduleHistory[historyIndex + 1]));
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all scheduled classes?')) {
      setScheduledClasses([]);
      setTeacherHours({});
      setLockedClasses(new Set());
      setLockedTeachers(new Set());
      setClassesLocked(false);
      setTeachersLocked(false);
    }
  };

  const toggleClassLock = () => {
    setClassesLocked(!classesLocked);
    if (!classesLocked) {
      const classIds = new Set(scheduledClasses.map(cls => cls.id));
      setLockedClasses(classIds);
    } else {
      setLockedClasses(new Set());
    }
  };

  const toggleTeacherLock = () => {
    setTeachersLocked(!teachersLocked);
    if (!teachersLocked) {
      const teacherNames = new Set(scheduledClasses.map(cls => `${cls.teacherFirstName} ${cls.teacherLastName}`));
      setLockedTeachers(teacherNames);
    } else {
      setLockedTeachers(new Set());
    }
  };

  const classCounts = getClassCounts(scheduledClasses);

  // Show upload screen if no data
  if (isLoadingData) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="relative mb-6">
            <Sparkles className={`h-16 w-16 ${theme.accent} animate-pulse mx-auto`} />
          </div>
          <h1 className={`text-3xl font-bold mb-4 ${theme.text}`}>
            Loading Smart Class Scheduler
          </h1>
          <p className={`text-lg ${theme.textSecondary} mb-4`}>
            Loading Scoring.csv and Classes.csv data...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (csvData.length === 0) {
    if (loadingError) {
      return (
        <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
          <div className="text-center max-w-2xl mx-auto p-6">
            <AlertTriangle className={`h-16 w-16 text-red-400 mx-auto mb-6`} />
            <h1 className={`text-3xl font-bold mb-4 ${theme.text}`}>
              Data Loading Error
            </h1>
            <p className={`text-lg ${theme.textSecondary} mb-6`}>
              Failed to load CSV files: {loadingError}
            </p>
            <p className={`text-sm ${theme.textSecondary} mb-6`}>
              Please ensure Scoring.csv and Classes.csv are available in the public folder, or upload your data manually.
            </p>
            <button
              onClick={() => window.location.reload()}
              className={`${theme.buttonPrimary} px-6 py-3 rounded-xl font-medium mr-4`}
            >
              Retry Loading
            </button>
          </div>
        </div>
      );
    }
    return <CSVUpload onDataUpload={handleDataUpload} theme={theme} />;
  }

  const renderMainContent = () => {
    switch (activeView) {
      case 'monthly':
        return <MonthlyView scheduledClasses={scheduledClasses} csvData={csvData} />;
      case 'yearly':
        return <YearlyView scheduledClasses={scheduledClasses} csvData={csvData} />;
      case 'analytics':
        return <AnalyticsView scheduledClasses={scheduledClasses} csvData={csvData} />;
      default:
        return (
          <>
            {/* Location Tabs */}
            <div className={`flex space-x-1 mb-6 rounded-2xl p-1 ${theme.card} shadow-lg`}>
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => setActiveTab(location)}
                  className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === location
                      ? `${theme.buttonPrimary} shadow-lg transform scale-105`
                      : `${theme.textSecondary} ${theme.cardHover}`
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {location.split(',')[0]}
                  </div>
                </button>
              ))}
            </div>

            {/* Teacher Hours Tracker - Collapsible */}
            <div className="mb-6">
              <TeacherHourTracker 
                teacherHours={teacherHours} 
                theme={theme}
                showCards={showTeacherCards}
                onToggleCards={() => setShowTeacherCards(!showTeacherCards)}
              />
            </div>

            {/* Weekly Calendar */}
            {activeTab && (
              <WeeklyCalendar
                location={activeTab}
                csvData={csvData}
                scheduledClasses={scheduledClasses.filter(cls => {
                  if (!filterOptions.showTopPerformers && cls.isTopPerformer) return false;
                  if (!filterOptions.showPrivateClasses && cls.isPrivate) return false;
                  if (!filterOptions.showRegularClasses && !cls.isTopPerformer && !cls.isPrivate) return false;
                  if (filterOptions.selectedTeacher && `${cls.teacherFirstName} ${cls.teacherLastName}` !== filterOptions.selectedTeacher) return false;
                  if (filterOptions.selectedClassFormat && cls.classFormat !== filterOptions.selectedClassFormat) return false;
                  return true;
                })}
                onSlotClick={handleSlotClick}
                onClassEdit={handleClassEdit}
                lockedClasses={lockedClasses}
                theme={theme}
                allowRestrictedScheduling={allowRestrictedScheduling}
              />
            )}
          </>
        );
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Sleek Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="relative mr-4">
              <Sparkles className={`h-12 w-12 ${theme.accent}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${theme.text}`}>
                Smart Class Scheduler
              </h1>
              <p className={theme.textSecondary}>AI-powered optimization using Classes.csv and Scoring.csv data</p>
            </div>
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowThemeSelector(true)}
              className={`p-3 rounded-xl transition-all duration-200 ${theme.button} hover:scale-105`}
              title="Change Theme"
            >
              <Palette className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* History Controls */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme.button} hover:scale-105`}
              title="Undo"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Undo</span>
            </button>

            <button
              onClick={handleRedo}
              disabled={historyIndex >= scheduleHistory.length - 1}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme.button} hover:scale-105`}
              title="Redo"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Redo</span>
            </button>

            <button
              onClick={handleClearAll}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 bg-red-600 text-white hover:bg-red-700 hover:scale-105`}
              title="Clear All"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Clear</span>
            </button>

            <button
              onClick={() => handleAutoPopulateTopClasses(csvData)}
              disabled={isPopulatingTopClasses}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bg-yellow-600 text-white hover:bg-yellow-700`}
              title="Populate ONLY top classes from Classes.csv at exact day/time with best trainers"
            >
              {isPopulatingTopClasses ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Star className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">Top Classes (CSV)</span>
            </button>
            
            <button
              onClick={handleAutoOptimize}
              disabled={isOptimizing}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bg-green-600 text-white hover:bg-green-700`}
              title="Generate new optimization iteration using Scoring.csv data to maximize trainer hours"
            >
              {isOptimizing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">Optimize (Iter #{optimizationIteration + 1})</span>
            </button>

            {/* Enhanced Fill Additional Slots Button */}
            <button
              onClick={handleFillAdditionalSlots}
              disabled={isFillingSlots}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bg-orange-600 text-white hover:bg-orange-700`}
              title="Add 5 new classes per click to maximize trainer hours"
            >
              {isFillingSlots ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">Fill Additional Slots (+5)</span>
            </button>

            <button
              onClick={() => setShowEnhancedOptimizer(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-indigo-600 text-white hover:bg-indigo-700`}
              title="Advanced AI with multiple optimization strategies"
            >
              <Target className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Advanced AI</span>
            </button>

            <button
              onClick={() => setShowDailyOptimizer(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-purple-600 text-white hover:bg-purple-700`}
            >
              <Zap className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Daily AI</span>
            </button>

            <button
              onClick={toggleClassLock}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
                classesLocked 
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : theme.button
              }`}
            >
              {classesLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
              <span className="text-sm font-medium">{classesLocked ? 'Unlock' : 'Lock'} Classes</span>
            </button>

            <button
              onClick={toggleTeacherLock}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
                teachersLocked 
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : theme.button
              }`}
            >
              {teachersLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
              <span className="text-sm font-medium">{teachersLocked ? 'Unlock' : 'Lock'} Teachers</span>
            </button>
            
            <button
              onClick={() => setShowOptimizer(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-teal-600 text-white hover:bg-teal-700`}
            >
              <Target className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Optimizer</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-blue-600 text-white hover:bg-blue-700`}
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Export</span>
            </button>

            <button
              onClick={() => setShowStudioSettings(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Studio</span>
            </button>
            
            <button
              onClick={() => setShowAISettings(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${theme.button}`}
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">AI Settings</span>
            </button>
            
            <button
              onClick={() => setCsvData([])}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${theme.button}`}
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">New CSV</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className={`flex space-x-1 mb-6 rounded-2xl p-1 ${theme.card} shadow-lg`}>
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeView === view.id
                  ? `${theme.buttonPrimary} shadow-lg transform scale-105`
                  : `${theme.textSecondary} ${theme.cardHover}`
              }`}
            >
              <view.icon className="h-5 w-5 mr-2" />
              {view.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        {renderMainContent()}

        {/* Class Scheduling Modal */}
        {isModalOpen && selectedSlot && (
          <ClassModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingClass(null);
            }}
            selectedSlot={selectedSlot}
            editingClass={editingClass}
            csvData={csvData}
            teacherHours={teacherHours}
            customTeachers={customTeachers}
            teacherAvailability={teacherAvailability}
            scheduledClasses={scheduledClasses}
            onSchedule={handleClassSchedule}
            theme={theme}
            allowRestrictedScheduling={allowRestrictedScheduling}
          />
        )}

        {/* Smart Optimizer Modal */}
        {showOptimizer && (
          <SmartOptimizer
            isOpen={showOptimizer}
            onClose={() => setShowOptimizer(false)}
            csvData={csvData}
            currentSchedule={scheduledClasses}
            onOptimize={handleOptimizedSchedule}
            isDarkMode={currentTheme === 'dark' || currentTheme === 'darkPurple' || currentTheme === 'darkGreen'}
          />
        )}

        {/* Enhanced Optimizer Modal */}
        {showEnhancedOptimizer && (
          <EnhancedOptimizerModal
            isOpen={showEnhancedOptimizer}
            onClose={() => setShowEnhancedOptimizer(false)}
            csvData={csvData}
            currentSchedule={scheduledClasses}
            onOptimize={handleOptimizedSchedule}
            isDarkMode={currentTheme === 'dark' || currentTheme === 'darkPurple' || currentTheme === 'darkGreen'}
          />
        )}

        {/* Daily AI Optimizer Modal */}
        {showDailyOptimizer && (
          <DailyAIOptimizer
            isOpen={showDailyOptimizer}
            onClose={() => setShowDailyOptimizer(false)}
            csvData={csvData}
            currentSchedule={scheduledClasses}
            onOptimize={handleOptimizedSchedule}
            isDarkMode={currentTheme === 'dark' || currentTheme === 'darkPurple' || currentTheme === 'darkGreen'}
          />
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          scheduledClasses={scheduledClasses}
          location={activeTab}
        />

        {/* Studio Settings Modal */}
        <StudioSettings
          isOpen={showStudioSettings}
          onClose={() => setShowStudioSettings(false)}
          customTeachers={customTeachers}
          onUpdateTeachers={setCustomTeachers}
          teacherAvailability={teacherAvailability}
          onUpdateAvailability={setTeacherAvailability}
          theme={theme}
          allowRestrictedScheduling={allowRestrictedScheduling}
          onUpdateRestrictedScheduling={(value) => {
            setAllowRestrictedScheduling(value);
            localStorage.setItem('allow_restricted_scheduling', value.toString());
          }}
        />

        {/* AI Settings Modal */}
        <AISettings
          isOpen={showAISettings}
          onClose={() => setShowAISettings(false)}
          theme={theme}
        />

        {/* Theme Selector Modal */}
        <ThemeSelector
          isOpen={showThemeSelector}
          onClose={() => setShowThemeSelector(false)}
          currentTheme={currentTheme}
          themes={THEMES}
          onThemeChange={handleThemeChange}
        />
      </div>
    </div>
  );
}

export default App;
