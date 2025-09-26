import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import logoWhite from '@/assets/logo_white.png';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  Star
} from 'lucide-react';

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  avgResponseTime: number;
  satisfactionRate: number;
  ticketsThisWeek: number;
  ticketsThisMonth: number;
}

interface TicketTrend {
  date: string;
  open: number;
  closed: number;
}

const SupportStats = () => {
  const [stats, setStats] = useState<SupportStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    closedTickets: 0,
    avgResponseTime: 0,
    satisfactionRate: 0,
    ticketsThisWeek: 0,
    ticketsThisMonth: 0
  });
  const [trends, setTrends] = useState<TicketTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Datos mock hasta que las tablas estén creadas
      const mockStats: SupportStats = {
        totalTickets: 156,
        openTickets: 23,
        inProgressTickets: 12,
        closedTickets: 121,
        avgResponseTime: 2.5, // horas
        satisfactionRate: 4.2, // de 5
        ticketsThisWeek: 18,
        ticketsThisMonth: 67
      };

      const mockTrends: TicketTrend[] = [
        { date: '2024-01-01', open: 15, closed: 12 },
        { date: '2024-01-02', open: 18, closed: 14 },
        { date: '2024-01-03', open: 22, closed: 16 },
        { date: '2024-01-04', open: 19, closed: 18 },
        { date: '2024-01-05', open: 25, closed: 20 },
        { date: '2024-01-06', open: 23, closed: 22 },
        { date: '2024-01-07', open: 20, closed: 19 }
      ];

      setStats(mockStats);
      setTrends(mockTrends);
    } catch (error) {
      console.error('Error loading support stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600';
      case 'in_progress': return 'text-yellow-600';
      case 'closed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen Principal */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <div className="relative">
              <img src={logoWhite} alt="OndAI Logo" className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.ticketsThisWeek} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.openTickets / stats.totalTickets) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.inProgressTickets / stats.totalTickets) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.closedTickets}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.closedTickets / stats.totalTickets) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Rendimiento */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}h</div>
            <p className="text-xs text-muted-foreground">
              Tiempo de respuesta promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.satisfactionRate}/5</div>
            <p className="text-xs text-muted-foreground">
              Calificación promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ticketsThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Tickets nuevos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ticketsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Tickets nuevos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por Estado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <img src={logoWhite} alt="OndAI Logo" className="h-6 w-6" />
            </div>
            <span className="text-transparent bg-gradient-to-r from-[#3a0caa] to-[#710db2] bg-clip-text">Distribución de Tickets</span>
          </CardTitle>
          <CardDescription>
            Estado actual de todos los tickets de soporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Abiertos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.openTickets}</span>
                <Badge variant="outline" className="text-xs">
                  {((stats.openTickets / stats.totalTickets) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">En Progreso</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.inProgressTickets}</span>
                <Badge variant="outline" className="text-xs">
                  {((stats.inProgressTickets / stats.totalTickets) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Resueltos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.closedTickets}</span>
                <Badge variant="outline" className="text-xs">
                  {((stats.closedTickets / stats.totalTickets) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tendencias de la Semana */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias de la Semana</CardTitle>
          <CardDescription>
            Tickets abiertos vs cerrados en los últimos 7 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="text-sm font-medium">
                  {new Date(trend.date).toLocaleDateString('es-ES', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-600">{trend.open}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">{trend.closed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportStats;
