
import Papa from 'papaparse';
import { ClassData, PriorityClass } from '../types';

export interface CSVLoadResult {
  scoringData: ClassData[];
  priorityClasses: PriorityClass[];
  errors: string[];
}

/**
 * Load and parse both Scoring.csv and Classes.csv files
 */
export async function loadCSVFiles(): Promise<CSVLoadResult> {
  const result: CSVLoadResult = {
    scoringData: [],
    priorityClasses: [],
    errors: []
  };

  try {
    // Load Scoring.csv
    console.log('🔄 Loading Scoring.csv...');
    const scoringResponse = await fetch('/Scoring.csv');
    if (!scoringResponse.ok) {
      throw new Error(`Failed to fetch Scoring.csv: ${scoringResponse.statusText}`);
    }
    const scoringText = await scoringResponse.text();
    
    // Parse Scoring.csv
    const scoringParsed = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
      Papa.parse(scoringText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: resolve,
        error: reject
      });
    });

    if (scoringParsed.errors.length > 0) {
      console.warn('Scoring.csv parsing warnings:', scoringParsed.errors);
      result.errors.push(...scoringParsed.errors.map(e => `Scoring.csv: ${e.message}`));
    }

    // Transform Scoring.csv data to ClassData format
    result.scoringData = scoringParsed.data
      .filter((row: any) => row && row['Cleaned Class'] && row['Location'] && row['Trainer Name'])
      .map((row: any, index: number) => {
        try {
          const parseNumber = (value: any, defaultValue: number = 0): number => {
            if (value === null || value === undefined || value === '') return defaultValue;
            const parsed = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : parseFloat(value);
            return isNaN(parsed) ? defaultValue : parsed;
          };

          const parseInt = (value: any, defaultValue: number = 0): number => {
            if (value === null || value === undefined || value === '') return defaultValue;
            const parsed = typeof value === 'string' ? Number.parseInt(value.replace(/[^\d-]/g, '')) : Number.parseInt(value);
            return isNaN(parsed) ? defaultValue : parsed;
          };

          // Extract teacher name parts
          const trainerName = String(row['Trainer Name'] || '').trim();
          const nameParts = trainerName.split(' ');
          const teacherFirstName = nameParts[0] || '';
          const teacherLastName = nameParts.slice(1).join(' ') || '';

          return {
            // Required ClassData fields
            variantName: String(row['Cleaned Class'] || '').trim(),
            classDate: new Date().toISOString().split('T')[0], // Default to today
            location: String(row['Location'] || '').trim(),
            payrate: 'Standard', // Default value
            totalRevenue: parseNumber(row['Total Revenue']),
            basePayout: 0, // Not in scoring data
            additionalPayout: 0, // Not in scoring data
            totalPayout: 0, // Not in scoring data
            tip: parseNumber(row['Total Tips']),
            participants: parseInt(row['Total Participants']),
            checkedIn: parseInt(row['Total Checked In']),
            comps: 0, // Not in scoring data
            checkedInComps: 0, // Not in scoring data
            lateCancellations: parseNumber(row['Avg Late Cancels']),
            nonPaidCustomers: parseNumber(row['Avg Non Paid Customers']),
            timeHours: 1, // Default to 1 hour
            teacherFirstName,
            teacherLastName,
            teacherName: trainerName,
            dayOfWeek: String(row['Day of Week'] || '').trim(),
            classTime: String(row['Class Time'] || '').trim(),
            cleanedClass: String(row['Cleaned Class'] || '').trim(),
            unique1: '',
            unique2: '',
            
            // Additional Scoring.csv specific fields
            totalClasses: parseInt(row['Total Classes']),
            totalCheckedIn: parseInt(row['Total Checked In']),
            totalParticipants: parseInt(row['Total Participants']),
            emptyClasses: parseInt(row['Empty Classes']),
            nonEmptyClasses: parseInt(row['Non-Empty Classes']),
            avgAttendanceWithEmpty: parseNumber(row['Avg Attendance (with empty)']),
            avgAttendanceWithoutEmpty: parseNumber(row['Avg Attendance (w/o empty)']),
            revenuePerClass: parseNumber(row['Revenue Per Class']),
            avgLateCancels: parseNumber(row['Avg Late Cancels']),
            avgNonPaidCustomers: parseNumber(row['Avg Non Paid Customers']),
            totalTips: parseNumber(row['Total Tips']),
            tipsPerClass: parseNumber(row['Tips Per Class']),
            avgFillRate: parseNumber(row['Avg Fill Rate (%)']),
            revenuePerSeat: parseNumber(row['Revenue/Seat']),
            lateCancelRate: parseNumber(row['Late Cancel Rate (%)']),
            nonPaidRate: parseNumber(row['Non Paid Rate (%)']),
            adjustedScore: parseNumber(row['Adjusted Score']),
            classStatus: String(row['Class Status'] || 'Active').trim(),
            popularity: String(row['Popularity'] || '').trim(),
            consistency: String(row['Consistency'] || '').trim(),
            trainerVariance: parseNumber(row['Trainer Variance']),
            observations: String(row['Observations'] || '').trim(),
            topTrainerRecommendations: String(row['Top 3 Trainer Recommendations (Weighted Avg)'] || '').trim()
          };
        } catch (error) {
          console.error(`Error processing Scoring.csv row ${index + 1}:`, error, row);
          return null;
        }
      })
      .filter((item): item is ClassData => item !== null);

    console.log(`✅ Loaded ${result.scoringData.length} records from Scoring.csv`);

  } catch (error) {
    console.error('Error loading Scoring.csv:', error);
    result.errors.push(`Failed to load Scoring.csv: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Load Classes.csv - this appears to be the same structure as Scoring.csv based on the provided data
    console.log('🔄 Loading Classes.csv...');
    const classesResponse = await fetch('/Classes.csv');
    if (!classesResponse.ok) {
      throw new Error(`Failed to fetch Classes.csv: ${classesResponse.statusText}`);
    }
    const classesText = await classesResponse.text();
    
    // Parse Classes.csv
    const classesParsed = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
      Papa.parse(classesText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: resolve,
        error: reject
      });
    });

    if (classesParsed.errors.length > 0) {
      console.warn('Classes.csv parsing warnings:', classesParsed.errors);
      result.errors.push(...classesParsed.errors.map(e => `Classes.csv: ${e.message}`));
    }

    // Since Classes.csv has the same structure as Scoring.csv, we'll extract priority classes
    // based on performance metrics from the Classes.csv data
    console.log('📊 Extracting priority classes from Classes.csv data...');
    
    const topPerformingClasses = classesParsed.data
      .filter((row: any) => {
        // Filter for active, high-performing classes
        const adjustedScore = parseFloat(row['Adjusted Score'] || '0');
        const avgAttendance = parseFloat(row['Avg Attendance (w/o empty)'] || '0');
        const classStatus = String(row['Class Status'] || '').trim();
        const fillRate = parseFloat(row['Avg Fill Rate (%)'] || '0');
        
        return classStatus === 'Active' && 
               adjustedScore > 150 && 
               avgAttendance >= 6 && 
               fillRate >= 50;
      })
      .sort((a: any, b: any) => {
        // Sort by adjusted score descending
        const scoreA = parseFloat(a['Adjusted Score'] || '0');
        const scoreB = parseFloat(b['Adjusted Score'] || '0');
        return scoreB - scoreA;
      })
      .slice(0, 30) // Top 30 performing classes
      .map((row: any, index: number) => {
        const className = String(row['Cleaned Class'] || '').trim();
        const dayOfWeek = String(row['Day of Week'] || '').trim();
        const classTime = String(row['Class Time'] || '').trim();
        const location = String(row['Location'] || '').trim();
        const trainerName = String(row['Trainer Name'] || '').trim();
        const adjustedScore = parseFloat(row['Adjusted Score'] || '0');
        const avgAttendance = parseFloat(row['Avg Attendance (w/o empty)'] || '0');
        
        return {
          className,
          priority: 30 - index, // Higher priority for better performing classes
          mustInclude: index < 15, // Top 15 are must-include
          dayOfWeek,
          classTime,
          location,
          trainerName,
          adjustedScore,
          avgAttendance,
          // Create a unique key for this specific class-day-time-location-trainer combination
          scheduleKey: `${className}-${dayOfWeek}-${classTime}-${location}-${trainerName}`
        };
      });

    result.priorityClasses = topPerformingClasses;
    console.log(`✅ Extracted ${result.priorityClasses.length} priority classes from Classes.csv`);
    
    // Log the top 10 priority classes for verification
    console.log('🏆 Top 10 Priority Classes:');
    result.priorityClasses.slice(0, 10).forEach((pc, idx) => {
      console.log(`${idx + 1}. ${pc.className} with ${pc.trainerName} - ${pc.dayOfWeek} ${pc.classTime} at ${pc.location} (Score: ${pc.adjustedScore})`);
    });

  } catch (error) {
    console.error('Error loading Classes.csv:', error);
    result.errors.push(`Failed to load Classes.csv: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Fallback: Generate priority classes from Scoring.csv data
    if (result.scoringData.length > 0) {
      console.log('🔄 Generating priority classes from Scoring.csv data as fallback...');
      
      // Get top performing classes based on adjusted score and attendance
      const topClasses = result.scoringData
        .filter(item => item.adjustedScore && item.avgAttendanceWithEmpty && item.avgAttendanceWithEmpty >= 6)
        .sort((a, b) => (b.adjustedScore || 0) - (a.adjustedScore || 0))
        .slice(0, 20) // Top 20 classes
        .map((item, index) => ({
          className: item.cleanedClass,
          priority: 20 - index, // Higher priority for better performing classes
          mustInclude: index < 10, // Top 10 are must-include
          dayOfWeek: item.dayOfWeek,
          classTime: item.classTime,
          location: item.location,
          trainerName: item.teacherName,
          adjustedScore: item.adjustedScore || 0,
          avgAttendance: item.avgAttendanceWithEmpty || 0,
          scheduleKey: `${item.cleanedClass}-${item.dayOfWeek}-${item.classTime}-${item.location}-${item.teacherName}`
        }));

      result.priorityClasses = topClasses;
      console.log(`✅ Generated ${result.priorityClasses.length} priority classes from Scoring.csv data`);
    }
  }

  return result;
}

