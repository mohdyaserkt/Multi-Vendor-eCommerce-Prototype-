'use client';

import { SellerRegistrationForm } from '@/components/auth/seller-registration-form';

export default function SellerRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <SellerRegistrationForm />
      </div>
    </div>
  );
}