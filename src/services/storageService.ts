import { supabase } from '@/lib/supabase';

export const PRODUCE_IMAGES_BUCKET = 'produce-images';

/**
 * Upload a crop image file to the public 'produce-images' Supabase Storage bucket
 * and return its public URL string.
 *
 * @param farmerId - The UUID or ID of the farmer uploading the crop image
 * @param file - The image File or Blob object selected by the farmer
 * @param customName - Optional custom base name for the crop
 * @returns Public URL string of the uploaded image
 */
export async function uploadCropImage(
  farmerId: string,
  file: File | Blob,
  customName?: string
): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const timestamp = Date.now();
  const rawName = (file as File).name || customName || 'crop';
  const extension = rawName.split('.').pop()?.toLowerCase() || 'jpg';
  const sanitizedBase = rawName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();

  // Storage path pattern: farmerId/crop-name-timestamp.ext
  const filePath = `${farmerId}/${sanitizedBase}-${timestamp}.${extension}`;

  const { data, error } = await supabase.storage
    .from(PRODUCE_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    console.error('Error uploading to produce-images storage:', error.message);
    throw new Error(`Failed to upload crop image: ${error.message}`);
  }

  // Retrieve public URL from public produce-images bucket
  const { data: publicUrlData } = supabase.storage
    .from(PRODUCE_IMAGES_BUCKET)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Retrieve the public URL for a stored crop image
 */
export function getProduceImageUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(PRODUCE_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Delete a crop image from the public 'produce-images' bucket
 */
export async function deleteCropImage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(PRODUCE_IMAGES_BUCKET)
      .remove([filePath]);

    return !error;
  } catch {
    return false;
  }
}

export const storageService = {
  uploadCropImage,
  getProduceImageUrl,
  deleteCropImage,
  bucketName: PRODUCE_IMAGES_BUCKET,
};
