import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { FormattedDailyStat } from '../types';
import { TrendingUp, MessageCircle } from 'lucide-react';

interface DailyActivityChartProps {
  dailyData: FormattedDailyStat[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600">Mensajes:</span>
            <span className="text-sm font-semibold text-gray-900">{payload[0].value}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-gray-600">Tasa de Respuesta:</span>
            <span className="text-sm font-semibold text-gray-900">{payload[1].value}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ dailyData }) => {
  // Calculate totals for summary
  const totalMessages = dailyData.reduce((sum, day) => sum + day.messages, 0);
  const avgResponseRate = dailyData.length > 0
    ? (dailyData.reduce((sum, day) => sum + day.responseRate, 0) / dailyData.length).toFixed(1)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Actividad Diaria
            </CardTitle>
            <CardDescription className="mt-1">
              Últimos {dailyData.length} días de actividad
            </CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <p className="text-gray-500">Total Mensajes</p>
              <p className="text-xl font-bold text-blue-600">{totalMessages}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Respuesta Promedio</p>
              <p className="text-xl font-bold text-emerald-600">{avgResponseRate}%</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={dailyData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorResponseRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#3B82F6"
              style={{ fontSize: '12px' }}
              label={{ value: 'Mensajes', angle: -90, position: 'insideLeft', style: { fill: '#3B82F6' } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#10B981"
              style={{ fontSize: '12px' }}
              label={{ value: 'Tasa de Respuesta (%)', angle: 90, position: 'insideRight', style: { fill: '#10B981' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="messages"
              stroke="#3B82F6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorMessages)"
              name="Mensajes"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="responseRate"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorResponseRate)"
              name="Tasa de Respuesta (%)"
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
