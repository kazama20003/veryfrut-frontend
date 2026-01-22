'use client';

import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Building2, Palette, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAreasQuery } from '@/lib/api/hooks/useArea';
import { useCompaniesQuery } from '@/lib/api/hooks/useCompany';
import { useCreateAreaMutation } from '@/lib/api/hooks/useArea';
import { useCreateCompanyMutation } from '@/lib/api/hooks/useCompany';
import { colorOptions } from '@/lib/constants/color-options';
import { Area } from '@/types/area';
import { Company } from '@/types/company';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface FormData {
  companyName: string;
  companyColor: string;
  areaName: string;
  areaColor: string;
}

const Loading = () => null;

export default function AreasPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    companyColor: '#8CC63F',
    areaName: '',
    areaColor: '#1976D2',
  });

  const { data: areas = [] } = useAreasQuery();
  const { data: companies = [] } = useCompaniesQuery();
  const createAreaMutation = useCreateAreaMutation();
  const createCompanyMutation = useCreateCompanyMutation();

  const allColorsFlat = Object.values(colorOptions).flat();

  const filteredAreas = Array.isArray(areas) ? areas.filter((area: Area) =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredCompanies = Array.isArray(companies) ? companies.filter((company: Company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Crear empresa
      const newCompany = await createCompanyMutation.mutateAsync({
        name: formData.companyName,
        color: formData.companyColor,
      });

      // Crear área asociada
      if (newCompany?.id) {
        await createAreaMutation.mutateAsync({
          name: formData.areaName,
          companyId: newCompany.id,
          color: formData.areaColor,
        });
      }

      // Reset form
      setFormData({
        companyName: '',
        companyColor: '#8CC63F',
        areaName: '',
        areaColor: '#1976D2',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating company and area:', error);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-col gap-6 bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border-b border-border">
          <div className="flex items-center gap-2 px-6 w-full justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <h1 className="text-base font-semibold">Áreas</h1>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Área
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-8 p-8 bg-background">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-foreground">Gestión de Áreas</h2>
            <p className="text-lg text-muted-foreground">Administra empresas y sus áreas asociadas</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Empresas</CardTitle>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-foreground">{filteredCompanies.length}</div>
                <p className="text-xs text-muted-foreground">Registradas en el sistema</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Áreas</CardTitle>
                <div className="p-3 bg-green-100 rounded-full">
                  <Palette className="w-5 h-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-foreground">{filteredAreas.length}</div>
                <p className="text-xs text-muted-foreground">Activas en empresas</p>
              </CardContent>
            </Card>
          </div>

          {/* Form Section - Modal Style */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <Card className="w-full max-w-2xl border shadow-lg my-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-background border-b">
                  <CardTitle>Crear Empresa y Área</CardTitle>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Información de Empresa
                      </h3>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre</label>
                        <Input
                          placeholder="Ej: Recursos Humanos"
                          value={formData.companyName}
                          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Selecciona Color</label>
                        <div className="grid grid-cols-8 gap-2">
                          {allColorsFlat.map((color, index) => (
                            <button
                              key={`company-color-${index}`}
                              type="button"
                              onClick={() => setFormData({...formData, companyColor: color})}
                              className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                                formData.companyColor === color 
                                  ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-foreground' 
                                  : 'border-transparent'
                              }`}
                              style={{backgroundColor: color}}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{backgroundColor: formData.companyColor}}
                          />
                          <span className="text-sm text-muted-foreground">{formData.companyColor}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Area Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Información de Área
                      </h3>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre</label>
                        <Input
                          placeholder="Ej: Gestión de Personal"
                          value={formData.areaName}
                          onChange={(e) => setFormData({...formData, areaName: e.target.value})}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Selecciona Color</label>
                        <div className="grid grid-cols-8 gap-2">
                          {allColorsFlat.map((color, index) => (
                            <button
                              key={`area-color-${index}`}
                              type="button"
                              onClick={() => setFormData({...formData, areaColor: color})}
                              className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                                formData.areaColor === color 
                                  ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-foreground' 
                                  : 'border-transparent'
                              }`}
                              style={{backgroundColor: color}}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{backgroundColor: formData.areaColor}}
                          />
                          <span className="text-sm text-muted-foreground">{formData.areaColor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                      <Button variant="outline" onClick={() => setShowForm(false)} type="button">
                        Cancelar
                      </Button>
                      <Button type="submit" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Crear
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar áreas..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Areas Table */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>Áreas Registradas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-slate-50">
                      <th className="py-3 px-4 text-left text-sm font-semibold text-muted-foreground">Área</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-muted-foreground">Empresa</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-muted-foreground">Color Área</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAreas.length === 0 ? (
                      <tr className="border-b border-border">
                        <td colSpan={4} className="py-8 px-4 text-center text-muted-foreground">
                          No hay áreas registradas
                        </td>
                      </tr>
                    ) : (
                      filteredAreas.map((area: Area) => {
                        const company = companies.find(c => c.id === area.companyId);
                        return (
                          <tr key={area.id} className="border-b border-border hover:bg-slate-50 transition">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: area.color }}
                                />
                                <span className="font-medium">{area.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {company && (
                                  <>
                                    <div
                                      className="w-3 h-3 rounded"
                                      style={{ backgroundColor: company.color }}
                                    />
                                    <span>{company.name}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-muted-foreground">{area.color}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="gap-1">
                                  <Edit2 className="w-4 h-4" />
                                  Editar
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Companies List */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>Empresas Registradas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompanies.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No hay empresas registradas
                  </div>
                ) : (
                  filteredCompanies.map((company: Company) => (
                    <div
                      key={company.id}
                      className="p-4 border border-border rounded-lg hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-6 h-6 rounded flex-shrink-0"
                            style={{ backgroundColor: company.color }}
                          />
                          <div>
                            <h4 className="font-semibold">{company.name}</h4>
                            <p className="text-xs text-muted-foreground">{company.color}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Suspense>
  );
}
