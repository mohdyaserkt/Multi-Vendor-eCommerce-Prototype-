'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
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
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  recentOrders: number;
}
interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}


interface Product {
  id: string;
  productName: string;
  price: number;
  stockQuantity: number;
  isActive: boolean;
  adminApproved: boolean;
  createdAt: string;
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    recentOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);
console.log(recentOrders);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [
        productsResponse,
        ordersResponse,
        recentOrdersResponse,
        recentProductsResponse
      ] = await Promise.all([
        // Seller products
        api.get('/seller/products?limit=1'),
        // Seller orders
        api.get('/seller/orders?limit=1'),
        // Recent orders
        api.get('/seller/orders?limit=5'),
        // Recent products
        api.get('/seller/products?limit=5')
      ]);

      // Calculate stats
      const totalProducts = productsResponse.data.pagination?.total || 0;
      const totalOrders = ordersResponse.data.pagination?.total || 0;
      
      // Calculate revenue from delivered orders
      const deliveredOrdersResponse = await api.get('/seller/orders?status=DELIVERED&limit=1000');
      const totalRevenue = deliveredOrdersResponse.data.orders?.reduce((sum: number, order: any) => 
        sum + order.total, 0
      ) || 0;

      // Calculate pending orders
      const pendingOrdersResponse = await api.get('/seller/orders?status=PENDING&limit=1');
      const pendingOrders = pendingOrdersResponse.data.pagination?.total || 0;

      setStats({
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        recentOrders: recentOrdersResponse.data.orders?.length || 0
      });

      setRecentOrders(recentOrdersResponse.data.orders || []);
      setRecentProducts(recentProductsResponse.data.products || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

  const getProductStatusBadge = (isActive: boolean, isAdminApproved: boolean) => {
    if (!isAdminApproved) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (isActive) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
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
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-green-500",
      change: "+8% from last month"
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toLocaleString(),
      icon: Clock,
      color: "text-orange-500",
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
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your seller dashboard. Manage your products and orders here.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders for your products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : recentOrders?.length > 0 ? (
                recentOrders.map((order) => (
  <div
    key={order.id}
    className="flex items-center justify-between p-3 border rounded-lg"
  >
    <div>
      <p className="font-medium">{order.orderNumber}</p>
      <p className="text-sm text-muted-foreground">
        {order.customer} • ₹
        {order?.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
    </div>
    <div className="flex items-center gap-2">
      {getStatusBadge(order?.orderStatus)}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/seller/orders/${order.id}`}>View</Link>
      </Button>
    </div>
  </div>
))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No recent orders
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/seller/orders">View All Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>
              Your latest product listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : recentProducts.length > 0 ? (
                recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{product.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} • Stock: {product.stockQuantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getProductStatusBadge(product.isActive, product.adminApproved)}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/seller/products/${product.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No products listed
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/seller/products">View All Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}