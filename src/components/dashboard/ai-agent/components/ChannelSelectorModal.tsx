import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Facebook, Instagram, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseSelect } from '@/lib/supabaseUtils';
import type { Channel } from '@/components/dashboard/channels/types';

interface ChannelSelectorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    onImport: (selectedChannels: Channel[]) => Promise<void>;
}

export const ChannelSelectorModal: React.FC<ChannelSelectorModalProps> = ({
    open,
    onOpenChange,
    userId,
    onImport
}) => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (open && userId) {
            loadChannels();
        }
    }, [open, userId]);

    const loadChannels = async () => {
        setLoading(true);
        try {
            const { data } = await supabaseSelect(
                supabase
                    .from('communication_channels')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('is_connected', true)
            );

            setChannels(data || []);

            // Pre-seleccionar el primer canal si solo hay uno
            if (data && data.length === 1) {
                setSelectedChannelIds(new Set([data[0].id]));
            }
        } catch (error) {
            console.error('Error loading channels:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleChannel = (channelId: string) => {
        const newSelected = new Set(selectedChannelIds);
        if (newSelected.has(channelId)) {
            newSelected.delete(channelId);
        } else {
            newSelected.add(channelId);
        }
        setSelectedChannelIds(newSelected);
    };

    const handleImport = async () => {
        const selectedChannels = channels.filter(c => selectedChannelIds.has(c.id));
        if (selectedChannels.length === 0) return;

        setImporting(true);
        try {
            await onImport(selectedChannels);
            onOpenChange(false);
        } catch (error) {
            console.error('Error importing:', error);
        } finally {
            setImporting(false);
        }
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'facebook':
                return <Facebook className="h-5 w-5 text-blue-600" />;
            case 'instagram':
                return <Instagram className="h-5 w-5 text-pink-600" />;
            case 'whatsapp':
                return <Phone className="h-5 w-5 text-green-600" />;
            default:
                return null;
        }
    };

    const getChannelName = (channel: Channel) => {
        const config = channel.channel_config as any;
        switch (channel.channel_type) {
            case 'facebook':
                return config?.page_name || 'Página de Facebook';
            case 'instagram':
                return `@${config?.username}` || 'Instagram';
            case 'whatsapp':
            case 'whatsapp_green_api':
                return config?.display_phone_number || config?.phone_number || 'WhatsApp Business';
            default:
                return channel.channel_type;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Seleccionar Canales</DialogTitle>
                    <DialogDescription>
                        Elige de qué canal(es) quieres importar la información del negocio.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : channels.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No tienes canales conectados.</p>
                            <p className="text-sm mt-2">Conecta Facebook, Instagram o WhatsApp primero.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {channels.map((channel) => (
                                <div
                                    key={channel.id}
                                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => toggleChannel(channel.id)}
                                >
                                    <Checkbox
                                        id={channel.id}
                                        checked={selectedChannelIds.has(channel.id)}
                                        onCheckedChange={() => toggleChannel(channel.id)}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                        {getChannelIcon(channel.channel_type)}
                                        <Label
                                            htmlFor={channel.id}
                                            className="text-sm font-medium cursor-pointer flex-1"
                                        >
                                            {getChannelName(channel)}
                                        </Label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {channels.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-800">
                                💡 <strong>Tip:</strong> Si varios canales pertenecen al mismo negocio,
                                selecciona solo uno para evitar información duplicada.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={importing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={selectedChannelIds.size === 0 || importing}
                    >
                        {importing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Importando...
                            </>
                        ) : (
                            `Importar ${selectedChannelIds.size > 0 ? `(${selectedChannelIds.size})` : ''}`
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
