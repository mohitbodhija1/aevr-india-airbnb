import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, ChevronDown, X, Check, Search } from 'lucide-react';
import styles from './AdminProperties.module.css';
import { authService } from '../services/auth';
import { api } from '../services/api';
import { hasSupabaseConfig } from '../services/supabase';
import { SkeletonScreen } from '../components/SkeletonScreen';
import type { Listing } from '../types';

const formatPrice = (price: number, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(price);

/* ─── Host Option type ─────────────────────────────────────────────── */
type HostOption = { id: string; name: string; avatarUrl?: string };

/* ─── Assign Owner Panel ───────────────────────────────────────────── */
const AssignOwnerPanel = ({
    listing,
    hosts,
    onAssign,
    onClose,
    busy,
    successId,
    error,
}: {
    listing: Listing;
    hosts: HostOption[];
    onAssign: (listingId: string, hostId: string) => void;
    onClose: () => void;
    busy: boolean;
    successId: string | null;
    error: string | null;
}) => {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<HostOption | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.trim()
        ? hosts.filter((h) => h.name.toLowerCase().includes(query.toLowerCase()))
        : hosts;

    const isSuccess = successId === listing.id;

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className={styles.assignPanel}>
            <div className={styles.assignPanelHeader}>
                <span className={styles.assignPanelTitle}>
                    <UserCheck size={15} /> Assign Owner
                </span>
                <button type="button" className={styles.assignCloseBtn} onClick={onClose} aria-label="Close">
                    <X size={16} />
                </button>
            </div>

            <p className={styles.assignSubtitle}>
                Select a host to make them the owner of <strong>{listing.title}</strong>. They will see
                this property in their Host Dashboard immediately.
            </p>

            {/* Current owner */}
            <div className={styles.currentOwnerRow}>
                <span className={styles.currentOwnerLabel}>Current owner:</span>
                <span className={styles.currentOwnerValue}>{listing.host.name}</span>
            </div>

            {/* Search */}
            <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search hosts…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* Host list */}
            <div className={styles.hostList}>
                {filtered.length === 0 && (
                    <div className={styles.noHosts}>No approved hosts found.</div>
                )}
                {filtered.map((h) => (
                    <button
                        key={h.id}
                        type="button"
                        className={`${styles.hostOption} ${selected?.id === h.id ? styles.hostOptionSelected : ''}`}
                        onClick={() => setSelected(h)}
                    >
                        {h.avatarUrl ? (
                            <img src={h.avatarUrl} alt={h.name} className={styles.hostAvatar} />
                        ) : (
                            <span className={styles.hostAvatarFallback}>
                                {h.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                        <span className={styles.hostName}>{h.name}</span>
                        {selected?.id === h.id && <Check size={14} className={styles.hostCheck} />}
                    </button>
                ))}
            </div>

            {error && <div className={styles.assignError}>{error}</div>}
            {isSuccess && (
                <div className={styles.assignSuccess}>
                    <Check size={14} /> Owner updated successfully!
                </div>
            )}

            <div className={styles.assignActions}>
                <button
                    type="button"
                    className={styles.assignBtn}
                    disabled={!selected || busy}
                    onClick={() => selected && onAssign(listing.id, selected.id)}
                >
                    {busy ? 'Assigning…' : 'Assign Owner'}
                </button>
            </div>
        </div>
    );
};

/* ─── Property Card ────────────────────────────────────────────────── */
const PropertyCard = ({
    property,
    hosts,
    onDelist,
    onAssign,
    assignBusy,
    assignSuccess,
    assignError,
    delistBusy,
}: {
    property: Listing;
    hosts: HostOption[];
    onDelist: (id: string) => void;
    onAssign: (listingId: string, hostId: string) => void;
    assignBusy: string | null;  // listingId being assigned
    assignSuccess: string | null;
    assignError: string | null;
    delistBusy: boolean;
}) => {
    const [panelOpen, setPanelOpen] = useState(false);
    const isDelisted = property.isActive === false;
    const isBusy = delistBusy;

    return (
        <article className={styles.card}>
            <img
                src={property.images[0] ?? 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop'}
                alt={property.title}
                className={styles.image}
            />
            <div className={styles.body}>
                <div className={styles.top}>
                    <h3>{property.title}</h3>
                    <span className={isDelisted ? styles.badgeDelisted : styles.badgeActive}>
                        {isDelisted ? 'Delisted' : 'Active'}
                    </span>
                </div>
                <p>{property.location.city}, {property.location.country}</p>

                {/* Host info row */}
                <div className={styles.hostInfoRow}>
                    <div className={styles.hostInfoLeft}>
                        {property.host.avatarUrl ? (
                            <img src={property.host.avatarUrl} alt={property.host.name} className={styles.hostAvatarSm} />
                        ) : (
                            <span className={styles.hostAvatarSmFallback}>
                                {property.host.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                        <span className={styles.hostLineName}>{property.host.name}</span>
                    </div>
                    <button
                        type="button"
                        className={styles.assignToggleBtn}
                        onClick={() => setPanelOpen((v) => !v)}
                        title="Assign / change owner"
                    >
                        <UserCheck size={13} />
                        Assign
                        <ChevronDown size={12} style={{ transform: panelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                </div>

                {/* Assign panel — inline collapsible */}
                {panelOpen && (
                    <AssignOwnerPanel
                        listing={property}
                        hosts={hosts}
                        onAssign={(lid, hid) => {
                            onAssign(lid, hid);
                        }}
                        onClose={() => setPanelOpen(false)}
                        busy={assignBusy === property.id}
                        successId={assignSuccess}
                        error={assignBusy !== property.id ? null : assignError}
                    />
                )}

                <p className={styles.price}>{formatPrice(property.price, property.currency)} / night</p>
                <div className={styles.actions}>
                    <Link to={`/rooms/${property.id}`} className={styles.secondaryButton}>View</Link>
                    <Link to={`/host/edit/${property.id}`} className={styles.secondaryButton}>Edit</Link>
                    <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => onDelist(property.id)}
                        disabled={isBusy || isDelisted}
                    >
                        {isDelisted ? 'Already delisted' : isBusy ? 'Delisting…' : 'Delist'}
                    </button>
                </div>
            </div>
        </article>
    );
};

/* ═══════════════════════════════════════════════════════════════════════
   AdminProperties
════════════════════════════════════════════════════════════════════════ */
export const AdminProperties = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [properties, setProperties] = useState<Listing[]>([]);
    const [busyPropertyId, setBusyPropertyId] = useState<string | null>(null);

    // Assign-host state
    const [hosts, setHosts] = useState<HostOption[]>([]);
    const [assignBusyId, setAssignBusyId] = useState<string | null>(null);   // listing being assigned
    const [assignSuccessId, setAssignSuccessId] = useState<string | null>(null);
    const [assignError, setAssignError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!hasSupabaseConfig) {
                setError('Supabase auth is not configured yet.');
                setLoading(false);
                return;
            }

            const session = await authService.getSession();
            if (!session) {
                navigate('/host/auth', { replace: true });
                return;
            }

            const role = await api.getCurrentUserRole();
            if (role !== 'admin') {
                navigate(role === 'host' ? '/host' : '/', { replace: true });
                return;
            }

            const [listings, approvedHosts] = await Promise.all([
                api.fetchAdminListings(),
                api.adminFetchApprovedHosts(),
            ]);
            setProperties(listings);
            setHosts(approvedHosts);
            setLoading(false);
        };

        load();
    }, [navigate]);

    const reloadListings = async () => {
        const listings = await api.fetchAdminListings();
        setProperties(listings);
    };

    const handleDelist = async (listingId: string) => {
        if (!window.confirm('Delist this property? It will no longer be visible to guests.')) {
            return;
        }

        try {
            setBusyPropertyId(listingId);
            setError(null);
            await api.adminDelistListing(listingId);
            await reloadListings();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to delist property');
        } finally {
            setBusyPropertyId(null);
        }
    };

    const handleAssignHost = async (listingId: string, newHostId: string) => {
        setAssignBusyId(listingId);
        setAssignSuccessId(null);
        setAssignError(null);

        try {
            await api.adminAssignListingHost(listingId, newHostId);
            setAssignSuccessId(listingId);
            // Refresh listing so the UI reflects the new host name
            await reloadListings();
        } catch (err) {
            setAssignError(err instanceof Error ? err.message : 'Unable to assign owner');
        } finally {
            setAssignBusyId(null);
        }
    };

    if (loading) {
        return <div className={styles.page}><SkeletonScreen variant="admin-table" count={6} /></div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.panel}>
                <div className={styles.headerRow}>
                    <div>
                        <h1>Admin Properties</h1>
                        <p>View all properties, assign owners, delist active ones, and add new inventory.</p>
                    </div>
                    <Link to="/host/new" className={styles.primaryButton}>Add Property</Link>
                </div>

                {error && <div className={styles.errorBox}>{error}</div>}

                <div className={styles.metaRow}>
                    <span><strong>{properties.length}</strong> total properties</span>
                    <span><strong>{properties.filter((p) => p.hostId).length}</strong> with assigned host</span>
                </div>

                {properties.length > 0 ? (
                    <div className={styles.grid}>
                        {properties.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                hosts={hosts}
                                onDelist={handleDelist}
                                onAssign={handleAssignHost}
                                assignBusy={assignBusyId}
                                assignSuccess={assignSuccessId}
                                assignError={assignError}
                                delistBusy={busyPropertyId === property.id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <h3>No properties found</h3>
                        <p>Use Add Property to publish the first listing.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
