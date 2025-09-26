import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { 
  useProfile,
  useProfileForm,
  useNotifications,
  ProfileHeader,
  ProfileTabs,
  ProfileTab,
  SubscriptionTab,
  NotificationsTab,
  SecurityTab,
  ChangePasswordDialog,
  ProfileViewProps
} from './index';
import { ProfileService } from './services/profileService';

const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
  const { profile, loading, fetchProfile } = useProfile(user);
  const { notifications, updateNotificationSetting } = useNotifications();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const {
    editingProfile,
    setEditingProfile,
    profileData,
    setProfileData,
    loading: formLoading,
    updateProfile,
    cancelEdit
  } = useProfileForm(profile, user, fetchProfile);

  if (!profile) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      <ProfileHeader profile={profile} />

      <ProfileTabs>
        <ProfileTab
          profile={profile}
          editingProfile={editingProfile}
          profileData={profileData}
          loading={formLoading}
          onEdit={() => setEditingProfile(true)}
          onSave={updateProfile}
          onCancel={cancelEdit}
          onProfileDataChange={setProfileData}
        />

        <SubscriptionTab profile={profile} />

        <NotificationsTab
          notifications={notifications}
          onUpdateNotification={updateNotificationSetting}
        />

        <SecurityTab
          changePasswordOpen={changePasswordOpen}
          onChangePasswordOpen={setChangePasswordOpen}
        />
      </ProfileTabs>

      <ChangePasswordDialog 
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
};

export default ProfileView;