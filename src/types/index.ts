export interface User {
    id: string;
    name: string;
    avatarUrl: string;
    isSuperhost: boolean;
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
    rating: number;
    reviewCount: number;
    images: string[];
    location: Location;
    category: string;
    host: User;
    amenities: string[];
    isGuestFavorite: boolean;
    availableDates: string; // Simplification for UI: "Mar 1-6"
}

export interface Category {
    id: string;
    label: string;
    iconName: string; // Mapped to Lucide icons
}

export type ListingsResponse = Listing[];
export type CategoriesResponse = Category[];
