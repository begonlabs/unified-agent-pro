
import React from 'react';
import { 
  MessageSquare, 
  BarChart3, 
  Settings, 
  User, 
  HelpCircle, 
  Bot,
  LogOut,
  Phone,
  Instagram,
  Facebook
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onSignOut: () => void;
}

const menuItems = [
  { id: 'messages', label: 'Mensajes/CRM', icon: MessageSquare },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { id: 'channels', label: 'Canales', icon: Settings },
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'support', label: 'Soporte', icon: HelpCircle },
  { id: 'ai-agent', label: 'Mi Agente IA', icon: Bot },
];

export function AppSidebar({ currentView, setCurrentView, onSignOut }: AppSidebarProps) {
  return (
    <Sidebar className="bg-gray-50 border-gray-200">
      {/* Header */}
      <SidebarHeader className="p-6 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-sm">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">CHATBOT AI</h1>
            <p className="text-xs text-gray-500">Panel de Control</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-md transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Channel Status */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
            Canales Conectados
          </SidebarGroupLabel>
          <SidebarGroupContent className="p-3 bg-white rounded-md border border-gray-200 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-green-500" />
                <span>WhatsApp</span>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Facebook className="h-4 w-4 text-blue-500" />
                <span>Facebook</span>
                <div className="w-2 h-2 bg-gray-400 rounded-full ml-auto"></div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Instagram className="h-4 w-4 text-pink-500" />
                <span>Instagram</span>
                <div className="w-2 h-2 bg-gray-400 rounded-full ml-auto"></div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sign Out */}
      <SidebarFooter className="p-4 border-t border-gray-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 hover:bg-red-50 rounded-md transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
