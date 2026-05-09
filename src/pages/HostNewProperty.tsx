import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './HostNewProperty.module.css';
import { api } from '../services/api';
import { authService } from '../services/auth';
import type { Category } from '../types';
import { hasSupabaseConfig } from '../services/supabase';

type FormState = {
    title: string;
    description: string;
    pricePerNight: string;
    currency: string;
    categorySlug: string;
    city: string;
    country: string;
    lat: string;
    lng: string;
    guestCountMax: string;
    bedrooms: string;
    beds: string;
    baths: string;
    availabilitySummary: string;
    imageUrls: string;
    amenityLabels: string;
};

const initialState: FormState = {
    title: '',
    description: '',
    pricePerNight: '',
    currency: 'INR',
    categorySlug: 'cabins',
    city: '',
    country: '',
    lat: '',
    lng: '',
    guestCountMax: '2',
    bedrooms: '1',
    beds: '1',
    baths: '1',
    availabilitySummary: 'Flexible dates',
    imageUrls: '',
    amenityLabels: 'Wifi,Kitchen',
};

export const HostNewProperty = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<FormState>(initialState);
    const [error, setError] = useState<string | null>(null);

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
            setForm((current) => ({
                ...current,
                categorySlug: data.find((item) => item.slug && item.slug !== 'icons')?.slug ?? current.categorySlug,
            }));
            setLoading(false);
        };

        load();
    }, [navigate]);

    const updateField = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((current) => ({ ...current, [field]: event.target.value }));
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

            await api.createListing(session.user.id, {
                title: form.title,
                description: form.description,
                pricePerNight: Number(form.pricePerNight),
                currency: form.currency,
                categorySlug: form.categorySlug,
                city: form.city,
                country: form.country,
                lat: Number(form.lat),
                lng: Number(form.lng),
                guestCountMax: Number(form.guestCountMax),
                bedrooms: Number(form.bedrooms),
                beds: Number(form.beds),
                baths: Number(form.baths),
                availabilitySummary: form.availabilitySummary,
                imageUrls: form.imageUrls.split(',').map((item) => item.trim()).filter(Boolean),
                amenityLabels: form.amenityLabels.split(',').map((item) => item.trim()).filter(Boolean),
                isGuestFavorite: false,
            });

            navigate('/host', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create property');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={styles.page}><div className={styles.loading}>Loading property form...</div></div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <div className={styles.kicker}>Add property</div>
                    <h1>Publish a new stay</h1>
                    <p>Fill out the basics now. You can always expand the listing later from the host dashboard.</p>
                </div>
                <Link to="/host" className={styles.secondaryButton}>Back to dashboard</Link>
            </div>

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

                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span>Latitude</span>
                        <input type="number" step="any" value={form.lat} onChange={updateField('lat')} required />
                    </label>
                    <label className={styles.field}>
                        <span>Longitude</span>
                        <input type="number" step="any" value={form.lng} onChange={updateField('lng')} required />
                    </label>
                </div>

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
                    <span>Image URLs</span>
                    <textarea value={form.imageUrls} onChange={updateField('imageUrls')} placeholder="Comma-separated image URLs" rows={3} />
                </label>

                <label className={styles.field}>
                    <span>Amenities</span>
                    <textarea value={form.amenityLabels} onChange={updateField('amenityLabels')} placeholder="Comma-separated amenities like Wifi,Kitchen,Pool" rows={3} />
                </label>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.actions}>
                    <button type="submit" className={styles.primaryButton} disabled={saving}>
                        {saving ? 'Saving...' : 'Create property'}
                    </button>
                    <Link to="/host" className={styles.secondaryButton}>Cancel</Link>
                </div>
            </form>
        </div>
    );
};
