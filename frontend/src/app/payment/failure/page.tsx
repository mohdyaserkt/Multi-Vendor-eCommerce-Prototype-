'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Get order ID and error from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    const error = urlParams.get('error');
    setOrderId(orderId);
    setErrorMessage(error);
  }, []);

  return (
    <div className="container py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Payment Failed</CardTitle>
            <CardDescription>
              Your payment could not be processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                {errorMessage || 'There was an issue processing your payment.'}
              </p>
              {orderId && (
                <p className="text-sm text-muted-foreground mt-2">
                  Order ID: {orderId}
                </p>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">What you can do</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Check your card details and try again</li>
                <li>• Try a different payment method</li>
                <li>• Contact your bank if the issue persists</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/cart">
                  Try Again
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}