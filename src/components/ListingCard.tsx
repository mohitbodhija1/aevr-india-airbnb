import React, { useState, useEffect } from 'react';
import styles from './ListingCard.module.css';
import type { Listing } from '../types';
import { Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { favoritesService } from '../services/favorites';

interface ListingCardProps {
    listing: Listing;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(favoritesService.isFavorite(listing.id));

    useEffect(() => {
        // Sync with external updates (e.g. from other tabs or components)
        const handleUpdate = () => {
            setIsFavorited(favoritesService.isFavorite(listing.id));
        };
        window.addEventListener('favorites-updated', handleUpdate);
        return () => window.removeEventListener('favorites-updated', handleUpdate);
    }, [listing.id]);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    };

    const toggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent link click
        favoritesService.toggleFavorite(listing.id);
        // State updates via event listener, but optmistic update helps responsivenss
        setIsFavorited(!isFavorited);
    };

    return (
        <div className={styles.card}>
            <Link to={`/rooms/${listing.id}`} style={{ display: 'contents', color: 'inherit' }}>
                <div className={styles.imageContainer}>
                    <img
                        src={listing.images[currentImageIndex]}
                        alt={listing.title}
                        className={styles.image}
                    />

                    {/* Navigation Arrows */}
                    {listing.images.length > 1 && (
                        <>
                            <button
                                className={`${styles.navButton} ${styles.prevButton}`}
                                onClick={prevImage}
                                style={{ display: currentImageIndex === 0 ? 'none' : 'flex' }} // Airbnb style: hide prev on first image
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button className={`${styles.navButton} ${styles.nextButton}`} onClick={nextImage}>
                                <ChevronRight size={16} />
                            </button>
                        </>
                    )}

                    {/* Guest Favorite Badge */}
                    {listing.isGuestFavorite && (
                        <div className={styles.guestFavorite}>Guest favorite</div>
                    )}

                    {/* Heart Icon */}
                    <button
                        className={`${styles.heartButton} ${isFavorited ? styles.favorited : ''}`}
                        onClick={toggleFavorite}
                        style={{ zIndex: 4 }}
                    >
                        <Heart size={24} fill={isFavorited ? 'currentColor' : 'rgba(0,0,0,0.5)'} />
                    </button>

                    {/* Dots */}
                    {listing.images.length > 1 && (
                        <div className={styles.dotsContainer}>
                            {listing.images.slice(0, 5).map((_, idx) => ( // Limit dots to 5 for aesthetics if many images
                                <div
                                    key={idx}
                                    className={`${styles.dot} ${idx === currentImageIndex ? styles.active : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.info}>
                    <div className={styles.headerRow}>
                        <div className={styles.title}>{listing.location.city}, {listing.location.country}</div>
                        <div className={styles.rating}>
                            <Star size={14} fill="currentColor" />
                            <span>{listing.rating}</span>
                        </div>
                    </div>
                    <div className={styles.subtitle}>{listing.category === 'farms' ? 'Farm stay' : 'Stay with ' + listing.host.name}</div>
                    <div className={styles.dates}>{listing.availableDates}</div>
                    <div className={styles.priceRow}>
                        <div className={styles.price}>₹{listing.price}</div>
                        <div className={styles.period}>night</div>
                    </div>
                </div>
            </Link>
        </div>
    );
};
