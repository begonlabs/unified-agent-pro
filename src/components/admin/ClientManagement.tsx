
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin } from '@/integrations/supabase/client';
import { supabaseSelect, handleSupabaseError } from '@/lib/supabaseUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import ResponsiveTable from '@/components/ui/responsive-table';
import { 
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

      // Obtener clientes usando service role (sin roles por ahora, hasta que se cree la tabla)
      const { data: profiles, error: profilesError } = await supabaseSelect(
        supabaseAdmin
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
      setIsUpdating(true);
      
      // Primero obtener el perfil para asegurar que existe
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, company_name, is_active')
        .eq('id', clientId)
        .single();

      if (fetchError) throw fetchError;
      if (!profile) throw new Error('Cliente no encontrado');

      // Actualizar el estado is_active usando service role
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (updateError) throw updateError;

      toast({
        title: "Estado actualizado",
        description: `${profile.company_name} ha sido ${!currentStatus ? 'activado' : 'desactivado'} exitosamente.`,
      });
      
      fetchClients();
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "Error al actualizar estado");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
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
      setIsUpdating(true);
      
      // Validar datos requeridos
      if (!editForm.company_name.trim() || !editForm.email.trim()) {
        toast({
          title: "Error de validación",
          description: "El nombre de la empresa y el email son obligatorios.",
          variant: "destructive",
        });
        return;
      }

      // Actualizar perfil usando service role
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          company_name: editForm.company_name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone?.trim() || null,
          plan_type: editForm.plan_type,
          is_active: editForm.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingClient.id);

      if (profileError) throw profileError;

      // TODO: Implementar actualización de roles cuando se cree la tabla
      // Por ahora solo mostramos el rol seleccionado pero no lo guardamos

      toast({
        title: "Cliente actualizado",
        description: `${editForm.company_name} ha sido actualizado correctamente`,
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
    } finally {
      setIsUpdating(false);
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
      setIsDeleting(true);
      
      // Primero obtener el perfil para obtener el user_id usando service role
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, user_id, company_name')
        .eq('id', deleteClientId)
        .single();

      if (fetchError) throw fetchError;
      if (!profile) throw new Error('Cliente no encontrado');

      const companyName = profile.company_name;
      const userId = profile.user_id;

      // Eliminar el perfil primero usando service role (esto activará el CASCADE en la base de datos)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', deleteClientId);

      if (profileError) throw profileError;

      // Eliminar el usuario del auth de Supabase usando service role
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.warn('Error al eliminar usuario del auth:', authError);
        // No lanzamos error aquí porque el perfil ya se eliminó
        // Solo mostramos una advertencia en el toast
        toast({
          title: "Cliente eliminado parcialmente",
          description: `${companyName} ha sido eliminado del perfil, pero puede haber quedado en el sistema de autenticación.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cliente eliminado",
          description: `${companyName} ha sido eliminado completamente del sistema.`,
        });
      }
      
      closeDeleteDialog();
      fetchClients();
    } catch (error: unknown) {
      const errorInfo = handleSupabaseError(error, "Error al eliminar cliente");
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
                  <Badge className={getPlanBadge(String(value || ''))}>
                    {String(value || '').toUpperCase()}
                  </Badge>
                )
              },
              {
                key: 'role',
                label: 'Rol',
                render: (value) => (
                  <Badge className={getRoleBadge(String(value || 'user'))}>
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
                onClick: (client) => openEditDialog(client as unknown as Client)
              },
              {
                label: 'Cambiar Estado',
                icon: UserCheck,
                onClick: (client) => toggleClientStatus(String(client.id), Boolean(client.is_active))
              },
              {
                label: 'Eliminar',
                icon: Trash2,
                onClick: (client) => openDeleteDialog(String(client.id)),
                variant: 'destructive'
              }
            ]}
            emptyMessage="No se encontraron clientes"
          />
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
            <Button 
              onClick={updateClient} 
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
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
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientManagement;
