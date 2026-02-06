import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, BarChart3, Search, TrendingUp } from 'lucide-react';
import { ClientStatsTableProps } from '../types';
import { ClientStatsService } from '../services/clientStatsService';

export const ClientStatsTable: React.FC<ClientStatsTableProps> = ({
  clients,
  loading,
  onViewDetails
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative h-12 w-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-[#3a0caa] animate-spin"></div>
            </div>
            <p className="text-muted-foreground font-medium">Cargando estadísticas de clientes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md overflow-hidden bg-white">
      <CardHeader className="border-b border-gray-100 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#3a0caa] to-[#710db2] shadow-lg shadow-purple-200">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-gray-900">Estadísticas por Cliente</span>
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium ml-10">
              Gestión de actividad y rendimiento individual de la cartera de clientes
            </CardDescription>
          </div>

          <div className="relative md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#3a0caa] transition-colors" />
            <Input
              placeholder="Buscar cliente por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-gray-200 focus:border-[#3a0caa] focus:ring-[#3a0caa]/20 rounded-xl transition-all shadow-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-b border-gray-100">
                <TableHead className="py-4 font-bold text-gray-700">Cliente</TableHead>
                <TableHead className="py-4 font-bold text-gray-700">Plan</TableHead>
                <TableHead className="py-4 font-bold text-center text-gray-700">Canales Activos</TableHead>
                <TableHead className="py-4 font-bold text-center text-gray-700">Actividad Global</TableHead>
                <TableHead className="py-4 font-bold text-center text-gray-700">Rendimiento</TableHead>
                <TableHead className="py-4 font-bold text-right text-gray-700 pr-8">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="group hover:bg-gray-50/80 transition-colors border-b border-gray-100/50">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-600 border border-white shadow-sm group-hover:scale-105 transition-transform">
                          {client.company_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 leading-tight">{client.company_name}</div>
                          <div className="text-xs text-gray-500 font-medium">{client.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wider shadow-sm uppercase ${ClientStatsService.getPlanBadgeColor(client.plan_type)}`}>
                        {ClientStatsService.getPlanDisplayName(client.plan_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                          {ClientStatsService.getChannelIcon('whatsapp')}
                          <span className="text-[10px] font-bold text-gray-600">{ClientStatsService.formatNumber(client.stats.whatsapp_messages)}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          {ClientStatsService.getChannelIcon('facebook')}
                          <span className="text-[10px] font-bold text-gray-600">{ClientStatsService.formatNumber(client.stats.facebook_messages)}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          {ClientStatsService.getChannelIcon('instagram')}
                          <span className="text-[10px] font-bold text-gray-600">{ClientStatsService.formatNumber(client.stats.instagram_messages)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{ClientStatsService.formatNumber(client.stats.total_messages)} Mensajes</span>
                        <span className="text-[10px] font-medium text-amber-600">{ClientStatsService.formatNumber(client.stats.total_leads)} Leads</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 rounded-lg border border-green-100">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-sm font-bold">{ClientStatsService.formatResponseRate(client.stats.response_rate)}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 mt-1">Tasa Respuesta</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(client)}
                        className="h-9 w-9 rounded-xl hover:bg-[#3a0caa]/10 hover:text-[#3a0caa] transition-all"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground font-medium">
                    No se encontraron clientes con "{searchTerm}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
