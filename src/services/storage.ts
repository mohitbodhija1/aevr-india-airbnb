import { supabase } from './supabase';

const LISTING_IMAGES_BUCKET = 'listing-images';

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export const uploadListingImages = async (hostId: string, files: File[]): Promise<string[]> => {
    if (!supabase || files.length === 0) {
        return [];
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${hostId}/${sanitizeFileName(fileName)}`;

        const { error: uploadError } = await supabase.storage
            .from(LISTING_IMAGES_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || undefined,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
};
