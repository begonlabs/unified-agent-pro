import { Profile } from '@/components/dashboard/profile/types';

export interface ChannelPermissions {
    whatsapp: boolean;
    facebook: boolean;
    instagram: boolean;
    maxWhatsappChannels: number;
    maxChannels: number;
}

export const PLAN_LIMITS: Record<string, { messages: number; clients: number }> = {
    free: { messages: 0, clients: 0 },
    basico: { messages: 10000, clients: 200 },
    avanzado: { messages: 30000, clients: 600 },
    pro: { messages: 70000, clients: 2000 },
    empresarial: { messages: 100000, clients: 3000 }
};

/**
 * Obtiene los permisos de canales según el plan del usuario
 */
export const getChannelPermissions = (profile: Profile): ChannelPermissions => {
    // Si está en trial
    if (profile.is_trial) {
        return {
            whatsapp: false, // NO WhatsApp en trial
            facebook: true,
            instagram: true,
            maxWhatsappChannels: 0,
            maxChannels: 2, // Máximo 1 FB + 1 IG
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

    // Todos los planes de pago tienen los mismos límites de canales
    // Máximo 1 canal de cada tipo: 1 FB + 1 IG + 1 WhatsApp
    switch (profile.plan_type) {
        case 'basico':
            return {
                whatsapp: true,
                facebook: true,
                instagram: true,
                maxWhatsappChannels: 1,
                maxChannels: 1, // Plan Básico: Solo 1 canal activo en total (de cualquier tipo)
            };
        case 'avanzado':
        case 'pro':
        case 'empresarial':
            return {
                whatsapp: true,
                facebook: true,
                instagram: true,
                maxWhatsappChannels: 1, // Máximo 1 WhatsApp
                maxChannels: 3, // Máximo 1 FB + 1 IG + 1 WhatsApp
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
    currentChannelCount: number = 0,
    totalChannelCount: number = 0 // Nuevo parámetro para el conteo total
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
    if (permissions.maxChannels !== -1) {
        // Usamos totalChannelCount si se proporciona, de lo contrario usamos currentChannelCount (comportamiento anterior)
        // Pero para la restricción del plan básico necesitamos el total real
        const countToCheck = totalChannelCount > 0 ? totalChannelCount : currentChannelCount;

        if (countToCheck >= permissions.maxChannels) {
            return {
                allowed: false,
                reason: `Has alcanzado el límite de ${permissions.maxChannels} canal(es) en tu plan. Desconecta un canal para conectar otro.`,
            };
        }
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

/**
 * Verifica si el usuario puede enviar mensajes
 */
export const canSendMessage = (profile: Profile): { allowed: boolean; reason?: string } => {
    // Trial tiene mensajes ilimitados
    if (profile.is_trial) {
        return { allowed: true };
    }

    // Verificar si tiene plan activo
    if (profile.payment_status !== 'active') {
        return {
            allowed: false,
            reason: 'Tu plan no está activo. Actualiza tu suscripción para enviar mensajes.',
        };
    }

    // Verificar límite de mensajes
    const messagesSent = profile.messages_sent_this_month || 0;
    // Usar el límite del perfil o el defecto del plan
    const messagesLimit = profile.messages_limit ?? PLAN_LIMITS[profile.plan_type]?.messages ?? 0;

    if (messagesSent >= messagesLimit) {
        return {
            allowed: false,
            reason: `Has alcanzado el límite de ${messagesLimit} mensajes este mes. Actualiza tu plan.`,
        };
    }

    return { allowed: true };
};

/**
 * Verifica si el usuario puede crear un nuevo cliente en el CRM
 */
export const canCreateClient = (
    profile: Profile,
    currentClientCount: number = 0
): { allowed: boolean; reason?: string } => {
    // Trial tiene clientes ilimitados
    if (profile.is_trial) {
        return { allowed: true };
    }

    // Plan básico tiene CRM básico, así que permitimos acceso
    // Solo bloqueamos si el plan no tiene CRM (que no debería pasar con los planes actuales)
    if (getCRMLevel(profile) === 'none') {
        return {
            allowed: false,
            reason: 'El CRM no está disponible en tu plan actual.',
        };
    }

    // Verificar si tiene plan activo
    if (profile.payment_status !== 'active') {
        return {
            allowed: false,
            reason: 'Tu plan no está activo. Actualiza tu suscripción para usar el CRM.',
        };
    }

    // Verificar límite de clientes
    const clientsLimit = profile.clients_limit ?? PLAN_LIMITS[profile.plan_type]?.clients ?? 0;

    if (currentClientCount >= clientsLimit) {
        return {
            allowed: false,
            reason: `Has alcanzado el límite de ${clientsLimit} clientes. Actualiza tu plan.`,
        };
    }

    return { allowed: true };
};

/**
 * Obtiene el nivel de CRM del usuario
 */
export const getCRMLevel = (profile: Profile): 'none' | 'basic' | 'complete' => {
    // Si tiene un nivel asignado explícitamente, usarlo
    if (profile.crm_level && profile.crm_level !== 'none') {
        return profile.crm_level as 'none' | 'basic' | 'complete';
    }

    // Fallback basado en el plan (para usuarios existentes o errores de datos)
    switch (profile.plan_type) {
        case 'basico':
            return 'basic';
        case 'avanzado':
        case 'pro':
        case 'empresarial':
            return 'complete';
        default:
            return 'none';
    }
};

/**
 * Verifica si el usuario tiene acceso a estadísticas
 */
export const hasStatisticsAccess = (profile: Profile): boolean => {
    // Verificar explícitamente por tipo de plan
    const allowedPlans = ['avanzado', 'pro', 'empresarial'];
    if (allowedPlans.includes(profile.plan_type)) {
        return true;
    }

    return profile.has_statistics || false;
};

/**
 * Obtiene el porcentaje de uso de mensajes
 */
export const getMessageUsagePercentage = (profile: Profile): number => {
    const sent = profile.messages_sent_this_month || 0;
    const limit = profile.messages_limit ?? PLAN_LIMITS[profile.plan_type]?.messages ?? 1;
    // Evitar división por cero
    const safeLimit = limit === 0 ? 1 : limit;
    return Math.min(Math.round((sent / safeLimit) * 100), 100);
};

/**
 * Obtiene el porcentaje de uso de clientes CRM
 */
export const getClientUsagePercentage = (profile: Profile, currentCount: number): number => {
    const limit = profile.clients_limit ?? PLAN_LIMITS[profile.plan_type]?.clients ?? 1;
    // Evitar división por cero
    const safeLimit = limit === 0 ? 1 : limit;
    return Math.min(Math.round((currentCount / safeLimit) * 100), 100);
};
