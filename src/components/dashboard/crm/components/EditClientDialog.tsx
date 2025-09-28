import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { EditClientDialogProps } from '../types';

export const EditClientDialog: React.FC<EditClientDialogProps> = ({
  isOpen,
  client,
  formData,
  onClose,
  onSave,
  onFormChange
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">Editar Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <Label htmlFor="edit-name" className="text-sm sm:text-base">Nombre</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="Nombre del cliente"
              className="text-sm sm:text-base"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-email" className="text-sm sm:text-base">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
              placeholder="email@ejemplo.com"
              className="text-sm sm:text-base"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-phone" className="text-sm sm:text-base">Teléfono</Label>
            <PhoneInput
              placeholder="Ingresa número de teléfono"
              value={formData.phone}
              onChange={(value) => onFormChange({ ...formData, phone: value || '' })}
              defaultCountry="US"
              international
              countryCallingCodeEditable={false}
              className="text-sm sm:text-base"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="edit-country" className="text-sm sm:text-base">País</Label>
              <Input
                id="edit-country"
                value={formData.country}
                onChange={(e) => onFormChange({ ...formData, country: e.target.value })}
                placeholder="País del cliente"
                className="text-sm sm:text-base"
              />
            </div>
            <div>
              <Label htmlFor="edit-city" className="text-sm sm:text-base">Ciudad</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => onFormChange({ ...formData, city: e.target.value })}
                placeholder="Ciudad del cliente"
                className="text-sm sm:text-base"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-address" className="text-sm sm:text-base">Dirección</Label>
            <Input
              id="edit-address"
              value={formData.address}
              onChange={(e) => onFormChange({ ...formData, address: e.target.value })}
              placeholder="Dirección completa del cliente"
              className="text-sm sm:text-base"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label htmlFor="edit-status" className="text-sm sm:text-base">Estado</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => onFormChange({ ...formData, status: value })}
              >
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospecto</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-custom-status" className="text-sm sm:text-base">Estado Personalizado</Label>
              <Input
                id="edit-custom-status"
                value={formData.custom_status}
                onChange={(e) => onFormChange({ ...formData, custom_status: e.target.value })}
                placeholder="Ej: Cliente VIP, En proceso..."
                className="text-sm sm:text-base"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-notes" className="text-sm sm:text-base">Notas</Label>
            <textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => onFormChange({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales sobre el cliente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base min-h-[80px] resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-3 sm:pt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm sm:text-base">
            Cancelar
          </Button>
          <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm sm:text-base">
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
