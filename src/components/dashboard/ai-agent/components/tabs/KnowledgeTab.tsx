import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Upload, FileText } from 'lucide-react';
import { SectionStatus } from '../shared/SectionStatus';
import { WebsiteScraperModal } from '../WebsiteScraperModal';

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
  const isCompleted = !!knowledgeBase.trim();

  const handleSaveScrapedData = (data: string) => {
    const newKnowledge = knowledgeBase
      ? `${knowledgeBase}\n\n${data}`
      : data;
    onKnowledgeBaseChange(newKnowledge);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