/**
 * Get priority class formats as a simple array of strings
 */
export function getPriorityClassFormats(priorityClasses: PriorityClass[]): string[] {
  return priorityClasses
    .sort((a, b) => b.priority - a.priority)
    .map(pc => pc.className);
}

/**
 * Get priority classes with their specific scheduling details
 */
export function getPriorityClassSchedules(priorityClasses: PriorityClass[]): any[] {
  return priorityClasses
    .sort((a, b) => b.priority - a.priority)
    .map(pc => ({
      className: pc.className,
      dayOfWeek: pc.dayOfWeek,
      classTime: pc.classTime,
      location: pc.location,
      trainerName: pc.trainerName,
      priority: pc.priority,
      mustInclude: pc.mustInclude,
      scheduleKey: pc.scheduleKey
    }));
}

/**
 * Check if a class format is a priority class
 */
export function isPriorityClass(classFormat: string, priorityClasses: PriorityClass[]): boolean {
  return priorityClasses.some(pc => pc.className === classFormat);
}

/**
 * Get must-include priority classes
 */
export function getMustIncludeClasses(priorityClasses: PriorityClass[]): PriorityClass[] {
  return priorityClasses.filter(pc => pc.mustInclude);
}

/**
 * Get the best trainer for a specific class format based on performance data
 */
export function getBestTrainerForClass(classFormat: string, priorityClasses: PriorityClass[]): string | null {
  const matchingClass = priorityClasses.find(pc => pc.className === classFormat);
  return matchingClass ? matchingClass.trainerName : null;
}

/**
 * Get the optimal day and time for a specific class format
 */
export function getOptimalScheduleForClass(classFormat: string, priorityClasses: PriorityClass[]): {
  dayOfWeek: string;
  classTime: string;
  location: string;
} | null {
  const matchingClass = priorityClasses.find(pc => pc.className === classFormat);
  if (matchingClass) {
    return {
      dayOfWeek: matchingClass.dayOfWeek,
      classTime: matchingClass.classTime,
      location: matchingClass.location
    };
  }
  return null;
}
