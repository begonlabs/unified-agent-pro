
import React from 'react';
import { Button } from '@/components/ui/button';
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

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onSignOut: () => void;
}

const Sidebar = ({ currentView, setCurrentView, onSignOut }: SidebarProps) => {
  const menuItems = [
    { id: 'messages', label: 'Mensajes/CRM', icon: MessageSquare },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'channels', label: 'Canales', icon: Settings },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'support', label: 'Soporte', icon: HelpCircle },
    { id: 'ai-agent', label: 'Mi Agente IA', icon: Bot },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ChatBot AI</h1>
            <p className="text-sm text-gray-500">Panel de Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => setCurrentView(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Quick Channel Status */}
      <div className="p-4 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Canales Conectados</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-green-600" />
            <span>WhatsApp</span>
            <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Facebook className="h-4 w-4 text-blue-600" />
            <span>Facebook</span>
            <div className="w-2 h-2 bg-gray-400 rounded-full ml-auto"></div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Instagram className="h-4 w-4 text-pink-600" />
            <span>Instagram</span>
            <div className="w-2 h-2 bg-gray-400 rounded-full ml-auto"></div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={onSignOut}
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
