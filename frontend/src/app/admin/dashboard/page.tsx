'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Users, 
  Store, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  totalSellers: number;
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  pendingSellers: number;
  pendingProducts: number;
}

interface PendingSeller {
  id: string;
  businessName: string;
  user: {
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
}

interface PendingProduct {
  id: string;
  name: string;
  productSellers: {
    seller: {
      businessName: string;
    };
  }[];
  createdAt: string;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  items: {
    productName: string;
  }[];
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSellers: 0,
    totalCustomers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    pendingSellers: 0,
    pendingProducts: 0
  });
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [
        productsResponse,
        sellersResponse,
        pendingSellersResponse,
        pendingProductsResponse,
        ordersResponse,
        recentOrdersResponse
      ] = await Promise.all([
        // Total products
        api.get('/products/admin/all?limit=1'),
        // Total sellers
        api.get('/admin/sellers?limit=1'),
        // Pending sellers
        api.get('/admin/sellers?status=PENDING&limit=3'),
        // Pending products
        api.get('/products/admin/all?approved=false&limit=3'),
        // Total orders
        api.get('/admin/orders?limit=1'),
        // Recent orders
        api.get('/admin/orders?limit=5')
      ]);

      // Calculate customer count (users who are not sellers or admins)
      const usersResponse = await api.get('/admin/users?limit=1000');
      const totalCustomers = usersResponse.data.users?.filter((user: any) => 
        user.role === 'CUSTOMER'
      ).length || 0;

      // Calculate total revenue from delivered orders
      const allOrdersResponse = await api.get('/admin/orders?status=DELIVERED&limit=1000');
      const totalRevenue = allOrdersResponse.data.orders?.reduce((sum: number, order: any) => 
        sum + order.totalAmount, 0
      ) || 0;

      // Calculate pending orders
      const pendingOrdersResponse = await api.get('/admin/orders?status=PENDING&limit=1');
      const pendingOrders = pendingOrdersResponse.data.pagination?.total || 0;

      setStats({
        totalProducts: productsResponse.data.pagination?.total || 0,
        totalSellers: sellersResponse.data.pagination?.total || 0,
        totalCustomers: totalCustomers,
        totalOrders: ordersResponse.data.pagination?.total || 0,
        pendingOrders: pendingOrders,
        totalRevenue: totalRevenue,
        pendingSellers: pendingSellersResponse.data.pagination?.total || 0,
        pendingProducts: pendingProductsResponse.data.pagination?.total || 0
      });

      setPendingSellers(pendingSellersResponse.data.sellers || []);
      setPendingProducts(pendingProductsResponse.data.products || []);
      setRecentOrders(recentOrdersResponse.data.orders || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (sellerId: string) => {
    try {
      await api.post(`/admin/sellers/${sellerId}/approve`);
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving seller:', error);
    }
  };

  const handleRejectSeller = async (sellerId: string) => {
    try {
      await api.post(`/admin/sellers/${sellerId}/reject`, { rejectionReason: 'Rejected by admin' });
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting seller:', error);
    }
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      await api.post(`/products/admin/${productId}/approve`);
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving product:', error);
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      await api.post(`/products/admin/${productId}/reject`);
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting product:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'CONFIRMED':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Confirmed</Badge>;
      case 'SHIPPED':
        return <Badge variant="outline"><TrendingUp className="h-3 w-3 mr-1" /> Shipped</Badge>;
      case 'DELIVERED':
        return <Badge variant="default"><Package className="h-3 w-3 mr-1" /> Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      color: "text-blue-500",
      change: "+12% from last month"
    },
    {
      title: "Total Sellers",
      value: stats.totalSellers.toLocaleString(),
      icon: Store,
      color: "text-green-500",
      change: "+8% from last month"
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: "text-purple-500",
      change: "+15% from last month"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-orange-500",
      change: "+5% from last month"
    },
    {
      title: "Pending Sellers",
      value: stats.pendingSellers.toLocaleString(),
      icon: Clock,
      color: "text-yellow-500",
      change: "Needs attention"
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-500",
      change: "+15% from last month"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your admin dashboard. Here you can manage your multi-vendor platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Sellers */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Seller Approvals</CardTitle>
            <CardDescription>
              Review and approve new seller applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : pendingSellers.length > 0 ? (
                pendingSellers.map((seller) => (
                  <div key={seller.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{seller.businessName}</p>
                      <p className="text-sm text-muted-foreground">
                        {seller.user.email} • {new Date(seller.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRejectSeller(seller.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleApproveSeller(seller.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No pending sellers
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/sellers">View All Pending Sellers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Products */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Product Approvals</CardTitle>
            <CardDescription>
              Review and approve new product listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : pendingProducts.length > 0 ? (
                pendingProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        By {product.productSellers[0]?.seller.businessName || 'Unknown Seller'} • {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRejectProduct(product.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleApproveProduct(product.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No pending products
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/products">View All Pending Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Latest orders from customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders?.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{order.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} • {order?.items?.length} items
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/orders/${order.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No recent orders
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}