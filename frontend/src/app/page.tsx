'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Search, 
  ShoppingCart,
  TrendingUp,
  Star,
  Filter
} from 'lucide-react';
import api from '@/lib/api';
import { Product } from '@/lib/types';
import { useCart } from '@/components/cart/cart-context';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products?limit=8');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (productSellerId: string) => {
    addToCart(productSellerId, 1);
  };

  const getLowestPriceSeller = (product: Product) => {
    const activeSellers = product.productSellers.filter(ps => ps.stockQuantity > 0);
    if (activeSellers.length === 0) return null;
    return activeSellers.reduce((min, ps) => ps.price < min.price ? ps : min, activeSellers[0]);
  };

  return (
    <div className="w-full flex justify-center">
      <div className="container py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Welcome to MultiVendor Store
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover amazing products from multiple sellers at competitive
            prices
          </p>
          <div className="max-w-2xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </div>

        {/* Featured Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((category) => (
              <Button key={category.id} variant="outline" asChild>
                <Link href={`/products?category=${category.id}`}>
                  {category.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            </div>

            <div className="flex gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low</SelectItem>
                  <SelectItem value="price-high">Price: High</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Featured Products */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Button variant="outline" asChild>
              <Link href="/products">View All Products</Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="h-full">
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const lowestPriceSeller = getLowestPriceSeller(product);
                return (
                  <Card key={product.id} className="h-full flex flex-col">
                    <CardHeader className="p-4">
                      <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                        <div className="text-muted-foreground">
                          Product Image
                        </div>
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {product.brand}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">
                          {product.category.name}
                        </Badge>
                        {!product.adminApproved && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>

                      {lowestPriceSeller ? (
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold">
                              ₹{lowestPriceSeller.price.toFixed(2)}
                            </span>
                            {product.productSellers.length > 1 && (
                              <span className="text-xs text-muted-foreground">
                                from {product.productSellers.length} sellers
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Seller: {lowestPriceSeller.seller.businessName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            In stock: {lowestPriceSeller.stockQuantity}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Out of stock
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="p-4 pt-0">
                      {lowestPriceSeller ? (
                        <Button
                          className="w-full"
                          onClick={() => handleAddToCart(lowestPriceSeller.id)}
                          disabled={lowestPriceSeller.stockQuantity === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      ) : (
                        <Button className="w-full" disabled>
                          Out of Stock
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}