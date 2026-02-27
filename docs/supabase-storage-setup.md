# Configurar Supabase Storage para Fotos de Inspección

Esta guía explica cómo crear y configurar el bucket de Supabase Storage necesario para que las fotos de daño en la inspección vehicular funcionen correctamente.

## Prerrequisitos

- Acceso al dashboard de Supabase del proyecto
- Rol de administrador en el proyecto de Supabase

## Opción A: Desde el Dashboard de Supabase (Recomendado)

### 1. Crear el Bucket

1. Ir a **Storage** en el menú lateral del dashboard de Supabase
2. Click en **New Bucket**
3. Configurar:
   - **Name**: `damage-photos`
   - **Public bucket**: **Activado** (toggle ON)
   - **File size limit**: `10MB` (o dejar por defecto)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/heic, image/heif`
4. Click en **Create bucket**

### 2. Crear las Policies de Acceso

Ir a **Storage** → **Policies** (o click en el bucket `damage-photos` → pestaña **Policies**):

#### Policy 1: Usuarios autenticados pueden subir fotos

1. Click en **New Policy**
2. Seleccionar **For full customization**
3. Configurar:
   - **Policy name**: `Authenticated users can upload damage photos`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**: `bucket_id = 'damage-photos'`
4. Click en **Review** → **Save policy**

#### Policy 2: Cualquiera puede ver las fotos (lectura pública)

1. Click en **New Policy**
2. Seleccionar **For full customization**
3. Configurar:
   - **Policy name**: `Public read access for damage photos`
   - **Allowed operation**: `SELECT`
   - **Target roles**: (dejar vacío para `public`)
   - **USING expression**: `bucket_id = 'damage-photos'`
4. Click en **Review** → **Save policy**

#### Policy 3: Usuarios autenticados pueden eliminar fotos

1. Click en **New Policy**
2. Seleccionar **For full customization**
3. Configurar:
   - **Policy name**: `Authenticated users can delete damage photos`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: `bucket_id = 'damage-photos'`
4. Click en **Review** → **Save policy**

## Opción B: Con SQL (Editor de SQL en el Dashboard)

Ir a **SQL Editor** en el dashboard y ejecutar:

```sql
-- 1. Crear bucket público para fotos de daño
INSERT INTO storage.buckets (id, name, public)
VALUES ('damage-photos', 'damage-photos', true);

-- 2. Policy: usuarios autenticados pueden subir
CREATE POLICY "Authenticated users can upload damage photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'damage-photos');

-- 3. Policy: lectura pública (URLs directas sin firma)
CREATE POLICY "Public read access for damage photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'damage-photos');

-- 4. Policy: usuarios autenticados pueden eliminar
CREATE POLICY "Authenticated users can delete damage photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'damage-photos');
```

## Verificación

1. Ir a **Storage** → deberías ver el bucket `damage-photos`
2. En la app, crear una orden nueva → paso de inspección → marcar un daño → agregar foto
3. La foto debería subirse y aparecer como thumbnail
4. Verificar en **Storage** → `damage-photos` → `markers/` que el archivo existe

## Estructura de Archivos en el Bucket

Las fotos se organizan por marker ID:

```
damage-photos/
  markers/
    {marker-uuid}/
      1709234567890-abc123.jpg
      1709234567891-def456.jpg
```

Cada marker de daño puede tener hasta 3 fotos. Las fotos se comprimen automáticamente en el cliente antes de subir (máximo 1MB, 1920px de ancho/alto).

## Notas Importantes

- **Las fotos son públicas**: cualquiera con la URL puede verlas. Esto es intencional para simplificar la visualización sin necesidad de tokens de autenticación.
- **Fotos huérfanas**: si un usuario sube fotos pero cierra el modal sin guardar, las fotos quedan en Storage sin referencia. Esto se puede limpiar con un job periódico en el futuro.
- **Cada taller necesita su propio bucket**: al hacer onboarding de un nuevo taller, incluir este paso en el proceso de setup del proyecto Supabase.
- **Tamaño estimado**: con compresión, cada foto ocupa ~300-500KB. Un taller con 100 órdenes/mes y promedio 2 fotos/orden usaría ~60-100MB/mes.

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `Bucket not found` | El bucket no existe | Seguir paso 1 de esta guía |
| `new row violates row-level security policy` | Falta policy de INSERT | Crear policy 1 |
| `Object not found` al ver la foto | Falta policy de SELECT | Crear policy 2 |
| Foto no se sube (sin error visible) | El usuario no está autenticado | Verificar que el usuario haya iniciado sesión |
