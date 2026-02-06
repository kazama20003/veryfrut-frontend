'use client';

import React from "react"

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Loader } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateSupplierInput } from '@/types/supplier';
import suppliersService, { type Suplier } from '@/lib/api/services/suppliers-service';

export default function CreateSupplierPage() {
  const [isLoading, setIsLoading] = useState(false);
const [suppliers, setSuppliers] = useState<Suplier[]>([]);

  const [formData, setFormData] = useState<CreateSupplierInput>({
    name: '',
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del proveedor es requerido');
      return;
    }

setIsLoading(true);
    try {
      // Llamar al API real para crear el proveedor
      const newSupplier = await suppliersService.create(formData);

      if (newSupplier) {
        // Agregar nuevo proveedor a la lista local
        setSuppliers((prev) => [newSupplier, ...prev]);
        toast.success('Proveedor creado exitosamente');

        // Resetear formulario
        setFormData({
          name: '',
          companyName: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
        });
      } else {
        throw new Error('No se pudo crear el proveedor');
      }
    } catch (error) {
      toast.error('Error al crear el proveedor');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success('Proveedor eliminado');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/supliers">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Crear Proveedor</h1>
              <p className="text-slate-600 mt-1">Registra nuevos proveedores en el sistema</p>
            </div>
          </div>
          <Link href="/dashboard/supliers/purchases">
            <Button variant="outline">Ver Compras</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="text-2xl text-blue-900">Formulario de Registro</CardTitle>
              <CardDescription className="text-blue-700">
                Completa los datos del nuevo proveedor
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Nombre y Empresa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      Nombre del Proveedor *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Ej: Acme Corp"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
                      Nombre de Empresa
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder="Ej: Acme Manufacturing Inc."
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Row 2: Contacto y Teléfono */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-sm font-semibold text-slate-700">
                      Nombre de Contacto
                    </Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      type="text"
                      placeholder="Ej: Juan Pérez"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Ej: +34 912 345 678"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Row 3: Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Ej: contacto@acme.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Row 4: Dirección */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-slate-700">
                    Dirección
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Ej: Calle Principal 123, Madrid, España"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 min-h-24 resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Proveedor
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        name: '',
                        companyName: '',
                        contactName: '',
                        phone: '',
                        email: '',
                        address: '',
                      })
                    }
                    className="h-10"
                  >
                    Limpiar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card className="shadow-lg h-fit">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b">
              <CardTitle className="text-lg text-amber-900">Información</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Campo Requerido</h3>
                <p className="text-sm text-blue-800">
                  El <strong>Nombre del Proveedor</strong> es obligatorio para crear un nuevo registro.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Campos Opcionales</h3>
                <p className="text-sm text-green-800">
                  Los demás campos puedes completarlos según la información disponible del proveedor.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Próximo Paso</h3>
                <p className="text-sm text-purple-800 mb-3">
                  Una vez creado el proveedor, podrás registrar compras asociadas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suppliers List */}
        {suppliers.length > 0 && (
          <Card className="mt-8 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
              <CardTitle className="text-xl text-slate-900">Proveedores Creados</CardTitle>
              <CardDescription>
                {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{supplier.name}</h3>
                      {supplier.email && (
                        <p className="text-sm text-slate-600">{supplier.email}</p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(supplier.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
