'use client';

import React, { useState } from 'react';
import { Order } from '@/types/order';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateExcelReport } from '@/lib/utils/excel-report';
import { useOrdersByDay } from '@/lib/api/hooks/use-orders-by-day';
import { useCategoriesQuery } from '@/lib/api';
import { Loader2, Download } from 'lucide-react';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function ReportDialog({ open, onOpenChange }: ReportDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  
  // Obtener órdenes del día seleccionado desde la API
  const { data: dayOrders = [], isLoading: isDayLoading } = useOrdersByDay(
    selectedDate || null,
    !!selectedDate && open
  );

  // Obtener categorías para ordenar el reporte
  const { data: categoriesData = [] } = useCategoriesQuery();

  console.log('[v0] Report Dialog - Selected date:', selectedDate);
  console.log('[v0] Report Dialog - Day orders from API:', dayOrders.length);
  
  // Usar órdenes del día si están disponibles, sino usar un array vacío
  const filteredOrders = selectedDate ? (dayOrders.length > 0 ? dayOrders : []) : [];
  
  const previewData = {
    totalOrders: filteredOrders.length,
    totalProducts: new Set(
      filteredOrders.flatMap((o) => o.orderItems?.map((i) => i.productId) || [])
    ).size,
    totalAreas: new Set(filteredOrders.map((o) => o.areaId)).size,
    totalQuantity: filteredOrders.reduce(
      (sum, o) =>
        sum +
        (o.orderItems?.reduce((s, i) => s + (i.quantity || 0), 0) || 0),
      0
    ),
  };

  const handleGenerateReport = async () => {
    if (filteredOrders.length === 0) return;

    setIsGenerating(true);
    try {
      console.log('[v0] Generating report for date:', selectedDate);
      console.log('[v0] Orders to export:', filteredOrders.length);
      console.log('[v0] Orders with observations:', filteredOrders.filter((o) => o.observation).map((o) => ({ id: o.id, obs: o.observation })));
      console.log('[v0] Categories order:', categoriesData.map((c) => c.name));
      
      await generateExcelReport(filteredOrders, selectedDate, selectedDate, selectedDate, categoriesData);
      onOpenChange(false);
      setSelectedDate('');
    } catch (error) {
      console.error('[v0] Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Reporte de Productos</DialogTitle>
          <DialogDescription>
            Descarga un archivo Excel con el resumen de órdenes y productos del día seleccionado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Selecciona la fecha del reporte:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
              <p className="text-xs text-muted-foreground">Órdenes</p>
              <p className="text-xl font-bold text-blue-600">{previewData.totalOrders}</p>
            </div>
            <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
              <p className="text-xs text-muted-foreground">Productos</p>
              <p className="text-xl font-bold text-purple-600">{previewData.totalProducts}</p>
            </div>
            <div className="bg-green-50 p-2 rounded-lg border border-green-200">
              <p className="text-xs text-muted-foreground">Áreas</p>
              <p className="text-xl font-bold text-green-600">{previewData.totalAreas}</p>
            </div>
            <div className="bg-orange-50 p-2 rounded-lg border border-orange-200">
              <p className="text-xs text-muted-foreground">Cantidad Total</p>
              <p className="text-xl font-bold text-orange-600">{previewData.totalQuantity}</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              El reporte incluirá todas las órdenes del día seleccionado organizadas por categoría, empresa y área con las cantidades de cada producto y observaciones.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedDate('');
            }}
            disabled={isGenerating || isDayLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || isDayLoading || filteredOrders.length === 0}
            className="gap-2"
          >
            {isGenerating || isDayLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isGenerating ? 'Generando...' : 'Cargando...'}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
