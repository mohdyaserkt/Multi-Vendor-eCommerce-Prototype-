'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import { Product } from '@/lib/types';
import { useCart } from '@/components/cart/cart-context';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);


  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, selectedCategory, sortBy, searchQuery, priceRange]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '12');
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (priceRange[0] > 0) params.append('minPrice', priceRange[0].toString());
      if (priceRange[1] < 10000) params.append('maxPrice', priceRange[1].toString());
      
      const response = await api.get(`/products?${params.toString()}`);
      setProducts(response.data.products || []);
      setTotalPages(response.data.pagination?.pages || 1);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrl();
  };

  const updateUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    if (currentPage > 1) params.append('page', currentPage.toString());
    
    const newUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
  };

  const handleAddToCart = (productSellerId: string) => {
    addToCart(productSellerId, 1);
  };

  const getLowestPriceSeller = (product: Product) => {
    const activeSellers = product.productSellers.filter(ps => ps.stockQuantity > 0);
    if (activeSellers.length === 0) return null;
    return activeSellers.reduce((min, ps) => ps.price < min.price ? ps : min, activeSellers[0]);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex w-full justify-center ">

    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="md:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Categories</h3>
                  <div className="space-y-2">
                    <Button
                      variant={selectedCategory ? "outline" : "secondary"}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedCategory('');
                        setCurrentPage(1);
                      }}
                    >
                      All Categories
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "secondary" : "outline"}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setCurrentPage(1);
                        }}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Price Range</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                        className="h-8"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 10000])}
                        className="h-8"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setPriceRange([0, 10000]);
                        setCurrentPage(1);
                      }}
                    >
                      Reset Price
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and Sort */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-4">
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

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-muted-foreground">
                {products.length > 0 ? `${products.length} products found` : 'No products found'}
              </p>
              
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const lowestPriceSeller = getLowestPriceSeller(product);
                  return (
                    <Card key={product.id} className="h-full flex flex-col">
                      <Link href={`/products/${product.id}`} className="flex-grow">
                        <CardHeader className="p-4">
                          <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                            <div className="text-muted-foreground">Product Image</div>
                          </div>
                          <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {product.brand}
                          </p>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-0 flex-grow">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary">{product.category.name}</Badge>
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
                      </Link>
                      
                      <CardFooter className="p-4 pt-0">
                        {lowestPriceSeller ? (
                          <Button 
                            className="w-full"
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(lowestPriceSeller.id);
                            }}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}