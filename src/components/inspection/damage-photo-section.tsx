'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { compressImage } from '@/lib/image-compression'
import { uploadDamagePhoto, deleteDamagePhoto } from '@/lib/supabase/storage'
import { toast } from 'sonner'

const MAX_PHOTOS = 3
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic,image/heif'

export interface PhotoItem {
  url: string
  path: string
}

interface DamagePhotoSectionProps {
  photos: PhotoItem[]
  onChange: (photos: PhotoItem[]) => void
  markerId: string
  disabled?: boolean
}

export function DamagePhotoSection({
  photos,
  onChange,
  markerId,
  disabled = false,
}: DamagePhotoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      const remainingSlots = MAX_PHOTOS - photos.length
      if (remainingSlots <= 0) {
        toast.error('Máximo 3 fotos por daño')
        return
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots)
      setUploading(true)

      const newPhotos = [...photos]

      for (const file of filesToProcess) {
        try {
          const compressed = await compressImage(file)
          const result = await uploadDamagePhoto(compressed, markerId)
          if (result.error) {
            toast.error(`Error al subir foto: ${result.error}`)
            continue
          }
          newPhotos.push({ url: result.url, path: result.path })
        } catch {
          toast.error('Error al procesar la imagen')
        }
      }

      onChange(newPhotos)
      setUploading(false)

      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [photos, onChange, markerId],
  )

  const handleRemove = useCallback(
    async (index: number) => {
      const photo = photos[index]
      if (photo.path) {
        await deleteDamagePhoto(photo.path)
      }
      onChange(photos.filter((_, i) => i !== index))
    },
    [photos, onChange],
  )

  const canAddMore = photos.length < MAX_PHOTOS && !disabled

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">
        Fotos{' '}
        <span className="font-normal text-muted-foreground">
          (opcional, máx {MAX_PHOTOS})
        </span>
      </Label>

      <div className="grid grid-cols-4 gap-2">
        {/* Thumbnails de fotos existentes */}
        {photos.map((photo, idx) => (
          <div
            key={photo.url}
            className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={`Foto ${idx + 1}`}
              className="size-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className={cn(
                  'absolute top-0 right-0 size-8 rounded-full',
                  'bg-black/60 text-white flex items-center justify-center',
                  'hover:bg-black/80 transition-colors',
                )}
                aria-label={`Eliminar foto ${idx + 1}`}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}

        {/* Botón para agregar foto */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed border-border',
              'flex flex-col items-center justify-center gap-1',
              'text-muted-foreground hover:border-primary hover:text-primary',
              'transition-colors',
              uploading && 'opacity-50 cursor-wait',
            )}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Camera className="size-5" />
                <span className="text-xs leading-none">Agregar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Input oculto — sin capture para que el OS presente Cámara/Galería */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled || uploading}
      />

      <p className="text-xs text-muted-foreground">
        {photos.length}/{MAX_PHOTOS} fotos
      </p>
    </div>
  )
}
