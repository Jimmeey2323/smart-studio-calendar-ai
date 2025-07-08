
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Zap, Users, RotateCcw, Lock, Shield, Brain } from 'lucide-react';

interface CalendarHeaderProps {
  activeLocation: string;
  onLocationChange: (location: string) => void;
  onSmartSchedule: () => void;
  onOptimizeSlots: () => void;
  onMaxOutTrainers: () => void;
  onClearSchedule: () => void;
  onAdvancedOptimization: () => void;
  isLoading: boolean;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  activeLocation,
  onLocationChange,
  onSmartSchedule,
  onOptimizeSlots,
  onMaxOutTrainers,
  onClearSchedule,
  onAdvancedOptimization,
  isLoading
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 p-6 rounded-xl shadow-2xl mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            AI Studio Scheduler
          </h1>
          <p className="text-blue-200">Auto-populated with top performing sessions based on historical data</p>
          <p className="text-blue-300 text-sm mt-1">
            ✨ Classes ranked by attendance, revenue, and performance metrics
          </p>
        </div>
        
        <Tabs value={activeLocation} onValueChange={onLocationChange} className="bg-white/10 rounded-lg p-1">
          <TabsList className="bg-transparent">
            <TabsTrigger 
              value="Kwality House Kemps Corner" 
              className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
            >
              Kwality House, Kemps Corner
            </TabsTrigger>
            <TabsTrigger 
              value="Supreme HQ Bandra" 
              className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white"
            >
              Supreme HQ, Bandra
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-6">
        <Button 
          onClick={onSmartSchedule}
          disabled={isLoading}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Refresh Top Sessions
        </Button>
        
        <Button 
          onClick={onOptimizeSlots}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0"
        >
          <Zap className="w-4 h-4 mr-2" />
          Optimize Time Distribution
        </Button>
        
        <Button 
          onClick={onMaxOutTrainers}
          disabled={isLoading}
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0"
        >
          <Users className="w-4 h-4 mr-2" />
          Maximize Trainer Hours
        </Button>
        
        <Button 
          onClick={onClearSchedule}
          disabled={isLoading}
          variant="destructive"
          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear Schedule
        </Button>
        
        <Button 
          onClick={onAdvancedOptimization}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0"
        >
          <Brain className="w-4 h-4 mr-2" />
          AI Advanced Optimization
        </Button>
      </div>
    </div>
  );
};
