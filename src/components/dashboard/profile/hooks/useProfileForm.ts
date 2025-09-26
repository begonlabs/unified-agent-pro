import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Profile, ProfileFormData, User } from '../types';
import { ProfileService } from '../services/profileService';

export const useProfileForm = (profile: Profile | null, user: User | null, onProfileUpdate: () => void) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    company_name: '',
    email: '',
    phone: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Inicializar datos del formulario cuando el perfil cambie
  useEffect(() => {
    if (profile) {
      const fullPhone = profile.phone_country_code && profile.phone 
        ? `${profile.phone_country_code} ${profile.phone}`
        : profile.phone || '';
      
      setProfileData({
        company_name: profile.company_name || '',
        email: profile.email || '',
        phone: fullPhone,
        country: profile.country || 'US'
      });
    }
  }, [profile]);

  const updateProfile = useCallback(async () => {
    const validation = ProfileService.validateProfile(profileData);
    if (!validation.isValid) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await ProfileService.updateProfile(user?.id, profileData);
      await onProfileUpdate();
      setEditingProfile(false);
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada exitosamente",
      });
    } catch (error: unknown) {
      const errorInfo = ProfileService.handleSupabaseError?.(error, "No se pudo actualizar el perfil") || {
        title: "Error",
        description: "No se pudo actualizar el perfil"
      };
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profileData, user?.id, onProfileUpdate, toast]);

  const cancelEdit = useCallback(() => {
    setEditingProfile(false);
    if (profile) {
      const fullPhone = profile.phone_country_code && profile.phone 
        ? `${profile.phone_country_code} ${profile.phone}`
        : profile.phone || '';
        
      setProfileData({
        company_name: profile.company_name || '',
        email: profile.email || '',
        phone: fullPhone,
        country: profile.country || 'US'
      });
    }
  }, [profile]);

  return {
    editingProfile,
    setEditingProfile,
    profileData,
    setProfileData,
    loading,
    updateProfile,
    cancelEdit
  };
};
