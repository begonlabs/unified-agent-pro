import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { SettingsSaveButtonProps } from '../types';

export const SettingsSaveButton: React.FC<SettingsSaveButtonProps> = ({
  onSave,
  loading = false
}) => {
  return (
    <div className="flex justify-end">
      <Button 
        onClick={onSave} 
        disabled={loading}
        className="flex items-center gap-2 bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Guardando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Guardar Configuración
          </>
        )}
      </Button>
    </div>
  );
};
