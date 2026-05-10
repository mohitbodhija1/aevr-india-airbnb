import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import styles from './HostNewProperty.module.css';
import { api } from '../services/api';
import { authService } from '../services/auth';
import { hasSupabaseConfig } from '../services/supabase';
import { uploadListingImages } from '../services/storage';
import type { AvailabilityBlock, AvailabilityBlockStatus, Category, Listing } from '../types';

type FormState = {
    title: string;
    description: string;
    pricePerNight: string;
    currency: string;
    categorySlug: string;
    city: string;
    country: string;
    mapLink: string;
    guestCountMax: string;
    bedrooms: string;
    beds: string;
    baths: string;
    availabilitySummary: string;
    amenityLabels: string;
};

const initialState: FormState = {
    title: '',
    description: '',
    pricePerNight: '',
    currency: 'INR',
    categorySlug: 'cabins',
    city: '',
    country: 'India',
    mapLink: '',
    guestCountMax: '2',
    bedrooms: '1',
    beds: '1',
    baths: '1',
    availabilitySummary: 'Flexible dates',
    amenityLabels: 'Wifi,Kitchen',
};

const listingToForm = (listing: Listing): FormState => ({
    title: listing.title,
    description: listing.description,
    pricePerNight: String(listing.price),
    currency: listing.currency ?? 'INR',
    categorySlug: listing.category,
    city: listing.location.city,
    country: listing.location.country,
    mapLink: listing.mapLink ?? '',
    guestCountMax: String(listing.guestCountMax ?? 1),
    bedrooms: String(listing.bedrooms ?? 0),
    beds: String(listing.beds ?? 0),
    baths: String(listing.baths ?? 0),
    availabilitySummary: listing.availabilitySummary ?? listing.availableDates ?? 'Flexible dates',
    amenityLabels: listing.amenities.join(', '),
});

const formatBlockRange = (startDate: string, endDate: string) =>
    `${new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(new Date(`${startDate}T00:00:00Z`))} - ${new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(new Date(`${endDate}T00:00:00Z`))}`;

const blockStatusLabel: Record<AvailabilityBlockStatus, string> = {
    booked: 'Booked',
    restricted: 'Restricted',
};

