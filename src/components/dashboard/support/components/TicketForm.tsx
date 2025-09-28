import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, MessageSquare } from 'lucide-react';
import { TicketFormProps, PriorityLevel } from '../types';

export const TicketForm: React.FC<TicketFormProps> = ({
  formData,
  loading,
  onSubmit,
  onFormChange
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Crear Nueva Consulta
      </CardTitle>
      <CardDescription>
        Describe tu consulta o problema y nuestro equipo te ayudará
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="subject">Asunto</Label>
          <Input
            id="subject"
            placeholder="Describe brevemente tu consulta"
            value={formData.subject}
            onChange={(e) => onFormChange({ ...formData, subject: e.target.value })}
            required
            maxLength={200}
          />
        </div>

        <div>
          <Label htmlFor="priority">Prioridad</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => onFormChange({ ...formData, priority: value as PriorityLevel })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona la prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="message">Mensaje</Label>
          <Textarea
            id="message"
            placeholder="Proporciona todos los detalles posibles sobre tu consulta o problema..."
            value={formData.message}
            onChange={(e) => onFormChange({ ...formData, message: e.target.value })}
            className="min-h-[120px]"
            required
            maxLength={2000}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white" 
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Crear Consulta
            </>
          )}
        </Button>
      </form>
    </CardContent>
  </Card>
);
