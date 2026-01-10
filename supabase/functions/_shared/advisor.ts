
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
            .from('crm_clients')
            .select('tags, status')
            .eq('id', targetClientId)
            .single();

        if (!clientFetchError && clientData) {
            const currentTags = clientData.tags || [];
            const hasTag = currentTags.includes('Asesor Requerido');

            if (!hasTag) {
                const newTags = [...currentTags, 'Asesor Requerido'];

                const { error: updateError } = await supabase
                    .from('crm_clients')
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

        // 4. Send Email Notification (Internal/Simulation capable)
        console.log('📧 Preparing email notification for handoff...');

        // Intentar obtener el email del usuario.
        // Nota: supabase.auth.admin requiere service_role key.
        // Si el cliente supabase pasado es anon o autenticado normal, puede fallar si no hay políticas adecuadas.
        // Asumimos que esta función corre en contexto seguro o que se puede obtener info básica.

        let targetEmail;

        try {
            // Intento 1: Vía User User Metadata (si está disponible en contexto)
            const { data: { user } } = await supabase.auth.getUser();
            // Si el user_id coincide con el actual, tenemos el email
            if (user && user.id === user_id) {
                targetEmail = user.email;
            } else {
                // Si no, necesitamos admin (esto funcionará si 'supabase' viene con service role key, común en edge functions internas)
                const { data: adminUser, error: adminError } = await supabase.auth.admin.getUserById(user_id);
                if (!adminError && adminUser?.user) {
                    targetEmail = adminUser.user.email;
                }
            }
        } catch (e) {
            console.log('⚠️ Error fetching user email details', e);
        }

        if (targetEmail) {
            const appUrl = Deno.env.get('APP_URL') || 'https://app.ondai.ai';

            const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                <h2 style="color: #d32f2f;">⚠️ Atención Requerida: Asesor Humano</h2>
                <p>Hola,</p>
                <p>El cliente <strong>${clientName}</strong> ha solicitado hablar con un humano o la IA ha determinado que requiere asistencia personalizada.</p>
                
                <div style="background: white; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
                    <p><strong>Canal:</strong> ${platform}</p>
                    <p><strong>Cliente:</strong> ${clientName}</p>
                    <p><strong>Razón:</strong> Derivación automática de IA</p>
                </div>

                <a href="${appUrl}/dashboard/crm?conversation=${conversation_id}" 
                   style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Atender Ahora
                </a>
            </div>
            `;

            // Llamar a send-email (que maneja simulación si no hay API Key)
            const { error: emailError } = await supabase.functions.invoke('send-email', {
                body: {
                    to: targetEmail,
                    subject: `⚠️ Atención: ${clientName} requiere un asesor humano`,
                    html: emailHtml,
                    text: `El cliente ${clientName} requiere asistencia humana inmediata en ${platform}.`,
                    priority: 'high'
                }
            });

            if (emailError) {
                console.error('Error invoking send-email:', emailError);
            } else {
                console.log(`✅ Email notification invocation sent to ${targetEmail}`);
            }
        } else {
            console.log('⚠️ No email found for user (permissions issue?), skipping email notification');
        }

        // 5. Pause AI for this conversation so human can take over
        const { error: pauseError } = await supabase
            .from('conversations')
            .update({ ai_enabled: false })
            .eq('id', conversation_id);

        if (pauseError) {
            console.error('Error pausing AI for conversation:', pauseError);
        } else {
            console.log('⏸️ AI paused for conversation to allow human interaction');
        }

    } catch (error) {
        console.error('Critical error in handleAdvisorHandoff:', error);
    }
}
