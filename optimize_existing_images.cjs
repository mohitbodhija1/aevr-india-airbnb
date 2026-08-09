const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
const envPath = path.resolve(__dirname, './.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8').replace(/\r/g, '');
    envContent.split('\n').forEach((line) => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
            process.env[key] = val;
        }
    });
}

// Prefer VITE_SUPABASE_SERVICE_ROLE_KEY or process.env.SUPABASE_SERVICE_ROLE_KEY for write/RLS bypass access,
// falling back to VITE_SUPABASE_ANON_KEY.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const isRollback = process.argv.includes('--rollback');
const isDryRun = process.argv.includes('--dry-run') || (!process.argv.includes('--execute') && !isRollback);

const LOG_FILE = path.join(__dirname, 'migration_log.json');

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase environment variables are missing.');
    console.log('Ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY (preferred for DB writes) or VITE_SUPABASE_ANON_KEY are in your .env file.');
    process.exit(1);
}

// Check if sharp is installed
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.error('Error: "sharp" module is not installed.');
    console.log('\nTo run this script, please install sharp as a devDependency or temporary module first:');
    console.log('  npm install sharp --no-save');
    console.log('or');
    console.log('  npm install sharp --save-dev\n');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

const LISTING_IMAGES_BUCKET = 'listing-images';

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to download: Status Code ${res.statusCode}`));
                return;
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
            res.on('error', (err) => reject(err));
        }).on('error', (err) => reject(err));
    });
}

async function run() {
    if (isRollback) {
        await rollbackMigration();
        return;
    }

    console.log('==================================================');
    console.log('      AEVR SUPABASE STORAGE IMAGE MIGRATOR        ');
    console.log('==================================================');
    if (isDryRun) {
        console.log('MODE: [DRY-RUN] (No modifications will be made. Pass --execute to run the migration.)');
    } else {
        console.log('MODE: [EXECUTION] (Performing actual optimization and database updates.)');
    }
    console.log('--------------------------------------------------');

    // 1. Query all listing images
    console.log('Fetching image rows from database...');
    const { data: dbImages, error: dbError } = await supabase
        .from('listing_images')
        .select('id, listing_id, image_url, media_kind, source_type');

    if (dbError) {
        console.error('Error reading listing_images table:', dbError.message);
        console.log('The project may currently be restricted. Please ensure your database is accessible.');
        process.exit(1);
    }

    console.log(`Found ${dbImages.length} total media items in the database.`);

    // Filter Supabase uploaded listing images that are not yet optimized
    const targets = dbImages.filter(img => {
        return img.media_kind === 'image' &&
            img.source_type === 'upload' &&
            img.image_url.includes(`/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`) &&
            !img.image_url.endsWith('-optimized.webp');
    });

    console.log(`Identified ${targets.length} unoptimized Supabase Storage images to process.`);

    // Also fetch listings to see if we have JSONB room_types that need processing
    const { data: dbListings, error: listingsError } = await supabase
        .from('listings')
        .select('id, room_types');

    let listingsToProcess = [];
    if (!listingsError && dbListings) {
        listingsToProcess = dbListings.filter(l => {
            const rtString = JSON.stringify(l.room_types || []);
            return rtString.includes(`/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`) &&
                !rtString.includes('-optimized.webp');
        });
        console.log(`Found ${listingsToProcess.length} listings with unoptimized images inside room_types JSON.`);
    }

    if (targets.length === 0 && listingsToProcess.length === 0) {
        console.log('No unoptimized images found. Everything is already optimized!');
        return;
    }

    if (isDryRun) {
        console.log('\n[DRY-RUN] Planned Actions:');
        for (const item of targets) {
            console.log(` - Will optimize: ${item.image_url}`);
        }
        for (const listing of listingsToProcess) {
            console.log(` - Will optimize room_types in listing: ${listing.id}`);
        }
        console.log('\nDry-run complete. Run with "--execute" parameter to apply these changes.');
        return;
    }

    // Actual execution
    const migrationLogs = [];
    let successCount = 0;
    let failCount = 0;

    console.log('\nStarting migration...');

    // A. Optimize listing_images table items
    for (const item of targets) {
        console.log(`\nProcessing image [${item.id}]: ${item.image_url}`);
        try {
            // Parse relative path in the storage bucket
            const urlParts = item.image_url.split(`/public/${LISTING_IMAGES_BUCKET}/`);
            if (urlParts.length < 2) {
                throw new Error('Could not parse relative storage path');
            }
            const relativePath = urlParts[1];
            const pathParts = relativePath.split('/');
            const hostId = pathParts[0];
            const fileName = pathParts.slice(1).join('/');
            
            const fileExt = fileName.split('.').pop() || 'jpg';
            const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
            
            const newFileName = `${baseName}-optimized.webp`;
            const newRelativePath = `${hostId}/${newFileName}`;

            // Download file
            console.log(` -> Downloading original...`);
            const buffer = await downloadFile(item.image_url);

            // Compress file
            console.log(` -> Compressing and resizing...`);
            const compressedBuffer = await sharp(buffer)
                .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            // Upload compressed file
            console.log(` -> Uploading optimized version...`);
            const { error: uploadError } = await supabase.storage
                .from(LISTING_IMAGES_BUCKET)
                .upload(newRelativePath, compressedBuffer, {
                    cacheControl: '31536000, immutable',
                    contentType: 'image/webp',
                    upsert: true
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get new public url
            const { data: publicUrlData } = supabase.storage
                .from(LISTING_IMAGES_BUCKET)
                .getPublicUrl(newRelativePath);

            const newPublicUrl = publicUrlData.publicUrl;

            // Update database row
            console.log(` -> Updating database URL...`);
            const { error: updateError } = await supabase
                .from('listing_images')
                .update({ image_url: newPublicUrl })
                .eq('id', item.id);

            if (updateError) {
                throw updateError;
            }

            // Verify update
            const { data: verifyData } = await supabase
                .from('listing_images')
                .select('image_url')
                .eq('id', item.id)
                .single();

            if (!verifyData || verifyData.image_url !== newPublicUrl) {
                throw new Error('Database verification failed. Row value does not match.');
            }

            console.log(`[SUCCESS] Optimized: ${item.image_url} -> ${newPublicUrl}`);
            
            migrationLogs.push({
                type: 'listing_image',
                rowId: item.id,
                oldUrl: item.image_url,
                newUrl: newPublicUrl,
                relativePath: newRelativePath
            });

            successCount++;
        } catch (err) {
            console.error(`[ERROR] Failed to process image [${item.id}]:`, err.message);
            failCount++;
        }
    }

    // B. Optimize listings.room_types jsonb items
    for (const listing of listingsToProcess) {
        console.log(`\nProcessing room_types in listing: ${listing.id}`);
        try {
            let updatedRoomTypes = JSON.parse(JSON.stringify(listing.room_types || []));
            let modified = false;

            for (let rt of updatedRoomTypes) {
                // Optimize rt.photos
                if (Array.isArray(rt.photos)) {
                    for (let i = 0; i < rt.photos.length; i++) {
                        const url = rt.photos[i];
                        if (url.includes(`/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`) && !url.endsWith('-optimized.webp')) {
                            // Find corresponding media item or parse directly
                            const newUrl = await optimizeJsonUrl(url);
                            if (newUrl) {
                                rt.photos[i] = newUrl;
                                modified = true;
                            }
                        }
                    }
                }

                // Optimize rt.media
                if (Array.isArray(rt.media)) {
                    for (let m of rt.media) {
                        if (m.kind === 'image' && m.url.includes(`/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`) && !m.url.endsWith('-optimized.webp')) {
                            const newUrl = await optimizeJsonUrl(m.url);
                            if (newUrl) {
                                m.url = newUrl;
                                modified = true;
                            }
                        }
                    }
                }
            }

            if (modified) {
                console.log(` -> Saving listing room_types JSON to database...`);
                const { error: updateError } = await supabase
                    .from('listings')
                    .update({ room_types: updatedRoomTypes })
                    .eq('id', listing.id);

                if (updateError) {
                    throw updateError;
                }

                console.log(`[SUCCESS] Optimized room_types JSON for listing ${listing.id}`);
                migrationLogs.push({
                    type: 'room_types_json',
                    rowId: listing.id,
                    oldJson: listing.room_types,
                    newJson: updatedRoomTypes
                });
                successCount++;
            }
        } catch (err) {
            console.error(`[ERROR] Failed to process room_types for listing ${listing.id}:`, err.message);
            failCount++;
        }
    }

    // Write log file for rollbacks
    fs.writeFileSync(LOG_FILE, JSON.stringify(migrationLogs, null, 2), 'utf8');
    console.log('\n--------------------------------------------------');
    console.log(`Migration complete. Success: ${successCount}, Failed: ${failCount}.`);
    console.log(`Migration log written to ${LOG_FILE}. Keep this file for rollback if needed.`);
}

async function optimizeJsonUrl(url) {
    try {
        const urlParts = url.split(`/public/${LISTING_IMAGES_BUCKET}/`);
        if (urlParts.length < 2) return null;
        const relativePath = urlParts[1];
        const pathParts = relativePath.split('/');
        const hostId = pathParts[0];
        const fileName = pathParts.slice(1).join('/');
        
        const fileExt = fileName.split('.').pop() || 'jpg';
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        
        const newFileName = `${baseName}-optimized.webp`;
        const newRelativePath = `${hostId}/${newFileName}`;

        // Download
        const buffer = await downloadFile(url);

        // Compress
        const compressedBuffer = await sharp(buffer)
            .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // Upload
        const { error: uploadError } = await supabase.storage
            .from(LISTING_IMAGES_BUCKET)
            .upload(newRelativePath, compressedBuffer, {
                cacheControl: '31536000, immutable',
                contentType: 'image/webp',
                upsert: true
            });

        if (uploadError) return null;

        const { data: publicUrlData } = supabase.storage
            .from(LISTING_IMAGES_BUCKET)
            .getPublicUrl(newRelativePath);

        return publicUrlData.publicUrl;
    } catch (e) {
        console.warn(`    Failed to optimize JSON image link ${url}:`, e.message);
        return null;
    }
}

async function rollbackMigration() {
    console.log('==================================================');
    console.log('          ROLLING BACK MIGRATION CHANGES          ');
    console.log('==================================================');
    
    if (!fs.existsSync(LOG_FILE)) {
        console.error(`Error: Migration log file ${LOG_FILE} was not found.`);
        process.exit(1);
    }

    const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    console.log(`Found ${logs.length} operations to revert.`);

    let success = 0;
    let failed = 0;

    for (const log of logs) {
        try {
            if (log.type === 'listing_image') {
                console.log(`Restoring listing_image [${log.rowId}] to: ${log.oldUrl}`);
                const { error } = await supabase
                    .from('listing_images')
                    .update({ image_url: log.oldUrl })
                    .eq('id', log.rowId);

                if (error) throw error;
                success++;
            } else if (log.type === 'room_types_json') {
                console.log(`Restoring room_types JSON for listing [${log.rowId}]`);
                const { error } = await supabase
                    .from('listings')
                    .update({ room_types: log.oldJson })
                    .eq('id', log.rowId);

                if (error) throw error;
                success++;
            }
        } catch (e) {
            console.error(`Failed to rollback operation:`, e.message);
            failed++;
        }
    }

    console.log(`\nRollback complete. Restored: ${success}, Failed: ${failed}.`);
}

run();
