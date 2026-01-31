'use client';

import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} from '@/lib/api/hooks/useOrder';
import { useAreasQuery } from '@/lib/api/hooks/useArea';
import { useUsersQuery } from '@/lib/api/hooks/useUsers';
import { useProductsQuery } from '@/lib/api/hooks/useProduct';
import { Order, OrderItem, OrderStatus } from '@/types/order';
import { Area } from '@/types/area';
import { User } from '@/types/users';
import { Product } from '@/types/product';
import { OrderReportGenerator } from '@/components/dashboard/orders/order-report-generator';

interface FormData {
  areaId: number;
  userId?: number;
  totalAmount: number;
  status: string;
  observation?: string;
  orderItems: OrderItem[];
}

interface OrderItemForm {
  productId: number;
  quantity: number;
  price: number;
  unitMeasurementId: number;
}

const initialFormData: FormData = {
  areaId: 0,
  userId: undefined,
  totalAmount: 0,
  status: 'created',
  observation: '',
  orderItems: [],
};

export default function OrdersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [currentOrderItem, setCurrentOrderItem] = useState<OrderItemForm>({
    productId: 0,
    quantity: 0,
    price: 0,
    unitMeasurementId: 0,
  });

  const limit = 10;
  const { data: paginatedData, isLoading, isError, error } = useOrdersQuery({
    page: currentPage,
    limit,
    q: searchTerm,
  });
  const { data: areas = [] } = useAreasQuery();
  const { data: usersData = [] } = useUsersQuery();
  const { data: productsData } = useProductsQuery({ page: 1, limit: 100 });

  const createMutation = useCreateOrderMutation();
  const updateMutation = useUpdateOrderMutation(editingId || 0);
  const deleteMutation = useDeleteOrderMutation(deleteId || 0);

  // Extraer items
  const orders = React.useMemo(() => {
    return paginatedData?.items || [];
  }, [paginatedData]);
  const totalPages = paginatedData?.totalPages || 1;
  const filteredOrders = React.useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);

  const users = React.useMemo(() => (Array.isArray(usersData) ? usersData : []), [usersData]);
  const products = React.useMemo(() => productsData?.items || [], [productsData?.items]);

  // Logs de depuración (solo cuando cambian los datos importantes)
  React.useEffect(() => {
    console.log('[OrdersPage] Estado actual:', {
      isLoading,
      isError,
      error,
      ordersCount: filteredOrders.length,
      totalPages
    });
  }, [isLoading, isError, error, filteredOrders.length, totalPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.areaId || formData.orderItems.length === 0) {
      alert('Por favor completa los campos requeridos y añade al menos un producto');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          areaId: formData.areaId,
          userId: formData.userId || undefined,
          totalAmount: formData.totalAmount,
          status: formData.status as OrderStatus,
          observation: formData.observation || undefined,
          orderItems: formData.orderItems,
        });
      } else {
        await createMutation.mutateAsync({
          areaId: formData.areaId,
          userId: formData.userId || 0,
          totalAmount: formData.totalAmount,
          status: formData.status as OrderStatus,
          observation: formData.observation || undefined,
          orderItems: formData.orderItems,
        });
      }

      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la orden');
    }
  };

  const handleEdit = (order: Order) => {
    setFormData({
      areaId: order.areaId,
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: order.status,
      observation: order.observation || '',
      orderItems: order.orderItems || [],
    });
    setEditingId(order.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Est��s seguro de que deseas eliminar esta orden?')) {
      try {
        setDeleteId(id);
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la orden');
      }
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const addOrderItem = () => {
    if (!currentOrderItem.productId || !currentOrderItem.quantity || !currentOrderItem.unitMeasurementId) {
      alert('Por favor completa todos los campos del producto');
      return;
    }

    const product = products.find((p) => p.id === currentOrderItem.productId);
    if (!product) {
      alert('Producto no encontrado');
      return;
    }

    const unitMeasurement = product.productUnits?.find(pu => pu.unitMeasurementId === currentOrderItem.unitMeasurementId)?.unitMeasurement;

    const newItem: OrderItem = {
      id: Date.now(),
      orderId: editingId || 0,
      productId: currentOrderItem.productId,
      quantity: currentOrderItem.quantity,
      price: currentOrderItem.price,
      unitMeasurementId: currentOrderItem.unitMeasurementId,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
      },
      unitMeasurement,
    };

    setFormData({
      ...formData,
      orderItems: [...formData.orderItems, newItem],
      totalAmount: formData.totalAmount + currentOrderItem.quantity * currentOrderItem.price,
    });

    setCurrentOrderItem({
      productId: 0,
      quantity: 0,
      price: 0,
      unitMeasurementId: 0,
    });
  };

  const removeOrderItem = (index: number) => {
    const item = formData.orderItems[index];
    setFormData({
      ...formData,
      orderItems: formData.orderItems.filter((_, i) => i !== index),
      totalAmount: formData.totalAmount - item.quantity * item.price,
    });
  };

  const getAreaName = (areaId: number) => {
    return areas.find((a) => a.id === areaId)?.name || '-';
  };

  const getUserName = (userId?: number) => {
    if (!userId) return '-';
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : '-';
  };

  return (
    <div className="flex flex-col gap-6 bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border-b border-border">
        <div className="flex items-center gap-2 px-6 w-full justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <h1 className="text-base font-semibold">Órdenes</h1>
          </div>
          <div className="flex gap-2">
            <OrderReportGenerator />
            <Button
              onClick={() => router.push('/dashboard/orders/new')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Orden
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-8 bg-background">
        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Orden' : 'Nueva Orden'}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Actualiza los detalles de la orden'
                  : 'Crea una nueva orden para tu sistema'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Área *</label>
                  <select
                    value={formData.areaId}
                    onChange={(e) => setFormData({ ...formData, areaId: Number(e.target.value) })}
                    required
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecciona un área</option>
                    {Array.isArray(areas) &&
                      areas.map((area: Area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente (Opcional)</label>
                  <select
                    value={formData.userId || ''}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value ? Number(e.target.value) : undefined })}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Sin cliente</option>
                    {users.map((user: User) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="created">Creada</option>
                    <option value="pending">Pendiente</option>
                    <option value="delivered">Entregada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto Total: ${formData.totalAmount.toFixed(2)}</label>
                  <Input disabled value={`$${formData.totalAmount.toFixed(2)}`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observación</label>
                <Input
                  placeholder="Ej: Entregar en horario de mañana"
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>

              {/* Agregar Productos */}
              <div className="border-t border-border pt-4 space-y-4">
                <h3 className="text-sm font-semibold">Productos en la Orden</h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Producto</label>
                  <select
                    value={currentOrderItem.productId}
                    onChange={(e) => {
                      const productId = Number(e.target.value);
                      const product = products.find((p) => p.id === productId);
                      setCurrentOrderItem({
                        ...currentOrderItem,
                        productId,
                        price: product?.price || 0,
                        unitMeasurementId: product?.productUnits?.[0]?.unitMeasurementId || 0,
                      });
                    }}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map((product: Product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (${product.price.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cantidad</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={currentOrderItem.quantity}
                      onChange={(e) => setCurrentOrderItem({ ...currentOrderItem, quantity: Number(e.target.value) })}
                      disabled={createMutation.isPending || updateMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unidad</label>
                    <select
                      value={currentOrderItem.unitMeasurementId}
                      onChange={(e) => setCurrentOrderItem({ ...currentOrderItem, unitMeasurementId: Number(e.target.value) })}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecciona unidad</option>
                      {products.find(p => p.id === currentOrderItem.productId)?.productUnits?.map((unit) => (
                        <option key={unit.id} value={unit.unitMeasurementId}>
                          {unit.unitMeasurement.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Precio</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={currentOrderItem.price}
                      onChange={(e) => setCurrentOrderItem({ ...currentOrderItem, price: Number(e.target.value) })}
                      disabled={createMutation.isPending || updateMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subtotal</label>
                    <Input
                      disabled
                      value={`$${(currentOrderItem.quantity * currentOrderItem.price).toFixed(2)}`}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addOrderItem}
                  className="w-full bg-transparent"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Agregar Producto
                </Button>

                {/* Lista de productos en la orden */}
                {formData.orderItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Productos Agregados</h4>
                    <div className="space-y-2">
                      {formData.orderItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded border border-border"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.product?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOrderItem(index)}
                            className="p-2 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData(initialFormData);
                    setCurrentOrderItem({ productId: 0, quantity: 0, price: 0, unitMeasurementId: 0 });
                  }}
                  type="button"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editingId ? 'Actualizar' : 'Crear'} Orden
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles de la Orden #{selectedOrder?.id}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Área</p>
                    <p className="text-sm font-medium">{getAreaName(selectedOrder.areaId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="text-sm font-medium">{getUserName(selectedOrder.userId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="text-sm font-medium">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('es-PE', { 
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>
                </div>

                {selectedOrder.observation && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observación</p>
                    <p className="text-sm">{selectedOrder.observation}</p>
                  </div>
                )}

                {selectedOrder.createdAt && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Creada</p>
                      <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actualizada</p>
                      <p className="text-sm">{new Date(selectedOrder.updatedAt || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-semibold mb-2">Productos</h4>
                    <div className="space-y-2">
                      {selectedOrder.orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between p-2 bg-muted rounded text-sm">
                          <span>{item.product?.name}</span>
                          <span>
                            {item.quantity} × ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Welcome Header */}
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-foreground">Gestión de Órdenes</h2>
          <p className="text-lg text-muted-foreground">Administra todas las órdenes del sistema</p>
        </div>

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar orden por ID o área..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Orders Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Lista de Órdenes</CardTitle>
              <span className="text-sm text-muted-foreground">{filteredOrders.length} registros</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="ml-2 text-sm text-muted-foreground">Cargando órdenes...</p>
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-red-500">
                  Error al cargar órdenes: {error instanceof Error ? error.message : 'Error desconocido'}
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-center space-y-4">
                  <p className="text-lg font-semibold text-muted-foreground">No hay órdenes disponibles</p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No se encontraron órdenes que coincidan con tu búsqueda.' : 'Crea tu primera orden haciendo clic en "Nueva Orden".'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Área</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Cliente</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Fecha</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Observación</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order: Order) => (
                        <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-foreground">#{order.id}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">{getAreaName(order.areaId)}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">{getUserName(order.userId)}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">
                              {order.createdAt ? new Date(order.createdAt).toLocaleString('es-PE', { 
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </p>
                          </td>
                          <td className="py-4 px-4 max-w-xs">
                            <p className="text-sm text-muted-foreground truncate" title={order.observation || '-'}>
                              {order.observation || '-'}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleViewDetails(order)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleEdit(order)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredOrders.length > 0 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage >= totalPages}
                        className="gap-2"
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
