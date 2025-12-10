import React, { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useRealtimeConversations } from '@/hooks/useRealtimeConversations';
import { NotificationService } from '@/components/notifications';

interface GlobalNotificationListenerProps {
    user: User | null;
    currentView: string;
}

export const GlobalNotificationListener: React.FC<GlobalNotificationListenerProps> = ({
    user,
    currentView
}) => {
    const { conversations } = useRealtimeConversations(user?.id || null);

    // Store the last message timestamp for each conversation to detect changes
    // Map<conversationId, timestamp>
    const previousMessageTimestamps = useRef<Record<string, number>>({});
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (!user || !conversations.length) return;

        // Initialize/Update timestamps
        const currentTimestamps: Record<string, number> = {};
        const newNotifications: Array<{
            clientName: string;
            channelName: string;
            conversationId: string;
            lastMessageTime: string;
            channel: string;
        }> = [];

        conversations.forEach(conversation => {
            const conversationId = conversation.id;
            const lastMessageTime = conversation.last_message_at;

            if (!lastMessageTime) return;

            const currentTime = new Date(lastMessageTime).getTime();
            currentTimestamps[conversationId] = currentTime;

            // Skip notification logic on first load to prevent spam
            if (isFirstLoad.current) return;

            // Check if we should notify
            // 1. We are NOT in messages view (or maybe allow it if it's a different conversation? 
            //    But simpler to let MessagesView handle internal notifications if logic permits, 
            //    though separating concerns is better. 
            //    The plan says: "If currentView === 'messages', return null (idle)" behavior-wise, 
            //    but strictly disabling it here avoids duplicates with MessagesView's internal logic.)

            if (currentView === 'messages') return;

            const previousTime = previousMessageTimestamps.current[conversationId];

            const isNewConversation = previousTime === undefined;
            const isNewMessage = previousTime !== undefined && currentTime > previousTime;

            if (isNewConversation || isNewMessage) {
                const clientName = conversation.crm_clients?.name || 'Cliente Anónimo';
                const channelName = conversation.channel === 'whatsapp' ? 'WhatsApp' :
                    conversation.channel === 'facebook' ? 'Facebook' :
                        conversation.channel === 'instagram' ? 'Instagram' :
                            conversation.channel;

                newNotifications.push({
                    clientName,
                    channelName,
                    conversationId,
                    lastMessageTime,
                    channel: conversation.channel
                });
            }
        });

        // Update ref
        previousMessageTimestamps.current = currentTimestamps;

        // If it was first load, mark as done and return
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            return;
        }

        // Process notifications
        newNotifications.forEach(notification => {
            console.log('🔔 Global Notification Listener triggering:', notification);

            NotificationService.createNotification(
                user.id,
                'message',
                `Nuevo mensaje de ${notification.clientName}`,
                `Has recibido un nuevo mensaje en ${notification.channelName}`,
                {
                    priority: 'medium',
                    metadata: {
                        conversation_id: notification.conversationId,
                        channel: notification.channel,
                        client_name: notification.clientName,
                        last_message_time: notification.lastMessageTime
                    },
                    action_url: `/dashboard?view=messages&conversation=${notification.conversationId}`,
                    action_label: 'Ver conversación'
                }
            ).catch(error => {
                console.error('Error creating global notification:', error);
            });
        });

    }, [conversations, user, currentView]);

    return null; // This component does not render anything
};
