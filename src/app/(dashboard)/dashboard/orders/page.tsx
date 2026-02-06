'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeleteOrderMutation, useOrdersQuery } from '@/lib/api';
import { Order } from '@/types/order';
import { ReportDialog } from './report-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, AlertCircle, Plus, FileDown, Trash2, Eye } from 'lucide-react';

const statusColorMap: Record<string, { bg: string; text: string }> = {
  created: { bg: 'bg-blue-100', text: 'text-blue-800' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  process: { bg: 'bg-purple-100', text: 'text-purple-800' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
};

const statusLabels: Record<string, string> = {
  created: 'Creada',
  pending: 'Pendiente',
  process: 'En proceso',
  confirmed: 'Confirmada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
};

export default function OrdersPage() {
  const router = useRouter();
  const [pagination, setPagination] = useState({ page: 1, limit: 100 });
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { data, isLoading, error } = useOrdersQuery({
    page: pagination.page,
    limit: pagination.limit,
  });
  const deleteMutation = useDeleteOrderMutation();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${dateStr} ${timeStr}`;
  };

  const handleNewOrder = () => {
    router.push('/dashboard/orders/new');
  };

  const handleGenerateReport = () => {
    setReportDialogOpen(true);
  };

  const handleDelete = async (order: Order) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la orden #${order.id}?`)) return;

    try {
      setDeletingId(order.id);
      await deleteMutation.mutateAsync(order.id);
    } catch (err) {
      console.error('[OrdersPage] Error deleting order:', err);
      alert('Error al eliminar la orden');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className='h-full w-full flex flex-col bg-background overflow-hidden'>
      <div className='h-full flex flex-col p-6 overflow-y-auto'>
        {/* Header con acciones */}
        <div className='mb-6 flex items-start justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Órdenes</h1>
            <p className='text-sm text-muted-foreground mt-1'>Gestiona y visualiza todas tus órdenes</p>
          </div>
          <div className='flex gap-3'>
            <Button onClick={handleGenerateReport} variant='outline' className='gap-2'>
              <FileDown className='w-4 h-4' />
              Generar reporte
            </Button>
            <Button onClick={handleNewOrder} className='gap-2'>
              <Plus className='w-4 h-4' />
              Nueva orden
            </Button>
          </div>
        </div>

        {/* Cards de resumen */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
          <Card className='border-l-4 border-l-blue-500'>
            <CardHeader className='pb-1 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Total de órdenes
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3'>
              <div className='text-2xl font-bold'>{data?.total || 0}</div>
              <p className='text-xs text-muted-foreground mt-1'>en el sistema</p>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-purple-500'>
            <CardHeader className='pb-1 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                En proceso
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3'>
              <div className='text-2xl font-bold'>
                {data?.items?.filter((o) => o.status === 'process').length || 0}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>pendientes de completar</p>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-green-500'>
            <CardHeader className='pb-1 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Entregadas
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3'>
              <div className='text-2xl font-bold'>
                {data?.items?.filter((o) => o.status === 'delivered').length || 0}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>completadas</p>
            </CardContent>
          </Card>

          <Card className='border-l-4 border-l-red-500'>
            <CardHeader className='pb-1 pt-3 px-4'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Canceladas
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3'>
              <div className='text-2xl font-bold'>
                {data?.items?.filter((o) => o.status === 'cancelled').length || 0}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>sin procesar</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de órdenes */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg'>Listado de órdenes</CardTitle>
            <CardDescription className='text-xs'>
              {data?.total} órdenes en total ({data?.page || 1} de {data?.totalPages || 1} páginas)
            </CardDescription>
          </CardHeader>

          <CardContent className='px-4'>
            {error && (
              <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3'>
                <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                <div>
                  <p className='font-semibold text-red-900'>Error al cargar órdenes</p>
                  <p className='text-red-700 text-sm'>{error instanceof Error ? error.message : 'Intenta de nuevo'}</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='flex flex-col items-center gap-2'>
                  <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
                  <p className='text-muted-foreground'>Cargando órdenes...</p>
                </div>
              </div>
            ) : data?.items && data.items.length > 0 ? (
              <>
                <div className='relative overflow-x-auto'>
                  <Table className='w-full table-fixed text-sm'>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-14 text-xs px-2'>ID</TableHead>
                        <TableHead className='w-[220px] text-xs px-2'>Cliente</TableHead>
                        <TableHead className='w-[120px] text-xs px-2'>Área</TableHead>
                        <TableHead className='w-[280px] text-xs px-2'>Productos</TableHead>
                        <TableHead className='w-[120px] text-xs px-2'>Estado</TableHead>
                        <TableHead className='w-[160px] text-xs px-2'>Fecha</TableHead>
                        <TableHead className='sticky right-0 z-10 w-[92px] bg-background text-right text-xs px-2 border-l border-border'>
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((order: Order) => (
                        <TableRow key={order.id} className='group hover:bg-muted/50'>
                          <TableCell className='font-semibold text-primary text-xs px-2'>#{order.id}</TableCell>
                          <TableCell className='px-2'>
                            <div className='min-w-0'>
                              <p className='font-medium text-xs truncate'>
                                {order.User?.firstName} {order.User?.lastName}
                              </p>
                              <p className='text-xs text-muted-foreground truncate'>{order.User?.email || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell className='px-2'>
                            <div
                              className='px-2 py-1 rounded-full text-xs font-semibold text-white w-fit'
                              style={{ backgroundColor: order.area?.color || '#666' }}
                            >
                              {order.area?.name || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className='px-2'>
                            <div className='text-xs min-w-0'>
                              <p className='font-medium'>{order.orderItems?.length || 0}</p>
                              {order.orderItems && order.orderItems.length > 0 && (
                                <p className='text-xs text-muted-foreground truncate'>
                                  {order.orderItems
                                    .map((item) => `${item.quantity} ${item.product?.name}`)
                                    .join(', ')}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='px-2'>
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                                statusColorMap[order.status]?.bg || 'bg-gray-100'
                              } ${statusColorMap[order.status]?.text || 'text-gray-800'}`}
                            >
                              {statusLabels[order.status] || order.status}
                            </div>
                          </TableCell>
                          <TableCell className='text-xs text-muted-foreground whitespace-nowrap px-2'>
                            {formatDate(order.createdAt || '')}
                          </TableCell>
                          <TableCell className='sticky right-0 bg-background group-hover:bg-muted/50 text-right px-2 border-l border-border'>
                            <div className='flex justify-end gap-1'>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-7 w-7 p-0'
                                title='Ver'
                                aria-label='Ver'
                              >
                                <Eye className='w-3.5 h-3.5' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                                onClick={() => handleDelete(order)}
                                disabled={deleteMutation.isPending && deletingId === order.id}
                                title='Eliminar'
                                aria-label='Eliminar'
                              >
                                {deleteMutation.isPending && deletingId === order.id ? (
                                  <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                ) : (
                                  <Trash2 className='w-3.5 h-3.5' />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                <div className='mt-4 flex items-center justify-between border-t pt-3'>
                  <div className='text-xs text-muted-foreground'>
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, data.total)} de {data.total} órdenes
                  </div>
                  <div className='flex gap-2 items-center'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(prev.page - 1, 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className='h-8 text-xs'
                    >
                      Anterior
                    </Button>
                    <div className='flex items-center gap-1 px-2'>
                      <span className='text-xs font-medium'>
                        Pág {pagination.page} de {data.totalPages}
                      </span>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.page + 1, data.totalPages),
                        }))
                      }
                      disabled={pagination.page >= data.totalPages}
                      className='h-8 text-xs'
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className='flex items-center justify-center py-12'>
                <div className='text-center'>
                  <p className='text-muted-foreground text-lg'>No hay órdenes disponibles</p>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Comienza creando una nueva orden
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ReportDialog 
          open={reportDialogOpen} 
          onOpenChange={setReportDialogOpen} 
          orders={data?.items || []} 
        />
      </div>
    </div>
  );
}
