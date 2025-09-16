'use client';

import { useState } from 'react';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Store } from 'lucide-react';
import { Label } from '@/components/ui/label';


export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'SELLER' | null>(null);

  if (selectedRole === 'CUSTOMER') {
    window.location.href = '/register/customer';
    return null;
  }

  if (selectedRole === 'SELLER') {
    window.location.href = '/register/seller';
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Choose Account Type</CardTitle>
            <CardDescription>
              Select the type of account you want to create
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full h-auto py-6 flex flex-col items-center justify-center space-y-2"
                onClick={() => setSelectedRole('CUSTOMER')}
              >
                <User className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Customer Account</div>
                  <div className="text-sm text-muted-foreground">
                    Shop for products from multiple sellers
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-auto py-6 flex flex-col items-center justify-center space-y-2"
                onClick={() => setSelectedRole('SELLER')}
              >
                <Store className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold">Seller Account</div>
                  <div className="text-sm text-muted-foreground">
                    Sell your products to customers
                  </div>
                </div>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* <div className="space-y-2">
              <Label>Select Account Type</Label>
              <Select onValueChange={(value) => setSelectedRole(value as 'CUSTOMER' | 'SELLER')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="SELLER">Seller</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center">
              <span>Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}