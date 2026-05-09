export interface User {
    id: string;
    name: string;
    avatarUrl: string;
    isSuperhost: boolean;
    role?: 'guest' | 'host' | 'admin';
    bio?: string;
}

export interface Location {
    id: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
}

export interface Review {
    id: string;
    userId: string;
    rating: number;
    comment: string;
    date: string;
}

export interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    currency?: string;
    rating: number;
    reviewCount: number;
    images: string[];
    location: Location;
    category: string;
    categoryLabel?: string;
    host: User;
    amenities: string[];
    isGuestFavorite: boolean;
    availableDates: string; // Simplification for UI: "Mar 1-6"
    guestCountMax?: number;
    bedrooms?: number;
    beds?: number;
    baths?: number;
    availabilitySummary?: string;
    hostId?: string;
}

export interface Category {
    id: string;
    label: string;
    slug?: string;
    iconName: string; // Mapped to Lucide icons
}

export interface Amenity {
    id: string;
    slug: string;
    label: string;
    iconName: string;
}

export interface Booking {
    id: string;
    listingId: string;
    guestId: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    subtotal: number;
    fees: number;
    taxes: number;
    total: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    createdAt: string;
}

export interface Favorite {
    userId: string;
    listingId: string;
    createdAt: string;
}

export interface CreateListingInput {
    title: string;
    description: string;
    pricePerNight: number;
    currency: string;
    categorySlug: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    guestCountMax: number;
    bedrooms: number;
    beds: number;
    baths: number;
    isGuestFavorite?: boolean;
    availabilitySummary?: string;
    imageUrls: string[];
    amenityLabels: string[];
}

export type ListingsResponse = Listing[];
export type CategoriesResponse = Category[];
