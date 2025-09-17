import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export interface UploadConfig {
  endpoint: string;
  fieldName: string;
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: string[];
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  additionalData?: Record<string, any>;
}

export interface UploadState {
  isUploading: boolean;
  uploadProgress: Record<string, boolean>;
  uploadedFiles: Record<string, any>;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File, identifier?: string, additionalData?: Record<string, any>) => Promise<any>;
  uploadMultipleFiles: (files: { file: File; identifier: string; additionalData?: Record<string, any> }[]) => Promise<any[]>;
  state: UploadState;
  resetUploadState: () => void;
}

export function useFileUpload(config: UploadConfig): UseFileUploadReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, any>>({});

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    // Check file type
    if (config.acceptedTypes && config.acceptedTypes.length > 0) {
      if (!config.acceptedTypes.includes(file.type)) {
        return `Invalid file type. Accepted types: ${config.acceptedTypes.join(', ')}`;
      }
    }

    // Check file size
    if (config.maxSizeInMB) {
      const maxSizeInBytes = config.maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        return `File too large. Maximum size: ${config.maxSizeInMB}MB`;
      }
    }

    return null;
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ 
      file, 
      identifier, 
      additionalData 
    }: { 
      file: File; 
      identifier?: string; 
      additionalData?: Record<string, any> 
    }) => {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      const formData = new FormData();
      formData.append(config.fieldName, file);
      
      // Add any additional data to the form
      const dataToAdd = { ...config.additionalData, ...additionalData };
      Object.entries(dataToAdd).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(config.endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: config.successMessage || "File uploaded successfully",
      });
      
      // Store uploaded file data
      if (variables.identifier) {
        setUploadedFiles(prev => ({
          ...prev,
          [variables.identifier!]: data
        }));
      }
      
      // Invalidate specified queries
      if (config.invalidateQueries) {
        config.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
    },
    onError: (error: Error, variables) => {
      toast({
        title: "Error",
        description: error.message || config.errorMessage || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const uploadFile = async (
    file: File, 
    identifier?: string, 
    additionalData?: Record<string, any>
  ): Promise<any> => {
    const uploadId = identifier || file.name;
    
    setUploadProgress(prev => ({ ...prev, [uploadId]: true }));
    
    try {
      const result = await uploadMutation.mutateAsync({ file, identifier, additionalData });
      return result;
    } finally {
      setUploadProgress(prev => ({ ...prev, [uploadId]: false }));
    }
  };

  const uploadMultipleFiles = async (
    files: { file: File; identifier: string; additionalData?: Record<string, any> }[]
  ): Promise<any[]> => {
    const results = [];
    
    for (const { file, identifier, additionalData } of files) {
      try {
        const result = await uploadFile(file, identifier, additionalData);
        results.push({ success: true, identifier, result });
      } catch (error) {
        results.push({ success: false, identifier, error });
      }
    }
    
    return results;
  };

  const resetUploadState = () => {
    setUploadProgress({});
    setUploadedFiles({});
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    state: {
      isUploading: uploadMutation.isPending,
      uploadProgress,
      uploadedFiles,
    },
    resetUploadState,
  };
}

// Predefined configurations for common upload scenarios
export const uploadConfigs = {
  documents: {
    endpoint: '/api/applicant/documents',
    fieldName: 'document',
    successMessage: 'Document uploaded successfully',
    errorMessage: 'Failed to upload document',
    invalidateQueries: ['/api/auth/user'],
    acceptedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSizeInMB: 10,
  },
  profilePhoto: {
    endpoint: '/api/upload/profile-photo',
    fieldName: 'profilePhoto',
    successMessage: 'Profile photo uploaded successfully',
    errorMessage: 'Failed to upload profile photo',
    invalidateQueries: ['/api/auth/user'],
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxSizeInMB: 5,
  },
} as const;