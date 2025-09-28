import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CRMService } from '../services/crmService';
import { Client } from '../types';

export const useExport = () => {
  const { toast } = useToast();

  const exportToCSV = useCallback((clients: Client[]) => {
    try {
      const csvContent = CRMService.generateCSV(clients);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clientes_${timestamp}.csv`;
      CRMService.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
      
      toast({
        title: "Exportación exitosa",
        description: `${clients.length} clientes exportados a CSV`,
      });
    } catch (error) {
      toast({
        title: "Error de exportación",
        description: "No se pudo generar el archivo CSV",
        variant: "destructive",
      });
    }
  }, [toast]);

  const exportToExcel = useCallback((clients: Client[]) => {
    try {
      const excelContent = CRMService.generateExcel(clients);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `clientes_${timestamp}.xlsx`;
      CRMService.downloadFile(excelContent, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      toast({
        title: "Exportación exitosa",
        description: `${clients.length} clientes exportados a Excel`,
      });
    } catch (error) {
      toast({
        title: "Error de exportación",
        description: "No se pudo generar el archivo Excel",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    exportToCSV,
    exportToExcel
  };
};
