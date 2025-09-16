'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield,
  MapPin
} from 'lucide-react';
import api from '@/lib/api';
import { Product } from '@/lib/types';
import { useCart } from '@/components/cart/cart-context';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${params.id}`);
      setProduct(response.data);
      
      // Set default seller to the one with lowest price
      if (response.data.productSellers.length > 0) {
        const lowestPriceSeller = response.data.productSellers.reduce(
          (min: any, ps: any) => ps.price < min.price ? ps : min,
          response.data.productSellers[0]
        );
        setSelectedSeller(lowestPriceSeller.id);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (selectedSeller) {
      addToCart(selectedSeller, quantity);
    }
  };

  const handleCalculateDelivery = () => {
    if (pincode.length === 6) {
      // Mock delivery calculation
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3 + Math.floor(Math.random() * 4));
      setEstimatedDelivery(deliveryDate.toLocaleDateString());
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2">
            <div className="aspect-square bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="lg:w-1/2 space-y-4">
            <div className="h-8 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
            <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            </div>
            <div className="h-10 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
      </div>
    );
  }

  const selectedProductSeller = product.productSellers.find(ps => ps.id === selectedSeller);
  const availableSellers = product.productSellers.filter(ps => ps.stockQuantity > 0);

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Images */}
        <div className="lg:w-1/2">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
            <div className="text-muted-foreground">Product Image</div>
          </div>
          
          {/* Thumbnails */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square w-20 bg-muted rounded flex items-center justify-center">
                <div className="text-muted-foreground text-xs">Img {i}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="lg:w-1/2">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-muted-foreground">{product.brand}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(128 reviews)</span>
            </div>

            <div className="text-3xl font-bold">
              {selectedProductSeller ? `₹${selectedProductSeller.price.toFixed(2)}` : 'N/A'}
            </div>

            <div>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge>{product.category.name}</Badge>
              {selectedProductSeller && (
                <Badge variant="outline">
                  In Stock: {selectedProductSeller.stockQuantity}
                </Badge>
              )}
            </div>

            {/* Seller Selection */}
            {availableSellers.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Available Sellers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a seller" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSellers.map((ps) => (
                        <SelectItem key={ps.id} value={ps.id}>
                          <div className="flex justify-between w-full">
                            <span>{ps.seller.businessName}</span>
                            <span className="font-bold">₹{ps.price.toFixed(2)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Delivery Estimation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter pincode"
                      className="pl-8"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      maxLength={6}
                    />
                  </div>
                  <Button onClick={handleCalculateDelivery}>Check</Button>
                </div>
                
                {estimatedDelivery ? (
                  <div className="text-sm">
                    <p className="font-medium">Estimated Delivery:</p>
                    <p className="text-muted-foreground">{estimatedDelivery}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter your pincode to check delivery time
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!selectedProductSeller || quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="px-3 py-1">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(
                      selectedProductSeller?.stockQuantity || 1,
                      quantity + 1
                    ))}
                    disabled={!selectedProductSeller || quantity >= (selectedProductSeller?.stockQuantity || 0)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!selectedProductSeller || selectedProductSeller.stockQuantity === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Product Highlights */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm">Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm">Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Product Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>{product.description || 'No description available for this product.'}</p>
              
              {/* Additional product details */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Product Details</h3>
                  <ul className="space-y-1 text-sm">
                    <li><span className="font-medium">Category:</span> {product.category.name}</li>
                    <li><span className="font-medium">Brand:</span> {product.brand || 'N/A'}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Seller Information</h3>
                  <ul className="space-y-1 text-sm">
                    {availableSellers.map((ps) => (
                      <li key={ps.id}>
                        <span className="font-medium">{ps.seller.businessName}:</span> ₹{ps.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}