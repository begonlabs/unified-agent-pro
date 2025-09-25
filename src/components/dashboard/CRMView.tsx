import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Users,
  Mail,
  Phone,
  Calendar,
  Edit,
  Facebook,
  Instagram,
  MessageCircle,
  User,
  MapPin,
  Globe,
  FileText,
  Flag,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRefreshListener } from '@/hooks/useDataRefresh';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  phone_country_code?: string;
  status: string;
  custom_status?: string;
  country?: string;
  address?: string;
  city?: string;
  notes?: string;
  tags?: string[];
  last_interaction?: string;
  created_at: string;
  source?: string;
}

// Función para extraer código de país y número del teléfono
const parsePhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) return { countryCode: '+1', number: '' };
  
  const match = phoneNumber.match(/^(\+\d{1,4})\s?(.*)$/);
  if (match) {
    return { countryCode: match[1], number: match[2] };
  }
  
  return { countryCode: '+1', number: phoneNumber };
};

const CRMView = () => {
  console.log('CRMView: Component is rendering!');
  
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'lead',
    custom_status: '',
    country: '',
    address: '',
    city: '',
    notes: '',
    tags: [] as string[]
  });
  const { toast } = useToast();
  
  console.log('CRMView: User ID:', user?.id, 'Loading:', loading, 'Clients count:', clients.length);

  // 🔄 Escuchar eventos de refresh de datos
  useRefreshListener(
    async () => {
      console.log('🔄 CRMView: Refreshing clients data');
      await fetchClients();
    },
    'crm'
  );

  // Función para obtener clientes
  const fetchClients = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔍 Fetching clients for user:', user.id);
      
      const { data } = await supabaseSelect(
        supabase
          .from('crm_clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      );
      
      console.log('👥 Clients fetched:', data?.length || 0);
      setClients(data || []);
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "No se pudieron cargar los clientes");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);


  const updateClientStatus = async (clientId: string, status: string) => {
    try {
      // Verificar que el usuario esté autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast({
          title: "Error de autenticación",
          description: "Debes estar autenticado para actualizar clientes",
          variant: "destructive",
        });
        return;
      }

      // Verificar que el cliente pertenezca al usuario
      const { data: clientCheck } = await supabase
        .from('crm_clients')
        .select('user_id')
        .eq('id', clientId)
        .eq('user_id', user.id)
        .single();

      if (!clientCheck) {
        toast({
          title: "Error de permisos",
          description: "No tienes permisos para actualizar este cliente",
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Updating client status for user:', user.id, 'client:', clientId);
      
      const { error } = await supabase
        .from('crm_clients')
        .update({ status })
        .eq('id', clientId)
        .eq('user_id', user.id);

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, status } : client
      ));
      
      toast({
        title: "Estado actualizado",
        description: "El estado del cliente ha sido actualizado",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    const fullPhone = client.phone_country_code && client.phone 
      ? `${client.phone_country_code} ${client.phone}`
      : client.phone || '';
    
    setEditForm({
      name: client.name,
      email: client.email || '',
      phone: fullPhone,
      status: client.status,
      custom_status: client.custom_status || '',
      country: client.country || '',
      address: client.address || '',
      city: client.city || '',
      notes: client.notes || '',
      tags: client.tags || []
    });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingClient(null);
    setEditForm({
      name: '',
      email: '',
      phone: '',
      status: 'lead',
      custom_status: '',
      country: '',
      address: '',
      city: '',
      notes: '',
      tags: []
    });
  };

  const updateClient = async () => {
    if (!editingClient || !user?.id) return;

    try {
      const { countryCode, number } = parsePhoneNumber(editForm.phone);
      
      const { error } = await supabase
        .from('crm_clients')
        .update({
          name: editForm.name,
          email: editForm.email || null,
          phone: number || null,
          phone_country_code: countryCode,
          status: editForm.status,
          custom_status: editForm.custom_status || null,
          country: editForm.country || null,
          address: editForm.address || null,
          city: editForm.city || null,
          notes: editForm.notes || null,
          tags: editForm.tags
        })
        .eq('id', editingClient.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === editingClient.id 
          ? { 
              ...client, 
              ...editForm,
              phone: number,
              phone_country_code: countryCode
            }
          : client
      ));
      
      closeEditDialog();
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados correctamente",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead':
        return 'bg-yellow-100 text-yellow-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  // Función para generar CSV
  const generateCSV = (clients: Client[]) => {
    const headers = [
      'Nombre',
      'Email',
      'Teléfono',
      'Código País',
      'Estado',
      'Estado Personalizado',
      'País',
      'Ciudad',
      'Dirección',
      'Notas',
      'Origen',
      'Fecha Registro'
    ];

    const csvContent = [
      headers.join(','),
      ...clients.map(client => [
        `"${client.name}"`,
        `"${client.email || ''}"`,
        `"${client.phone || ''}"`,
        `"${client.phone_country_code || ''}"`,
        `"${client.status}"`,
        `"${client.custom_status || ''}"`,
        `"${client.country || ''}"`,
        `"${client.city || ''}"`,
        `"${client.address || ''}"`,
        `"${client.notes || ''}"`,
        `"${client.source || 'manual'}"`,
        `"${new Date(client.created_at).toLocaleDateString('es-ES')}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  // Función para generar Excel (usando formato CSV con extensión .xlsx)
  const generateExcel = (clients: Client[]) => {
    // Para simplificar, generamos un CSV que se puede abrir en Excel
    // En una implementación más avanzada se podría usar una librería como xlsx
    return generateCSV(clients);
  };

  // Función para descargar archivo
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Función para exportar como CSV
  const exportToCSV = () => {
    try {
      const csvContent = generateCSV(filteredClients);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clientes_${timestamp}.csv`;
      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
      
      toast({
        title: "Exportación exitosa",
        description: `${filteredClients.length} clientes exportados a CSV`,
      });
    } catch (error) {
      toast({
        title: "Error de exportación",
        description: "No se pudo generar el archivo CSV",
        variant: "destructive",
      });
    }
  };

  // Función para exportar como Excel
  const exportToExcel = () => {
    try {
      const excelContent = generateExcel(filteredClients);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clientes_${timestamp}.xlsx`;
      downloadFile(excelContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      toast({
        title: "Exportación exitosa",
        description: `${filteredClients.length} clientes exportados a Excel`,
      });
    } catch (error) {
      toast({
        title: "Error de exportación",
        description: "No se pudo generar el archivo Excel",
        variant: "destructive",
      });
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesSource = filterSource === 'all' || client.source === filterSource;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  // useEffect para inicializar clientes
  useEffect(() => {
    if (user?.id) {
      fetchClients();
    }
  }, [user?.id, fetchClients]);

  const clientStats = {
    total: clients.length,
    leads: clients.filter(c => c.status === 'lead').length,
    prospects: clients.filter(c => c.status === 'prospect').length,
    active: clients.filter(c => c.status === 'client').length,
    inactive: clients.filter(c => c.status === 'inactive').length
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <Users className="h-6 w-6 sm:h-7 sm:w-7" />
                CRM - Gestión de Clientes
              </h1>
              <p className="text-white/80 text-sm">
                Administra tus leads, prospectos y clientes
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 text-center">
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{clientStats.total}</div>
                <div className="text-xs text-white/80">Total</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-200">{clientStats.leads}</div>
                <div className="text-xs text-white/80">Leads</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-200">{clientStats.prospects}</div>
                <div className="text-xs text-white/80">Prospectos</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-200">{clientStats.active}</div>
                <div className="text-xs text-white/80">Activos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Base de Clientes
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Los clientes se crean automáticamente cuando reciben mensajes
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 bg-gray-50 text-sm sm:text-base"
                />
              </div>
              
              <div className="flex gap-2 sm:gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-32 lg:w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospecto</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-full sm:w-32 lg:w-40">
                    <SelectValue placeholder="Origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>

                {/* Botón de exportación */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    disabled={filteredClients.length === 0}
                    className="h-8 text-xs sm:text-sm"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToExcel}
                    disabled={filteredClients.length === 0}
                    className="h-8 text-xs sm:text-sm"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando clientes...</p>
                  </div>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No hay clientes</h3>
                  <p className="text-sm">
                    {searchTerm || filterStatus !== 'all' || filterSource !== 'all'
                      ? 'No se encontraron clientes con los filtros aplicados'
                      : 'Los clientes aparecerán aquí cuando envíen mensajes'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 p-3 sm:p-6">
                  {filteredClients.map((client) => (
                    <Card key={client.id} className="hover:shadow-md transition-all duration-200">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                              <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-sm sm:text-base">
                                {client.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <h3 className="font-semibold text-base sm:text-lg truncate">{client.name}</h3>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  {getSourceIcon(client.source)}
                                  <Badge 
                                    className={`${getStatusColor(client.status)} text-xs`}
                                    variant="secondary"
                                  >
                                    {client.custom_status || client.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                {client.email && (
                                  <div className="flex items-center gap-1 truncate">
                                    <Mail className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{client.email}</span>
                                  </div>
                                )}
                                {client.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    <span className="flex items-center gap-1">
                                      {client.phone_country_code && (
                                        <span className="text-xs">{client.phone_country_code}</span>
                                      )}
                                      {client.phone}
                                    </span>
                                  </div>
                                )}
                                {client.country && (
                                  <div className="flex items-center gap-1">
                                    <Globe className="h-3 w-3 flex-shrink-0" />
                                    {client.country}
                                  </div>
                                )}
                                {client.city && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    {client.city}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  {new Date(client.created_at).toLocaleDateString('es-ES')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(client)}
                              className="h-8 text-xs sm:text-sm"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Select 
                              value={client.status} 
                              onValueChange={(value) => updateClientStatus(client.id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-28 lg:w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lead">Lead</SelectItem>
                                <SelectItem value="prospect">Prospecto</SelectItem>
                                <SelectItem value="client">Cliente</SelectItem>
                                <SelectItem value="inactive">Inactivo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-sm sm:text-base">Nombre</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del cliente"
                className="text-sm sm:text-base"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
                className="text-sm sm:text-base"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-phone" className="text-sm sm:text-base">Teléfono</Label>
              <PhoneInput
                placeholder="Ingresa número de teléfono"
                value={editForm.phone}
                onChange={(value) => setEditForm(prev => ({ ...prev, phone: value || '' }))}
                defaultCountry="US"
                international
                countryCallingCodeEditable={false}
                className="text-sm sm:text-base"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="edit-country" className="text-sm sm:text-base">País</Label>
                <Input
                  id="edit-country"
                  value={editForm.country}
                  onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="País del cliente"
                  className="text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="edit-city" className="text-sm sm:text-base">Ciudad</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Ciudad del cliente"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-address" className="text-sm sm:text-base">Dirección</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa del cliente"
                className="text-sm sm:text-base"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label htmlFor="edit-status" className="text-sm sm:text-base">Estado</Label>
                <Select 
                  value={editForm.status} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospecto</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-custom-status" className="text-sm sm:text-base">Estado Personalizado</Label>
                <Input
                  id="edit-custom-status"
                  value={editForm.custom_status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, custom_status: e.target.value }))}
                  placeholder="Ej: Cliente VIP, En proceso..."
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-notes" className="text-sm sm:text-base">Notas</Label>
              <textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales sobre el cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base min-h-[80px] resize-none"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-3 sm:pt-4">
            <Button variant="outline" onClick={closeEditDialog} className="w-full sm:w-auto text-sm sm:text-base">
              Cancelar
            </Button>
            <Button onClick={updateClient} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm sm:text-base">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMView;
