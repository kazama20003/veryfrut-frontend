/**
 * Custom hooks para Upload mutations
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import uploadService from '../services/upload-service';

export function useUploadImageMutation() {
  return useMutation({
    mutationFn: (file: File) => uploadService.upload(file),
  });
}

export function useDeleteUploadMutation() {
  return useMutation({
    mutationFn: (publicId: string) => uploadService.delete(publicId),
  });
}
