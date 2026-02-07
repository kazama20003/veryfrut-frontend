'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrderQuery, useProductsQuery, useUpdateOrderMutation } from '@/lib/api';
import type { CreateOrderItemDto, Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleProductCombobox } from '@/components/users/simple-product-combobox';

interface DraftItem {
  key: string;
  productId: number;
  unitMeasurementId: number;
  productName: string;
  unitName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

function formatDate(date?: string) {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('es-ES');
}

function toPositiveNumber(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function toInitialItems(order: Order): DraftItem[] {
  return (order.orderItems ?? []).map((item) => ({
    key: `existing-${item.id}`,
    productId: item.productId,
    unitMeasurementId: item.unitMeasurementId,
    productName: item.product?.name ?? `Producto ${item.productId}`,
    unitName: item.unitMeasurement?.name ?? `Unidad ${item.unitMeasurementId}`,
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    imageUrl: item.product?.imageUrl,
  }));
}

function EditOrderForm({ order }: { order: Order }) {
  const router = useRouter();
  const updateMutation = useUpdateOrderMutation(order.id);
  const { data: productsData, isLoading: isLoadingProducts } = useProductsQuery({ page: 1, limit: 300 });
  const products = useMemo(() => productsData?.items ?? [], [productsData?.items]);

  const [items, setItems] = useState<DraftItem[]>(() => toInitialItems(order));
  const [observation, setObservation] = useState(order.observation ?? '');
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [selectedUnitId, setSelectedUnitId] = useState<number | undefined>(undefined);
  const [newQuantity, setNewQuantity] = useState('1');

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  const selectedProductUnits = useMemo(
    () => selectedProduct?.productUnits ?? [],
    [selectedProduct?.productUnits]
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const handleSelectProduct = (productId: number) => {
    const product = products.find((item) => item.id === productId);
    setSelectedProductId(productId);
    setSelectedUnitId(product?.productUnits?.[0]?.unitMeasurement.id);
  };

  const handleChangeQuantity = (index: number, rawValue: string) => {
    const parsed = toPositiveNumber(rawValue);
    if (parsed === null && rawValue !== '') return;

    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity: parsed ?? 0 } : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleAddProduct = () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    if (!selectedUnitId) {
      toast.error('El producto no tiene unidad disponible');
      return;
    }

    const quantity = toPositiveNumber(newQuantity);
    if (!quantity) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const selectedUnit = selectedProduct.productUnits?.find(
      (unit) => unit.unitMeasurement.id === selectedUnitId
    )?.unitMeasurement;

    if (!selectedUnit) {
      toast.error('Unidad no valida para este producto');
      return;
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === selectedProduct.id && item.unitMeasurementId === selectedUnit.id
      );

      if (existingIndex >= 0) {
        return prev.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...prev,
        {
          key: `new-${selectedProduct.id}-${selectedUnit.id}-${Date.now()}`,
          productId: selectedProduct.id,
          unitMeasurementId: selectedUnit.id,
          productName: selectedProduct.name,
          unitName: selectedUnit.name,
          quantity,
          price: selectedProduct.price,
          imageUrl: selectedProduct.imageUrl,
        },
      ];
    });

    setSelectedProductId(undefined);
    setSelectedUnitId(undefined);
    setNewQuantity('1');
  };

  const handleSave = async () => {
    const cleanItems = items
      .filter((item) => item.quantity > 0)
      .map<CreateOrderItemDto>((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        unitMeasurementId: item.unitMeasurementId,
      }));

