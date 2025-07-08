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
    // Load Classes.csv
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

    // Transform Classes.csv data to PriorityClass format
    result.priorityClasses = classesParsed.data
      .filter((row: any) => row && (row['Class Name'] || row['className'] || row['Cleaned Class']))
      .map((row: any, index: number) => {
        try {
          const className = String(row['Class Name'] || row['className'] || row['Cleaned Class'] || '').trim();
          const priority = parseInt(row['Priority'] || row['priority'] || '1');
          const mustInclude = String(row['Must Include'] || row['mustInclude'] || 'true').toLowerCase() === 'true';

          return {
            className,
            priority: isNaN(priority) ? 1 : priority,
            mustInclude
          };
        } catch (error) {
          console.error(`Error processing Classes.csv row ${index + 1}:`, error, row);
          return null;
        }
      })
      .filter((item): item is PriorityClass => item !== null && item.className !== '');

    console.log(`✅ Loaded ${result.priorityClasses.length} priority classes from Classes.csv`);

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
        .slice(0, 15) // Top 15 classes
        .map((item, index) => ({
          className: item.cleanedClass,
          priority: 15 - index, // Higher priority for better performing classes
          mustInclude: index < 10 // Top 10 are must-include
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