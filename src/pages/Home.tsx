import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from '../App.module.css'; // Reusing the grid styles from App module
import { Categories } from '../components/Categories';
import { ListingCard } from '../components/ListingCard';
import { api } from '../services/api';
import type { Listing } from '../types';

export const Home = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('q') || '';
    const categoryFilter = categoryParam && categoryParam !== 'icons' ? categoryParam : undefined;

    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    // Sync state with URL param
    const handleSelectCategory = (id: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('category', id);
        setSearchParams(params);
    };

    useEffect(() => {
        const loadListings = async () => {
            setLoading(true);
            try {
                const data = await api.fetchListings(categoryFilter, searchParam);
                setListings(data);
            } finally {
                setLoading(false);
            }
        };
        loadListings();
    }, [categoryFilter, searchParam]);

    return (
        <>
            <Categories
                selectedCategory={categoryParam}
                onSelectCategory={handleSelectCategory}
            />

            <main className={styles.mainContainer}>
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
                        <h2>No listings found for this category</h2>
                        <p>Try selecting a different category.</p>
                    </div>
                )}
            </main>
        </>
    );
};
