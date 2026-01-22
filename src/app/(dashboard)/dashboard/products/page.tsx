'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Search, Trash2, Edit2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  useProductsQuery, 
  useCreateProductMutation, 
  useUpdateProductMutation, 
  useDeleteProductMutation 
} from '@/lib/api/hooks/useProduct';
import { useCategoriesQuery } from '@/lib/api/hooks/useCategory';
import { useUnitMeasurementsQuery } from '@/lib/api/hooks/useUnitMeasurement';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { UnitMeasurement } from '@/types/unit-measurement';

interface FormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: number;
  unitMeasurementIds: number[];
}

const initialFormData: FormData = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  imageUrl: '',
  categoryId: 0,
  unitMeasurementIds: [],
};

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const limit = 10;
  const { data: paginatedData, isLoading, isError, error } = useProductsQuery({ 
    page: currentPage,
    limit,
    q: searchTerm,
  });
  const { data: categories = [] } = useCategoriesQuery();
  const { data: unitMeasurements = [] } = useUnitMeasurementsQuery();
  
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation(editingId || 0);
  const deleteMutation = useDeleteProductMutation(deleteId || 0);

  // Extraer los items del objeto paginado
  const products = React.useMemo(() => paginatedData?.items || [], [paginatedData]);
  const totalPages = paginatedData?.totalPages || 1;
  const filteredProducts = React.useMemo(() => Array.isArray(products) ? products : [], [products]);

  // Logs de depuración
  React.useEffect(() => {
    console.log('[ProductsPage] paginatedData:', paginatedData);
    console.log('[ProductsPage] isLoading:', isLoading);
    console.log('[ProductsPage] isError:', isError);
    console.log('[ProductsPage] error:', error);
    console.log('[ProductsPage] products:', products);
    console.log('[ProductsPage] filteredProducts:', filteredProducts);
  }, [paginatedData, isLoading, isError, error, products, filteredProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.categoryId) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          price: formData.price,
          stock: formData.stock,
          imageUrl: formData.imageUrl || undefined,
          categoryId: formData.categoryId,
          unitMeasurementIds: formData.unitMeasurementIds.length > 0 ? formData.unitMeasurementIds : undefined,
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
          price: formData.price,
          stock: formData.stock,
          imageUrl: formData.imageUrl || undefined,
          categoryId: formData.categoryId,
          unitMeasurementIds: formData.unitMeasurementIds,
        });
      }

      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId,
      unitMeasurementIds: product.unitMeasurementIds || [],
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        setDeleteId(id);
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  const toggleUnitMeasurement = (id: number) => {
    setFormData({
      ...formData,
      unitMeasurementIds: formData.unitMeasurementIds.includes(id)
        ? formData.unitMeasurementIds.filter(uid => uid !== id)
        : [...formData.unitMeasurementIds, id],
    });
  };

  return (
    <div className="flex flex-col gap-6 bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border-b border-border">
        <div className="flex items-center gap-2 px-6 w-full justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <h1 className="text-base font-semibold">Productos</h1>
          </div>
          <Button onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setShowForm(!showForm);
          }} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-8 bg-background">
        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Actualiza los detalles del producto'
                  : 'Crea un nuevo producto para tu catálogo'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    placeholder="Ej: Manzana Roja"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    required
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecciona una categoría</option>
                    {Array.isArray(categories) && categories.map((cat: Category) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  placeholder="Ej: Manzanas frescas de temporada"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock *</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    required
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL de Imagen</label>
                <Input
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                {formData.imageUrl && (
                  <Image 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    width={128}
                    height={128}
                    className="w-32 h-32 object-cover rounded-lg border border-border"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unidades de Medida</label>
                <div className="grid grid-cols-2 gap-2">
                  {Array.isArray(unitMeasurements) && unitMeasurements.map((unit: UnitMeasurement) => (
                    <label key={unit.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.unitMeasurementIds.includes(unit.id)}
                        onChange={() => toggleUnitMeasurement(unit.id)}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{unit.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData(initialFormData);
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
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingId ? 'Actualizar' : 'Crear Producto'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Welcome Header */}
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-foreground">Gestión de Productos</h2>
          <p className="text-lg text-muted-foreground">Administra todos los productos de tu catálogo</p>
        </div>

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto por nombre..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Products Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Lista de Productos</CardTitle>
              <span className="text-sm text-muted-foreground">{filteredProducts.length} registros</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="ml-2 text-sm text-muted-foreground">Cargando productos...</p>
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-red-500">Error al cargar productos: {error instanceof Error ? error.message : 'Error desconocido'}</p>
              </div>
            ) : (
              <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Categoría</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Precio</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Stock</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr className="border-b border-border">
                      <td colSpan={5} className="py-12 px-4 text-center text-sm text-muted-foreground">
                        No hay productos disponibles
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product: Product) => {
                      const category = Array.isArray(categories) 
                        ? categories.find((c: Category) => c.id === product.categoryId)
                        : null;
                      
                      return (
                        <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {product.imageUrl && (
                                <Image 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-foreground">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.description || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">{category?.name || '-'}</p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <p className="text-sm font-medium text-foreground">${product.price.toFixed(2)}</p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <p className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {product.stock}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
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
