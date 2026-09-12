import { supabase } from '@/lib/supabase';

/**
 * Upload a crop image file to the Supabase Storage 'produce-images' bucket
 * and return the public URL string.
 *
 * @param farmerId - The UUID or ID of the farmer uploading the crop image
 * @param file - The image File object selected by the farmer
 * @returns Public URL of the uploaded image
 */
export async function uploadCropImage(farmerId: string, file: File): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  const timestamp = Date.now();
  // Extract file extension cleanly
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  // Sanitize filename
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();

  // Storage path pattern: farmerId/crop-name-timestamp.ext
  const filePath = `${farmerId}/${sanitizedName}-${timestamp}.${extension}`;

  const { data, error } = await supabase.storage
    .from('produce-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    console.error('Error uploading crop image to Supabase Storage:', error.message);
    throw new Error(`Failed to upload crop image: ${error.message}`);
  }

  // Retrieve public URL from Supabase Storage
  const { data: publicUrlData } = supabase.storage
    .from('produce-images')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

export const storageService = {
  uploadCropImage,
};
