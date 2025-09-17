
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserX, 
  UserCheck,
  Calendar,
  Mail,
  Phone,
  Search,
  Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Client {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  phone: string | null;
  plan_type: string;
  subscription_start: string;
  subscription_end: string | null;
  is_active: boolean;
  created_at: string;
  role?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

// Roles predefinidos hasta que se cree la tabla en Supabase
const PREDEFINED_ROLES: Role[] = [
  { id: 'admin', name: 'admin', description: 'Administrador completo' },
  { id: 'moderator', name: 'moderator', description: 'Moderador' },
  { id: 'user', name: 'user', description: 'Usuario estándar' }
];

const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    company_name: '',
    email: '',
    phone: '',
    plan_type: 'free',
    role: 'user',
    is_active: true
  });
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching clients for management...');

      // Obtener clientes (sin roles por ahora, hasta que se cree la tabla)
      const { data: profiles, error: profilesError } = await supabaseSelect(
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (profilesError) throw profilesError;

      // Asignar rol por defecto 'user' a todos los clientes
      const clientsWithRoles = (profiles || []).map(profile => ({
        ...profile,
        role: 'user' // Rol por defecto hasta implementar la tabla de roles
      }));

      console.log('👥 Clients fetched:', clientsWithRoles.length);
      setClients(clientsWithRoles);
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "Error al cargar clientes");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const toggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Cliente ${!currentStatus ? 'activado' : 'desactivado'} exitosamente.`,
      });
      
      fetchClients();
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "Error al actualizar estado");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      company_name: client.company_name,
      email: client.email,
      phone: client.phone || '',
      plan_type: client.plan_type,
      role: client.role || 'user',
      is_active: client.is_active
    });
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingClient(null);
    setEditForm({
      company_name: '',
      email: '',
      phone: '',
      plan_type: 'free',
      role: 'user',
      is_active: true
    });
  };

  const updateClient = async () => {
    if (!editingClient) return;

    try {
      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_name: editForm.company_name,
          email: editForm.email,
          phone: editForm.phone || null,
          plan_type: editForm.plan_type,
          is_active: editForm.is_active
        })
        .eq('id', editingClient.id);

      if (profileError) throw profileError;

      // TODO: Implementar actualización de roles cuando se cree la tabla
      // Por ahora solo mostramos el rol seleccionado pero no lo guardamos
      console.log('Rol seleccionado:', editForm.role);

      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente han sido actualizados correctamente",
      });
      
      closeEditDialog();
      fetchClients();
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "Error al actualizar cliente");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (clientId: string) => {
    setDeleteClientId(clientId);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeleteClientId(null);
  };

  const deleteClient = async () => {
    if (!deleteClientId) return;

    try {
      // Eliminar perfil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteClientId);

      if (error) throw error;

      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente",
      });
      
      closeDeleteDialog();
      fetchClients();
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "Error al eliminar cliente");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      premium: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[plan as keyof typeof colors] || colors.free;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-orange-100 text-orange-800',
      user: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || colors.user;
  };

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.phone && client.phone.includes(searchTerm))
  );

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Gestión de Clientes
          </CardTitle>
          <CardDescription>
            Administra todos los clientes de la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.company_name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlanBadge(client.plan_type)}>
                        {client.plan_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadge(client.role || 'user')}>
                        {(client.role || 'user').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(client)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleClientStatus(client.id, client.is_active)}
                          >
                            {client.is_active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => openDeleteDialog(client.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-company">Empresa</Label>
              <Input
                id="edit-company"
                value={editForm.company_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Nombre de la empresa"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@ejemplo.com"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 234 567 8900"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-plan">Plan</Label>
              <Select 
                value={editForm.plan_type} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, plan_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-role">Rol</Label>
              <Select 
                value={editForm.role} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_ROLES.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name} - {role.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit-active">Cliente activo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancelar
            </Button>
            <Button onClick={updateClient} className="bg-blue-600 hover:bg-blue-700">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteClient}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientManagement;
