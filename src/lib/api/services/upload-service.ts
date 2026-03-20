/**
 * Service para endpoints de uploads
 */

import axiosInstance from '../client';
import { ApiResponse } from '../types';

export interface UploadAsset {
  url: string;
  publicId: string;
}

export interface DeleteUploadResponse {
  success: boolean;
  message?: string;
}

type UploadResponseShape =
  | UploadAsset
  | {
      imageUrl?: string;
      url?: string;
      secure_url?: string;
      publicId?: string;
      public_id?: string;
    };

function extractData<T>(response: T | ApiResponse<T>) {
  if (
    response &&
    typeof response === 'object' &&
    'data' in (response as Record<string, unknown>) &&
    (response as ApiResponse<T>).data
  ) {
    return (response as ApiResponse<T>).data as T;
  }

  return response as T;
}

function normalizeUploadAsset(payload: UploadResponseShape | undefined): UploadAsset {
  const url = payload?.url || payload?.imageUrl || payload?.secure_url;
  const publicId = payload?.publicId || payload?.public_id;

  if (!url || !publicId) {
    throw new Error('La respuesta del upload no incluye url o publicId');
  }

  return {
    url,
    publicId,
  };
}

class UploadService {
  /**
   * Subir imagen
   */
  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<UploadResponseShape | ApiResponse<UploadResponseShape>>('/uploads', formData);
    return normalizeUploadAsset(extractData(response.data));
  }

  /**
   * Eliminar imagen por publicId
   */
  async delete(publicId: string) {
    const response = await axiosInstance.delete<DeleteUploadResponse | ApiResponse<DeleteUploadResponse>>(
      `/uploads/${encodeURIComponent(publicId)}`
    );

    const data = extractData(response.data);
    return data || { success: false };
  }
}

const uploadService = new UploadService();

export default uploadService;
