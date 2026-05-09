import React, { useState } from 'react';
import styles from './Header.module.css';
import { Search, Globe, Menu, UserCircle, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Header: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchTerm.trim()) {
            params.set('q', searchTerm);
        } else {
            params.delete('q');
        }
        setIsSearchOpen(false);
        navigate(`/?${params.toString()}`);
    };

    const clearSearch = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSearchTerm('');
        const params = new URLSearchParams(searchParams);
        params.delete('q');
        navigate(`/?${params.toString()}`);
    }

    return (
        <header className={styles.header}>
            {/* Logo */}
            <div className={styles.logoContainer}>
                <a href="/" className={styles.logoText} onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                    {/* Nest Logo */}
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm5 15h-2v-6H9v6H7v-7.81l5-4.5 5 4.5V18z" />
                        <circle cx="12" cy="14" r="1.5" />
                    </svg>
                    Aevr
                </a>
            </div>

            {/* Search Bar - "Pill" */}
            <div className={styles.searchContainer}>
                {isSearchOpen ? (
                    <form onSubmit={handleSearch} className={styles.searchExpanded} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 8px' }}>
                        <input
                            type="text"
                            placeholder="Search destinations"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            style={{
                                border: 'none',
                                outline: 'none',
                                fontSize: '14px',
                                flex: 1,
                                fontWeight: 500,
                                background: 'transparent'
                            }}
                        />
                        <button type="submit" className={styles.searchIconContainer} style={{ width: '32px', height: '32px' }}>
                            <Search size={14} strokeWidth={3} />
                        </button>
                        <button type="button" onClick={() => setIsSearchOpen(false)} style={{ marginLeft: '8px', padding: '4px' }}>
                            <X size={16} />
                        </button>
                    </form>
                ) : (
                    <div className={styles.searchBar} onClick={() => setIsSearchOpen(true)}>
                        <div className={styles.searchButton}>
                            {searchTerm ? searchTerm : 'Anywhere'} {searchTerm && <button onClick={clearSearch} style={{ marginLeft: '4px', display: 'flex' }}><X size={12} /></button>}
                        </div>
                        <div className={styles.searchButton}>Any week</div>
                        <div className={styles.searchButton} style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>Add guests</div>
                        <div className={styles.searchIconContainer}>
                            <Search size={14} strokeWidth={3} />
                        </div>
                    </div>
                )}
            </div>

            {/* User Menu */}
            <div className={styles.userMenu}>
                <a href="/favorites" className={styles.hostLink} onClick={(e) => { e.preventDefault(); navigate('/favorites'); }}>
                    Favorites
                </a>
                <button className={styles.hostLink} onClick={() => navigate('/host')}>
                    Switch to hosting
                </button>
                <button className={styles.globeButton}>
                    <Globe size={18} />
                </button>
                <div className={styles.profileMenu}>
                    <Menu size={18} />
                    <div className={styles.avatar}>
                        <UserCircle size={24} fill="currentColor" className={styles.userIcon} />
                    </div>
                </div>
            </div>
        </header>
    );
};
