import { useEffect, useMemo, useState, type ElementType } from 'react';
import { useParams } from 'react-router-dom';
import {
    Star,
    Heart,
    Share,
    Grid,
    Key,
    Calendar,
    MapPin,
    Wifi,
    Car,
    Utensils,
    Bath,
    BedDouble,
    Users,
    Sparkles,
    Snowflake,
    Dumbbell,
    Coffee,
    ConciergeBell,
    Waves,
    Umbrella,
    Trees,
} from 'lucide-react';
import styles from './ListingDetails.module.css';
import { api } from '../services/api';
import { favoritesService } from '../services/favorites';
import type { AvailabilityBlock, Listing } from '../types';

const amenityIcons: Record<string, ElementType> = {
    wifi: Wifi,
    pool: Waves,
    kitchen: Utensils,
    ac: Snowflake,
    heater: Sparkles,
    gym: Dumbbell,
    elevator: Sparkles,
    'private beach': Umbrella,
    breakfast: Coffee,
    butler: ConciergeBell,
    'nature trails': Trees,
    'organic food': Sparkles,
    'estate walk': Trees,
    'lake view': Sparkles,
    'cycle rental': Car,
    cafe: Coffee,
};

const getAmenityIcon = (label: string): ElementType => {
    const key = label.trim().toLowerCase();
    return amenityIcons[key] ?? MapPin;
};

const formatPrice = (amount: number, currency?: string) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency ?? 'INR',
        maximumFractionDigits: 0,
    }).format(amount);

const dateToInput = (date: Date) => date.toISOString().slice(0, 10);

const parseInputDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

const addDays = (value: string, days: number) => {
    const date = parseInputDate(value);
    date.setUTCDate(date.getUTCDate() + days);
    return dateToInput(date);
};

const nightsBetween = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const start = parseInputDate(checkIn).getTime();
    const end = parseInputDate(checkOut).getTime();
    const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
};

const rangesOverlap = (startA: string, endA: string, startB: string, endB: string) => {
    const start1 = parseInputDate(startA).getTime();
    const end1 = parseInputDate(endA).getTime();
    const start2 = parseInputDate(startB).getTime();
    const end2 = parseInputDate(endB).getTime();
    return start1 < end2 && start2 < end1;
};

const formatDateRange = (startDate: string, endDate: string) => {
    const formatter = new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' });
    const start = formatter.format(new Date(`${startDate}T00:00:00Z`));
    const end = formatter.format(new Date(`${endDate}T00:00:00Z`));
    return `${start} - ${end}`;
};

