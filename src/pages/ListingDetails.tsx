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
import type { Listing } from '../types';

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

export const ListingDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<Listing | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);

    const [checkIn, setCheckIn] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [checkOut, setCheckOut] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(tomorrow);
        nextWeek.setDate(nextWeek.getDate() + 5);
        return nextWeek.toISOString().split('T')[0];
    });
    const [guestCount, setGuestCount] = useState(1);

    useEffect(() => {
        if (!id) return;

        const load = async () => {
            setLoading(true);
            const data = await api.fetchListingById(id);
            setListing(data);
            setIsFavorited(favoritesService.isFavorite(id));
            setLoading(false);
        };

        load();
    }, [id]);

    const nights = useMemo(() => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const timeDiff = end.getTime() - start.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return days > 0 ? days : 0;
    }, [checkIn, checkOut]);

    const subtotal = listing ? listing.price * nights : 0;
    const cleaningFee = 60;
    const serviceFee = 80;
    const total = subtotal + cleaningFee + serviceFee;
    const coverImage = listing?.images[0] ?? 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop';

    const toggleFavorite = () => {
        if (!listing) return;
        favoritesService.toggleFavorite(listing.id);
        setIsFavorited(!isFavorited);
    };

    const handleReserve = () => {
        alert(
            `Reservation confirmed!\n\nListing: ${listing?.title}\nDates: ${checkIn} to ${checkOut}\nGuests: ${guestCount}\nTotal: ${formatPrice(total, listing?.currency)}`
        );
    };

    if (loading) {
        return <div className={styles.container} style={{ height: '80vh' }} />;
    }

    if (!listing) {
        return <div className={styles.container}>Listing not found</div>;
    }

    const guestLimit = listing.guestCountMax ?? 10;
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
                                {formatPrice(listing.price, listing.currency)} <span style={{ fontSize: '1rem', fontWeight: 400 }}>night</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                                <Star size={14} fill="currentColor" />
                                <span style={{ fontWeight: 600 }}>{listing.rating}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>·</span>
                                <span style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>{listing.reviewCount} reviews</span>
                            </div>
                        </div>

                        <div style={{
                            border: '1px solid var(--color-gray-400)',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            overflow: 'hidden'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--color-gray-400)' }}>
                                <div style={{ padding: '10px 12px', borderRight: '1px solid var(--color-gray-400)', position: 'relative' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Check-in</div>
                                    <input
                                        type="date"
                                        value={checkIn}
                                        onChange={(e) => setCheckIn(e.target.value)}
                                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div style={{ padding: '10px 12px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Checkout</div>
                                    <input
                                        type="date"
                                        value={checkOut}
                                        onChange={(e) => setCheckOut(e.target.value)}
                                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontFamily: 'inherit', color: 'var(--text-primary)' }}
                                    />
                                </div>
                            </div>
                            <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Guests</div>
                                    <div style={{ fontSize: '14px' }}>{guestCount} guest{guestCount !== 1 && 's'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                                        style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--color-gray-400)', background: 'white', cursor: 'pointer' }}
                                    >-</button>
                                    <button
                                        onClick={() => setGuestCount(Math.min(guestLimit, guestCount + 1))}
                                        style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--color-gray-400)', background: 'white', cursor: 'pointer' }}
                                    >+</button>
                                </div>
                            </div>
                        </div>

                        <button className={styles.reserveButton} onClick={handleReserve} disabled={nights <= 0}>
                            Reserve
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            You won't be charged yet
                        </div>

                        {nights > 0 && (
                            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                    <span style={{ textDecoration: 'underline' }}>{formatPrice(listing.price, listing.currency)} x {nights} nights</span>
                                    <span>{formatPrice(subtotal, listing.currency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                    <span style={{ textDecoration: 'underline' }}>Cleaning fee</span>
                                    <span>{formatPrice(cleaningFee, listing.currency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                    <span style={{ textDecoration: 'underline' }}>Aevr service fee</span>
                                    <span>{formatPrice(serviceFee, listing.currency)}</span>
                                </div>
                                <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                    <span>Total before taxes</span>
                                    <span>{formatPrice(total, listing.currency)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
