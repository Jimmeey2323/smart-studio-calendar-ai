
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrainerStats, DaySchedule } from '../types/calendar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';

interface AnalyticsDashboardProps {
  trainerStats: TrainerStats[];
  schedule: DaySchedule[];
  location: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  trainerStats,
  schedule,
  location
}) => {
  const totalClasses = schedule.reduce((sum, day) => 
    sum + day.timeSlots.reduce((daySum, slot) => daySum + slot.classes.length, 0), 0
  );

  const dayWiseData = schedule.map(day => ({
    day: day.day.slice(0, 3),
    classes: day.timeSlots.reduce((sum, slot) => sum + slot.classes.length, 0)
  }));

  const trainerHoursData = trainerStats.slice(0, 10).map(trainer => ({
    name: trainer.name.split(' ')[0],
    hours: trainer.currentWeekHours,
    classes: trainer.classCount
  }));

  const classDistribution = schedule.reduce((acc, day) => {
    day.timeSlots.forEach(slot => {
      slot.classes.forEach(classItem => {
        const className = classItem.name.split(' ')[0] + ' ' + classItem.name.split(' ')[1];
        acc[className] = (acc[className] || 0) + 1;
      });
    });
    return acc;
  }, {} as { [key: string]: number });

  const pieData = Object.entries(classDistribution).map(([name, value]) => ({ name, value }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-white">
        <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
        <p>Performance insights for {location}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trainers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trainerStats.length}</div>
            <p className="text-xs text-muted-foreground">
              {trainerStats.filter(t => t.isOverloaded).length} at capacity
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainerStats.reduce((sum, t) => sum + t.currentWeekHours, 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Instructor hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((totalClasses / (schedule.length * 10)) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Time slot usage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Class Distribution</CardTitle>
            <CardDescription>Number of classes scheduled per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayWiseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="classes" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Format Distribution</CardTitle>
            <CardDescription>Breakdown of scheduled class types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trainer Workload Analysis</CardTitle>
          <CardDescription>Weekly hours and class count per trainer</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={trainerHoursData} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#82ca9d" name="Hours" />
              <Bar dataKey="classes" fill="#8884d8" name="Classes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trainer Details</CardTitle>
          <CardDescription>Individual trainer statistics and specialties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainerStats.map(trainer => (
              <div key={trainer.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className={`font-semibold ${trainer.isOverloaded ? 'text-red-600' : ''}`}>
                    {trainer.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Specialties: {trainer.specialties.join(', ') || 'General'}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${trainer.isOverloaded ? 'text-red-600' : 'text-green-600'}`}>
                    {trainer.currentWeekHours}h / 15h
                  </div>
                  <div className="text-sm text-gray-500">
                    {trainer.classCount} classes
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
