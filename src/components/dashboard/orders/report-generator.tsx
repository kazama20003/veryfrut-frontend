'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Order } from '@/types/order';
import { useAreasQuery } from '@/lib/api/hooks/useArea';

export function ReportGenerator() {
  const [reportType, setReportType] = useState<'day' | 'range'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({ from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });
  const [isLoading, setIsLoading] = useState(false);
  const [reportDate, setReportDate] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showReport, setShowReport] = useState(false);

  const { data: areasData = [] } = useAreasQuery();

  // Generar CSV (Excel simple)
  const downloadExcel = async () => {
    try {
      if (orders.length === 0) {
        alert('No hay órdenes para exportar.');
        return;
      }

      // Crear CSV
      let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
      csvContent += `Reporte de Órdenes - ${reportDate}\n\n`;
      csvContent += 'ID,Área,Cliente,Estado,Monto Total,Observación,Fecha\n';

      orders.forEach((order) => {
        const areaName = areasData.find((a) => a.id === order.areaId)?.name || '-';
        const clientName = order.user ? `${order.user.firstName} ${order.user.lastName}` : '-';
        const createdDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-';
        const observation = (order.observation || '').replace(/,/g, ';'); // Escapar comas

        csvContent += `${order.id},"${areaName}","${clientName}","${order.status}","${order.totalAmount.toFixed(2)}","${observation}","${createdDate}"\n`;
      });

      // Descargar
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Reporte_Ordenes_${reportDate.replace(/\//g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al generar CSV:', error);
      alert('Error al generar el reporte');
    }
  };

  // Generar PDF simple con tabla
  const downloadPDF = async () => {
    try {
      if (orders.length === 0) {
        alert('No hay órdenes para exportar.');
        return;
      }

      let pdfContent = `
        <html>
          <head>
            <title>Reporte de Órdenes</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #366092; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
              td { padding: 8px; border: 1px solid #ddd; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .total { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Reporte de Órdenes - ${reportDate}</h1>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Área</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Monto Total</th>
                  <th>Observación</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
      `;

      orders.forEach((order) => {
        const areaName = areasData.find((a) => a.id === order.areaId)?.name || '-';
        const clientName = order.user ? `${order.user.firstName} ${order.user.lastName}` : '-';
        const createdDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-';

        pdfContent += `
          <tr>
            <td>${order.id}</td>
            <td>${areaName}</td>
            <td>${clientName}</td>
            <td>${order.status}</td>
            <td>$${order.totalAmount.toFixed(2)}</td>
            <td>${order.observation || ''}</td>
            <td>${createdDate}</td>
          </tr>
        `;
      });

      pdfContent += `
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '', 'width=900,height=600');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  // Generar reporte
  const generateReport = async () => {
    setIsLoading(true);

    try {
      let startDate: Date;
      let endDate: Date;
      let displayDate: string;

      if (reportType === 'day') {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        displayDate = new Date(selectedDate).toLocaleDateString();
      } else {
        startDate = new Date(dateRange.from);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        displayDate = `${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`;
      }

      setReportDate(displayDate);

      // Llamar al API para obtener órdenes
      const response = await fetch(`/api/orders?page=1&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        alert('Error al cargar las órdenes');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const allOrders = data.items || data || [];

      // Filtrar órdenes por fecha
      const filteredOrders = allOrders.filter((order: Order) => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      if (filteredOrders.length === 0) {
        alert('No hay órdenes en el período seleccionado');
        setIsLoading(false);
        return;
      }

      setOrders(filteredOrders);
      setShowReport(true);
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo generar el reporte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden sm:inline">Reporte</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generar Reporte de Órdenes</DialogTitle>
          <DialogDescription>Selecciona el período para generar el reporte.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de reporte</label>
            <div className="flex gap-2">
              <Button
                variant={reportType === 'day' ? 'default' : 'outline'}
                onClick={() => setReportType('day')}
                className="flex-1"
              >
                Por día
              </Button>
              <Button
                variant={reportType === 'range' ? 'default' : 'outline'}
                onClick={() => setReportType('range')}
                className="flex-1"
              >
                Por rango
              </Button>
            </div>
          </div>

          {reportType === 'day' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar día</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Desde</label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hasta</label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
            </div>
          )}

          <Button onClick={generateReport} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              'Generar Reporte'
            )}
          </Button>

          {showReport && (
            <div className="space-y-4 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                <strong>Reporte para:</strong> {reportDate}
                <br />
                <strong>Órdenes:</strong> {orders.length}
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadExcel} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Descargar CSV
                </Button>
                <Button onClick={downloadPDF} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Imprimir PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
