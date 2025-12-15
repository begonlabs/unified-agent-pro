
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AdvisorHandoffParams {
    supabase: ReturnType<typeof createClient>;
    conversation_id: string;
    user_id: string;
    platform: string;
    client_id?: string; // Optional if we need to look it up
}

export async function handleAdvisorHandoff({
    supabase,
    conversation_id,
    user_id,
    platform,
    client_id
}: AdvisorHandoffParams) {
    try {
        console.log('👨‍💼 Handling Advisor Handoff:', { conversation_id, user_id, platform });

        // 1. Get Conversation & Client Details (if not provided)
        let targetClientId = client_id;
        let clientName = 'Cliente';

        if (!targetClientId) {
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .select('client_id, clients(name)')
                .eq('id', conversation_id)
                .single();

            if (convError || !conv) {
                console.error('Error fetching conversation for handoff:', convError);
                return;
            }
            targetClientId = conv.client_id;
            // @ts-ignore
            clientName = conv.clients?.name || 'Cliente';
        }

        if (!targetClientId) {
            console.error('No client ID found for handoff');
            return;
        }

        // 2. Update Client Status/Badge
        // Check current tags first to avoid duplicates
        const { data: clientData, error: clientFetchError } = await supabase
            .from('clients')
            .select('tags, status')
            .eq('id', targetClientId)
            .single();

        if (!clientFetchError && clientData) {
            const currentTags = clientData.tags || [];
            const hasTag = currentTags.includes('Asesor Requerido');

            if (!hasTag) {
                const newTags = [...currentTags, 'Asesor Requerido'];

                const { error: updateError } = await supabase
                    .from('clients')
                    .update({
                        tags: newTags,
                        // Optional: Update status if needed, but tags are safer to avoid disrupting flow
                        // status: 'active' 
                    })
                    .eq('id', targetClientId);

                if (updateError) {
                    console.error('Error updating client tags:', updateError);
                } else {
                    console.log('✅ Client marked with advisor badge');
                }
            }
        }

        // 3. Create Notification
        const notification = {
            user_id,
            type: 'warning', // High priority/Attention needed
            priority: 'high',
            status: 'unread',
            title: 'Atención Requerida: Asesor Humano',
            message: `El cliente ${clientName} ha sido derivado a un asesor humano por la IA.`,
            metadata: {
                conversation_id,
                client_id: targetClientId,
                channel_type: platform,
                action: 'advisor_handoff'
            },
            action_url: `/dashboard/crm?conversation=${conversation_id}`,
            action_label: 'Ver Conversación'
        };

        const { error: notifError } = await supabase
            .from('notifications')
            .insert(notification);

        if (notifError) {
            console.error('Error creating notification:', notifError);
        } else {
            console.log('✅ Advisor notification created');
        }

    } catch (error) {
        console.error('Critical error in handleAdvisorHandoff:', error);
    }
}