    if (cleanItems.length === 0) {
      toast.error('Debes dejar al menos un producto en el pedido');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        areaId: order.areaId,
        userId: order.userId,
        status: order.status,
        observation,
        totalAmount: totalQuantity,
        orderItems: cleanItems,
      });

      toast.success('Pedido actualizado correctamente');
      router.push('/dashboard/orders');
    } catch (saveError) {
      console.error('[EditOrderPage] Error updating order', saveError);
      toast.error('No se pudo actualizar el pedido');
    }
  };

  return (
    <div className='p-4 sm:p-6 space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Editar pedido #{order.id}</h1>
          <p className='text-sm text-muted-foreground'>
            Cliente: {order.User?.firstName} {order.User?.lastName} | Fecha: {formatDate(order.createdAt)}
          </p>
        </div>
        <Button variant='outline' onClick={() => router.push('/dashboard/orders')} className='w-full sm:w-auto'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar productos</CardTitle>
          <CardDescription>Selecciona producto, unidad y cantidad</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='space-y-2'>
              <Label>Producto</Label>
              <SimpleProductCombobox
                products={products}
                selectedProductId={selectedProductId}
                onProductSelect={handleSelectProduct}
                placeholder={isLoadingProducts ? 'Cargando productos...' : 'Selecciona un producto'}
              />
            </div>

            <div className='space-y-2'>
              <Label>Unidad</Label>
              <Select
                value={selectedUnitId ? selectedUnitId.toString() : ''}
                onValueChange={(value) => setSelectedUnitId(Number(value))}
                disabled={!selectedProduct || selectedProductUnits.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Selecciona unidad' />
                </SelectTrigger>
                <SelectContent>
                  {selectedProductUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.unitMeasurement.id.toString()}>
                      {unit.unitMeasurement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3'>
            <div className='space-y-2'>
              <Label>Cantidad</Label>
              <Input
                type='number'
                min='0.01'
                step='0.25'
                value={newQuantity}
                onChange={(event) => setNewQuantity(event.target.value)}
              />
            </div>

            <div className='flex items-end'>
              <Button type='button' onClick={handleAddProduct} className='w-full md:w-auto'>
                <Plus className='h-4 w-4 mr-2' />
                Agregar producto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos del pedido</CardTitle>
          <CardDescription>Modifica cantidades o elimina productos</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No hay productos en el pedido.</p>
          ) : (
            <div className='space-y-3'>
              {items.map((item, index) => (
                <div key={item.key} className='border rounded-lg p-3'>
                  <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
                    <div className='flex items-center gap-3'>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          width={52}
                          height={52}
                          className='h-12 w-12 rounded-md object-cover border'
                        />
                      ) : (
                        <div className='h-12 w-12 rounded-md border bg-muted' />
                      )}
                      <div>
                      <p className='font-medium'>{item.productName}</p>
                      <p className='text-xs text-muted-foreground'>
                        Unidad: {item.unitName}
                      </p>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-[140px_160px] gap-2 w-full md:w-auto'>
                      <Input
                        type='number'
                        min='0.01'
                        step='0.25'
                        value={item.quantity}
                        onChange={(event) => handleChangeQuantity(index, event.target.value)}
                      />
                      <Button
                        type='button'
                        variant='destructive'
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className='pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>Total de cantidad</p>
            <p className='text-2xl font-bold'>{totalQuantity.toLocaleString('es-ES')}</p>
          </div>

          <Button onClick={handleSave} disabled={updateMutation.isPending} className='w-full sm:w-auto'>
            {updateMutation.isPending ? (
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            ) : null}
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observacion</CardTitle>
          <CardDescription>Edita la observacion del pedido</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder='Escribe una observacion para el pedido'
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditOrderPage() {
  const params = useParams();
  const orderId = useMemo(() => Number(params?.id), [params?.id]);

  const { data: order, isLoading, error } = useOrderQuery(Number.isFinite(orderId) ? orderId : null);

  if (!Number.isFinite(orderId)) {
    return (
      <div className='p-6'>
        <Card>
          <CardContent className='pt-6'>ID de pedido invalido.</CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='p-6 flex justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className='p-6'>
        <Card>
          <CardContent className='pt-6'>No se pudo cargar el pedido.</CardContent>
        </Card>
      </div>
    );
  }

  return <EditOrderForm key={order.id} order={order} />;
}
