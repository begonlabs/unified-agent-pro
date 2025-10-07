import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import logoWhite from '@/assets/logo_white.png';
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ResponsiveTableColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps {
  columns: ResponsiveTableColumn[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  actions?: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: (row: Record<string, unknown>) => void;
    variant?: 'default' | 'destructive';
  }[];
  emptyMessage?: string;
  className?: string;
}

export const ResponsiveTable = ({
  columns,
  data,
  onRowClick,
  actions = [],
  emptyMessage = "No hay datos disponibles",
  className = ""
}: ResponsiveTableProps) => {
  const visibleColumns = columns.filter(col => !col.hideOnMobile);
  const hiddenColumns = columns.filter(col => col.hideOnMobile);

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img src={logoWhite} alt="OndAI Logo" className="h-6 w-6 rounded-lg" />
            </div>
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.label}
                  </TableHead>
                ))}
                {actions.length > 0 && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow 
                  key={index} 
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, actionIndex) => {
                            const Icon = action.icon;
                            return (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(row);
                                }}
                                className={action.variant === 'destructive' ? 'text-red-600' : ''}
                              >
                                <Icon className="mr-2 h-4 w-4" />
                                {action.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((row, index) => (
          <Card 
            key={index}
            className={onRowClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Primary Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {visibleColumns.slice(0, 2).map((column) => (
                      <div key={column.key} className="mb-2 last:mb-0">
                        <div className="text-sm font-medium text-muted-foreground">
                          {column.label}
                        </div>
                        <div className="text-sm">
                          {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  {actions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, actionIndex) => {
                          const Icon = action.icon;
                          return (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(row);
                              }}
                              className={action.variant === 'destructive' ? 'text-red-600' : ''}
                            >
                              <Icon className="mr-2 h-4 w-4" />
                              {action.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Additional Info */}
                {visibleColumns.length > 2 && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    {visibleColumns.slice(2).map((column) => (
                      <div key={column.key}>
                        <div className="text-xs font-medium text-muted-foreground">
                          {column.label}
                        </div>
                        <div className="text-sm">
                          {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hidden columns info */}
                {hiddenColumns.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-1">
                      Información adicional:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hiddenColumns.map((column) => (
                        <div key={column.key} className="text-xs">
                          <span className="font-medium">{column.label}:</span>{' '}
                          <span className="text-muted-foreground">
                            {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveTable;
