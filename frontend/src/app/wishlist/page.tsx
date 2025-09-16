'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ShoppingCart,
  X
} from 'lucide-react';
import api from '@/lib/api';
import { useCart } from '@/components/cart/cart-context';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    seller: {
      businessName: string;
    };
  };
  addedAt: string;
}

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/wishlist');
      setWishlistItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistItemId: string) => {
    try {
      await api.delete(`/wishlist/${wishlistItemId}`);
      setWishlistItems(wishlistItems.filter(item => item.id !== wishlistItemId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      // First, get product details to find the best seller
      const productResponse = await api.get(`/products/${productId}`);
      const product = productResponse.data;
      
      // Get the seller with lowest price
      const lowestPriceSeller = product.productSellers.reduce(
        (min: any, ps: any) => ps.price < min.price ? ps : min,
        product.productSellers[0]
      );
      
      // Add to cart
      await addToCart(lowestPriceSeller.id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-4">
                <div className="aspect-square bg-muted rounded-md mb-2 animate-pulse"></div>
                <div className="h-4 bg-muted rounded mb-2 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-3 bg-muted rounded mb-2 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <div className="h-8 bg-muted rounded w-full animate-pulse"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-6">
            Start adding products to your wishlist to save them for later
          </p>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <p className="text-muted-foreground">{wishlistItems.length} items</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => (
          <Card key={item.id} className="h-full flex flex-col">
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center w-full">
                  <div className="text-muted-foreground">Product Image</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromWishlist(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-base line-clamp-2">{item.product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {item.product.seller.businessName}
              </p>
            </CardHeader>
            
            <CardContent className="p-4 pt-0 flex-grow">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">₹{item.product.price.toFixed(2)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.product.description}
              </p>
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <Button 
                className="w-full"
                onClick={() => handleAddToCart(item.product.id)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}