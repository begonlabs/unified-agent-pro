
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Users } from 'lucide-react';

export const useAdvisorNotifications = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('advisor-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotification = payload.new as any;

                    // Check if it's an advisor handoff or high priority warning
                    if (
                        newNotification.type === 'warning' &&
                        newNotification.priority === 'high' &&
                        newNotification.metadata?.action === 'advisor_handoff'
                    ) {
                        // Play sound (optional, browsers block auto-play often but works after interaction)
                        try {
                            const audio = new Audio('/assets/sounds/alert.mp3'); // Assuming file exists or fails silently
                            audio.play().catch(e => console.log('Audio play failed (interaction needed)', e));
                        } catch (e) { }

                        toast({
                            title: "⚠️ Asesor Humano Requerido",
                            description: newNotification.message || "Un cliente necesita atención inmediata.",
                            variant: "destructive", // Red color in shadcn/ui
                            duration: 10000, // Stay longer
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);
};
