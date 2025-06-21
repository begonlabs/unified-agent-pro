
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
    <div className="w-64 bg-zinc-800/50 border-r border-zinc-700 backdrop-blur-sm h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-sm">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-white">CHATBOT AI</h1>
            <p className="text-sm font-mono text-zinc-400 tracking-wide">Panel de Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-mono tracking-wider uppercase rounded-sm transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/50'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-700/50 border border-transparent hover:border-zinc-600'
              }`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-400' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Quick Channel Status */}
      <div className="p-4 border-t border-zinc-700 bg-zinc-800/30">
        <h3 className="text-sm font-mono font-medium text-zinc-300 mb-3 uppercase tracking-wider">Canales Conectados</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-mono text-zinc-400">
            <Phone className="h-4 w-4 text-green-400" />
            <span>WhatsApp</span>
            <div className="w-2 h-2 bg-green-400 rounded-full ml-auto animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono text-zinc-400">
            <Facebook className="h-4 w-4 text-blue-400" />
            <span>Facebook</span>
            <div className="w-2 h-2 bg-zinc-600 rounded-full ml-auto"></div>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono text-zinc-400">
            <Instagram className="h-4 w-4 text-pink-400" />
            <span>Instagram</span>
            <div className="w-2 h-2 bg-zinc-600 rounded-full ml-auto"></div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="p-4 border-t border-zinc-700">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-mono tracking-wider uppercase text-zinc-300 hover:text-white border border-zinc-600 hover:border-red-500/50 hover:bg-red-600/10 rounded-sm transition-all duration-300"
          onClick={onSignOut}
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
