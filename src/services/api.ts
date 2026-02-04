import { CATEGORIES, LISTINGS } from '../mock/data';
import type { CategoriesResponse, ListingsResponse, Listing } from '../types';

const DELAY_MS = 800;

export const api = {
    fetchCategories: (): Promise<CategoriesResponse> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(CATEGORIES);
            }, DELAY_MS);
        });
    },

    fetchListings: (category?: string, search?: string): Promise<ListingsResponse> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                let filtered = LISTINGS;

                if (category && category !== 'icons') { // 'icons' usually means 'all' or default in this mock
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

                resolve(filtered);
            }, DELAY_MS);
        });
    },

    fetchListingById: (id: string): Promise<Listing | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const listing = LISTINGS.find((item) => item.id === id);
                resolve(listing);
            }, DELAY_MS);
        });
    },
};
