import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, BarChart3 } from 'lucide-react';
import { ClientStatsTableProps } from '../types';
import { ClientStatsService } from '../services/clientStatsService';

export const ClientStatsTable: React.FC<ClientStatsTableProps> = ({
  clients,
  loading,
  onViewDetails
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando estadísticas de clientes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Estadísticas por Cliente</span>
        </CardTitle>
        <CardDescription>
          Resumen de actividad y rendimiento de cada cliente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Mensajes</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Conversaciones</TableHead>
                <TableHead>Tasa Respuesta</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Facebook</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{client.company_name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={ClientStatsService.getPlanBadgeColor(client.plan_type)}>
                      {client.plan_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ClientStatsService.formatNumber(client.stats.total_messages)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ClientStatsService.formatNumber(client.stats.total_leads)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ClientStatsService.formatNumber(client.stats.total_conversations)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ClientStatsService.formatResponseRate(client.stats.response_rate)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {ClientStatsService.getChannelIcon('whatsapp')}
                      <span className="text-sm">{client.stats.whatsapp_messages}M / {client.stats.whatsapp_leads}L</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {ClientStatsService.getChannelIcon('facebook')}
                      <span className="text-sm">{client.stats.facebook_messages}M / {client.stats.facebook_leads}L</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {ClientStatsService.getChannelIcon('instagram')}
                      <span className="text-sm">{client.stats.instagram_messages}M / {client.stats.instagram_leads}L</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(client)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
