import imageCompression from 'browser-image-compression'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
}

/**
 * Comprime una imagen antes de subirla.
 * Fotos de cámara (5-10MB) se reducen a ~300-500KB.
 * Si ya es menor a 1MB, retorna el archivo original.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.size <= 1 * 1024 * 1024) {
    return file
  }

  try {
    return await imageCompression(file, COMPRESSION_OPTIONS)
  } catch {
    console.warn('Image compression failed, using original')
    return file
  }
}
