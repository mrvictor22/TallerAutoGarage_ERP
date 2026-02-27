import { createClient } from './client'

const BUCKET = 'damage-photos'

export interface UploadResult {
  url: string
  path: string
  error?: string
}

/**
 * Sube una foto (ya comprimida) al bucket de damage-photos.
 * Path: markers/{markerId}/{timestamp}-{random}.{ext}
 */
export async function uploadDamagePhoto(
  file: File,
  markerId: string,
): Promise<UploadResult> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `markers/${markerId}/${filename}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { url: '', path: '', error: error.message }
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path)

  return { url: publicUrlData.publicUrl, path: data.path }
}

/**
 * Elimina una foto del storage por su path.
 */
export async function deleteDamagePhoto(path: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  return !error
}
