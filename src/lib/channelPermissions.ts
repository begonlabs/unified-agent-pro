import { Profile } from '@/components/dashboard/profile/types';

export interface ChannelPermissions {
    whatsapp: boolean;
    facebook: boolean;
    instagram: boolean;
    maxWhatsappChannels: number;
    maxChannels: number;
}

/**
 * Obtiene los permisos de canales según el plan del usuario
 */
export const getChannelPermissions = (profile: Profile): ChannelPermissions => {
    // Si está en trial
    if (profile.is_trial) {
        return {
            whatsapp: false,
            facebook: true,
            instagram: true,
            maxWhatsappChannels: 0,
            maxChannels: 2,
        };
    }

    // Si el trial expiró y no tiene plan activo
    if (profile.payment_status === 'expired' || profile.payment_status === 'cancelled') {
        return {
            whatsapp: false,
            facebook: false,
            instagram: false,
            maxWhatsappChannels: 0,
            maxChannels: 0,
        };
    }

    // Según plan de pago
    switch (profile.plan_type) {
        case 'basico':
            return {
                whatsapp: true,
                facebook: true,
                instagram: true,
                maxWhatsappChannels: 1,
                maxChannels: 3,
            };
        case 'avanzado':
            return {
                whatsapp: true,
                facebook: true,
                instagram: true,
                maxWhatsappChannels: 3,
                maxChannels: 6,
            };
        case 'pro':
            return {
                whatsapp: true,
                facebook: true,
                instagram: true,
                maxWhatsappChannels: -1, // ilimitado
                maxChannels: -1, // ilimitado
            };
        default:
            return {
                whatsapp: false,
                facebook: false,
                instagram: false,
                maxWhatsappChannels: 0,
                maxChannels: 0,
            };
    }
};

/**
 * Verifica si el usuario puede conectar un canal específico
 */
export const canConnectChannel = (
    profile: Profile,
    channelType: 'whatsapp' | 'facebook' | 'instagram',
    currentChannelCount: number = 0
): { allowed: boolean; reason?: string } => {
    const permissions = getChannelPermissions(profile);

    // Verificar si el tipo de canal está permitido
    if (!permissions[channelType]) {
        if (profile.is_trial && channelType === 'whatsapp') {
            return {
                allowed: false,
                reason: 'WhatsApp no está disponible en el período de prueba. Actualiza a un plan de pago.',
            };
        }
        return {
            allowed: false,
            reason: `Tu plan actual no incluye acceso a ${channelType}. Actualiza tu plan.`,
        };
    }

    // Verificar límite de canales de WhatsApp
    if (channelType === 'whatsapp' && permissions.maxWhatsappChannels !== -1) {
        if (currentChannelCount >= permissions.maxWhatsappChannels) {
            return {
                allowed: false,
                reason: `Has alcanzado el límite de ${permissions.maxWhatsappChannels} canal(es) de WhatsApp. Actualiza tu plan.`,
            };
        }
    }

    // Verificar límite total de canales
    if (permissions.maxChannels !== -1 && currentChannelCount >= permissions.maxChannels) {
        return {
            allowed: false,
            reason: `Has alcanzado el límite de ${permissions.maxChannels} canales. Actualiza tu plan.`,
        };
    }

    return { allowed: true };
};

/**
 * Obtiene un mensaje descriptivo de los permisos del usuario
 */
export const getPermissionsDescription = (profile: Profile): string => {
    const permissions = getChannelPermissions(profile);

    if (profile.is_trial) {
        return 'Período de prueba: Facebook e Instagram disponibles. WhatsApp requiere plan de pago.';
    }

    if (profile.payment_status === 'expired') {
        return 'Tu plan ha expirado. Actualiza tu suscripción para continuar.';
    }

    const parts: string[] = [];

    if (permissions.whatsapp) {
        if (permissions.maxWhatsappChannels === -1) {
            parts.push('WhatsApp ilimitado');
        } else {
            parts.push(`${permissions.maxWhatsappChannels} canal(es) de WhatsApp`);
        }
    }

    if (permissions.facebook) parts.push('Facebook');
    if (permissions.instagram) parts.push('Instagram');

    return parts.join(', ');
};
