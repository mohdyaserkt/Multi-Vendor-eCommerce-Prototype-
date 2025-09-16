'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Get order ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    setOrderId(orderId);
  }, []);

  return (
    <div className="container py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your order has been placed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                Thank you for your purchase. Your order #{orderId} has been confirmed.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You will receive an email confirmation shortly.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Next Steps</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Your order is being processed</li>
                <li>• You'll receive shipping updates via email</li>
                <li>• Track your order in the "My Orders" section</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={orderId ? `/orders/${orderId}` : '/orders'}>
                  View Order Details
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}