export const HostNewProperty = () => {
    const navigate = useNavigate();
    const { id: listingId } = useParams<{ id?: string }>();
    const isEditMode = Boolean(listingId);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [blockSaving, setBlockSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<FormState>(initialState);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [blockError, setBlockError] = useState<string | null>(null);
    const [blockStart, setBlockStart] = useState('');
    const [blockEnd, setBlockEnd] = useState('');
    const [blockStatus, setBlockStatus] = useState<AvailabilityBlockStatus>('booked');

    useEffect(() => {
        const load = async () => {
            if (!hasSupabaseConfig) {
                navigate('/host/auth', { replace: true });
                return;
            }

            const session = await authService.getSession();
            if (!session) {
                navigate('/host/auth', { replace: true });
                return;
            }

            const data = await api.fetchCategories();
            setCategories(data);

            if (listingId) {
                const listing = await api.fetchListingById(listingId);
                if (!listing) {
                    setError('Listing not found.');
                } else {
                    setForm(listingToForm(listing));
                    setExistingImages(listing.images);
                    setAvailabilityBlocks(await api.fetchAvailabilityBlocks(listingId));
                }
            } else {
                setForm((current) => ({
                    ...current,
                    categorySlug: data.find((item) => item.slug && item.slug !== 'icons')?.slug ?? current.categorySlug,
                }));
            }

            setLoading(false);
        };

        load();
    }, [navigate, listingId]);

    useEffect(() => {
        const urls = selectedFiles.map((file) => URL.createObjectURL(file));
        setPreviewUrls(urls);

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [selectedFiles]);

    const updateField = (field: keyof FormState) => (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm((current) => ({ ...current, [field]: event.target.value }));
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const files = Array.from(event.target.files ?? []);
        setSelectedFiles(files);
    };

    const refreshAvailabilityBlocks = async () => {
        if (!listingId) {
            return;
        }
        const blocks = await api.fetchAvailabilityBlocks(listingId);
        setAvailabilityBlocks(blocks);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const session = await authService.getSession();
            if (!session) {
                navigate('/host/auth', { replace: true });
                return;
            }

            if (!isEditMode && selectedFiles.length === 0) {
                throw new Error('Upload at least one property image.');
            }

            if (isEditMode && selectedFiles.length === 0 && existingImages.length === 0) {
                throw new Error('Add at least one property image.');
            }

            const imageUrls = selectedFiles.length > 0
                ? await uploadListingImages(session.user.id, selectedFiles)
                : undefined;

            if (selectedFiles.length > 0 && (!imageUrls || imageUrls.length === 0)) {
                throw new Error('Could not upload images. Make sure the `listing-images` storage bucket exists.');
            }

            const payload = {
                title: form.title,
                description: form.description,
                pricePerNight: Number(form.pricePerNight),
                currency: form.currency,
                categorySlug: form.categorySlug,
                city: form.city,
                country: form.country,
                mapLink: form.mapLink,
                lat: 0,
                lng: 0,
                guestCountMax: Number(form.guestCountMax),
                bedrooms: Number(form.bedrooms),
                beds: Number(form.beds),
                baths: Number(form.baths),
                availabilitySummary: form.availabilitySummary,
                amenityLabels: form.amenityLabels.split(',').map((item) => item.trim()).filter(Boolean),
                isGuestFavorite: false,
                ...(imageUrls ? { imageUrls } : {}),
            };

            if (isEditMode && listingId) {
                await api.updateListing(session.user.id, listingId, payload);
            } else {
                await api.createListing(session.user.id, {
                    ...payload,
                    imageUrls: imageUrls ?? [],
                });
            }

            navigate('/host', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save property');
        } finally {
            setSaving(false);
        }
    };

    const handleAddAvailabilityBlock = async () => {
        if (!listingId) {
            return;
        }

        if (!blockStart || !blockEnd) {
            setBlockError('Choose both dates first.');
            return;
        }

        if (blockEnd <= blockStart) {
            setBlockError('Checkout must be after check-in.');
            return;
        }

        setBlockSaving(true);
        setBlockError(null);

        try {
            const session = await authService.getSession();
            if (!session) {
                navigate('/host/auth', { replace: true });
                return;
            }

            await api.createAvailabilityBlock({
                listingId,
                startDate: blockStart,
                endDate: blockEnd,
                status: blockStatus,
            });

            setBlockStart('');
            setBlockEnd('');
            setBlockStatus('booked');
            await refreshAvailabilityBlocks();
        } catch (err) {
            setBlockError(err instanceof Error ? err.message : 'Unable to update calendar');
        } finally {
            setBlockSaving(false);
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        setBlockSaving(true);
        setBlockError(null);

        try {
            const session = await authService.getSession();
            if (!session) {
                navigate('/host/auth', { replace: true });
                return;
            }

            await api.deleteAvailabilityBlock(blockId);
            await refreshAvailabilityBlocks();
        } catch (err) {
            setBlockError(err instanceof Error ? err.message : 'Unable to delete block');
        } finally {
            setBlockSaving(false);
        }
    };

    const currentImageUrls = useMemo(() => {
        if (selectedFiles.length > 0) {
            return previewUrls;
        }

        return existingImages;
    }, [existingImages, previewUrls, selectedFiles.length]);

    if (loading) {
        return <div className={styles.page}><div className={styles.loading}>Loading property form...</div></div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <div className={styles.kicker}>{isEditMode ? 'Edit property' : 'Add property'}</div>
                    <h1>{isEditMode ? 'Update your listing' : 'Publish a new stay'}</h1>
                    <p>Fill out the basics now. You can always expand the listing later from the host dashboard.</p>
                </div>
                <Link to="/host" className={styles.secondaryButton}>Back to dashboard</Link>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.field}>
                    <span>Title</span>
                    <input value={form.title} onChange={updateField('title')} placeholder="Luxury villa with sea view" required />
                </label>

                <label className={styles.field}>
                    <span>Description</span>
                    <textarea value={form.description} onChange={updateField('description')} placeholder="A short description of the place" rows={5} required />
                </label>

                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>Price per night</span>
                        <input type="number" min="0" value={form.pricePerNight} onChange={updateField('pricePerNight')} required />
                    </label>
                    <label className={styles.field}>
                        <span>Currency</span>
                        <input value={form.currency} onChange={updateField('currency')} required />
                    </label>
                </div>

                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>Category</span>
                        <select value={form.categorySlug} onChange={updateField('categorySlug')}>
                            {categories.filter((category) => category.slug && category.slug !== 'icons').map((category) => (
                                <option key={category.slug} value={category.slug}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.field}>
                        <span>Availability summary</span>
                        <input value={form.availabilitySummary} onChange={updateField('availabilitySummary')} />
                    </label>
                </div>

                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>City</span>
                        <input value={form.city} onChange={updateField('city')} required />
                    </label>
                    <label className={styles.field}>
                        <span>Country</span>
                        <input value={form.country} onChange={updateField('country')} required />
                    </label>
                </div>

                <label className={styles.field}>
                    <span>Google Maps link</span>
                    <input
                        value={form.mapLink}
                        onChange={updateField('mapLink')}
                        placeholder="Paste any Google Maps link"
                        required
                    />
                    <small className={styles.helperText}>
                        Short links like `https://maps.app.goo.gl/...` are fine.
                    </small>
                </label>

                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>Max guests</span>
                        <input type="number" min="1" value={form.guestCountMax} onChange={updateField('guestCountMax')} required />
                    </label>
                    <label className={styles.field}>
                        <span>Bedrooms</span>
                        <input type="number" min="0" value={form.bedrooms} onChange={updateField('bedrooms')} required />
                    </label>
                    <label className={styles.field}>
                        <span>Beds</span>
                        <input type="number" min="0" value={form.beds} onChange={updateField('beds')} required />
                    </label>
                    <label className={styles.field}>
                        <span>Baths</span>
                        <input type="number" min="0" step="0.5" value={form.baths} onChange={updateField('baths')} required />
                    </label>
                </div>

                <label className={styles.field}>
                    <span>Property images</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileChange} />
                    <small className={styles.helperText}>
                        {isEditMode
                            ? 'Uploading new images will replace the current gallery.'
                            : 'Upload images directly. We will store them in Supabase Storage.'}
                    </small>
                </label>

                {currentImageUrls.length > 0 && (
                    <div className={styles.previewGrid}>
                        {currentImageUrls.map((src, index) => (
                            <figure key={`${src}-${index}`} className={styles.previewCard}>
                                <img src={src} alt={form.title || `Property image ${index + 1}`} className={styles.previewImage} />
                                <figcaption>{selectedFiles[index]?.name ?? `Image ${index + 1}`}</figcaption>
                            </figure>
                        ))}
                    </div>
                )}

                <label className={styles.field}>
                    <span>Amenities</span>
                    <textarea value={form.amenityLabels} onChange={updateField('amenityLabels')} placeholder="Comma-separated amenities like Wifi,Kitchen,Pool" rows={3} />
                </label>

                {isEditMode && (
                    <section className={styles.availabilitySection} id="availability">
                        <div className={styles.sectionHeader}>
                            <div>
                                <h2>
                                    <CalendarDays size={18} /> Calendar status
                                </h2>
                                <p>Available by default. Add a block when the property is booked or restricted.</p>
                            </div>
                        </div>

                        <div className={styles.availabilityForm}>
                            <label className={styles.field}>
                                <span>Start date</span>
                                <input type="date" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
                            </label>
                            <label className={styles.field}>
                                <span>End date</span>
                                <input type="date" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
                            </label>
                            <label className={styles.field}>
                                <span>Status</span>
                                <select value={blockStatus} onChange={(e) => setBlockStatus(e.target.value as AvailabilityBlockStatus)}>
                                    <option value="booked">Booked</option>
                                    <option value="restricted">Restricted</option>
                                </select>
                            </label>
                        </div>

                        <div className={styles.availabilityActions}>
                            <button type="button" className={styles.primaryButton} onClick={handleAddAvailabilityBlock} disabled={blockSaving}>
                                <Plus size={16} /> {blockSaving ? 'Saving...' : 'Block dates'}
                            </button>
                            {blockError && <div className={styles.blockError}>{blockError}</div>}
                        </div>

                        <div className={styles.blockList}>
                            {availabilityBlocks.length > 0 ? (
                                availabilityBlocks.map((block) => (
                                    <article key={block.id} className={styles.blockCard}>
                                        <div>
                                            <strong>{formatBlockRange(block.startDate, block.endDate)}</strong>
                                            <p>
                                                <span className={block.status === 'booked' ? styles.bookedBadge : styles.restrictedBadge}>
                                                    {blockStatusLabel[block.status]}
                                                </span>
                                                {block.reason ? ` ${block.reason}` : ''}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.blockDeleteButton}
                                            onClick={() => handleDeleteBlock(block.id)}
                                            disabled={blockSaving}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </article>
                                ))
                            ) : (
                                <div className={styles.emptyAvailability}>
                                    No blocked dates yet. The listing is available by default.
                                </div>
                            )}
                        </div>
                    </section>
                )}

                <div className={styles.actions}>
                    <button type="submit" className={styles.primaryButton} disabled={saving}>
                        {saving ? 'Saving...' : isEditMode ? 'Save changes' : 'Create property'}
                    </button>
                    <Link to="/host" className={styles.secondaryButton}>Cancel</Link>
                </div>
            </form>
        </div>
    );
};
