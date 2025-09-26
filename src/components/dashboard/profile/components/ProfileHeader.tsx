import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { Profile } from '../types';
import { ProfileService } from '../services/profileService';

interface ProfileHeaderProps {
  profile: Profile;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  const PlanIcon = ProfileService.getPlanIcon(profile.plan_type);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto sm:mx-0">
            <AvatarFallback className="text-sm sm:text-lg font-semibold bg-gradient-to-r from-[#3a0caa] to-[#710db2] text-white">
              {ProfileService.getInitials(profile.company_name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.company_name}</h1>
            <p className="text-sm sm:text-base text-gray-600 flex items-center justify-center sm:justify-start gap-1 mt-1">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
              {profile.email}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              Miembro desde {ProfileService.formatDate(profile.created_at)}
            </p>
            {profile.country && (
              <p className="text-xs sm:text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                {profile.country}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <Badge className={`${ProfileService.getPlanColor(profile.plan_type)} border text-xs sm:text-sm`}>
            <PlanIcon className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Plan {profile.plan_type?.charAt(0).toUpperCase()}{profile.plan_type?.slice(1)}</span>
            <span className="sm:hidden">{profile.plan_type?.charAt(0).toUpperCase()}{profile.plan_type?.slice(1)}</span>
          </Badge>
          {profile.is_active ? (
            <Badge variant="default" className="bg-gradient-to-r from-[#3a0caa]/10 to-[#710db2]/10 text-[#3a0caa] border-[#3a0caa]/20 text-xs sm:text-sm">
              <CheckCircle className="h-3 w-3 mr-1" />
              Activo
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs sm:text-sm">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Inactivo
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
