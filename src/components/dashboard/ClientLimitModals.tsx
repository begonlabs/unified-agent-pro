import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClientQuotaCheck } from '@/hooks/useClientQuotaCheck';
import { AlertTriangle, XOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ClientLimitModals: React.FC = () => {
  const { quotaStatus, clientCount, clientLimit, isLoading, dismissWarning } = useClientQuotaCheck();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && quotaStatus !== 'ok') {
      setIsOpen(true);
    }
  }, [quotaStatus, isLoading]);

  if (isLoading || quotaStatus === 'ok') return null;

  const handleDismissWarning = () => {
    dismissWarning(); // Saves in localStorage so it doesn't pop up again today
    setIsOpen(false);
  };

  const handleDismissCriticalTemporary = () => {
    setIsOpen(false);
    // Does NOT save to localStorage, will reappear on refresh to persistently warn them
    navigate('/dashboard?view=crm');
  };

  const handleUpgradePlan = () => {
    setIsOpen(false);
    navigate('/dashboard?view=settings'); // O a la pestaña de facturación/perfil
  };

  const isCritical = quotaStatus === 'critical';

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className={isCritical ? "border-red-500/50" : "border-amber-500/50"}>
        <AlertDialogHeader className="flex flex-col items-center gap-4 text-center">
          {isCritical ? (
            <div className="p-3 bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
              <XOctagon className="h-10 w-10" />
            </div>
          ) : (
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="h-10 w-10" />
            </div>
          )}
          <AlertDialogTitle className="text-xl">
            {isCritical ? "Límite de Contactos Alcanzado" : "Advertencia de Límite Próximo"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {isCritical ? (
              <span className="block text-foreground mt-2">
                Has alcanzado el máximo de contactos permitidos por tu plan actual <strong>({clientCount}/{clientLimit})</strong>. 
                <br /><br />
                <span className="text-red-600 dark:text-red-400 font-medium">No se procesarán nuevos mensajes de clientes desconocidos</span> hasta que liberes espacio o aumentes tu plan.
              </span>
            ) : (
              <span className="block text-foreground mt-2">
                Se ha alcanzado el 80% de los contactos que permite tu plan <strong>({clientCount}/{clientLimit})</strong>. 
                <br /><br />
                Te recomendamos aumentar tu plan para no presentar interrupciones en el servicio, o eliminar contactos que no necesitas en tu CRM. Por cualquier consulta puedes comunicarte con soporte.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="w-full flex sm:flex-row flex-col gap-2 mt-4 sm:space-x-0">
          {isCritical ? (
            <>
              <Button variant="outline" onClick={handleDismissCriticalTemporary} className="w-full sm:w-1/2">
                Ir al CRM (Limpiar)
              </Button>
              <Button variant="default" onClick={handleUpgradePlan} className="w-full sm:w-1/2 bg-red-600 hover:bg-red-700 text-white">
                Mejorar Plan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleDismissWarning} className="w-full sm:w-1/2">
                Entendido
              </Button>
              <Button variant="default" onClick={handleUpgradePlan} className="w-full sm:w-1/2 bg-amber-500 hover:bg-amber-600 text-white">
                Mejorar Plan
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
