import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, LayoutGrid, List } from 'lucide-react';
import { ClientFiltersProps, ViewMode } from '../types';

export const ClientFilters: React.FC<ClientFiltersProps> = ({
  filters,
  onFiltersChange,
  onExportCSV,
  onExportExcel,
  filteredClientsCount,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          value={filters.searchTerm}
          onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
          className="pl-8 sm:pl-10 bg-gray-50 text-sm sm:text-base"
        />
      </div>

      <div className="flex gap-2 sm:gap-4">
        <Select value={filters.filterStatus} onValueChange={(value) => onFiltersChange({ ...filters, filterStatus: value })}>
          <SelectTrigger className="w-full sm:w-32 lg:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="prospect">Prospecto</SelectItem>
            <SelectItem value="client">Cliente</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.filterSource} onValueChange={(value) => onFiltersChange({ ...filters, filterSource: value })}>
          <SelectTrigger className="w-full sm:w-32 lg:w-40">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>

        {/* View mode toggle */}
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-7 px-2"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-7 px-2"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Botón de exportación */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            disabled={filteredClientsCount === 0}
            className="h-8 text-xs sm:text-sm border-[#3a0caa] text-[#3a0caa] hover:bg-[#3a0caa] hover:text-white"
          >
            <Download className="h-3 w-3 mr-1" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            disabled={filteredClientsCount === 0}
            className="h-8 text-xs sm:text-sm border-[#710db2] text-[#710db2] hover:bg-[#710db2] hover:text-white"
          >
            <Download className="h-3 w-3 mr-1" />
            Excel
          </Button>
        </div>
      </div>
    </div>
  );
};
