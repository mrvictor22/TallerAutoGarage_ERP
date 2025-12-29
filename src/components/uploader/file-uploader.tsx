'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/lib/utils';
import {
  Upload,
  File,
  Image,
  X,
  Check,
  AlertCircle,
  Eye
} from 'lucide-react';

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface FileUploaderProps {
  onFilesChange?: (files: FileUpload[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

export function FileUploader({
  onFilesChange,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  multiple = true,
  disabled = false
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileUpload[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileUpload[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending'
    }));

    const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
    const limitedFiles = updatedFiles.slice(0, maxFiles);
    
    setFiles(limitedFiles);
    onFilesChange?.(limitedFiles);

    // Simulate upload process
    limitedFiles.forEach(fileUpload => {
      if (fileUpload.status === 'pending') {
        simulateUpload(fileUpload);
      }
    });
  }, [files, multiple, maxFiles, onFilesChange]);

  const simulateUpload = (fileUpload: FileUpload) => {
    setFiles(prev => prev.map(f => 
      f.id === fileUpload.id 
        ? { ...f, status: 'uploading' as const }
        : f
    ));

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Simulate random success/failure (90% success rate)
        const success = Math.random() > 0.1;
        
        setFiles(prev => prev.map(f => 
          f.id === fileUpload.id 
            ? { 
                ...f, 
                progress: 100,
                status: success ? 'completed' as const : 'error' as const,
                url: success ? URL.createObjectURL(fileUpload.file) : undefined,
                error: success ? undefined : 'Error al subir el archivo'
              }
            : f
        ));
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileUpload.id 
            ? { ...f, progress }
            : f
        ));
      }
    }, 200);
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const retryUpload = (fileUpload: FileUpload) => {
    simulateUpload(fileUpload);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    multiple,
    disabled
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: FileUpload['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'uploading':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <Card 
        {...getRootProps()} 
        className={`border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CardContent className="flex flex-col items-center justify-center py-6 px-4">
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mb-3" />
          <div className="text-center w-full max-w-full">
            <p className="text-sm font-medium break-words">
              {isDragActive
                ? 'Suelta los archivos aquí...'
                : 'Toca para seleccionar archivos'
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1 break-words">
              Máx. {maxFiles} archivo{maxFiles > 1 ? 's' : ''}, {formatFileSize(maxSize)} c/u
            </p>
            <p className="text-xs text-muted-foreground break-words">
              Imágenes y PDF
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Archivos ({files.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {files.map((fileUpload) => (
              <Card key={fileUpload.id} className="p-3 overflow-hidden">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {getFileIcon(fileUpload.file)}
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    {/* Filename and actions row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium truncate flex-1 min-w-0">
                        {fileUpload.file.name}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {fileUpload.status === 'completed' && fileUpload.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(fileUpload.url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeFile(fileUpload.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Status and size row */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{formatFileSize(fileUpload.file.size)}</span>
                      <Badge className={`${getStatusColor(fileUpload.status)} text-xs px-1.5 py-0`}>
                        {getStatusIcon(fileUpload.status)}
                        <span className="ml-1">
                          {fileUpload.status === 'pending' && 'Pendiente'}
                          {fileUpload.status === 'uploading' && `${Math.round(fileUpload.progress)}%`}
                          {fileUpload.status === 'completed' && 'Listo'}
                          {fileUpload.status === 'error' && 'Error'}
                        </span>
                      </Badge>
                    </div>

                    {fileUpload.status === 'uploading' && (
                      <Progress value={fileUpload.progress} className="mt-2 h-1" />
                    )}

                    {fileUpload.status === 'error' && (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-xs text-red-600 truncate">
                          {fileUpload.error}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-shrink-0"
                          onClick={() => retryUpload(fileUpload)}
                        >
                          Reintentar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
