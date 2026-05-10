import type {
    CategoriesResponse,
    ListingsResponse,
    Listing,
    CreateListingInput,
    ListingFilters,
    ListingSortOption,
    UpdateListingInput,
    AvailabilityBlock,
    AvailabilityBlockStatus,
} from '../types';
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
    map_link?: string | null;
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

type SupabaseAvailabilityBlockRow = {
    id: string;
    listing_id: string;
    start_date: string;
    end_date: string;
    reason: string | null;
};

const LISTING_SELECT = `
    host_id,
    id,
    map_link,
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
        mapLink: row.map_link ?? undefined,
    };
};

const mapAvailabilityBlock = (row: SupabaseAvailabilityBlockRow): AvailabilityBlock => {
    const reason = row.reason?.trim().toLowerCase();
    const status: AvailabilityBlockStatus = reason === 'restricted' ? 'restricted' : 'booked';

    return {
        id: row.id,
        listingId: row.listing_id,
        startDate: row.start_date,
        endDate: row.end_date,
        status,
        reason: row.reason ?? undefined,
    };
};

const fetchSupabaseCategories = async (): Promise<CategoriesResponse> => {
    if (!supabase) {
        return [];
    }

    const { data, error } = await supabase
        .from('categories')
        .select('id, slug, label, icon_name, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error || !data) {
        return [];
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

const sortListingRows = (rows: SupabaseListingRow[], sort: ListingSortOption) => {
    const byPriceAsc = (a: SupabaseListingRow, b: SupabaseListingRow) => (a.price_per_night ?? 0) - (b.price_per_night ?? 0);
    const byPriceDesc = (a: SupabaseListingRow, b: SupabaseListingRow) => (b.price_per_night ?? 0) - (a.price_per_night ?? 0);
    const byRatingDesc = (a: SupabaseListingRow, b: SupabaseListingRow) => (b.rating ?? 0) - (a.rating ?? 0);

    const sorted = rows.slice();
    if (sort === 'price_asc') {
        sorted.sort(byPriceAsc);
    } else if (sort === 'price_desc') {
        sorted.sort(byPriceDesc);
    } else if (sort === 'rating_desc') {
        sorted.sort(byRatingDesc);
    }

    return sorted;
};

const fetchSupabaseListings = async (filters: ListingFilters = {}): Promise<ListingsResponse> => {
    if (!supabase) {
        return [];
    }

    const {
        category,
        search,
        sort = 'recommended',
        maxPrice,
        minPrice,
        guests,
        bedrooms,
        baths,
        guestFavoriteOnly,
    } = filters;

    const categoryId = category ? await resolveCategoryId(category) : null;
    if (category && category !== 'icons' && !categoryId) {
        return [];
    }

    let query = supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('is_active', true);

    if (categoryId) {
        query = query.eq('category_id', categoryId);
    }

    if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
        query = query.gte('price_per_night', minPrice);
    }

    if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
        query = query.lte('price_per_night', maxPrice);
    }

    if (typeof guests === 'number' && !Number.isNaN(guests)) {
        query = query.gte('guest_count_max', guests);
    }

    if (typeof bedrooms === 'number' && !Number.isNaN(bedrooms)) {
        query = query.gte('bedrooms', bedrooms);
    }

    if (typeof baths === 'number' && !Number.isNaN(baths)) {
        query = query.gte('baths', baths);
    }

    if (guestFavoriteOnly) {
        query = query.eq('is_guest_favorite', true);
    }

    if (search?.trim()) {
        const q = search.trim();
        query = query.or(`city.ilike.%${q}%,country.ilike.%${q}%,title.ilike.%${q}%`);
    }

    const { data, error } = await query.order(
        sort === 'price_asc'
            ? 'price_per_night'
            : sort === 'price_desc'
                ? 'price_per_night'
                : sort === 'rating_desc'
                    ? 'rating'
                    : 'created_at',
        { ascending: sort === 'price_asc' }
    );

    if (error || !data) {
        return [];
    }

    const rows = data as unknown as SupabaseListingRow[];
    return sort === 'price_desc' || sort === 'rating_desc'
        ? sortListingRows(rows, sort).map(mapListing)
        : rows.map(mapListing);
};

const fetchSupabaseListingById = async (id: string): Promise<Listing | undefined> => {
    if (!supabase) {
        return undefined;
    }

    const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('id', id)
        .maybeSingle();

    if (error || !data) {
        return undefined;
    }

    return mapListing(data as unknown as SupabaseListingRow);
};

const fetchSupabaseAvailabilityBlocks = async (listingId: string): Promise<AvailabilityBlock[]> => {
    if (!supabase) {
        return [];
    }

    const { data, error } = await supabase
        .from('availability_blocks')
        .select('id, listing_id, start_date, end_date, reason')
        .eq('listing_id', listingId)
        .order('start_date', { ascending: true });

    if (error || !data) {
        return [];
    }

    return (data as SupabaseAvailabilityBlockRow[]).map(mapAvailabilityBlock);
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

const persistListingImages = async (listingId: string, imageUrls: string[], altText: string) => {
    if (!supabase) {
        return;
    }

    await supabase.from('listing_images').delete().eq('listing_id', listingId);

    if (imageUrls.length > 0) {
        await supabase.from('listing_images').insert(
            imageUrls.map((imageUrl, index) => ({
                listing_id: listingId,
                image_url: imageUrl,
                sort_order: index,
                alt_text: altText,
            }))
        );
    }
};

const persistListingAmenities = async (listingId: string, amenityLabels: string[]) => {
    if (!supabase) {
        return;
    }

    await supabase.from('listing_amenities').delete().eq('listing_id', listingId);

    const amenityRows = await resolveAmenityIds(amenityLabels);
    if (amenityRows.length > 0) {
        await supabase.from('listing_amenities').insert(
            amenityRows.map((amenity) => ({
                listing_id: listingId,
                amenity_id: amenity.id,
            }))
        );
    }
};

export const api = {
    fetchCategories: (): Promise<CategoriesResponse> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                fetchSupabaseCategories()
                    .then(resolve)
                    .catch(() => resolve([]));
            }, DELAY_MS);
        });
    },

    fetchListings: (filters: ListingFilters = {}): Promise<ListingsResponse> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                fetchSupabaseListings(filters)
                    .then(resolve)
                    .catch(() => resolve([]));
            }, DELAY_MS);
        });
    },

    fetchListingById: (id: string): Promise<Listing | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                fetchSupabaseListingById(id)
                    .then(resolve)
                    .catch(() => resolve(undefined));
            }, DELAY_MS);
        });
    },

    fetchAvailabilityBlocks: (listingId: string): Promise<AvailabilityBlock[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                fetchSupabaseAvailabilityBlocks(listingId)
                    .then(resolve)
                    .catch(() => resolve([]));
            }, DELAY_MS);
        });
    },

    fetchHostListings: async (hostId: string): Promise<ListingsResponse> => {
        if (!supabase) {
            return [];
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
            throw new Error('Supabase is not configured');
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
                map_link: input.mapLink ?? null,
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

        await persistListingImages(listing.id, input.imageUrls, input.title);
        await persistListingAmenities(listing.id, input.amenityLabels);

        return mapListing(listing as unknown as SupabaseListingRow);
    },

    updateListing: async (hostId: string, listingId: string, input: UpdateListingInput): Promise<Listing> => {
        if (!supabase) {
            throw new Error('Supabase is not configured');
        }

        const category = await resolveCategoryRow(input.categorySlug);
        if (!category) {
            throw new Error('Category not found');
        }

        const { data: updated, error } = await supabase
            .from('listings')
            .update({
                category_id: category.id,
                title: input.title,
                description: input.description,
                price_per_night: input.pricePerNight,
                currency: input.currency,
                city: input.city,
                country: input.country,
                lat: input.lat,
                lng: input.lng,
                map_link: input.mapLink ?? null,
                guest_count_max: input.guestCountMax,
                bedrooms: input.bedrooms,
                beds: input.beds,
                baths: input.baths,
                availability_summary: input.availabilitySummary ?? null,
                host_id: hostId,
            })
            .eq('id', listingId)
            .eq('host_id', hostId)
            .select(LISTING_SELECT)
            .maybeSingle();

        if (error || !updated) {
            throw error ?? new Error('Unable to update listing');
        }

        if (input.imageUrls) {
            await persistListingImages(listingId, input.imageUrls, input.title);
        }

        await persistListingAmenities(listingId, input.amenityLabels);

        return mapListing(updated as unknown as SupabaseListingRow);
    },

    deleteListing: async (hostId: string, listingId: string): Promise<void> => {
        if (!supabase) {
            throw new Error('Supabase is not configured');
        }

        const { error } = await supabase
            .from('listings')
            .update({ is_active: false })
            .eq('id', listingId)
            .eq('host_id', hostId);

        if (error) {
            throw error;
        }
    },

    createAvailabilityBlock: async (
        input: { listingId: string; startDate: string; endDate: string; status: AvailabilityBlockStatus }
    ): Promise<AvailabilityBlock> => {
        if (!supabase) {
            throw new Error('Supabase is not configured');
        }

        const { data, error } = await supabase
            .from('availability_blocks')
            .insert({
                listing_id: input.listingId,
                start_date: input.startDate,
                end_date: input.endDate,
                reason: input.status,
            })
            .select('id, listing_id, start_date, end_date, reason')
            .single();

        if (error || !data) {
            throw error ?? new Error('Unable to create availability block');
        }

        return mapAvailabilityBlock(data as SupabaseAvailabilityBlockRow);
    },

    deleteAvailabilityBlock: async (blockId: string): Promise<void> => {
        if (!supabase) {
            throw new Error('Supabase is not configured');
        }

        const { error } = await supabase
            .from('availability_blocks')
            .delete()
            .eq('id', blockId);

        if (error) {
            throw error;
        }
    },
};
