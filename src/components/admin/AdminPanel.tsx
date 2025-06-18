
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ClientManagement from './ClientManagement';
import GeneralStats from './GeneralStats';
import ClientStats from './ClientStats';
import AdminSettings from './AdminSettings';
import SupportMessages from './SupportMessages';
import { 
  Users, 
  BarChart3, 
  UserCheck, 
  Settings, 
  MessageSquare 
} from 'lucide-react';

interface AdminPanelProps {
  user: User;
}

const AdminPanel = ({ user }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('clients');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">Gestión general de la plataforma ChatBot AI</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="general-stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estadísticas Generales
            </TabsTrigger>
            <TabsTrigger value="client-stats" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Stats por Cliente
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Soporte
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="general-stats">
            <GeneralStats />
          </TabsContent>

          <TabsContent value="client-stats">
            <ClientStats />
          </TabsContent>

          <TabsContent value="support">
            <SupportMessages />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
