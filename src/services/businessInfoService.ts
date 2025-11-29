import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/components/notifications';

interface BusinessInfo {
    name?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zip?: string;
    };
    description?: string;
    category?: string;
    imported_at: string;
}

interface ImportResult {
    success: boolean;
    business_info?: BusinessInfo;
    knowledge_base_text?: string;
    error?: string;
}

export class BusinessInfoService {
    /**
     * Import business information from a connected channel
     */
    static async importBusinessInfo(
        userId: string,
        channelId: string,
        channelType: 'facebook' | 'instagram' | 'whatsapp',
        pageId: string,
        accessToken: string
    ): Promise<ImportResult> {
        try {
            console.log(`Importing business info for ${channelType} channel ${channelId}`);

            // Call Edge Function to fetch business info
            const { data, error } = await supabase.functions.invoke('fetch-business-info', {
                body: {
                    page_id: pageId,
                    access_token: accessToken,
                    channel_type: channelType
                }
            });

            if (error) {
                console.error('Error fetching business info:', error);
                throw error;
            }

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch business info');
            }

            const { business_info, knowledge_base_text } = data;

            // Update channel metadata with business info
            await this.updateChannelMetadata(channelId, business_info);

            // Update AI knowledge base
            if (knowledge_base_text) {
                await this.updateAIKnowledgeBase(userId, knowledge_base_text);
            }

            // Create success notification
            await this.notifyUserOfImport(userId, business_info, channelType);

            return {
                success: true,
                business_info,
                knowledge_base_text
            };

        } catch (error) {
            console.error('Error importing business info:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Update channel metadata with imported business info
     */
    private static async updateChannelMetadata(
        channelId: string,
        businessInfo: BusinessInfo
    ): Promise<void> {
        const { error } = await supabase
            .from('communication_channels')
            .update({
                metadata: {
                    business_info: businessInfo
                }
            })
            .eq('id', channelId);

        if (error) {
            console.error('Error updating channel metadata:', error);
            throw error;
        }

        console.log('Channel metadata updated with business info');
    }

    /**
     * Append business info to AI knowledge base
     */
    private static async updateAIKnowledgeBase(
        userId: string,
        businessInfoText: string
    ): Promise<void> {
        // Get current AI agent config
        const { data: aiAgent, error: fetchError } = await supabase
            .from('ai_configurations')
            .select('knowledge_base')
            .eq('user_id', userId)
            .single();

        if (fetchError) {
            console.error('Error fetching AI agent:', fetchError);
            throw fetchError;
        }

        // Append new business info to existing knowledge base
        const currentKnowledge = aiAgent?.knowledge_base || '';

        // Check if business info section already exists
        const hasBusinessInfo = currentKnowledge.includes('## Información del Negocio');

        let updatedKnowledge: string;
        if (hasBusinessInfo) {
            // Replace existing business info section
            const regex = /## Información del Negocio[\s\S]*?(?=\n##|\n\*Información importada|$)/;
            updatedKnowledge = currentKnowledge.replace(regex, businessInfoText);
        } else {
            // Append new business info section
            updatedKnowledge = currentKnowledge
                ? `${currentKnowledge}\n\n${businessInfoText}`
                : businessInfoText;
        }

        // Update AI agent knowledge base
        const { error: updateError } = await supabase
            .from('ai_configurations')
            .update({ knowledge_base: updatedKnowledge })
            .eq('user_id', userId);

        if (updateError) {
            console.error('Error updating AI knowledge base:', updateError);
            throw updateError;
        }

        console.log('AI knowledge base updated with business info');
    }

    /**
     * Notify user of successful import
     */
    private static async notifyUserOfImport(
        userId: string,
        businessInfo: BusinessInfo,
        channelType: string
    ): Promise<void> {
        const importedFields: string[] = [];

        if (businessInfo.name) importedFields.push('Nombre');
        if (businessInfo.phone) importedFields.push('Teléfono');
        if (businessInfo.email) importedFields.push('Email');
        if (businessInfo.website) importedFields.push('Sitio Web');
        if (businessInfo.address) importedFields.push('Dirección');
        if (businessInfo.description) importedFields.push('Descripción');
        if (businessInfo.category) importedFields.push('Categoría');

        const channelName = channelType === 'facebook' ? 'Facebook'
            : channelType === 'instagram' ? 'Instagram'
                : 'WhatsApp';

        await NotificationService.createNotification(
            userId,
            'system',
            'Información del negocio importada',
            `Se importaron ${importedFields.length} campos desde ${channelName}: ${importedFields.join(', ')}`,
            {
                priority: 'medium',
                metadata: {
                    channel_type: channelType,
                    imported_fields: importedFields,
                    business_name: businessInfo.name
                },
                action_url: '/dashboard/ai-agent',
                action_label: 'Ver conocimiento'
            }
        );
    }

    /**
     * Get imported business info from channel metadata
     */
    static async getBusinessInfo(channelId: string): Promise<BusinessInfo | null> {
        const { data, error } = await supabase
            .from('channels')
            .select('metadata')
            .eq('id', channelId)
            .single();

        if (error || !data) {
            return null;
        }

        return data.metadata?.business_info || null;
    }
}
