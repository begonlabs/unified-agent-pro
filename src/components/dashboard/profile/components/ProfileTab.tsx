import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building, 
  Mail, 
  Phone, 
  Flag, 
  Edit3, 
  Save, 
  X 
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Profile, ProfileFormData } from '../types';

interface ProfileTabProps {
  profile: Profile;
  editingProfile: boolean;
  profileData: ProfileFormData;
  loading: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onProfileDataChange: (data: ProfileFormData) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  editingProfile,
  profileData,
  loading,
  onEdit,
  onSave,
  onCancel,
  onProfileDataChange
}) => {
  return (
    <TabsContent value="profile" className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Información de la Empresa
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Gestiona los datos principales de tu empresa
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {editingProfile ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSave}
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#3a0caa] to-[#710db2] hover:from-[#270a59] hover:to-[#2b0a63] text-white"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Guardar
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="w-full sm:w-auto"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium flex items-center gap-1">
                <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                Nombre de la Empresa *
              </Label>
              <Input
                id="company"
                value={profileData.company_name}
                onChange={(e) => onProfileDataChange({ ...profileData, company_name: e.target.value })}
                disabled={!editingProfile}
                className={`text-sm sm:text-base ${editingProfile ? 'border-blue-300 focus:border-blue-500' : ''}`}
                placeholder="Ej: Mi Empresa S.A."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                Email de Contacto *
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => onProfileDataChange({ ...profileData, email: e.target.value })}
                disabled={!editingProfile}
                className={`text-sm sm:text-base ${editingProfile ? 'border-blue-300 focus:border-blue-500' : ''}`}
                placeholder="contacto@empresa.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                Teléfono de Contacto
              </Label>
              <PhoneInput
                placeholder="Ingresa número de teléfono"
                value={profileData.phone}
                onChange={(value) => onProfileDataChange({ ...profileData, phone: value || '' })}
                disabled={!editingProfile}
                defaultCountry="US"
                international
                countryCallingCodeEditable={false}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium flex items-center gap-1">
                <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
                País
              </Label>
              <Input
                id="country"
                value={profileData.country}
                onChange={(e) => onProfileDataChange({ ...profileData, country: e.target.value })}
                disabled={!editingProfile}
                className={`text-sm sm:text-base ${editingProfile ? 'border-blue-300 focus:border-blue-500' : ''}`}
                placeholder="US, MX, ES, etc."
              />
            </div>
          </div>
          {editingProfile && (
            <div className="text-xs sm:text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
              * Campos obligatorios. La información será utilizada para comunicaciones importantes.
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};
