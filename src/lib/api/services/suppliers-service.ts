/**
 * Service para endpoints de Suppliers (Proveedores)
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';

// Tipos basados en los DTOs del backend
export interface CreatePurchaseItemDto {
  productId?: number;
  description?: string;
  quantity: number;
  unitMeasurementId?: number;
  unitCost: number;
}

export interface CreatePurchaseDto {
  areaId?: number | null;
  totalAmount: number;
  purchaseItems: CreatePurchaseItemDto[];
}

export interface CreateSuplierDto {
  name: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdatePurchaseDto {
  status?: 'created' | 'processing' | 'completed' | 'cancelled';
  paid?: boolean;
  paymentDate?: Date;
  observation?: string;
}

export type UpdateSuplierDto = Partial<CreateSuplierDto>;

// Tipos de respuesta
export interface Suplier {
  id: number;
  name: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  purchases?: Purchase[];
}

export interface Purchase {
  id: number;
  suplierId: number;
  areaId?: number;
  totalAmount: number;
  status: 'created' | 'processing' | 'completed' | 'cancelled';
  paid: boolean;
  paymentDate?: string;
  observation?: string;
  createdAt: string;
  updatedAt: string;
  purchaseItems?: PurchaseItem[];
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId?: number;
  description?: string;
  quantity: number;
  unitMeasurementId?: number;
  unitCost: number;
  product?: {
    id: number;
    name: string;
  };
  unitMeasurement?: {
    id: number;
    name: string;
    abbreviation: string;
  };
}

// Parámetros de consulta
export interface GetSupliersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface GetPurchasesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Tipos de respuesta paginada
export interface PaginatedSupliersResponse {
  data: Suplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedPurchasesResponse {
  data: Purchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}



class SuppliersService {
  /**
   * Obtener todos los proveedores con paginación y ordenamiento
   */
  async getAll(params?: GetSupliersParams) {
    const response = await axiosInstance.get<Suplier[] | ApiResponse<Suplier[]> | PaginatedSupliersResponse>('/supliers', { params });
    
    // Si es respuesta paginada
    if ('totalPages' in response.data) {
      return response.data as PaginatedSupliersResponse;
    }
    
    // Si es respuesta simple o ApiResponse
    const data = (response.data as ApiResponse<Suplier[]>)?.data || response.data;
    return Array.isArray(data) ? { data, total: data.length, page: 1, limit: data.length, totalPages: 1 } : { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }

  /**
   * Obtener proveedor por ID
   */
  async getById(id: string | number) {
    const response = await axiosInstance.get<Suplier | ApiResponse<Suplier>>(`/supliers/${id}`);
    const data = (response.data as ApiResponse<Suplier>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Crear nuevo proveedor
   */
  async create(data: CreateSuplierDto) {
    const response = await axiosInstance.post<Suplier | ApiResponse<Suplier>>('/supliers', data);
    const responseData = (response.data as ApiResponse<Suplier>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Actualizar proveedor
   */
  async update(id: number, data: UpdateSuplierDto) {
    const response = await axiosInstance.patch<Suplier | ApiResponse<Suplier>>(`/supliers/${id}`, data);
    const responseData = (response.data as ApiResponse<Suplier>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Eliminar proveedor
   */
  async delete(id: string | number): Promise<{ success: boolean }> {
    const response = await axiosInstance.delete<{ success: boolean } | ApiResponse<{ success: boolean }>>(`/supliers/${id}`);
    const payload = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;

    if (payload && typeof payload === 'object' && 'success' in payload) {
      return { success: Boolean((payload as { success?: boolean }).success) };
    }

    return { success: response.status >= 200 && response.status < 300 };
  }

  /**
   * Obtener todas las compras de un proveedor
   */
  async getPurchasesBySupplier(suplierId: string | number, params?: GetPurchasesParams) {
    const response = await axiosInstance.get<Purchase[] | ApiResponse<Purchase[]> | PaginatedPurchasesResponse>(`/supliers/${suplierId}/purchases`, { params });
    
    // Si es respuesta paginada
    if ('totalPages' in response.data) {
      return response.data as PaginatedPurchasesResponse;
    }
    
    // Si es respuesta simple o ApiResponse
    const data = (response.data as ApiResponse<Purchase[]>)?.data || response.data;
    return Array.isArray(data) ? { data, total: data.length, page: 1, limit: data.length, totalPages: 1 } : { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }

  /**
   * Crear compra para un proveedor específico
   */
  async createPurchase(suplierId: string | number, data: CreatePurchaseDto) {
    const response = await axiosInstance.post<Purchase | ApiResponse<Purchase>>(`/supliers/${suplierId}/purchases`, data);
    const responseData = (response.data as ApiResponse<Purchase>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Obtener compra específica por ID
   */
  async getPurchaseById(purchaseId: string | number) {
    const response = await axiosInstance.get<Purchase | ApiResponse<Purchase>>(`/supliers/purchases/${purchaseId}`);
    const data = (response.data as ApiResponse<Purchase>)?.data || response.data;
    return data && typeof data === 'object' && 'id' in data ? data : undefined;
  }

  /**
   * Actualizar compra específica
   */
  async updatePurchase(purchaseId: string | number, data: UpdatePurchaseDto) {
    const response = await axiosInstance.patch<Purchase | ApiResponse<Purchase>>(`/supliers/purchases/${purchaseId}`, data);
    const responseData = (response.data as ApiResponse<Purchase>)?.data || response.data;
    return responseData && typeof responseData === 'object' && 'id' in responseData ? responseData : undefined;
  }

  /**
   * Eliminar compra por ID
   */
  async deletePurchase(purchaseId: string | number) {
    const response = await axiosInstance.delete<{ success: boolean } | ApiResponse<{ success: boolean }>>(`/supliers/purchases/${purchaseId}`);
    const data = (response.data as ApiResponse<{ success: boolean }>)?.data || response.data;
    return data || { success: false };
  }
}

const suppliersService = new SuppliersService();
export default suppliersService;
