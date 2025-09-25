
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientManagement from './ClientManagement';
import GeneralStats from './GeneralStats';
import ClientStats from './ClientStats';
import AdminSettings from './AdminSettings';
import SupportMessages from './SupportMessages';
import SupportStats from './SupportStats';
import { 
  Users, 
  BarChart3, 
  UserCheck, 
  Settings, 
  MessageSquare,
  TrendingUp
} from 'lucide-react';

interface AdminPanelProps {
  user: User;
}

const AdminPanel = ({ user }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('clients');
  const [supportView, setSupportView] = useState('messages');

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Gestión general de la plataforma ChatBot AI</p>
          <div className="mt-4 p-3 sm:p-4 bg-white rounded-lg shadow-sm border">
            <p className="text-sm text-gray-600">
              Conectado como: <span className="font-medium text-gray-900">{user.email}</span>
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile Navigation - Scrollable */}
          <div className="block sm:hidden">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              <TabsTrigger value="clients" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                <Users className="h-4 w-4" />
                <span>Clientes</span>
              </TabsTrigger>
              <TabsTrigger value="general-stats" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                <BarChart3 className="h-4 w-4" />
                <span>Stats</span>
              </TabsTrigger>
              <TabsTrigger value="client-stats" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                <UserCheck className="h-4 w-4" />
                <span>Por Cliente</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                <MessageSquare className="h-4 w-4" />
                <span>Soporte</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
                <Settings className="h-4 w-4" />
                <span>Config</span>
              </TabsTrigger>
            </div>
          </div>

          {/* Desktop Navigation */}
          <TabsList className="hidden sm:grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="clients" className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
              <Users className="h-4 w-4" />
              <span>Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="general-stats" className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
              <BarChart3 className="h-4 w-4" />
              <span>Estadísticas</span>
            </TabsTrigger>
            <TabsTrigger value="client-stats" className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
              <UserCheck className="h-4 w-4" />
              <span>Stats Cliente</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
              <MessageSquare className="h-4 w-4" />
              <span>Soporte</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">
              <Settings className="h-4 w-4" />
              <span>Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="general-stats" className="space-y-6">
            <GeneralStats />
          </TabsContent>

          <TabsContent value="client-stats" className="space-y-6">
            <ClientStats />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <div className="space-y-6">
              {/* Sub-navegación para Soporte */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setSupportView('messages')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    supportView === 'messages'
                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Mensajes
                </button>
                <button
                  onClick={() => setSupportView('stats')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    supportView === 'stats'
                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="h-4 w-4 inline mr-2" />
                  Estadísticas
                </button>
              </div>

              {/* Contenido de Soporte */}
              {supportView === 'messages' && <SupportMessages />}
              {supportView === 'stats' && <SupportStats />}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
