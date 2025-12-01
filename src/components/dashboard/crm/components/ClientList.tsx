import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Edit,
    Facebook,
    Instagram,
    MessageCircle,
    User,
    Phone,
    Trash2
} from 'lucide-react';
import { Client } from '../types';
import { CRMService } from '../services/crmService';
import { formatWhatsAppNumber, isPSID } from '@/utils/phoneNumberUtils';

interface ClientListProps {
    clients: Client[];
    onEdit: (client: Client) => void;
    onStatusChange: (clientId: string, status: string) => void;
    onDelete: (clientId: string) => void;
}

// Helper function to translate status labels
const getStatusLabel = (status: string, customStatus?: string): string => {
    if (customStatus) return customStatus;

    const statusMap: Record<string, string> = {
        'lead': 'Lead',
        'prospect': 'Prospecto',
        'client': 'Cliente',
        'inactive': 'Inactivo'
    };

    return statusMap[status] || status;
};

// Helper function to normalize source display
const getSourceLabel = (source?: string): string => {
    if (!source) return 'manual';
    // Normalize whatsapp_green_api to whatsapp for display
    if (source === 'whatsapp_green_api') return 'whatsapp';
    return source;
};

export const ClientList: React.FC<ClientListProps> = ({
    clients,
    onEdit,
    onStatusChange,
    onDelete
}) => {
    const getSourceIcon = (source?: string) => {
        switch (source) {
            case 'facebook':
                return <Facebook className="h-4 w-4 text-blue-600" />;
            case 'instagram':
                return <Instagram className="h-4 w-4 text-pink-600" />;
            case 'whatsapp':
                return <MessageCircle className="h-4 w-4 text-green-600" />;
            default:
                return <User className="h-4 w-4 text-gray-600" />;
        }
    };

    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Avatar</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>País</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-gray-50">
                            <TableCell>
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={client.avatar_url} alt={client.name} />
                                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-sm">
                                        {client.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {client.email || '-'}
                            </TableCell>
                            <TableCell>
                                {(() => {
                                    const phone = client.phone;

                                    // If there's a phone and it's NOT a PSID, format and display it
                                    if (phone && !isPSID(phone)) {
                                        const formatted = formatWhatsAppNumber(phone);
                                        if (formatted) {
                                            return (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    <span>{formatted.flag}</span>
                                                    <span className="text-sm">{formatted.formattedNumber}</span>
                                                </div>
                                            );
                                        }
                                    }

                                    // Otherwise, show a dash
                                    return <span className="text-sm text-muted-foreground">-</span>;
                                })()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {client.country || '-'}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        className={`${CRMService.getStatusColor(client.status)} text-xs`}
                                        variant="secondary"
                                    >
                                        {getStatusLabel(client.status, client.custom_status)}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    {getSourceIcon(getSourceLabel(client.source))}
                                    <span className="text-xs capitalize">{getSourceLabel(client.source)}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {new Date(client.created_at).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(client)}
                                        className="h-8 text-xs"
                                    >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDelete(client.id)}
                                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Eliminar
                                    </Button>
                                    <Select
                                        value={client.status}
                                        onValueChange={(value) => onStatusChange(client.id, value)}
                                    >
                                        <SelectTrigger className="w-28 h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lead">Lead</SelectItem>
                                            <SelectItem value="prospect">Prospecto</SelectItem>
                                            <SelectItem value="client">Cliente</SelectItem>
                                            <SelectItem value="inactive">Inactivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
