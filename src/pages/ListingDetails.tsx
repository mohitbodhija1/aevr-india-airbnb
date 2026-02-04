import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ListingDetails.module.css';
import { api } from '../services/api';
import { favoritesService } from '../services/favorites';
import type { Listing } from '../types';
import { Star, Heart, Share, Grid, Key, Calendar, MapPin, Wifi, Car, Utensils } from 'lucide-react';

export const ListingDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<Listing | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);

    // Reservation State
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guestCount, setGuestCount] = useState(1);

    useEffect(() => {
        // Set default dates (tomorrow and 5 days after)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(tomorrow);
        nextWeek.setDate(nextWeek.getDate() + 5);

        setCheckIn(tomorrow.toISOString().split('T')[0]);
        setCheckOut(nextWeek.toISOString().split('T')[0]);
    }, []);

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

    const toggleFavorite = () => {
        if (!listing) return;
        favoritesService.toggleFavorite(listing.id);
        setIsFavorited(!isFavorited);
    };

    const handleReserve = () => {
        alert(`Reservation confirmed!\n\nListing: ${listing?.title}\nDates: ${checkIn} to ${checkOut}\nGuests: ${guestCount}\nTotal: ₹${calculateTotal()}`);
    };

    // Price Calculation Logic
    const calculateNights = () => {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const timeDiff = end.getTime() - start.getTime();
        const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return days > 0 ? days : 0;
    };

    const calculateTotal = () => {
        if (!listing) return 0;
        const nights = calculateNights();
        const basePrice = listing.price * nights;
        const cleaningFee = 60;
        const serviceFee = 80;
        return basePrice + cleaningFee + serviceFee;
    };

    const nights = calculateNights();
    const subtotal = listing ? listing.price * nights : 0;
    const cleaningFee = 60;
    const serviceFee = 80;
    const total = subtotal + cleaningFee + serviceFee;

    if (loading) {
        return <div className={styles.container} style={{ height: '80vh' }} />;
    }

    if (!listing) {
        return <div className={styles.container}>Listing not found</div>;
    }

    return (
        <div className={styles.container}>
            {/* Heading */}
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

            {/* Photo Grid */}
            <div className={styles.photoGrid}>
                {/* Main large photo */}
                <div className={styles.mainPhoto}>
                    <img src={listing.images[0]} alt="Main" className={styles.photo} />
                </div>
                {/* Side photos */}
                <div className={styles.sidePhotos}>
                    {listing.images.slice(1, 5).map((img, idx) => (
                        <img key={idx} src={img} alt={`View ${idx}`} className={styles.photo} />
                    ))}
                </div>
                <button className={styles.showAllButton}>
                    <Grid size={16} /> Show all photos
                </button>
            </div>

            {/* Content Grid */}
            <div className={styles.contentGrid}>
                {/* Left Column */}
                <div className={styles.leftColumn}>
                    <div className={styles.hostSection}>
                        <div className={styles.hostInfo}>
                            <h2>{listing.category === 'farms' ? 'Farm stay' : `Hosted by ${listing.host.name}`}</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                {listing.host.isSuperhost && 'Superhost · '}
                                4 guests · 2 bedrooms · 2 beds · 1 bath
                            </p>
                        </div>
                        <div className={styles.hostAvatar}>
                            <img src={listing.host.avatarUrl} alt={listing.host.name} />
                        </div>
                    </div>

                    {/* Features */}
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
                            <h3>Free cancellation for 48 hours.</h3>
                        </div>
                    </div>

                    {/* Description */}
                    <div className={styles.description}>
                        <p>{listing.description}</p>
                        <p style={{ marginTop: '16px' }}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                    </div>

                    {/* Amenities */}
                    <div className={styles.amenities}>
                        <h2>What this place offers</h2>
                        <div className={styles.amenityList}>
                            <div className={styles.amenityItem}><Wifi size={20} /> Wifi</div>
                            <div className={styles.amenityItem}><Car size={20} /> Free parking on premises</div>
                            <div className={styles.amenityItem}><Utensils size={20} /> Kitchen</div>
                            {/* Dynamically mapped from data but hardcoded for now for visuals */}
                            {listing.amenities.map(a => (
                                <div key={a} className={styles.amenityItem}><MapPin size={20} /> {a}</div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Booking Card */}
                <div className={styles.bookingCardWrapper}>
                    <div className={styles.bookingCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardPrice}>
                                ₹{listing.price} <span style={{ fontSize: '1rem', fontWeight: 400 }}>night</span>
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
                                        onClick={() => setGuestCount(Math.min(10, guestCount + 1))}
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
                                    <span style={{ textDecoration: 'underline' }}>₹{listing.price} x {nights} nights</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                    <span style={{ textDecoration: 'underline' }}>Cleaning fee</span>
                                    <span>₹{cleaningFee}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                    <span style={{ textDecoration: 'underline' }}>Aevr service fee</span>
                                    <span>₹{serviceFee}</span>
                                </div>
                                <div style={{ borderTop: '1px solid var(--color-gray-100)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                    <span>Total before taxes</span>
                                    <span>₹{total}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
