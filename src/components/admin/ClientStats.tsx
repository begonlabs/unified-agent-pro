
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Search, MessageSquare, TrendingUp, Activity, Users } from 'lucide-react';

const ClientStats = () => {
  const [selectedClient, setSelectedClient] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Datos de ejemplo de clientes
  const clients = [
    { id: '1', name: 'TechCorp Solutions', email: 'admin@techcorp.com', messages: 1245, leads: 89, automation: 78 },
    { id: '2', name: 'Green Energy Co.', email: 'info@greenenergy.com', messages: 892, leads: 67, automation: 85 },
    { id: '3', name: 'Digital Marketing Pro', email: 'hello@digitalmp.com', messages: 2103, leads: 156, automation: 92 },
    { id: '4', name: 'Local Restaurant', email: 'owner@restaurant.com', messages: 567, leads: 34, automation: 65 }
  ];

  // Datos de ejemplo para el cliente seleccionado
  const clientActivityData = [
    { date: '2024-01-01', messages: 45, leads: 8, responseTime: 2.3 },
    { date: '2024-01-02', messages: 67, leads: 12, responseTime: 1.8 },
    { date: '2024-01-03', messages: 52, leads: 9, responseTime: 2.1 },
    { date: '2024-01-04', messages: 89, leads: 15, responseTime: 1.5 },
    { date: '2024-01-05', messages: 78, leads: 13, responseTime: 1.9 },
    { date: '2024-01-06', messages: 94, leads: 18, responseTime: 1.4 },
    { date: '2024-01-07', messages: 112, leads: 22, responseTime: 1.2 }
  ];

  const channelData = [
    { channel: 'WhatsApp', messages: 456, leads: 34, color: '#25D366' },
    { channel: 'Facebook', messages: 298, leads: 18, color: '#1877F2' },
    { channel: 'Instagram', messages: 167, leads: 12, color: '#E4405F' }
  ];

  const selectedClientData = clients.find(c => c.id === selectedClient);
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-mono font-black uppercase tracking-widest text-white">Estadísticas por Cliente</h2>
        <p className="text-zinc-400 font-mono tracking-wide">
          Análisis detallado del rendimiento individual de cada cliente
        </p>
      </div>

      {/* Client Selection */}
      <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-mono text-white uppercase tracking-wider">Seleccionar Cliente</CardTitle>
          <CardDescription className="text-zinc-400 font-mono">
            Elige un cliente para ver sus estadísticas detalladas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
              />
            </div>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[300px] bg-zinc-700/50 border-zinc-600 text-white font-mono">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {filteredClients.map((client) => (
                  <SelectItem key={client.id} value={client.id} className="text-white font-mono focus:bg-zinc-700">
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client List */}
          <div className="grid gap-3">
            {filteredClients.map((client) => (
              <div 
                key={client.id}
                className={`p-4 rounded-sm border cursor-pointer transition-all duration-300 ${
                  selectedClient === client.id
                    ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/50'
                    : 'bg-zinc-700/30 border-zinc-600 hover:bg-zinc-700/50 hover:border-zinc-500'
                }`}
                onClick={() => setSelectedClient(client.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-mono font-bold">
                        {client.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-mono font-medium text-white">{client.name}</h3>
                      <p className="text-sm text-zinc-400 font-mono">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-mono">
                    <div className="text-center">
                      <div className="text-white font-bold">{client.messages.toLocaleString()}</div>
                      <div className="text-zinc-400">Mensajes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold">{client.leads}</div>
                      <div className="text-zinc-400">Leads</div>
                    </div>
                    <Badge className="bg-purple-600 text-white font-mono">{client.automation}% IA</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedClientData && (
        <>
          {/* Client Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Mensajes Totales</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold text-white">{selectedClientData.messages.toLocaleString()}</div>
                <p className="text-xs font-mono text-zinc-400 tracking-wide">Este mes</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Leads Generados</CardTitle>
                <Users className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold text-white">{selectedClientData.leads}</div>
                <p className="text-xs font-mono text-zinc-400 tracking-wide">+{Math.floor(selectedClientData.leads * 0.15)} vs mes anterior</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Automatización</CardTitle>
                <Activity className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold text-white">{selectedClientData.automation}%</div>
                <p className="text-xs font-mono text-zinc-400 tracking-wide">Mensajes automatizados</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Conversión</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold text-white">
                  {((selectedClientData.leads / selectedClientData.messages) * 100).toFixed(1)}%
                </div>
                <p className="text-xs font-mono text-zinc-400 tracking-wide">Tasa de conversión</p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-mono text-white uppercase tracking-wider">Actividad Diaria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={clientActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                    <YAxis stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#27272a', 
                        border: '1px solid #3f3f46', 
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }} 
                    />
                    <Line type="monotone" dataKey="messages" stroke="#3B82F6" strokeWidth={3} />
                    <Line type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Channel Performance */}
            <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-mono text-white uppercase tracking-wider">Rendimiento por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="channel" stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                    <YAxis stroke="#a1a1aa" fontSize={12} fontFamily="monospace" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#27272a', 
                        border: '1px solid #3f3f46', 
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }} 
                    />
                    <Bar dataKey="messages" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Channel Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {channelData.map((channel) => (
              <Card key={channel.channel} className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-mono font-medium text-white uppercase tracking-wider">
                    {channel.channel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-400 font-mono">Mensajes</span>
                      <span className="font-mono font-bold text-white">{channel.messages.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
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
                    <div className="w-full bg-zinc-700 rounded-full h-2 mt-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${(channel.leads / Math.max(...channelData.map(c => c.leads))) * 100}%`,
                          backgroundColor: channel.color
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400 font-mono">Conversión</span>
                    <span className="font-mono font-bold text-green-400">
                      {((channel.leads / channel.messages) * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientStats;
