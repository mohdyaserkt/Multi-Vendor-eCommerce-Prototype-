'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/lib/types';
import { ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productSellerId: string) => void;
  onAddToWishlist?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart, onAddToWishlist }: ProductCardProps) {
  // Get the lowest price seller
  const lowestPriceSeller = product.productSellers
    .filter(ps => ps.stockQuantity > 0)
    .sort((a, b) => a.price - b.price)[0];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4">
        <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
          <div className="text-muted-foreground">Product Image</div>
          
        </div>
        <h3 className="font-semibold line-clamp-2">{product.name}</h3>
        {product.brand && (
          <p className="text-sm text-muted-foreground">{product.brand}</p>
        )}
      </CardHeader>
      
      <CardContent className="p-4 flex-grow">
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">{product.category.name}</Badge>
          {!product.adminApproved && (
            <Badge variant="outline">Pending Approval</Badge>
          )}
        </div>
        
        {lowestPriceSeller ? (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold">
                ₹{lowestPriceSeller.price.toFixed(2)}
              </span>
              {product.productSellers.length > 1 && (
                <span className="text-sm text-muted-foreground">
                  from {product.productSellers.length} sellers
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Seller: {lowestPriceSeller.seller.businessName}
            </div>
            <div className="text-sm text-muted-foreground">
              In stock: {lowestPriceSeller.stockQuantity}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Out of stock
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2">
        {lowestPriceSeller && (
          <Button 
            className="flex-1"
            size="sm"
            onClick={() => onAddToCart?.(lowestPriceSeller.id)}
            disabled={lowestPriceSeller.stockQuantity === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onAddToWishlist?.(product.id)}
        >
          <Heart className="h-4 w-4" />
          <span className="sr-only">Add to wishlist</span>
        </Button>
      </CardFooter>
    </Card>
  );
}