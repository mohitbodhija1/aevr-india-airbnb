import { CATEGORIES, LISTINGS } from '../mock/data';
import type { CategoriesResponse, ListingsResponse, Listing, CreateListingInput } from '../types';
import { supabase } from './supabase';

const DELAY_MS = 800;

type JoinedEntity<T> = T | T[] | null;

type SupabaseCategoryRow = {
    id: string;
    slug: string;
    label: string;
    icon_name: string;
    is_active: boolean;
};

type SupabaseListingRow = {
    id: string;
    host_id?: string;
    title: string;
    description: string;
    price_per_night: number;
    currency: string;
    rating: number | null;
    review_count: number | null;
    is_guest_favorite: boolean;
    availability_summary: string | null;
    city: string;
    country: string;
    lat: number;
    lng: number;
    guest_count_max: number | null;
    bedrooms: number | null;
    beds: number | null;
    baths: number | null;
    is_active: boolean;
    category: JoinedEntity<{
        id: string;
        slug: string;
        label: string;
        icon_name: string;
    }>;
    host: JoinedEntity<{
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        is_superhost: boolean;
        bio: string | null;
    }>;
    listing_images: Array<{
        image_url: string;
        sort_order: number | null;
        alt_text: string | null;
    }> | null;
    listing_amenities: Array<{
        amenity: {
            label: string;
        } | null;
    }> | null;
};

const LISTING_SELECT = `
    host_id,
    id,
    title,
    description,
    price_per_night,
    currency,
    rating,
    review_count,
    is_guest_favorite,
    availability_summary,
    city,
    country,
    lat,
    lng,
    guest_count_max,
    bedrooms,
    beds,
    baths,
    is_active,
    category:categories (
        id,
        slug,
        label,
        icon_name
    ),
    host:profiles!host_id (
        id,
        full_name,
        avatar_url,
        is_superhost,
        bio
    ),
    listing_images (
        image_url,
        sort_order,
        alt_text
    ),
    listing_amenities (
        amenity:amenities (
            label
        )
    )
`;

const first = <T,>(value: JoinedEntity<T>): T | null => {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value;
};

const toFallbackListing = (item: Listing): Listing => item;

const buildFallbackListings = (category?: string, search?: string): ListingsResponse => {
    let filtered = LISTINGS.map(toFallbackListing);

    if (category && category !== 'icons') {
        filtered = filtered.filter((item) => item.category === category);
    }

    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((item) =>
            item.location.city.toLowerCase().includes(q) ||
            item.location.country.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q)
        );
    }

    return filtered;
};

