import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Save } from 'lucide-react';
import { AIConfig } from '../types';

interface AIAgentHeaderProps {
  config: AIConfig;
  loading: boolean;
  saving: boolean;
  autoSaving?: boolean;
  onSave: () => void;
}

export const AIAgentHeader: React.FC<AIAgentHeaderProps> = ({
  config,
  loading,
  saving,
  autoSaving = false,
  onSave
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-12 lg:mt-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-r from-[#3a0caa] to-[#710db2]">
          <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">
            Mi Agente IA
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Configura y entrena tu asistente inteligente
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <Badge 
          variant={config.is_active ? "default" : "secondary"} 
          className="text-xs sm:text-sm w-fit"
        >
          {config.is_active ? "Activo" : "Inactivo"}
        </Badge>
        
        {autoSaving && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Save className="h-3 w-3 animate-pulse" />
            <span>Guardando cambios...</span>
          </div>
        )}
        
        <Button 
          onClick={onSave} 
          disabled={loading || saving || autoSaving} 
          className="w-full sm:w-auto text-sm sm:text-base bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white"
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
};
