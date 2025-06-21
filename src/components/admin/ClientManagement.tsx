
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Activity,
  UserCheck,
  UserX,
  Edit
} from 'lucide-react';

interface Client {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    name?: string;
    company?: string;
    phone?: string;
  };
}

const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;
      setClients(data.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.user_metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.user_metadata?.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientInitials = (client: Client) => {
    if (client.user_metadata?.name) {
      return client.user_metadata.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return client.email.substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (client: Client) => {
    // Simulamos el estado basado en la fecha de creación
    const daysSinceCreation = Math.floor((Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreation < 7) {
      return <Badge className="bg-green-600 text-white font-mono">Nuevo</Badge>;
    } else if (daysSinceCreation < 30) {
      return <Badge className="bg-blue-600 text-white font-mono">Activo</Badge>;
    } else {
      return <Badge variant="outline" className="border-zinc-600 text-zinc-300 font-mono">Inactivo</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-zinc-900 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="font-mono text-zinc-400 tracking-wider uppercase">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-mono font-black uppercase tracking-widest text-white">Gestión de Clientes</h2>
          <p className="text-zinc-400 font-mono tracking-wide">
            Administra y supervisa todos los usuarios de la plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 font-mono uppercase tracking-wider">
            <Users className="h-4 w-4 mr-2" />
            Exportar Datos
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">{clients.length}</div>
            <p className="text-xs font-mono text-zinc-400 tracking-wide">Usuarios registrados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Nuevos (7d)</CardTitle>
            <UserCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">
              {clients.filter(c => {
                const daysSince = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
                return daysSince < 7;
              }).length}
            </div>
            <p className="text-xs font-mono text-zinc-400 tracking-wide">Última semana</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Activos</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">
              {clients.filter(c => {
                const daysSince = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
                return daysSince < 30;
              }).length}
            </div>
            <p className="text-xs font-mono text-zinc-400 tracking-wide">Último mes</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-mono font-medium text-zinc-300 uppercase tracking-wider">Inactivos</CardTitle>
            <UserX className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-white">
              {clients.filter(c => {
                const daysSince = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
                return daysSince >= 30;
              }).length}
            </div>
            <p className="text-xs font-mono text-zinc-400 tracking-wide">Más de 30 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-zinc-800/50 border-zinc-700 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-white uppercase tracking-wider">Lista de Clientes</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-400 font-mono"
                />
              </div>
              <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-sm border border-zinc-600 hover:bg-zinc-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={client.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-mono font-bold">
                      {getClientInitials(client)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono font-medium text-white">
                        {client.user_metadata?.name || 'Usuario Sin Nombre'}
                      </h3>
                      {getStatusBadge(client)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-zinc-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                      {client.user_metadata?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.user_metadata.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {client.user_metadata?.company && (
                      <p className="text-sm text-zinc-500 font-mono">
                        {client.user_metadata.company}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500 font-mono">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientManagement;
