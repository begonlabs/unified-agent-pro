import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ResponsiveTable from '@/components/ui/responsive-table';
import { 
  Edit, 
  Trash2, 
  UserCheck,
  Calendar,
  Mail,
  Phone,
  Search,
  Building2
} from 'lucide-react';
import { ClientTableProps, Client } from '../types';
import { ClientManagementService } from '../services/clientManagementService';

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  loading,
  searchTerm,
  onSearchChange,
  onEditClient,
  onToggleStatus,
  onDeleteClient
}) => {
  // Filter clients based on search term
  const filteredClients = ClientManagementService.filterClients(clients, searchTerm);

  // Convert clients to the format expected by ResponsiveTable
  const tableData = filteredClients.map(client => ({
    ...client,
    // Ensure all values are properly typed for the table
    id: client.id,
    user_id: client.user_id,
    company_name: client.company_name,
    email: client.email,
    phone: client.phone,
    plan_type: client.plan_type,
    subscription_start: client.subscription_start,
    subscription_end: client.subscription_end,
    is_active: client.is_active,
    created_at: client.created_at,
    role: client.role || 'user'
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando clientes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#3a0caa]" />
          <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Gestión de Clientes</span>
        </CardTitle>
        <CardDescription>
          Administra todos los clientes de la plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ResponsiveTable
          columns={[
            {
              key: 'company_name',
              label: 'Cliente',
              render: (value, row) => (
                <div>
                  <div className="font-medium">{String(value || '')}</div>
                  <div className="text-sm text-gray-500">{String(row.email || '')}</div>
                </div>
              )
            },
            {
              key: 'email',
              label: 'Contacto',
              render: (value, row) => (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3" />
                    {String(value || '')}
                  </div>
                  {row.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      {String(row.phone || '')}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'plan_type',
              label: 'Plan',
              render: (value) => (
                <Badge className={ClientManagementService.getPlanBadgeColor(String(value || ''))}>
                  {String(value || '').toUpperCase()}
                </Badge>
              )
            },
            {
              key: 'role',
              label: 'Rol',
              render: (value) => (
                <Badge className={ClientManagementService.getRoleBadgeColor(String(value || 'user'))}>
                  {String(value || 'user').toUpperCase()}
                </Badge>
              )
            },
            {
              key: 'created_at',
              label: 'Fecha Registro',
              render: (value) => (
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {new Date(String(value || '')).toLocaleDateString()}
                </div>
              ),
              hideOnMobile: true
            },
            {
              key: 'is_active',
              label: 'Estado',
              render: (value) => (
                <Badge variant={value ? "default" : "secondary"}>
                  {value ? "Activo" : "Inactivo"}
                </Badge>
              )
            }
          ]}
          data={tableData}
          actions={[
            {
              label: 'Editar',
              icon: Edit,
              onClick: (client) => onEditClient(client as unknown as Client)
            },
            {
              label: 'Cambiar Estado',
              icon: UserCheck,
              onClick: (client) => onToggleStatus(String(client.id), Boolean(client.is_active))
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              onClick: (client) => onDeleteClient(String(client.id)),
              variant: 'destructive'
            }
          ]}
          emptyMessage="No se encontraron clientes"
        />
      </CardContent>
    </Card>
  );
};
