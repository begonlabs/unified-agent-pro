import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail,
  Phone,
  Calendar,
  Edit,
  Facebook,
  Instagram,
  MessageCircle,
  User,
  MapPin,
  Globe
} from 'lucide-react';
import { ClientCardProps } from '../types';
import { CRMService } from '../services/crmService';
import { formatWhatsAppNumber } from '@/utils/phoneNumberUtils';

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onEdit,
  onStatusChange
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
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarImage src={client.avatar_url} alt={client.name} />
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-sm sm:text-base">
                {client.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <h3 className="font-semibold text-base sm:text-lg truncate">{client.name}</h3>
                <div className="flex items-center gap-1 sm:gap-2">
                  {getSourceIcon(client.source)}
                  <Badge
                    className={`${CRMService.getStatusColor(client.status)} text-xs`}
                    variant="secondary"
                  >
                    {client.custom_status || client.status}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                {client.email && (
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    <span className="flex items-center gap-1">
                      {(() => {
                        const formatted = formatWhatsAppNumber(client.phone);
                        return formatted ? (
                          <>
                            <span>{formatted.flag}</span>
                            <span>{formatted.formattedNumber}</span>
                          </>
                        ) : (
                          <>
                            {client.phone_country_code && (
                              <span className="text-xs">{client.phone_country_code}</span>
                            )}
                            {client.phone}
                          </>
                        );
                      })()}
                    </span>
                  </div>
                )}
                {client.country && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 flex-shrink-0" />
                    {client.country}
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {client.city}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  {new Date(client.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(client)}
              className="h-8 text-xs sm:text-sm"
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Select
              value={client.status}
              onValueChange={(value) => onStatusChange(client.id, value)}
            >
              <SelectTrigger className="w-full sm:w-28 lg:w-32 h-8">
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
        </div>
      </CardContent>
    </Card>
  );
};
