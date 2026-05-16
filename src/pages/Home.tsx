import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock3, Filter, ShieldCheck, Sparkles, SlidersHorizontal, X } from 'lucide-react';
import styles from '../App.module.css'; // Reusing the grid styles from App module
import { Categories } from '../components/Categories';
import { ListingCard } from '../components/ListingCard';
import { api } from '../services/api';
import type { FlashSaleDrop, Listing, ListingFilters, ListingSortOption } from '../types';

const SORT_OPTIONS: Array<{ value: ListingSortOption; label: string }> = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'rating_desc', label: 'Top rated' },
];

const parseNumberParam = (value: string | null) => {
    if (!value) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseSortParam = (value: string | null): ListingSortOption => {
    if (value === 'price_asc' || value === 'price_desc' || value === 'rating_desc') {
        return value;
    }

    return 'recommended';
};

export const Home = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');
    const categoryFilter = categoryParam && categoryParam !== 'icons' ? categoryParam : undefined;
    const sort = parseSortParam(searchParams.get('sort'));
    const maxPrice = parseNumberParam(searchParams.get('maxPrice'));
    const guests = parseNumberParam(searchParams.get('guests'));
    const bedrooms = parseNumberParam(searchParams.get('bedrooms'));
    const baths = parseNumberParam(searchParams.get('baths'));
    const guestFavoriteOnly = searchParams.get('favorites') === '1';

    const [listings, setListings] = useState<Listing[]>([]);
    const [activeDrop, setActiveDrop] = useState<FlashSaleDrop | null>(null);
    const [nowTs, setNowTs] = useState(Date.now());
    const [loading, setLoading] = useState(true);

    const updateParams = (patch: Record<string, string | number | boolean | null | undefined>) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(patch).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                params.delete(key);
                return;
            }

            params.set(key, String(value));
        });
        setSearchParams(params);
    };

    const handleSelectCategory = (id: string) => {
        const next = new URLSearchParams(searchParams);
        if (categoryParam === id) {
            next.delete('category');
        } else {
            next.set('category', id);
        }
        setSearchParams(next);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams);
        ['category', 'sort', 'maxPrice', 'guests', 'bedrooms', 'baths', 'favorites'].forEach((key) => params.delete(key));
        setSearchParams(params);
    };

    const toggleFavoritesOnly = () => {
        updateParams({ favorites: guestFavoriteOnly ? null : 1 });
    };

    useEffect(() => {
        const loadListings = async () => {
            setLoading(true);
            try {
                const filters: ListingFilters = {
                    category: categoryFilter,
                    sort,
                    maxPrice,
                    guests,
                    bedrooms,
                    baths,
                    guestFavoriteOnly,
                };
                const data = await api.fetchListings(filters);
                setListings(data);
                const drop = await api.fetchActiveFlashDrop(new Date());
                setActiveDrop(drop);
            } finally {
                setLoading(false);
            }
        };
        loadListings();
    }, [categoryFilter, sort, maxPrice, guests, bedrooms, baths, guestFavoriteOnly]);

    useEffect(() => {
        const id = window.setInterval(() => setNowTs(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const activeFiltersCount = [
        categoryFilter,
        sort !== 'recommended' ? sort : null,
        maxPrice,
        guests,
        bedrooms,
        baths,
        guestFavoriteOnly ? 'favorites' : null,
    ].filter(Boolean).length;

    const remainingMs = activeDrop ? new Date(activeDrop.endAt).getTime() - nowTs : 0;
    const hasActiveDrop = Boolean(activeDrop && remainingMs > 0);
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    const countdown = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
        <>
            <Categories
                selectedCategory={categoryParam}
                onSelectCategory={handleSelectCategory}
            />

            <main className={styles.mainContainer}>
                {hasActiveDrop && activeDrop && (
                    <section className={styles.flashSaleCard}>
                        <img
                            className={styles.flashSaleImage}
                            src={activeDrop.listing.images[0] ?? 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop'}
                            alt={activeDrop.listing.title}
                        />
                        <div className={styles.flashSaleBody}>
                            <div className={styles.flashSaleMeta}>
                                <span className={styles.flashSaleBadge}>
                                    <ShieldCheck size={14} /> Verified by AevrLux
                                </span>
                                <span className={styles.flashSaleTimer}>
                                    <Clock3 size={14} /> {countdown}
                                </span>
                            </div>
                            <h2>{activeDrop.listing.title}</h2>
                            <p>{activeDrop.listing.location.city}, {activeDrop.listing.location.country}</p>
                            <div className={styles.flashSalePricing}>
                                <span className={styles.flashOldPrice}>₹{Math.round(activeDrop.listing.price).toLocaleString('en-IN')}</span>
                                <strong>₹{Math.round(activeDrop.salePrice).toLocaleString('en-IN')}</strong>
                                <span className={styles.flashDiscount}>{Math.round(activeDrop.discountPercent)}% OFF</span>
                            </div>
                            <a className={styles.flashSaleCta} href={`/rooms/${activeDrop.listing.id}`}>View drop</a>
                        </div>
                    </section>
                )}

                <section className={styles.discoveryPanel}>
                    <div className={styles.discoveryHeader}>
                        <div>
                            <div className={styles.discoveryEyebrow}>Search and discovery</div>
                            <h1>Find your next stay</h1>
                            <p>
                                {loading
                                    ? 'Loading stays...'
                                    : `${listings.length} stay${listings.length === 1 ? '' : 's'} matching your current filters.`}
                            </p>
                        </div>
                        <div className={styles.discoveryActions}>
                            <button type="button" className={styles.clearButton} onClick={clearFilters} disabled={activeFiltersCount === 0}>
                                <X size={16} />
                                Clear filters
                            </button>
                        </div>
                    </div>

                    <div className={styles.discoveryControls}>
                        <label className={styles.controlField}>
                            <span><SlidersHorizontal size={14} /> Sort</span>
                            <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })}>
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className={styles.controlField}>
                            <span><Filter size={14} /> Budget</span>
                            <select
                                value={maxPrice ?? ''}
                                onChange={(e) => updateParams({ maxPrice: e.target.value ? Number(e.target.value) : null })}
                            >
                                <option value="">Any price</option>
                                <option value="5000">Under ₹5,000</option>
                                <option value="10000">Under ₹10,000</option>
                                <option value="15000">Under ₹15,000</option>
                            </select>
                        </label>

                        <label className={styles.controlField}>
                            <span>Guests</span>
                            <select
                                value={guests ?? ''}
                                onChange={(e) => updateParams({ guests: e.target.value ? Number(e.target.value) : null })}
                            >
                                <option value="">Any guests</option>
                                <option value="2">2+</option>
                                <option value="4">4+</option>
                                <option value="6">6+</option>
                                <option value="8">8+</option>
                            </select>
                        </label>

                        <label className={styles.controlField}>
                            <span>Bedrooms</span>
                            <select
                                value={bedrooms ?? ''}
                                onChange={(e) => updateParams({ bedrooms: e.target.value ? Number(e.target.value) : null })}
                            >
                                <option value="">Any bedrooms</option>
                                <option value="1">1+</option>
                                <option value="2">2+</option>
                                <option value="3">3+</option>
                                <option value="4">4+</option>
                            </select>
                        </label>

                        <button
                            type="button"
                            className={`${styles.favoriteToggle} ${guestFavoriteOnly ? styles.favoriteToggleActive : ''}`}
                            onClick={toggleFavoritesOnly}
                        >
                            <Sparkles size={14} />
                            Guest favorites
                        </button>
                    </div>

                    <div className={styles.quickChips}>
                        <button type="button" className={styles.quickChip} onClick={() => updateParams({ maxPrice: 5000 })}>
                            Under ₹5k
                        </button>
                        <button type="button" className={styles.quickChip} onClick={() => updateParams({ maxPrice: 10000 })}>
                            Under ₹10k
                        </button>
                        <button type="button" className={styles.quickChip} onClick={() => updateParams({ sort: 'rating_desc' })}>
                            Top rated
                        </button>
                        <button type="button" className={styles.quickChip} onClick={() => updateParams({ guests: 4 })}>
                            4+ guests
                        </button>
                    </div>
                </section>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #f7f7f7',
                            borderTopColor: '#ff385c',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : listings.length > 0 ? (
                    <div className={styles.grid}>
                        {listings.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <h2>No listings found</h2>
                        <p>Try loosening a filter, switching category, or clearing filters.</p>
                    </div>
                )}
            </main>
        </>
    );
};
