import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    Clock3,
    ShieldCheck,
    Sparkles,
    X,
    BedDouble,
    Waves,
    Mountain,
    Home as HomeIcon,
    Rocket,
    Umbrella,
    Tractor,
    Minimize,
    Gem,
    Castle,
    Tent,
    Star,
    Mail,
    MessageCircle,
    Plus,
    Minus,
    Search,
    Building2,
    Compass,
    MapPin,
    User,
    ChevronDown,
    ArrowRight
} from 'lucide-react';
import styles from '../App.module.css'; // Reusing the grid styles from App module

import { ListingCard } from '../components/ListingCard';
import { SkeletonScreen } from '../components/SkeletonScreen';
import { api } from '../services/api';
import { getFallbackImage, withImageTransform } from '../services/media';
import type { FlashSaleDrop, Listing, ListingFilters, ListingSortOption } from '../types';

const SORT_OPTIONS: Array<{ value: ListingSortOption; label: string }> = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'rating_desc', label: 'Top rated' },
];

const FILTER_CATEGORIES = [
    { slug: 'icons', label: 'Icons', Icon: Star },
    { slug: 'rooms', label: 'Rooms', Icon: BedDouble },
    { slug: 'amazing-pools', label: 'Amazing pools', Icon: Waves },
    { slug: 'amazing-views', label: 'Amazing views', Icon: Mountain },
    { slug: 'cabins', label: 'Cabins', Icon: HomeIcon },
    { slug: 'omg', label: 'OMG!', Icon: Rocket },
    { slug: 'beachfront', label: 'Beachfront', Icon: Umbrella },
    { slug: 'farms', label: 'Farms', Icon: Tractor },
    { slug: 'tiny-homes', label: 'Tiny homes', Icon: Minimize },
    { slug: 'luxe', label: 'Luxe', Icon: Gem },
    { slug: 'castles', label: 'Castles', Icon: Castle },
    { slug: 'camping', label: 'Camping', Icon: Tent },
];

const BUDGET_MIN = 0;
const BUDGET_MAX = 50000;
const BUDGET_STEP = 1000;

const parseNumberParam = (value: string | null) => {
    if (!value) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const clampBudgetParam = (value: number | undefined) => {
    if (value === undefined) {
        return undefined;
    }

    return Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, value));
};

const parseSortParam = (value: string | null): ListingSortOption => {
    if (value === 'price_asc' || value === 'price_desc' || value === 'rating_desc') {
        return value;
    }

    return 'recommended';
};




const HERO_IMAGES = [
    '/coastal_calm_hero.png',
    '/beige_palace_hero.png',
    '/heritage_palace_hero.png',
    '/mountain_retreat_hero.png',
    '/backwater_paradise_hero.png'
];

const TOP_DESTINATIONS = [
    {
        name: 'Udaipur',
        villasCount: 33,
        image: 'https://bnwtqridnqbjzwqzkejj.supabase.co/storage/v1/render/image/public/listing-images/5db62c26-e08c-4c60-a306-89d7637f60cb/1779601571206-rzk4465nvj.jpeg?width=600&quality=70&resize=cover',
        searchQuery: 'Udaipur'
    },
    {
        name: 'Rishikesh',
        villasCount: 2,
        image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=600&auto=format&fit=crop',
        searchQuery: 'Rishikesh'
    },
    {
        name: 'Gurgaon',
        villasCount: 1,
        image: 'https://bnwtqridnqbjzwqzkejj.supabase.co/storage/v1/render/image/public/listing-images/5db62c26-e08c-4c60-a306-89d7637f60cb/1781181109856-v4tdi0915r.jpeg?width=600&quality=70&resize=cover',
        searchQuery: 'Gurgaon'
    },
    {
        name: 'Coming Soon',
        villasCount: 0,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=600&auto=format&fit=crop',
        searchQuery: '',
        isComingSoon: true
    }
];

