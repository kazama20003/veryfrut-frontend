'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, ShoppingCart, Package, TrendingUp, Loader2, AlertCircle, FileText, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSuppliersQuery, useUnitMeasurementsQuery } from '@/lib/api';
import {
  generateDailyReportByClient,
  generateReportByProductUnit,
} from '@/lib/utils/report-generator';
import suppliersService, { type Purchase } from '@/lib/api/services/suppliers-service';
import { useQueryClient } from '@tanstack/react-query';
import queryKeys from '@/lib/api/queryKeys';

export default function SuppliersPage() {
  const { data: suppliersData, isLoading, error, refetch } = useSuppliersQuery();
  const { data: unitMeasurements = [] } = useUnitMeasurementsQuery();
  const queryClient = useQueryClient();
  const [reportLoading, setReportLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<{
    supplierId: number;
    purchase: Purchase;
  } | null>(null);
  const [editStatus, setEditStatus] = useState<'created' | 'processing' | 'completed' | 'cancelled'>('created');
  const [editPaid, setEditPaid] = useState(false);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const parseDateFromInput = (value: string, boundary: 'start' | 'end'): Date | undefined => {
    if (!value) return undefined;
    const [yearRaw, monthRaw, dayRaw] = value.split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return undefined;
    if (boundary === 'start') return new Date(year, month - 1, day, 0, 0, 0, 0);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  };

  // Calcular estadísticas
  const suppliers = suppliersData?.data || [];
  const totalSuppliers = suppliers.length;

  const unitMeasurementsMap = new Map<number, { id: number; name: string }>(
    unitMeasurements.map((u) => [u.id, u])
  );

  const getUnitLabel = (item: { unitMeasurement?: { name: string; abbreviation: string }; unitMeasurementId?: number }) => {
    if (item.unitMeasurement?.abbreviation) return item.unitMeasurement.abbreviation;
    if (item.unitMeasurement?.name) return item.unitMeasurement.name;
    if (typeof item.unitMeasurementId === 'number') return unitMeasurementsMap.get(item.unitMeasurementId)?.name || `Unidad ${item.unitMeasurementId}`;
    return '-';
  };

  const handleDeletePurchase = async (supplierId: number, purchaseId: number) => {
    if (!confirm('¿Eliminar esta compra?')) return;

    try {
      const result = await suppliersService.deletePurchase(purchaseId);
      if (result.success) {
        toast.success('Compra eliminada');
        await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
        await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.purchaseLists(supplierId) });
      } else {
        toast.error('No se pudo eliminar la compra');
      }
    } catch (error) {
      toast.error('Error al eliminar la compra');
      console.error(error);
    }
  };

  const openEditPurchase = (supplierId: number, purchase: Purchase) => {
    setEditingPurchase({ supplierId, purchase });
    setEditStatus(purchase.status);
    setEditPaid(Boolean(purchase.paid));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPurchase) return;

    try {
      await suppliersService.updatePurchase(editingPurchase.purchase.id, {
        status: editStatus,
        paid: editPaid,
      });
      toast.success('Compra actualizada');
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.purchaseLists(editingPurchase.supplierId) });
    } catch (error) {
      toast.error('Error al actualizar la compra');
      console.error(error);
    }
  };

  const handleDailyReport = async () => {
    const start = startDate ? parseDateFromInput(startDate, 'start') : undefined;
    const end = endDate ? parseDateFromInput(endDate, 'end') : undefined;

    if (startDate && !start) {
      toast.error('Fecha inicio invalida');
      return;
    }
    if (endDate && !end) {
      toast.error('Fecha fin invalida');
      return;
    }
    if (start && end && start > end) {
      toast.error('La fecha fin debe ser mayor o igual a la fecha inicio');
      return;
    }

    try {
      setReportLoading(true);

      const filename = `reporte_diario_${new Date().toISOString().split('T')[0]}.xlsx`;
      await generateDailyReportByClient({
        filename,
        suppliers,
        startDate: start,
        endDate: end,
      });
      toast.success('Reporte diario generado');
    } catch (error) {
      toast.error('Error al generar el reporte');
      console.error(error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleProductReport = async () => {
    const start = startDate ? parseDateFromInput(startDate, 'start') : undefined;
    const end = endDate ? parseDateFromInput(endDate, 'end') : undefined;

    if (startDate && !start) {
      toast.error('Fecha inicio invalida');
      return;
    }
    if (endDate && !end) {
      toast.error('Fecha fin invalida');
      return;
    }
    if (start && end && start > end) {
      toast.error('La fecha fin debe ser mayor o igual a la fecha inicio');
      return;
    }

    try {
      setReportLoading(true);

      const filename = `reporte_productos_${new Date().toISOString().split('T')[0]}.xlsx`;
      await generateReportByProductUnit({
        filename,
        suppliers,
        startDate: start,
        endDate: end,
      });
      toast.success('Reporte de productos generado');
    } catch (error) {
      toast.error('Error al generar el reporte');
      console.error(error);
    } finally {
      setReportLoading(false);
    }
  };
  const totalPurchases = suppliers.reduce((sum, supplier) => sum + (supplier.purchases?.length || 0), 0);
  const totalAmount = suppliers.reduce((sum, supplier) => {
    return sum + (supplier.purchases?.reduce((purchaseSum, purchase) => purchaseSum + (purchase.totalAmount || 0), 0) || 0);
  }, 0);

  const stats = [
    {
      title: 'Total Proveedores',
      value: totalSuppliers.toString(),
      description: 'Proveedores activos en el sistema',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Compras Registradas',
      value: totalPurchases.toString(),
      description: 'Transacciones completadas',
      icon: ShoppingCart,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Productos Únicos',
      value: suppliers.reduce((sum, supplier) => {
        return sum + (supplier.purchases?.reduce((itemSum, purchase) => itemSum + (purchase.purchaseItems?.length || 0), 0) || 0);
      }, 0).toString(),
      description: 'Diferentes productos comprados',
      icon: Package,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Inversión Total',
      value: `$${totalAmount.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`,
      description: 'Monto invertido en compras',
      icon: TrendingUp,
      color: 'from-amber-500 to-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Gestión de Proveedores</h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl">
            Administra proveedores, registra compras y controla tu inventario de forma eficiente.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/supliers/create">
              <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-6 h-11">
                + Crear Proveedor
              </Button>
            </Link>
            <Link href="/dashboard/supliers/purchases">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-6 h-11 bg-transparent">
                + Registrar Compra
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reports Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 bg-slate-50 rounded-lg mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Reportes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Daily Report Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 h-12 w-full">
                <FileText className="h-5 w-5 mr-2" />
                Reporte Diario por Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar Reporte Diario por Cliente</DialogTitle>
                <DialogDescription>
                  Selecciona el rango de fechas para generar el reporte en Excel
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha Inicio</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Fecha Fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleDailyReport}
                  disabled={reportLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {reportLoading ? 'Generando...' : 'Descargar Reporte'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Product Report Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 w-full">
                <FileText className="h-5 w-5 mr-2" />
                Reporte por Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar Reporte por Producto</DialogTitle>
                <DialogDescription>
                  Selecciona el rango de fechas para generar el reporte agrupado por producto
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date-product">Fecha Inicio</Label>
                  <Input
                    id="start-date-product"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date-product">Fecha Fin</Label>
                  <Input
                    id="end-date-product"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleProductReport}
                  disabled={reportLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {reportLoading ? 'Generando...' : 'Descargar Reporte'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Funcionalidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Suppliers */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Crear Proveedores</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600 mb-4">
                Registra nuevos proveedores con todos sus datos de contacto e información adicional.
              </CardDescription>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-slate-700">✓ Datos de contacto completos</p>
                <p className="text-sm text-slate-700">✓ Información de empresa</p>
                <p className="text-sm text-slate-700">✓ Dirección y ubicación</p>
                <p className="text-sm text-slate-700">✓ Historial de cambios</p>
              </div>
              <Link href="/dashboard/supliers/create">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Ir a Crear Proveedor
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Register Purchases */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Registrar Compras</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-600 mb-4">
                Registra compras a proveedores con detalles de productos y costos.
              </CardDescription>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-slate-700">✓ Múltiples productos por compra</p>
                <p className="text-sm text-slate-700">✓ Cálculo automático de totales</p>
                <p className="text-sm text-slate-700">✓ Seguimiento de estado</p>
                <p className="text-sm text-slate-700">✓ Observaciones y notas</p>
              </div>
              <Link href="/dashboard/supliers/purchases">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Ir a Registrar Compra
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Suppliers and Purchases Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Proveedores y Compras</h2>

        {/* Edit Purchase Dialog */}
        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingPurchase(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar compra</DialogTitle>
              <DialogDescription>
                {editingPurchase ? `Compra #${editingPurchase.purchase.id}` : 'Selecciona una compra'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={editStatus}
                  onValueChange={(value) => setEditStatus(value as typeof editStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">created</SelectItem>
                    <SelectItem value="processing">processing</SelectItem>
                    <SelectItem value="completed">completed</SelectItem>
                    <SelectItem value="cancelled">cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pagado</Label>
                <Select
                  value={editPaid ? 'yes' : 'no'}
                  onValueChange={(value) => setEditPaid(value === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="¿Pagado?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveEdit} disabled={!editingPurchase}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600 font-medium">Cargando proveedores...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Error al cargar proveedores</p>
                <p className="text-sm text-red-700">No pudimos conectar con el servidor. Intenta nuevamente.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && suppliers.length === 0 && (
          <Card className="border-blue-200 bg-blue-50 text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-blue-900 font-semibold text-lg mb-2">No hay proveedores registrados</p>
              <p className="text-blue-700 mb-6">Comienza creando tu primer proveedor</p>
              <Link href="/dashboard/supliers/create">
                <Button className="bg-blue-600 hover:bg-blue-700">Crear Primer Proveedor</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && suppliers.length > 0 && (
          <div className="space-y-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl text-slate-900">{supplier.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {supplier.companyName && <p className="text-slate-600">Empresa: {supplier.companyName}</p>}
                        {supplier.contactName && <p className="text-slate-600">Contacto: {supplier.contactName}</p>}
                        {supplier.email && <p className="text-slate-600">Email: {supplier.email}</p>}
                        {supplier.phone && <p className="text-slate-600">Teléfono: {supplier.phone}</p>}
                        {supplier.address && <p className="text-slate-600">Dirección: {supplier.address}</p>}
                      </CardDescription>
                    </div>
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
                      {supplier.purchases?.length || 0} compras
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {supplier.purchases && supplier.purchases.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900 mb-3">Compras realizadas:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 border-b">
                            <tr>
                              <th className="text-left p-3 font-semibold text-slate-700">ID</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Fecha</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Productos</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Monto Total</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Estado</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Pagado</th>
                              <th className="text-left p-3 font-semibold text-slate-700">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplier.purchases.map((purchase) => (
                              <tr key={purchase.id} className="border-b hover:bg-slate-50 transition">
                                <td className="p-3 text-slate-600">#{purchase.id}</td>
                                <td className="p-3 text-slate-600">
                                  {new Date(purchase.createdAt).toLocaleDateString('es-ES')}
                                </td>
                                <td className="p-3">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <button
                                        type="button"
                                        className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium hover:bg-purple-200 transition"
                                      >
                                        {purchase.purchaseItems?.length || 0} items
                                      </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl">
                                      <DialogHeader>
                                        <DialogTitle>Items de compra #{purchase.id}</DialogTitle>
                                        <DialogDescription>
                                          {supplier.name} • {new Date(purchase.createdAt).toLocaleDateString('es-ES')}
                                        </DialogDescription>
                                      </DialogHeader>

                                      {purchase.purchaseItems && purchase.purchaseItems.length > 0 ? (
                                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                          <table className="w-full text-sm">
                                            <thead className="bg-slate-50 border-b">
                                              <tr>
                                                <th className="text-left p-3 font-semibold text-slate-700">Producto</th>
                                                <th className="text-left p-3 font-semibold text-slate-700">Unidad</th>
                                                <th className="text-right p-3 font-semibold text-slate-700">Cantidad</th>
                                                <th className="text-right p-3 font-semibold text-slate-700">Precio</th>
                                                <th className="text-right p-3 font-semibold text-slate-700">Subtotal</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {purchase.purchaseItems.map((item) => (
                                                <tr key={item.id} className="border-b last:border-b-0">
                                                  <td className="p-3 text-slate-700">
                                                    {item.product?.name || item.description || '-'}
                                                  </td>
                                                  <td className="p-3 text-slate-600">{getUnitLabel(item)}</td>
                                                  <td className="p-3 text-right text-slate-700">{item.quantity}</td>
                                                  <td className="p-3 text-right text-slate-700">
                                                    {item.unitCost.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                                                  </td>
                                                  <td className="p-3 text-right font-semibold text-slate-900">
                                                    {(item.quantity * item.unitCost).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="text-slate-600">No hay items en esta compra</p>
                                      )}
                                    </DialogContent>
                                  </Dialog>
                                </td>
                                <td className="p-3 font-semibold text-slate-900">
                                  ${purchase.totalAmount.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    purchase.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                    purchase.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {purchase.status}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    purchase.paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {purchase.paid ? 'Sí' : 'No'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => openEditPurchase(supplier.id, purchase)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => handleDeletePurchase(supplier.id, purchase.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600">No hay compras registradas</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 mb-12">
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-indigo-900">Sistema Profesional</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-800 mb-4">
              Nuestro sistema de gestión de proveedores está diseñado para ser intuitivo y fácil de usar. Con una interfaz clara y organizada, puedes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-900 mb-2">📋 Administración Eficiente</p>
                <p className="text-sm text-indigo-800">Mantén un registro completo de todos tus proveedores y sus datos de contacto en un solo lugar.</p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-900 mb-2">💰 Control Financiero</p>
                <p className="text-sm text-indigo-800">Rastrea todas tus compras y gastos con detalle, incluyendo fechas de pago y estados.</p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-900 mb-2">📊 Análisis de Datos</p>
                <p className="text-sm text-indigo-800">Obtén reportes y estadísticas sobre tus compras y proveedores para tomar mejores decisiones.</p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-900 mb-2">🔄 Fácil de Usar</p>
                <p className="text-sm text-indigo-800">Interfaz intuitiva que no requiere capacitación. Comienza a usar en minutos.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

