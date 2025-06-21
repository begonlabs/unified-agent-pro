
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MessageSquare, Users, Bot, Phone, Facebook, Instagram } from 'lucide-react';

const StatsView = () => {
  const [timeRange, setTimeRange] = useState('7d');

  // Datos de ejemplo - en producción vendrían de la base de datos
  const stats = {
    totalMessages: 2847,
    automatedMessages: 1902,
    humanMessages: 945,
    responseRate: 94.5,
    newLeads: 156,
    totalClients: 847
  };

  const channelData = [
    { name: 'WhatsApp', messages: 1456, leads: 89, color: '#25D366' },
    { name: 'Facebook', messages: 892, leads: 45, color: '#1877F2' },
    { name: 'Instagram', messages: 499, leads: 22, color: '#E4405F' }
  ];

  const dailyData = [
    { date: '2024-01-01', messages: 245, leads: 12, responseRate: 92 },
    { date: '2024-01-02', messages: 312, leads: 18, responseRate: 95 },
    { date: '2024-01-03', messages: 278, leads: 15, responseRate: 89 },
    { date: '2024-01-04', messages: 389, leads: 24, responseRate: 97 },
    { date: '2024-01-05', messages: 445, leads: 31, responseRate: 93 },
    { date: '2024-01-06', messages: 398, leads: 28, responseRate: 96 },
    { date: '2024-01-07', messages: 467, leads: 35, responseRate: 98 }
  ];

  const automationData = [
    { name: 'Automatizados', value: stats.automatedMessages, color: '#10B981' },
    { name: 'Humanos', value: stats.humanMessages, color: '#3B82F6' }
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-mono font-bold text-white">{value}</div>
        {subtitle && <p className="text-xs font-mono text-zinc-400 tracking-wide">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 bg-zinc-900 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-black uppercase tracking-widest text-white">Estadísticas</h1>
        <div className="flex gap-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-sm text-sm font-mono tracking-wider uppercase transition-all duration-300 ${
                timeRange === range
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 border border-zinc-600 hover:border-zinc-500'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Mensajes Totales"
          value={stats.totalMessages.toLocaleString()}
          icon={MessageSquare}
          color="text-blue-400"
          subtitle="+12% vs mes anterior"
        />
        <StatCard
          title="Tasa de Respuesta"
          value={`${stats.responseRate}%`}
          icon={TrendingUp}
          color="text-green-400"
          subtitle="+2.3% vs mes anterior"
        />
        <StatCard
          title="Nuevos Leads"
          value={stats.newLeads}
          icon={Users}
          color="text-purple-400"
          subtitle="+8% vs mes anterior"
        />
        <StatCard
          title="Mensajes IA"
          value={`${((stats.automatedMessages / stats.totalMessages) * 100).toFixed(1)}%`}
          icon={Bot}
          color="text-emerald-400"
          subtitle="Automatización"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages per Channel */}
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-mono text-white uppercase tracking-wider">Mensajes por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                <YAxis stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#27272a', 
                    border: '1px solid #3f3f46', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }} 
                />
                <Bar dataKey="messages" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Automation Distribution */}
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-mono text-white uppercase tracking-wider">Distribución de Mensajes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={automationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  fontSize={12}
                  fontFamily="monospace"
                >
                  {automationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#27272a', 
                    border: '1px solid #3f3f46', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Daily Activity */}
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-mono text-white uppercase tracking-wider">Actividad Diaria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                <YAxis yAxisId="left" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#27272a', 
                    border: '1px solid #3f3f46', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }} 
                />
                <Bar yAxisId="left" dataKey="messages" fill="#3B82F6" />
                <Line yAxisId="right" type="monotone" dataKey="responseRate" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Channel Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channelData.map((channel) => (
          <Card key={channel.name} className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-mono font-medium text-white uppercase tracking-wider">{channel.name}</CardTitle>
              {channel.name === 'WhatsApp' && <Phone className="h-5 w-5 text-green-400" />}
              {channel.name === 'Facebook' && <Facebook className="h-5 w-5 text-blue-400" />}
              {channel.name === 'Instagram' && <Instagram className="h-5 w-5 text-pink-400" />}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400 font-mono">Mensajes</span>
                  <span className="font-mono font-bold text-white">{channel.messages.toLocaleString()}</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${(channel.messages / Math.max(...channelData.map(c => c.messages))) * 100}%`,
                      backgroundColor: channel.color
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400 font-mono">Leads</span>
                  <span className="font-mono font-bold text-white">{channel.leads}</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${(channel.leads / Math.max(...channelData.map(c => c.leads))) * 100}%`,
                      backgroundColor: channel.color
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StatsView;