export const Home = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');
    const luxurySection = searchParams.get('luxurySection') === '1';
    const categoryFilter = !luxurySection && categoryParam && categoryParam !== 'icons' ? categoryParam : undefined;
    const search = searchParams.get('search') ?? undefined;
    const sort = parseSortParam(searchParams.get('sort'));
    const minBudgetParam = clampBudgetParam(parseNumberParam(searchParams.get('minPrice')));
    const maxBudgetParam = clampBudgetParam(parseNumberParam(searchParams.get('maxPrice')));
    
    let budgetMinValue = minBudgetParam ?? BUDGET_MIN;
    let budgetMaxValue = maxBudgetParam ?? BUDGET_MAX;

    // Enforce a minimum gap of BUDGET_STEP to prevent overlap lock
    if (budgetMaxValue - budgetMinValue < BUDGET_STEP) {
        if (maxBudgetParam !== undefined && minBudgetParam === undefined) {
            budgetMinValue = Math.max(BUDGET_MIN, budgetMaxValue - BUDGET_STEP);
            if (budgetMaxValue - budgetMinValue < BUDGET_STEP) {
                budgetMaxValue = budgetMinValue + BUDGET_STEP;
            }
        } else {
            budgetMaxValue = Math.min(BUDGET_MAX, budgetMinValue + BUDGET_STEP);
            if (budgetMaxValue - budgetMinValue < BUDGET_STEP) {
                budgetMinValue = budgetMaxValue - BUDGET_STEP;
            }
        }
    }

    const minPrice = budgetMinValue > BUDGET_MIN ? budgetMinValue : undefined;
    const maxPrice = budgetMaxValue < BUDGET_MAX ? budgetMaxValue : undefined;
    const guests = parseNumberParam(searchParams.get('guests'));
    const bedrooms = parseNumberParam(searchParams.get('bedrooms'));
    const baths = parseNumberParam(searchParams.get('baths'));
    const guestFavoriteOnly = searchParams.get('favorites') === '1';

    const [listings, setListings] = useState<Listing[]>([]);
    const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [activeDrop, setActiveDrop] = useState<FlashSaleDrop | null>(null);
    const [activeDrops, setActiveDrops] = useState<FlashSaleDrop[]>([]);
    const [nowTs, setNowTs] = useState(Date.now());
    const [loading, setLoading] = useState(true);
    const [listingError, setListingError] = useState<string | null>(null);

    // Local draft state for the budget slider.
    // Writes here immediately (for responsive visual feedback) and debounces
    // committing to searchParams so fetchListings fires once after dragging stops.
    const [localMinBudget, setLocalMinBudget] = useState(budgetMinValue);
    const [localMaxBudget, setLocalMaxBudget] = useState(budgetMaxValue);

    useEffect(() => {
        if (!showFilters) {
            setDisplayedListings(listings);
        }
    }, [listings, showFilters]);

    // Keep local draft budget in sync when URL params change externally
    // (e.g. quick chips, back button, direct URL navigation).
    // Only sync when the filter modal is closed to avoid overwriting live drag.
    useEffect(() => {
        if (!showFilters) {
            setLocalMinBudget(budgetMinValue);
            setLocalMaxBudget(budgetMaxValue);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [budgetMinValue, budgetMaxValue]);

    const [heroSearchQuery, setHeroSearchQuery] = useState(searchParams.get('search') ?? '');
    const [heroGuests, setHeroGuests] = useState(searchParams.get('guests') ?? '');
    const [heroBedrooms, setHeroBedrooms] = useState(searchParams.get('bedrooms') ?? '');

    const [roomsOpen, setRoomsOpen] = useState(false);
    const [guestsOpen, setGuestsOpen] = useState(false);
    const [currentHeroImageIndex, setCurrentHeroImageIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    // Keep nowTs ticking every second so flash-sale countdowns and banner filters stay live
    useEffect(() => {
        const ticker = setInterval(() => setNowTs(Date.now()), 1000);
        return () => clearInterval(ticker);
    }, []);

    useEffect(() => {
        const handleCloseAll = () => {
            setRoomsOpen(false);
            setGuestsOpen(false);
        };
        document.addEventListener('mousedown', handleCloseAll);
        return () => document.removeEventListener('mousedown', handleCloseAll);
    }, []);

    const toggleRooms = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRoomsOpen(prev => !prev);
        setGuestsOpen(false);
    };

    const toggleGuests = (e: React.MouseEvent) => {
        e.stopPropagation();
        setGuestsOpen(prev => !prev);
        setRoomsOpen(false);
    };

    useEffect(() => {
        setHeroSearchQuery(searchParams.get('search') ?? '');
        setHeroGuests(searchParams.get('guests') ?? '');
        setHeroBedrooms(searchParams.get('bedrooms') ?? '');
    }, [searchParams]);

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

    const handleHeroSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateParams({
            search: heroSearchQuery || null,
            guests: heroGuests || null,
            bedrooms: heroBedrooms || null,
        });
    };

    const handleDestinationClick = (destName: string) => {
        setHeroSearchQuery(destName);
        updateParams({
            search: destName || null,
        });
        
        // Smooth scroll to listings grid
        setTimeout(() => {
            const mainEl = document.querySelector('main');
            if (mainEl) {
                const topOffset = mainEl.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: topOffset, behavior: 'smooth' });
            }
        }, 100);
    };

    const handleSelectCategory = (id: string) => {
        const next = new URLSearchParams(searchParams);
        if (categoryParam === id) {
            next.delete('category');
        } else {
            next.delete('luxurySection');
            next.set('category', id);
        }
        setSearchParams(next);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams);
        ['category', 'luxurySection', 'sort', 'minPrice', 'maxPrice', 'guests', 'bedrooms', 'baths', 'favorites', 'search'].forEach((key) => params.delete(key));
        setSearchParams(params);
    };

    const toggleFavoritesOnly = () => {
        updateParams({ favorites: guestFavoriteOnly ? null : 1 });
    };

    const handleMinBudgetChange = (value: string) => {
        const valNum = Number(value);
        if (Number.isNaN(valNum)) return;
        // Write to local state only; the debounce effect below commits to searchParams.
        const nextMin = Math.min(valNum, localMaxBudget - BUDGET_STEP);
        setLocalMinBudget(Math.max(BUDGET_MIN, nextMin));
    };

    const handleMaxBudgetChange = (value: string) => {
        const valNum = Number(value);
        if (Number.isNaN(valNum)) return;
        const nextMax = Math.max(valNum, localMinBudget + BUDGET_STEP);
        setLocalMaxBudget(Math.min(BUDGET_MAX, nextMax));
    };

    const changeGuests = (delta: number) => {
        const nextVal = (guests ?? 0) + delta;
        updateParams({ guests: nextVal <= 0 ? null : nextVal });
    };

    const changeBedrooms = (delta: number) => {
        const nextVal = (bedrooms ?? 0) + delta;
        updateParams({ bedrooms: nextVal <= 0 ? null : nextVal });
    };

    const changeBaths = (delta: number) => {
        const nextVal = (baths ?? 0) + delta;
        updateParams({ baths: nextVal <= 0 ? null : nextVal });
    };

    // Debounce: commit budget slider values to URL only after the user
    // stops dragging for 400ms. This prevents fetchListings from firing
    // on every pixel of slider movement.
    useEffect(() => {
        const timer = setTimeout(() => {
            updateParams({
                minPrice: localMinBudget <= BUDGET_MIN ? null : localMinBudget,
                maxPrice: localMaxBudget >= BUDGET_MAX ? null : localMaxBudget,
            });
        }, 400);
        return () => clearTimeout(timer);
    // updateParams is stable (defined outside effects, doesn't change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localMinBudget, localMaxBudget]);

    const isMinSliderOnTop = localMinBudget > BUDGET_MAX * 0.5;

    useEffect(() => {
        const loadListings = async () => {
            setLoading(true);
            setListingError(null);
            try {
                const filters: ListingFilters = {
                    category: categoryFilter,
                    luxurySection,
                    search,
                    sort,
                    minPrice,
                    maxPrice,
                    guests,
                    bedrooms,
                    baths,
                    guestFavoriteOnly,
                };

                // Fetch listings and flash-sale drop in PARALLEL to halve wait time
                const [listingsResult, flashSaleResult] = await Promise.allSettled([
                    api.fetchListings(filters),
                    api.fetchActiveFlashDrops(new Date()),
                ]);

                if (listingsResult.status === 'fulfilled') {
                    setListings(listingsResult.value);
                } else {
                    const message = listingsResult.reason instanceof Error
                        ? listingsResult.reason.message
                        : 'Could not load listings from Supabase.';
                    setListings([]);
                    setListingError(message);
                    if (import.meta.env.DEV) {
                        console.error(listingsResult.reason);
                    }
                }

                if (flashSaleResult.status === 'fulfilled') {
                    const drops = flashSaleResult.value;
                    setActiveDrops(drops);
                    setActiveDrop(drops.length > 0 ? drops[0] : null);
                } else {
                    setActiveDrops([]);
                    setActiveDrop(null);
                    if (import.meta.env.DEV) {
                        console.error(flashSaleResult.reason);
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        loadListings();
    }, [categoryFilter, luxurySection, search, sort, minPrice, maxPrice, guests, bedrooms, baths, guestFavoriteOnly]);

    const formatBudget = (value: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);

    // Show local draft values in the label/track for responsive visual feedback.
    const budgetLabel = localMinBudget <= BUDGET_MIN && localMaxBudget >= BUDGET_MAX
        ? 'Any price'
        : `${formatBudget(localMinBudget <= BUDGET_MIN ? BUDGET_MIN : localMinBudget)} - ${localMaxBudget >= BUDGET_MAX ? 'Any price' : formatBudget(localMaxBudget)}`;
    const budgetMinProgress = `${((localMinBudget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%`;
    const budgetMaxProgress = `${((localMaxBudget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%`;


    const activeFiltersCount = [
        Boolean(categoryFilter),
        luxurySection,
        sort !== 'recommended',
        minPrice !== undefined,
        maxPrice !== undefined,
        guests !== undefined,
        bedrooms !== undefined,
        baths !== undefined,
        guestFavoriteOnly,
    ].filter(Boolean).length;


    useEffect(() => {
        const handleToggle = () => {
            setShowFilters((prev) => !prev);
        };
        window.addEventListener('toggle-filters', handleToggle);
        return () => window.removeEventListener('toggle-filters', handleToggle);
    }, []);

    useEffect(() => {
        if (searchParams.get('showFilters') === 'true') {
            setShowFilters(true);
            const next = new URLSearchParams(searchParams);
            next.delete('showFilters');
            setSearchParams(next, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const remainingMs = activeDrop ? new Date(activeDrop.endAt).getTime() - nowTs : 0;
    const hasActiveDrop = Boolean(activeDrop && remainingMs > 0);
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    const countdown = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
        <>
            <div className={styles.heroSection}>
                {HERO_IMAGES.map((imgUrl, idx) => (
                    <div
                        key={imgUrl}
                        className={`${styles.heroBgImage} ${idx === currentHeroImageIndex ? styles.heroBgImageActive : ''}`}
                        style={{ backgroundImage: `url(${imgUrl})` }}
                    />
                ))}
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        Experience India's Finest Stays
                    </h1>
                    
                    <p className={styles.heroSubtitle}>
                        <span className={styles.coastalBlueText}>Handpicked Luxury.</span> Fully Verified Stays.
                    </p>

                    <div className={styles.heroSearchContainer}>
                        <form className={styles.heroSearchForm} onSubmit={handleHeroSearch}>
                            <div className={`${styles.searchField} ${styles.destinationField}`}>
                                <MapPin size={22} className={styles.searchFieldIcon} />
                                <div className={styles.searchFieldTextGroup}>
                                    <label className={styles.searchFieldLabel} htmlFor="hero-destination">Where to?</label>
                                    <div className={styles.inputDropdownWrapper}>
                                        <input
                                            id="hero-destination"
                                            type="text"
                                            placeholder="Search destinations"
                                            value={heroSearchQuery}
                                            onChange={(e) => setHeroSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.searchDivider} />
                            <div 
                                className={`${styles.searchField} ${styles.interactiveField}`} 
                                onMouseDown={toggleRooms}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setRoomsOpen(prev => !prev); setGuestsOpen(false); } }}
                            >
                                <BedDouble size={22} className={styles.searchFieldIcon} />
                                <div className={styles.searchFieldTextGroup}>
                                    <span className={styles.searchFieldLabel}>Rooms</span>
                                    <div className={styles.customSelectTrigger}>
                                        <span className={styles.customSelectValue}>
                                            {heroBedrooms ? (heroBedrooms === '5' ? '5+ rooms' : `${heroBedrooms} room${heroBedrooms === '1' ? '' : 's'}`) : 'Add rooms'}
                                        </span>
                                        <ChevronDown size={14} className={`${styles.selectChevron} ${roomsOpen ? styles.chevronRotated : ''}`} />
                                    </div>
                                </div>
                                {roomsOpen && (
                                    <div className={styles.customDropdownMenu} onMouseDown={(e) => e.stopPropagation()}>
                                        {[
                                            { value: '', label: 'Add rooms' },
                                            { value: '1', label: '1 room' },
                                            { value: '2', label: '2 rooms' },
                                            { value: '3', label: '3 rooms' },
                                            { value: '4', label: '4 rooms' },
                                            { value: '5', label: '5+ rooms' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                className={`${styles.customDropdownOption} ${heroBedrooms === opt.value ? styles.optionActive : ''}`}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setHeroBedrooms(opt.value);
                                                    updateParams({ bedrooms: opt.value || null });
                                                    setRoomsOpen(false);
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className={styles.searchDivider} />
                            <div 
                                className={`${styles.searchField} ${styles.interactiveField}`} 
                                onMouseDown={toggleGuests}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setGuestsOpen(prev => !prev); setRoomsOpen(false); } }}
                            >
                                <User size={22} className={styles.searchFieldIcon} />
                                <div className={styles.searchFieldTextGroup}>
                                    <span className={styles.searchFieldLabel}>Guests</span>
                                    <div className={styles.customSelectTrigger}>
                                        <span className={styles.customSelectValue}>
                                            {heroGuests ? (heroGuests === '6' ? '6+ guests' : `${heroGuests} guest${heroGuests === '1' ? '' : 's'}`) : 'Add guests'}
                                        </span>
                                        <ChevronDown size={14} className={`${styles.selectChevron} ${guestsOpen ? styles.chevronRotated : ''}`} />
                                    </div>
                                </div>
                                {guestsOpen && (
                                    <div className={styles.customDropdownMenu} onMouseDown={(e) => e.stopPropagation()}>
                                        {[
                                            { value: '', label: 'Add guests' },
                                            { value: '1', label: '1 guest' },
                                            { value: '2', label: '2 guests' },
                                            { value: '3', label: '3 guests' },
                                            { value: '4', label: '4 guests' },
                                            { value: '6', label: '6+ guests' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                className={`${styles.customDropdownOption} ${heroGuests === opt.value ? styles.optionActive : ''}`}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setHeroGuests(opt.value);
                                                    updateParams({ guests: opt.value || null });
                                                    setGuestsOpen(false);
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="submit" className={styles.heroSearchButton} aria-label="Search">
                                <Search size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

                {/* Mode toggle: Aevr / Aevr Luxe (placed below stats) */}
                <div className={styles.homeModeToggleContainer}>
                    <div className={styles.homeModeToggle}>
                        <div className={`${styles.sliderIndicator} ${luxurySection ? styles.sliderIndicatorLuxe : ''}`} />
                        <button
                            type="button"
                            className={`${styles.modeButton} ${!luxurySection ? styles.modeButtonActive : ''}`}
                            onClick={() => {
                                const next = new URLSearchParams(searchParams);
                                next.delete('luxurySection');
                                next.delete('category');
                                setSearchParams(next);
                            }}
                        >
                            Aevr
                        </button>
                        <button
                            type="button"
                            className={`${styles.modeButton} ${luxurySection ? `${styles.modeButtonActive} ${styles.modeButtonActiveLuxe}` : ''}`}
                            onClick={() => {
                                const next = new URLSearchParams(searchParams);
                                next.delete('category');
                                next.set('luxurySection', '1');
                                setSearchParams(next);
                            }}
                        >
                            Aevr Luxe
                        </button>
                    </div>
                    <p className={styles.modeToggleSubtitle}>
                        {!luxurySection 
                            ? 'Discover every stay on AEVR — from budget-friendly escapes to premium luxury villas.' 
                            : 'Explore our handpicked collection of luxury villas and heritage stays, priced above ₹10,000 per night.'}
                    </p>
                </div>

            <main className={`${styles.homeMainContainer} ${luxurySection ? styles.homeModeLuxe : styles.homeModeAevr}`}>
                {activeDrops.filter((drop) => new Date(drop.endAt).getTime() > nowTs).length > 0 && (
                    <section className={styles.flashSaleSection}>
                        <div className={styles.flashSaleSectionHeader}>
                            <div className={styles.flashSaleTitleGroup}>
                                <Sparkles className={styles.flashSaleSparkleIcon} size={22} />
                                <h2>⚡ Flash Sale Deals</h2>
                                <span className={styles.flashSaleCountBadge}>
                                    {activeDrops.filter((drop) => new Date(drop.endAt).getTime() > nowTs).length} Propert{activeDrops.filter((drop) => new Date(drop.endAt).getTime() > nowTs).length > 1 ? 'ies' : 'y'} on Sale
                                </span>
                            </div>
                            <p className={styles.flashSaleSubtitle}>
                                Limited-time special offers! Book directly before the timer runs out.
                            </p>
                        </div>

                        <div className={styles.flashSaleGrid}>
                            {activeDrops
                                .filter((drop) => new Date(drop.endAt).getTime() > nowTs)
                                .map((drop) => {
                                    const remMs = new Date(drop.endAt).getTime() - nowTs;
                                    const remSec = Math.max(0, Math.floor(remMs / 1000));
                                    const h = Math.floor(remSec / 3600);
                                    const m = Math.floor((remSec % 3600) / 60);
                                    const s = remSec % 60;
                                    const dropCountdown = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                                    const origPrice = drop.listing.originalPrice ?? drop.listing.price;

                                    return (
                                        <div key={drop.id} className={styles.flashSaleCard}>
                                            <img
                                                className={styles.flashSaleImage}
                                                src={withImageTransform(drop.listing.images[0] ?? getFallbackImage(), { width: 600, quality: 70 })}
                                                alt={drop.listing.title}
                                            />
                                            <div className={styles.flashSaleBody}>
                                                <div className={styles.flashSaleMeta}>
                                                    <span className={styles.flashSaleBadge}>
                                                        <ShieldCheck size={14} /> Verified by AevrLux
                                                    </span>
                                                    <span className={styles.flashSaleTimer}>
                                                        <Clock3 size={14} /> {dropCountdown}
                                                    </span>
                                                </div>
                                                <h2>{drop.listing.title}</h2>
                                                <p>{drop.listing.location.city}, {drop.listing.location.country}</p>
                                                <div className={styles.flashSalePricing}>
                                                    <span className={styles.flashOldPrice}>₹{Math.round(origPrice).toLocaleString('en-IN')}</span>
                                                    <strong>₹{Math.round(drop.salePrice).toLocaleString('en-IN')}</strong>
                                                    <span className={styles.flashDiscount}>{Math.round(drop.discountPercent)}% OFF</span>
                                                </div>
                                                <Link className={styles.flashSaleCta} to={`/rooms/${drop.listing.id}`}>View drop</Link>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </section>
                )}


            {showFilters && (
                <div className={styles.modalBackdrop} onClick={() => setShowFilters(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <button className={styles.closeModalButton} onClick={() => setShowFilters(false)} aria-label="Close filters">
                                <X size={18} />
                            </button>
                            <h2>Filters</h2>
                            <div style={{ width: 18 }} />
                        </div>

                        <div className={styles.modalBody}>
                            {/* Sort Section */}
                            <div className={styles.filterSection}>
                                <div className={styles.filterSectionHeader}>
                                    <h3>Sort Stays</h3>
                                    <p>Choose how listings are ordered in your results</p>
                                </div>
                                <div className={styles.sortOptionsPills}>
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={`${styles.sortPill} ${sort === option.value ? styles.sortPillActive : ''}`}
                                            onClick={() => updateParams({ sort: option.value })}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range / Budget Section */}
                            <div className={styles.filterSection}>
                                <div className={styles.filterSectionHeader}>
                                    <h3>Budget</h3>
                                    <p>Nightly prices before taxes and additional fees</p>
                                </div>
                                <div className={styles.budgetSliderShell}>
                                    <div className={styles.budgetValueRow}>
                                        <strong className={styles.budgetValue}>{budgetLabel}</strong>
                                        <span>/night</span>
                                    </div>
                                    <div
                                        className={styles.budgetRange}
                                        style={{
                                            '--budget-min-progress': budgetMinProgress,
                                            '--budget-max-progress': budgetMaxProgress,
                                        } as CSSProperties}
                                    >
                                        <input
                                            aria-label="Minimum nightly budget"
                                            className={`${styles.budgetSlider} ${styles.budgetSliderMin}`}
                                            type="range"
                                            min={BUDGET_MIN}
                                            max={BUDGET_MAX}
                                            step={BUDGET_STEP}
                                            value={localMinBudget}
                                            onChange={(e) => handleMinBudgetChange(e.target.value)}
                                            style={{ zIndex: isMinSliderOnTop ? 3 : 4 }}
                                        />
                                        <input
                                            aria-label="Maximum nightly budget"
                                            className={`${styles.budgetSlider} ${styles.budgetSliderMax}`}
                                            type="range"
                                            min={BUDGET_MIN}
                                            max={BUDGET_MAX}
                                            step={BUDGET_STEP}
                                            value={localMaxBudget}
                                            onChange={(e) => handleMaxBudgetChange(e.target.value)}
                                            style={{ zIndex: isMinSliderOnTop ? 4 : 3 }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.priceInputRow}>
                                    <div className={styles.priceInputContainer}>
                                        <span className={styles.priceInputLabel}>min price</span>
                                        <div className={styles.priceInputInner}>
                                            <span className={styles.currencyPrefix}>₹</span>
                                            <input
                                                type="number"
                                                min={BUDGET_MIN}
                                                max={BUDGET_MAX}
                                                value={localMinBudget}
                                                onChange={(e) => handleMinBudgetChange(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.priceInputDivider}>–</div>
                                    <div className={styles.priceInputContainer}>
                                        <span className={styles.priceInputLabel}>max price</span>
                                        <div className={styles.priceInputInner}>
                                            <span className={styles.currencyPrefix}>₹</span>
                                            <input
                                                type="number"
                                                min={BUDGET_MIN}
                                                max={BUDGET_MAX}
                                                value={localMaxBudget}
                                                onChange={(e) => handleMaxBudgetChange(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.quickChips}>
                                    <button type="button" className={styles.quickChip} onClick={() => { setLocalMinBudget(BUDGET_MIN); setLocalMaxBudget(5000); }}>
                                        Under ₹5k
                                    </button>
                                    <button type="button" className={styles.quickChip} onClick={() => { setLocalMinBudget(BUDGET_MIN); setLocalMaxBudget(10000); }}>
                                        Under ₹10k
                                    </button>
                                </div>
                            </div>

                            {/* Rooms and Beds Increment/Decrement Section */}
                            <div className={styles.filterSection}>
                                <div className={styles.filterSectionHeader}>
                                    <h3>Rooms and Beds</h3>
                                    <p>Specify the required space and capacity for your group</p>
                                </div>
                                <div className={styles.countersContainer}>
                                    <div className={styles.counterControl}>
                                        <div className={styles.counterLabel}>
                                            <strong>Guests</strong>
                                            <span>Number of total guests</span>
                                        </div>
                                        <div className={styles.counterActions}>
                                            <button
                                                type="button"
                                                onClick={() => changeGuests(-1)}
                                                disabled={!guests}
                                                className={styles.counterBtn}
                                                aria-label="Decrease guests"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className={styles.counterValue}>{guests ?? 'Any'}</span>
                                            <button
                                                type="button"
                                                onClick={() => changeGuests(1)}
                                                className={styles.counterBtn}
                                                aria-label="Increase guests"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.counterControl}>
                                        <div className={styles.counterLabel}>
                                            <strong>Bedrooms</strong>
                                            <span>Number of bedrooms needed</span>
                                        </div>
                                        <div className={styles.counterActions}>
                                            <button
                                                type="button"
                                                onClick={() => changeBedrooms(-1)}
                                                disabled={!bedrooms}
                                                className={styles.counterBtn}
                                                aria-label="Decrease bedrooms"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className={styles.counterValue}>{bedrooms ?? 'Any'}</span>
                                            <button
                                                type="button"
                                                onClick={() => changeBedrooms(1)}
                                                className={styles.counterBtn}
                                                aria-label="Increase bedrooms"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.counterControl}>
                                        <div className={styles.counterLabel}>
                                            <strong>Bathrooms</strong>
                                            <span>Number of bathrooms needed</span>
                                        </div>
                                        <div className={styles.counterActions}>
                                            <button
                                                type="button"
                                                onClick={() => changeBaths(-1)}
                                                disabled={!baths}
                                                className={styles.counterBtn}
                                                aria-label="Decrease bathrooms"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className={styles.counterValue}>{baths ?? 'Any'}</span>
                                            <button
                                                type="button"
                                                onClick={() => changeBaths(1)}
                                                className={styles.counterBtn}
                                                aria-label="Increase bathrooms"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Property Category Selection Section */}
                            <div className={styles.filterSection}>
                                <div className={styles.filterSectionHeader}>
                                    <h3>Property Styles</h3>
                                    <p>Select category to match your specific style preference</p>
                                </div>
                                <div className={styles.categoryFilterPills}>
                                    {FILTER_CATEGORIES.map((cat) => {
                                        const Icon = cat.Icon;
                                        const isActive = categoryParam === cat.slug;
                                        return (
                                            <button
                                                key={cat.slug}
                                                type="button"
                                                className={`${styles.categoryFilterPill} ${isActive ? styles.categoryFilterPillActive : ''}`}
                                                onClick={() => handleSelectCategory(cat.slug)}
                                            >
                                                <Icon size={14} />
                                                <span>{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Guest Favorites toggle */}
                            <div className={styles.filterSection}>
                                <div className={styles.toggleRow}>
                                    <div className={styles.toggleLabel}>
                                        <h3>Guest favorites</h3>
                                        <p>Stays that guests love most, rated 4.9+ stars</p>
                                    </div>
                                    <button
                                        type="button"
                                        className={`${styles.favoriteToggle} ${guestFavoriteOnly ? styles.favoriteToggleActive : ''}`}
                                        onClick={toggleFavoritesOnly}
                                    >
                                        <Sparkles size={14} />
                                        <span>Guest favorites</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.clearAllButton} onClick={clearFilters} disabled={activeFiltersCount === 0}>
                                Clear all
                            </button>
                            <button type="button" className={styles.showStaysButton} onClick={() => setShowFilters(false)}>
                                {loading ? 'Loading...' : `Show ${listings.length} stay${listings.length === 1 ? '' : 's'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

                {loading ? (
                    <SkeletonScreen variant="listing-grid" />
                ) : listingError ? (
                    <div className={`${styles.emptyState} ${styles.debugErrorState}`} role="status">
                        <h2>Listings could not load</h2>
                        <p>{listingError}</p>
                    </div>
                ) : displayedListings.length > 0 ? (
                    <>
                        <div className={styles.sectionHeaderRow}>
                            <h2 className={styles.sectionHeading}>{luxurySection ? 'Aevr Luxe stays' : 'Featured stays'}</h2>
                        </div>
                        <div className={styles.grid}>
                            {displayedListings.map((listing, index) => (
                                <ListingCard key={listing.id} listing={listing} activeFlashSale={activeDrops} cardIndex={index} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <h2>No listings found</h2>
                        <p>No properties found matching your search.</p>
                        <button type="button" className={styles.clearFiltersBtn} onClick={clearFilters}>
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Top Destinations Section */}
                <section className={styles.topDestinationsSection}>
                    <div className={styles.topDestinationsHeader}>
                        <div className={styles.topDestinationsHeaderLeft}>
                            <span className={styles.topDestinationsLabel}>Explore the world</span>
                            <h2 className={styles.topDestinationsTitle}>Top Destinations</h2>
                        </div>
                        <button type="button" className={styles.allDestinationsBtn} onClick={clearFilters}>
                            <span>All destinations</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className={styles.destinationsGrid}>
                        {TOP_DESTINATIONS.map((dest) => (
                            <div
                                key={dest.name}
                                className={styles.destinationCard}
                                onClick={() => !dest.isComingSoon && handleDestinationClick(dest.searchQuery)}
                                style={{
                                    cursor: dest.isComingSoon ? 'default' : 'pointer'
                                }}
                            >
                                <img
                                    src={dest.image}
                                    alt={dest.name}
                                    className={styles.destinationCardImage}
                                    loading="lazy"
                                />
                                <div className={styles.destinationCardOverlay} />
                                {dest.isComingSoon && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '16px',
                                            right: '16px',
                                            backgroundColor: '#B88A5A',
                                            color: '#FFFFFF',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            zIndex: 2
                                        }}
                                    >
                                        Soon
                                    </span>
                                )}
                                <div className={styles.destinationCardContent}>
                                    <h3 className={styles.destinationCardTitle}>{dest.name}</h3>
                                    <p className={styles.destinationCardSubtitle}>
                                        {dest.isComingSoon 
                                            ? 'Launching soon' 
                                            : `${dest.villasCount} ${dest.villasCount === 1 ? 'Villa' : 'Villas'}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <section className={styles.bottomDashboardSection}>
                <div className={styles.bottomDashboardContainer}>
                    {/* Card 1: Why choose AEVR? */}
                    <div className={styles.dashboardCard}>
                        <h2 className={styles.dashboardCardTitle}>Why choose AEVR?</h2>
                        <div className={styles.compactFeaturesGrid}>
                            <div className={styles.featureItem}>
                                <Building2 className={styles.featureIcon} size={20} />
                                <div className={styles.featureTextGroup}>
                                    <h3 className={styles.featureTitle}>Curated Stays</h3>
                                    <p className={styles.featureDescription}>Handpicked villas for quality & comfort</p>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <Sparkles className={styles.featureIcon} size={20} />
                                <div className={styles.featureTextGroup}>
                                    <h3 className={styles.featureTitle}>Best Prices</h3>
                                    <p className={styles.featureDescription}>Transparent pricing with no hidden fees</p>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <Compass className={styles.featureIcon} size={20} />
                                <div className={styles.featureTextGroup}>
                                    <h3 className={styles.featureTitle}>Local Experiences</h3>
                                    <p className={styles.featureDescription}>Discover like a local with curated guides</p>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <ShieldCheck className={styles.featureIcon} size={20} />
                                <div className={styles.featureTextGroup}>
                                    <h3 className={styles.featureTitle}>Safe & Secure</h3>
                                    <p className={styles.featureDescription}>Trusted by 1000+ families for secure stays</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            <div className={styles.contactFloatGroup}>
                <a
                    className={`${styles.contactFloatButton} ${styles.whatsappFloat}`}
                    href="https://wa.me/918890807482"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Message on WhatsApp"
                >
                    <img src="/whatsapp.svg" alt="" aria-hidden="true" />
                </a>
                <a
                    className={`${styles.contactFloatButton} ${styles.emailFloat}`}
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=Aevrindia%40gmail.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Email Aevrindia@gmail.com"
                >
                    <Mail size={30} aria-hidden="true" />
                </a>
                <a
                    className={`${styles.contactFloatButton} ${styles.instagramFloat}`}
                    href="https://www.instagram.com/aevrindia?igsh=c2dna3Z3Zm5hN293"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open Aevr India on Instagram"
                >
                    <img src="/instagram.svg" alt="" aria-hidden="true" />
                </a>
                <button
                    className={`${styles.contactFloatButton} ${styles.chatFloat}`}
                    type="button"
                    aria-label="Open contact options"
                >
                    <MessageCircle size={30} aria-hidden="true" />
                </button>
            </div>
        </>
    );
};
