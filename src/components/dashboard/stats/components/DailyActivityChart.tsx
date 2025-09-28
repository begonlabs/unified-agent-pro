import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FormattedDailyStat } from '../types';

interface DailyActivityChartProps {
  dailyData: FormattedDailyStat[];
}

export const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ dailyData }) => (
  <Card>
    <CardHeader>
      <CardTitle>Actividad Diaria</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Line yAxisId="left" type="monotone" dataKey="messages" stroke="#3B82F6" strokeWidth={2} name="Mensajes" />
          <Line yAxisId="right" type="monotone" dataKey="responseRate" stroke="#10B981" strokeWidth={2} name="Tasa de Respuesta %" />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
