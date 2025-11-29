import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Brain, Upload, FileText, Building2, Loader2 } from 'lucide-react';
import { SectionStatus } from '../shared/SectionStatus';
import { WebsiteScraperModal } from '../WebsiteScraperModal';
import { BusinessInfoService } from '@/services/businessInfoService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeTabProps {
  knowledgeBase: string;
  commonQuestions: string;
  onKnowledgeBaseChange: (knowledge: string) => void;
  onCommonQuestionsChange: (questions: string) => void;
}

export const KnowledgeTab: React.FC<KnowledgeTabProps> = ({
  knowledgeBase,
  commonQuestions,
  onKnowledgeBaseChange,
  onCommonQuestionsChange
}) => {
  const [isScraperOpen, setIsScraperOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isCompleted = !!knowledgeBase.trim();

  const handleSaveScrapedData = (data: string) => {
    const newKnowledge = knowledgeBase
      ? `${knowledgeBase}\n\n${data}`
      : data;
    onKnowledgeBaseChange(newKnowledge);
  };

  const handleImportBusinessInfo = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'Usuario no autenticado',
        variant: 'destructive'
      });
      return;
    }

    setIsImporting(true);

    try {
      // Obtener canales conectados
      const { data: channels, error } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_connected', true);

      if (error) throw error;

      if (!channels || channels.length === 0) {
        toast({
          title: 'Sin canales',
          description: 'No tienes canales conectados. Conecta Facebook, Instagram o WhatsApp primero.',
          variant: 'destructive'
        });
        return;
      }

      let importedCount = 0;

      // Importar de cada canal
      for (const channel of channels) {
        let pageId: string | undefined;
        let accessToken: string | undefined;
        const config = channel.channel_config as any;

        // Extraer datos según tipo de canal
        if (channel.channel_type === 'facebook') {
          pageId = config?.page_id;
          accessToken = config?.page_access_token;
        } else if (channel.channel_type === 'instagram') {
          pageId = config?.instagram_business_account_id;
          accessToken = config?.access_token;
        } else if (channel.channel_type === 'whatsapp') {
          pageId = config?.phone_number_id;
          accessToken = config?.access_token;
        }

        if (pageId && accessToken) {
          const result = await BusinessInfoService.importBusinessInfo(
            user.id,
            channel.id,
            channel.channel_type as 'facebook' | 'instagram' | 'whatsapp',
            pageId,
            accessToken
          );

          if (result.success) {
            importedCount++;
          }
        }
      }

      if (importedCount > 0) {
        toast({
          title: '¡Importación exitosa!',
          description: `Se importó información de ${importedCount} canal(es). Revisa la base de conocimiento.`,
        });

        // Recargar la página para ver los cambios en la knowledge base
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: 'Sin datos',
          description: 'No se pudo extraer información de los canales conectados.',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Error importing business info:', error);
      toast({
        title: 'Error',
        description: 'No se pudo importar la información del negocio',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionStatus
        title="Estado: Base de Conocimiento"
        completed={isCompleted}
        icon={Brain}
        iconColor="text-purple-600"
      />

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Base de Conocimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="space-y-2">
            <Label htmlFor="knowledge" className="text-sm sm:text-base">
              Información y Documentos para Entrenar la IA
            </Label>
            <Textarea
              id="knowledge"
              placeholder="Pega aquí información sobre tu empresa, productos, servicios, políticas, etc. También puedes incluir ejemplos de conversaciones exitosas..."
              rows={8}
              value={knowledgeBase}
              onChange={(e) => onKnowledgeBaseChange(e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-not-allowed opacity-60">
              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs sm:text-sm text-gray-600">Subir Documentos</p>
              <p className="text-xs text-gray-400">PDF, DOC, TXT (Próximamente)</p>
            </div>

            <div
              className="p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors group"
              onClick={() => setIsScraperOpen(true)}
            >
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2 group-hover:text-purple-500 transition-colors" />
              <p className="text-xs sm:text-sm text-gray-600 group-hover:text-purple-700 font-medium">Conectar Website</p>
              <p className="text-xs text-gray-400">Importar contenido web con IA</p>
            </div>

            <div
              className="p-3 sm:p-4 border-2 border-dashed border-blue-300 rounded-lg text-center cursor-pointer hover:bg-blue-50 transition-colors group"
              onClick={handleImportBusinessInfo}
            >
              {isImporting ? (
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-2 animate-spin" />
              ) : (
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mx-auto mb-2 group-hover:text-blue-600 transition-colors" />
              )}
              <p className="text-xs sm:text-sm text-gray-600 group-hover:text-blue-700 font-medium">
                {isImporting ? 'Importando...' : 'Importar de Canales'}
              </p>
              <p className="text-xs text-gray-400">Extraer info de FB/IG/WA</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="common-questions" className="text-sm sm:text-base">
              Preguntas Frecuentes de tus Clientes
            </Label>
            <Textarea
              id="common-questions"
              placeholder="Lista las preguntas más comunes que reciben de tus clientes..."
              rows={4}
              value={commonQuestions}
              onChange={(e) => onCommonQuestionsChange(e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>
        </CardContent>
      </Card>

      <WebsiteScraperModal
        open={isScraperOpen}
        onOpenChange={setIsScraperOpen}
        onSave={handleSaveScrapedData}
      />
    </div>
  );
};