export const ListingDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<Listing | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);
    const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
    const [bookingStatus, setBookingStatus] = useState<'reserved' | 'requested' | null>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [bookingMode, setBookingMode] = useState<'reserve' | 'request'>('reserve');

    const [checkIn, setCheckIn] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return dateToInput(tomorrow);
    });
    const [checkOut, setCheckOut] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(tomorrow);
        nextWeek.setDate(nextWeek.getDate() + 4);
        return dateToInput(nextWeek);
    });
    const [guestCount, setGuestCount] = useState(1);

    useEffect(() => {
        if (!id) return;

        const load = async () => {
            setLoading(true);
            const data = await api.fetchListingById(id);
            const blocks = await api.fetchAvailabilityBlocks(id);
            setListing(data);
            setAvailabilityBlocks(blocks);
            setIsFavorited(favoritesService.isFavorite(id));
            setLoading(false);
        };

        load();
    }, [id]);

    useEffect(() => {
        if (!listing) return;
        const guestLimit = listing.guestCountMax ?? 10;
        setGuestCount((current) => Math.min(current, guestLimit));
    }, [listing]);

    useEffect(() => {
        if (checkOut <= checkIn) {
            setCheckOut(addDays(checkIn, 1));
        }
    }, [checkIn, checkOut]);

    const guestLimit = listing?.guestCountMax ?? 10;
    const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
    const subtotal = listing ? listing.price * nights : 0;
    const cleaningFee = listing ? Math.max(45, Math.round(listing.price * 0.06)) : 0;
    const serviceFee = listing ? Math.max(35, Math.round(subtotal * 0.12)) : 0;
    const taxes = listing ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal + cleaningFee + serviceFee + taxes;
    const coverImage = listing?.images[0] ?? 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop';

    const toggleFavorite = () => {
        if (!listing) return;
        favoritesService.toggleFavorite(listing.id);
        setIsFavorited(!isFavorited);
    };

    const handleBooking = (mode: 'reserve' | 'request') => {
        if (!listing) return;

        if (nights <= 0) {
            setBookingError('Please choose a valid check-in and checkout date.');
            return;
        }

        const blockedRange = availabilityBlocks.find((block) => rangesOverlap(checkIn, checkOut, block.startDate, block.endDate));
        if (blockedRange) {
            setBookingError(
                blockedRange.status === 'restricted'
                    ? 'Those dates are restricted by the host. Please choose another range.'
                    : 'Those dates are already booked. Please choose another range.'
            );
            return;
        }

        if (guestCount < 1 || guestCount > guestLimit) {
            setBookingError(`Please choose between 1 and ${guestLimit} guests.`);
            return;
        }

        setBookingError(null);
        setBookingStatus(mode === 'reserve' ? 'reserved' : 'requested');
    };

    const bookingHeadline = bookingMode === 'reserve' ? 'Reserve now' : 'Request to book';
    const bookingActionLabel = bookingMode === 'reserve' ? 'Reserve' : 'Request to book';

    if (loading) {
        return <div className={styles.container} style={{ height: '80vh' }} />;
    }

    if (!listing) {
        return <div className={styles.container}>Listing not found</div>;
    }

    const listingSummary = [
        listing.guestCountMax ? `${listing.guestCountMax} guests` : null,
        listing.bedrooms ? `${listing.bedrooms} bedrooms` : null,
        listing.beds ? `${listing.beds} beds` : null,
        listing.baths ? `${listing.baths} baths` : null,
    ].filter((part): part is string => Boolean(part)).join(' · ');

    return (
        <div className={styles.container}>
            <div className={styles.heading}>
                <h1 className={styles.title}>{listing.title}</h1>
                <div className={styles.subHeading}>
                    <div className={styles.ratingLoc}>
                        <Star size={14} fill="currentColor" />
                        <span>{listing.rating}</span>
                        <span>·</span>
                        <span style={{ textDecoration: 'underline' }}>{listing.reviewCount} reviews</span>
                        <span>·</span>
                        <span style={{ textDecoration: 'underline' }}>{listing.location.city}, {listing.location.country}</span>
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.actionButton}><Share size={16} /> Share</button>
                        <button className={styles.actionButton} onClick={toggleFavorite}>
                            <Heart size={16} fill={isFavorited ? 'var(--color-primary)' : 'none'} color={isFavorited ? 'var(--color-primary)' : 'currentColor'} />
                            <span style={{ color: isFavorited ? 'var(--color-primary)' : 'inherit' }}>{isFavorited ? 'Saved' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.photoGrid}>
                <div className={styles.mainPhoto}>
                    <img src={coverImage} alt={listing.title} className={styles.photo} />
                </div>
                <div className={styles.sidePhotos}>
                    {listing.images.slice(1, 5).map((img, idx) => (
                        <img key={`${img}-${idx}`} src={img} alt={`${listing.title} view ${idx + 2}`} className={styles.photo} />
                    ))}
                </div>
                <button className={styles.showAllButton}>
                    <Grid size={16} /> Show all photos
                </button>
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.leftColumn}>
                    <div className={styles.hostSection}>
                        <div className={styles.hostInfo}>
                            <h2>{listing.categoryLabel ?? `Hosted by ${listing.host.name}`}</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {listing.host.isSuperhost && 'Superhost · '}
                                {listingSummary || 'Flexible stay'}
                            </p>
                            {listing.mapLink && (
                                <a
                                    href={listing.mapLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'inline-flex', marginTop: '10px', color: 'var(--color-primary)', fontWeight: 600 }}
                                >
                                    Open on Google Maps
                                </a>
                            )}
                        </div>
                        <div className={styles.hostAvatar}>
                            <img src={listing.host.avatarUrl} alt={listing.host.name} />
                        </div>
                    </div>

                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><Key size={24} /></div>
                        <div className={styles.featureText}>
                            <h3>Self check-in</h3>
                            <p>Check yourself in with the lockbox.</p>
                        </div>
                    </div>
                    {listing.host.isSuperhost && (
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}><Star size={24} /></div>
                            <div className={styles.featureText}>
                                <h3>{listing.host.name} is a Superhost</h3>
                                <p>Superhosts are experienced, highly rated Hosts.</p>
                            </div>
                        </div>
                    )}
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><Calendar size={24} /></div>
                        <div className={styles.featureText}>
                            <h3>{listing.availabilitySummary ?? 'Flexible cancellation policy'}</h3>
                        </div>
                    </div>

                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><Users size={24} /></div>
                        <div className={styles.featureText}>
                            <h3>At a glance</h3>
                            <p>
                                {listing.guestCountMax ? `${listing.guestCountMax} guests` : 'Guest-friendly stay'}
                                {listing.bedrooms ? ` · ${listing.bedrooms} bedrooms` : ''}
                                {listing.beds ? ` · ${listing.beds} beds` : ''}
                                {listing.baths ? ` · ${listing.baths} baths` : ''}
                            </p>
                        </div>
                    </div>

                    <div className={styles.description}>
                        <p>{listing.description}</p>
                        {listing.host.bio && (
                            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
                                {listing.host.bio}
                            </p>
                        )}
                    </div>

                    <div className={styles.amenities}>
                        <h2>What this place offers</h2>
                        <div className={styles.amenityList}>
                            {listing.amenities.length > 0 ? listing.amenities.map((amenity) => {
                                const AmenityIcon = getAmenityIcon(amenity);
                                return (
                                    <div key={amenity} className={styles.amenityItem}>
                                        <AmenityIcon size={20} />
                                        {amenity}
                                    </div>
                                );
                            }) : (
                                <>
                                    <div className={styles.amenityItem}><Wifi size={20} /> Wifi</div>
                                    <div className={styles.amenityItem}><Car size={20} /> Free parking on premises</div>
                                    <div className={styles.amenityItem}><Utensils size={20} /> Kitchen</div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><BedDouble size={24} /></div>
                        <div className={styles.featureText}>
                            <h3>Booking details</h3>
                            <p>{formatPrice(listing.price, listing.currency)} per night, before fees and taxes.</p>
                        </div>
                    </div>

                    <div className={styles.feature}>
                        <div className={styles.featureIcon}><Bath size={24} /></div>
                        <div className={styles.featureText}>
                            <h3>{listing.baths ? `${listing.baths} bath${listing.baths > 1 ? 's' : ''}` : 'Comfortable bath setup'}</h3>
                            <p>Designed for easy check-in and a smooth stay.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.bookingCardWrapper}>
                    <div className={styles.bookingCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardPrice}>
                                {formatPrice(listing.price, listing.currency)} <span>night</span>
                            </div>
                            <div className={styles.cardMeta}>
                                <Star size={14} fill="currentColor" />
                                <span>{listing.rating}</span>
                                <span>·</span>
                                <span>{listing.reviewCount} reviews</span>
                            </div>
                        </div>

                        {bookingStatus && (
                            <div className={`${styles.statusBanner} ${bookingStatus === 'reserved' ? styles.statusSuccess : styles.statusInfo}`}>
                                {bookingStatus === 'reserved'
                                    ? 'Reservation placed. You can follow up from this screen later.'
                                    : 'Request sent. The host can review your dates and get back to you.'}
                            </div>
                        )}

                        {bookingError && (
                            <div className={styles.statusBanner}>
                                {bookingError}
                            </div>
                        )}

                        <div className={styles.bookingForm}>
                            <div className={styles.dateGrid}>
                                <label className={styles.formField}>
                                    <span>Check-in</span>
                                    <input
                                        type="date"
                                        value={checkIn}
                                        min={dateToInput(new Date())}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                    />
                                </label>
                                <label className={styles.formField}>
                                    <span>Checkout</span>
                                    <input
                                        type="date"
                                        value={checkOut}
                                        min={addDays(checkIn, 1)}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                    />
                                </label>
                            </div>

                            <label className={styles.formField}>
                                <span>Guests</span>
                                <select value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))}>
                                    {Array.from({ length: guestLimit }, (_, index) => index + 1).map((value) => (
                                        <option key={value} value={value}>
                                            {value} guest{value > 1 ? 's' : ''}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className={styles.modeToggle} role="tablist" aria-label="Booking mode">
                                <button
                                    type="button"
                                    className={bookingMode === 'reserve' ? styles.modeButtonActive : styles.modeButton}
                                    onClick={() => setBookingMode('reserve')}
                                >
                                    Reserve
                                </button>
                                <button
                                    type="button"
                                    className={bookingMode === 'request' ? styles.modeButtonActive : styles.modeButton}
                                    onClick={() => setBookingMode('request')}
                                >
                                    Request
                                </button>
                            </div>

                            <button
                                type="button"
                                className={styles.reserveButton}
                                onClick={() => handleBooking(bookingMode)}
                                disabled={nights <= 0}
                            >
                                {bookingActionLabel}
                            </button>

                            <div className={styles.bookingNote}>
                                {bookingHeadline}. You will not be charged yet.
                            </div>
                        </div>

                        {availabilityBlocks.length > 0 && (
                            <div className={styles.availabilityList}>
                                <div className={styles.availabilityTitle}>Blocked dates</div>
                                {availabilityBlocks.map((block) => (
                                    <div key={block.id} className={styles.availabilityRow}>
                                        <span className={block.status === 'booked' ? styles.availabilityBooked : styles.availabilityRestricted}>
                                            {block.status === 'booked' ? 'Booked' : 'Restricted'}
                                        </span>
                                        <span>{formatDateRange(block.startDate, block.endDate)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.priceBreakdown}>
                            <div className={styles.breakdownRow}>
                                <span>{formatPrice(listing.price, listing.currency)} x {nights || 0} nights</span>
                                <span>{formatPrice(subtotal, listing.currency)}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Cleaning fee</span>
                                <span>{formatPrice(cleaningFee, listing.currency)}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Service fee</span>
                                <span>{formatPrice(serviceFee, listing.currency)}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Taxes</span>
                                <span>{formatPrice(taxes, listing.currency)}</span>
                            </div>
                            <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
                                <span>Total</span>
                                <span>{formatPrice(total, listing.currency)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