const mapListing = (row: SupabaseListingRow): Listing => {
    const category = first(row.category);
    const host = first(row.host);
    const images = (row.listing_images ?? [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((image) => image.image_url);

    const amenities = (row.listing_amenities ?? [])
        .map((entry) => entry.amenity?.label)
        .filter((label): label is string => Boolean(label));

    return {
        id: row.id,
        hostId: row.host_id,
        title: row.title,
        description: row.description,
        price: row.price_per_night,
        currency: row.currency,
        rating: row.rating ?? 0,
        reviewCount: row.review_count ?? 0,
        images,
        location: {
            id: row.id,
            city: row.city,
            country: row.country,
            lat: row.lat,
            lng: row.lng,
        },
        category: category?.slug ?? 'icons',
        categoryLabel: category?.label ?? undefined,
        host: {
            id: host?.id ?? '',
            name: host?.full_name ?? 'Host',
            avatarUrl: host?.avatar_url ?? '',
            isSuperhost: host?.is_superhost ?? false,
            bio: host?.bio ?? undefined,
        },
        amenities,
        isGuestFavorite: row.is_guest_favorite,
        availableDates: row.availability_summary ?? 'Flexible dates',
        guestCountMax: row.guest_count_max ?? undefined,
        bedrooms: row.bedrooms ?? undefined,
        beds: row.beds ?? undefined,
        baths: row.baths ?? undefined,
        availabilitySummary: row.availability_summary ?? undefined,
    };
};

const fetchSupabaseCategories = async (): Promise<CategoriesResponse> => {
    if (!supabase) {
        return CATEGORIES;
    }

    const { data, error } = await supabase
        .from('categories')
        .select('id, slug, label, icon_name, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error || !data) {
        return CATEGORIES;
    }

    return (data as SupabaseCategoryRow[]).map((category) => ({
        id: category.slug,
        slug: category.slug,
        label: category.label,
        iconName: category.icon_name,
    }));
};

const resolveCategoryId = async (slug: string): Promise<string | null> => {
    if (!supabase || slug === 'icons') {
        return null;
    }

    const { data, error } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

    if (error || !data) {
        return null;
    }

    return data.id;
};

const fetchSupabaseListings = async (category?: string, search?: string): Promise<ListingsResponse> => {
    if (!supabase) {
        return buildFallbackListings(category, search);
    }

    const categoryId = category ? await resolveCategoryId(category) : null;
    if (category && category !== 'icons' && !categoryId) {
        return buildFallbackListings(category, search);
    }

    let query = supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('is_active', true);

    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }

    if (search?.trim()) {
        const q = search.trim();
        query = query.or(`city.ilike.%${q}%,country.ilike.%${q}%,title.ilike.%${q}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) {
        return buildFallbackListings(category, search);
    }

    return (data as unknown as SupabaseListingRow[]).map(mapListing);
};

const fetchSupabaseListingById = async (id: string): Promise<Listing | undefined> => {
    if (!supabase) {
        return LISTINGS.find((item) => item.id === id);
    }

    const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('id', id)
        .maybeSingle();

    if (error || !data) {
        return LISTINGS.find((item) => item.id === id);
    }

    return mapListing(data as unknown as SupabaseListingRow);
};

const resolveCategoryRow = async (slug: string): Promise<{ id: string; slug: string; label: string; icon_name: string } | null> => {
    if (!supabase || !slug) {
        return null;
    }

    const { data, error } = await supabase
        .from('categories')
        .select('id, slug, label, icon_name')
        .eq('slug', slug)
        .maybeSingle();

    if (error || !data) {
        return null;
    }

    return data;
};

const resolveAmenityIds = async (labels: string[]) => {
    if (!supabase || labels.length === 0) {
        return [];
    }

    const normalized = labels.map((label) => label.trim().toLowerCase()).filter(Boolean);
    if (normalized.length === 0) {
        return [];
    }

    const { data } = await supabase
        .from('amenities')
        .select('id, label, slug')
        .eq('is_active', true);

    return (data ?? []).filter((amenity) => {
        const label = amenity.label.trim().toLowerCase();
        const slug = amenity.slug.trim().toLowerCase();
        return normalized.includes(label) || normalized.includes(slug);
    });
};

export const api = {
    fetchCategories: (): Promise<CategoriesResponse> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                fetchSupabaseCategories()
                    .then(resolve)
                    .catch(() => resolve(CATEGORIES));
            }, DELAY_MS);
        });
    },

    fetchListings: (category?: string, search?: string): Promise<ListingsResponse> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                fetchSupabaseListings(category, search)
                    .then(resolve)
                    .catch(() => resolve(buildFallbackListings(category, search)));
            }, DELAY_MS);
        });
    },

    fetchListingById: (id: string): Promise<Listing | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                fetchSupabaseListingById(id)
                    .then(resolve)
                    .catch(() => resolve(LISTINGS.find((item) => item.id === id)));
            }, DELAY_MS);
        });
    },

    fetchHostListings: async (hostId: string): Promise<ListingsResponse> => {
        if (!supabase) {
            return LISTINGS.map((item) => ({
                ...item,
                hostId,
            }));
        }

        const { data, error } = await supabase
            .from('listings')
            .select(LISTING_SELECT)
            .eq('host_id', hostId)
            .order('created_at', { ascending: false });

        if (error || !data) {
            return [];
        }

        return (data as unknown as SupabaseListingRow[]).map(mapListing);
    },

    createListing: async (hostId: string, input: CreateListingInput): Promise<Listing> => {
        if (!supabase) {
            return {
                ...LISTINGS[0],
                id: crypto.randomUUID(),
                hostId,
                title: input.title,
                description: input.description,
                price: input.pricePerNight,
                currency: input.currency,
                images: input.imageUrls.length > 0 ? input.imageUrls : LISTINGS[0].images,
                location: {
                    id: crypto.randomUUID(),
                    city: input.city,
                    country: input.country,
                    lat: input.lat,
                    lng: input.lng,
                },
                category: input.categorySlug,
                categoryLabel: input.categorySlug,
                amenities: input.amenityLabels,
                isGuestFavorite: Boolean(input.isGuestFavorite),
                availableDates: input.availabilitySummary ?? 'Flexible dates',
                guestCountMax: input.guestCountMax,
                bedrooms: input.bedrooms,
                beds: input.beds,
                baths: input.baths,
                availabilitySummary: input.availabilitySummary,
                rating: 0,
                reviewCount: 0,
            };
        }

        const category = await resolveCategoryRow(input.categorySlug);
        if (!category) {
            throw new Error('Category not found');
        }

        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .insert({
                host_id: hostId,
                category_id: category.id,
                title: input.title,
                description: input.description,
                price_per_night: input.pricePerNight,
                currency: input.currency,
                city: input.city,
                country: input.country,
                lat: input.lat,
                lng: input.lng,
                guest_count_max: input.guestCountMax,
                bedrooms: input.bedrooms,
                beds: input.beds,
                baths: input.baths,
                is_guest_favorite: input.isGuestFavorite ?? false,
                availability_summary: input.availabilitySummary ?? null,
            })
            .select(LISTING_SELECT)
            .single();

        if (listingError || !listing) {
            throw listingError ?? new Error('Unable to create listing');
        }

        if (input.imageUrls.length > 0) {
            await supabase.from('listing_images').insert(
                input.imageUrls.map((imageUrl, index) => ({
                    listing_id: listing.id,
                    image_url: imageUrl,
                    sort_order: index,
                    alt_text: input.title,
                }))
            );
        }

        const amenityRows = await resolveAmenityIds(input.amenityLabels);
        if (amenityRows.length > 0) {
            await supabase.from('listing_amenities').insert(
                amenityRows.map((amenity) => ({
                    listing_id: listing.id,
                    amenity_id: amenity.id,
                }))
            );
        }

        return mapListing(listing as unknown as SupabaseListingRow);
    },
};
