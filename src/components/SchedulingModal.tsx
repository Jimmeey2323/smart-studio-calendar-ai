
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClassData, TrainerStats } from '../types/calendar';
import { Brain, TrendingUp, Users, Clock, Star } from 'lucide-react';

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: string;
  time: string;
  location: string;
  classData: ClassData[];
  trainerStats: TrainerStats[];
  onScheduleClass: (classDetails: any) => void;
}

export const SchedulingModal: React.FC<SchedulingModalProps> = ({
  isOpen,
  onClose,
  day,
  time,
  location,
  classData,
  trainerStats,
  onScheduleClass
}) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [historicalData, setHistoricalData] = useState<ClassData[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Get historical data for this time slot and location
      const historical = classData.filter(c => 
        c.location.includes(location.split(',')[0]) && 
        c.classTime.includes(time.split(':')[0])
      );
      setHistoricalData(historical);
      generateAIRecommendations(historical);
    }
  }, [isOpen, day, time, location, classData]);

  const generateAIRecommendations = (historical: ClassData[]) => {
    if (historical.length === 0) {
      setAiRecommendations({
        bestFormat: 'Studio Barre 57',
        bestTrainer: 'Anisha Shah',
        reasoning: 'Based on overall performance metrics, Barre classes perform well during this time.',
        predictedCheckIn: 8,
        confidence: 0.7
      });
      return;
    }

    // Analyze historical performance
    const formatPerformance: { [key: string]: number[] } = {};
    const trainerPerformance: { [key: string]: number[] } = {};

    historical.forEach(c => {
      if (!formatPerformance[c.cleanedClass]) formatPerformance[c.cleanedClass] = [];
      if (!trainerPerformance[c.teacherName]) trainerPerformance[c.teacherName] = [];
      
      formatPerformance[c.cleanedClass].push(c.checkedIn);
      trainerPerformance[c.teacherName].push(c.checkedIn);
    });

    const bestFormat = Object.entries(formatPerformance)
      .map(([format, checkins]) => ({
        format,
        avg: checkins.reduce((a, b) => a + b, 0) / checkins.length
      }))
      .sort((a, b) => b.avg - a.avg)[0];

    const bestTrainer = Object.entries(trainerPerformance)
      .map(([trainer, checkins]) => ({
        trainer,
        avg: checkins.reduce((a, b) => a + b, 0) / checkins.length
      }))
      .sort((a, b) => b.avg - a.avg)[0];

    setAiRecommendations({
      bestFormat: bestFormat?.format || 'Studio Barre 57',
      bestTrainer: bestTrainer?.trainer || 'Anisha Shah',
      reasoning: `Historical data shows ${bestFormat?.format} averages ${bestFormat?.avg.toFixed(1)} check-ins at this time`,
      predictedCheckIn: Math.round(bestFormat?.avg || 8),
      confidence: historical.length > 5 ? 0.9 : 0.6
    });
  };

  const availableClasses = [
    'Studio Barre 57', 'Studio Mat 57', 'Studio HIIT', 'Studio Recovery',
    'Studio Foundations', 'powerCycle', 'Studio Pre/Post Natal Class'
  ];

  const getAvailableTrainers = () => {
    return trainerStats.filter(trainer => 
      !trainer.name.includes('Nishanth') && 
      !trainer.name.includes('Saniya')
    );
  };

  const handleSchedule = () => {
    if (!selectedClass || !selectedTrainer) return;

    const classDetails = {
      name: selectedClass,
      trainer: selectedTrainer,
      time,
      day,
      duration: 60,
      isPrivate,
      memberName: isPrivate ? memberName : undefined,
      predictedCheckIn: aiRecommendations?.predictedCheckIn || 8
    };

    onScheduleClass(classDetails);
    onClose();
    
    // Reset form
    setSelectedClass('');
    setSelectedTrainer('');
    setIsPrivate(false);
    setMemberName('');
  };

  const handleQuickSchedule = () => {
    if (!aiRecommendations) return;
    
    const classDetails = {
      name: aiRecommendations.bestFormat,
      trainer: aiRecommendations.bestTrainer,
      time,
      day,
      duration: 60,
      predictedCheckIn: aiRecommendations.predictedCheckIn
    };

    onScheduleClass(classDetails);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Schedule Class - {day} at {time}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Schedule Class</TabsTrigger>
            <TabsTrigger value="historical">Historical Data</TabsTrigger>
            <TabsTrigger value="ai">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            {aiRecommendations && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Quick Schedule
                  </CardTitle>
                  <CardDescription>
                    Based on historical performance data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{aiRecommendations.bestFormat}</p>
                      <p className="text-sm text-gray-600">with {aiRecommendations.bestTrainer}</p>
                      <p className="text-xs text-gray-500 mt-1">{aiRecommendations.reasoning}</p>
                      <Badge variant="secondary" className="mt-2">
                        Predicted: {aiRecommendations.predictedCheckIn} check-ins
                      </Badge>
                    </div>
                    <Button onClick={handleQuickSchedule} className="bg-green-600 hover:bg-green-700">
                      Quick Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class-type">Class Type</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map(className => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="trainer">Trainer</Label>
                <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTrainers().map(trainer => (
                      <SelectItem 
                        key={trainer.name} 
                        value={trainer.name}
                        disabled={trainer.isOverloaded}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={trainer.isOverloaded ? 'text-red-500' : ''}>
                            {trainer.name}
                          </span>
                          <Badge variant={trainer.isOverloaded ? 'destructive' : 'secondary'}>
                            {trainer.currentWeekHours}h
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="private">Private Class</Label>
            </div>

            {isPrivate && (
              <div>
                <Label htmlFor="member-name">Member Name</Label>
                <Input
                  id="member-name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Enter member name"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSchedule} disabled={!selectedClass || !selectedTrainer}>
                Schedule Class
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="historical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Historical Performance
                </CardTitle>
                <CardDescription>
                  Classes scheduled at {time} on {day}s at {location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historicalData.length > 0 ? (
                  <div className="space-y-2">
                    {historicalData.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{item.cleanedClass}</span>
                          <span className="text-sm text-gray-600 ml-2">by {item.teacherName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{item.checkedIn}/{item.participants}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No historical data available for this time slot.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  AI Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiRecommendations ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800">Best Format</h4>
                        <p className="text-blue-600">{aiRecommendations.bestFormat}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800">Best Trainer</h4>
                        <p className="text-green-600">{aiRecommendations.bestTrainer}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-800">AI Reasoning</h4>
                      <p className="text-purple-600">{aiRecommendations.reasoning}</p>
                      <div className="mt-2">
                        <Badge variant="outline">
                          Confidence: {(aiRecommendations.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Generating AI insights...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
