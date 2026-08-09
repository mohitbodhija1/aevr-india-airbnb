import { supabase } from './supabase';
import type { ListingMediaItem } from '../types';

const LISTING_IMAGES_BUCKET = 'listing-images';

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const compressAndResizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }
                        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                        const webpFile = new File([blob], `${nameWithoutExt}.webp`, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(webpFile);
                    },
                    'image/webp',
                    0.8
                );
            };
            img.onerror = () => resolve(file);
            img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
};

export const uploadListingImages = async (hostId: string, files: File[]): Promise<ListingMediaItem[]> => {
    if (!supabase || files.length === 0) {
        return [];
    }

    const uploadedMedia: ListingMediaItem[] = [];

    // Compress all images to WebP in parallel before uploading
    const processedFiles = await Promise.all(files.map(compressAndResizeImage));

    for (const [index, file] of processedFiles.entries()) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const filePath = `${hostId}/${sanitizeFileName(fileName)}`;

        const { error: uploadError } = await supabase.storage
            .from(LISTING_IMAGES_BUCKET)
            .upload(filePath, file, {
                cacheControl: '31536000, immutable',
                upsert: false,
                contentType: 'image/webp',
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(filePath);
        uploadedMedia.push({
            url: data.publicUrl,
            kind: 'image',
            sourceType: 'upload',
            sortOrder: index,
            title: file.name,
        });
    }

    return uploadedMedia;
};

