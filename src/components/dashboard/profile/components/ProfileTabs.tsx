import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User2,
  CreditCard,
  Bell,
  Shield
} from 'lucide-react';

interface ProfileTabsProps {
  children: React.ReactNode;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ children }) => {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white shadow-sm h-auto">
        <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3a0caa]/10 data-[state=active]:to-[#710db2]/10 data-[state=active]:text-[#3a0caa] py-3 sm:py-2">
          <User2 className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Perfil</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3a0caa]/10 data-[state=active]:to-[#710db2]/10 data-[state=active]:text-[#3a0caa] py-3 sm:py-2">
          <Bell className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Notificaciones</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3a0caa]/10 data-[state=active]:to-[#710db2]/10 data-[state=active]:text-[#3a0caa] py-3 sm:py-2">
          <Shield className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Seguridad</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
};
