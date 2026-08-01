import axiosInstance from '@/api/axiosInstance';
import type { WishlistItem } from '@/store/slices/wishlistSlice';

export interface WishlistResponse {
  items: WishlistItem[];
  count: number;
}

const wishlistService = {
  async getWishlist(): Promise<WishlistResponse> {
    const response = await axiosInstance.get('/wishlist');
    return response.data.data;
  },

  async addToWishlist(productId: number): Promise<WishlistItem> {
    const response = await axiosInstance.post('/wishlist', { productId });
    return response.data.data;
  },

  async removeFromWishlist(productId: number): Promise<void> {
    await axiosInstance.delete(`/wishlist/${productId}`);
  },

  async getWishlistCount(): Promise<number> {
    const response = await axiosInstance.get('/wishlist/count');
    return response.data.data?.count ?? response.data.data ?? 0;
  },

  async moveToCart(productId: number): Promise<void> {
    await axiosInstance.post(`/wishlist/${productId}/move-to-cart`);
  },
};

export default wishlistService;
