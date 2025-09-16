// User types
export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  requires2FA: boolean;
}

export interface Profile {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  pincode?: string;
}

// Product types
export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive?:boolean;
  
}

export interface ProductSeller {
  id: string;
  price: number;
  stockQuantity: number;
  seller: {
    id: string;
    businessName: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: Category;
  brand?: string;
  productSellers: ProductSeller[];
  adminApproved: boolean;
  createdAt: string;
}

// Cart types
export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    description?: string;
  };
  seller: {
    id: string;
    businessName: string;
  };
  price: number;
  quantity: number;
  total: number;
  createdAt: string;
}

export interface Cart {
  items: CartItem[];
  cartTotal: number;
  totalItems: number;
}

// Order types
export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemCount?: number;
}

// Base Order type from your API
export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  totalAmount: number;
  shippingAddress: string;
  pincode: string;
  status: string;
  paymentStatus: string;
  paymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
}

// OrderItem type
export interface OrderItem {
  id: string;
  orderId: string;
  productSellerId: string;
  quantity: number;
  price: number;
  total: number;
  productSeller: {
    id: string;
    productId: string;
    sellerId: string;
    price: number;
    stockQuantity: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    product: {
      id: string;
      name: string;
      description: string;
      categoryId: string;
      brand: string;
      isActive: boolean;
      adminApproved: boolean;
      createdAt: string;
      updatedAt: string;
    };
    seller: {
      id: string;
      userId: string;
      businessName: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

// Extended OrderDetail
export interface OrderDetail extends Order {
  estimatedDelivery: string | null; 
  items: OrderItem[];            
  statusHistory: {
    status: string;
    remarks: string;
    createdAt: string;
  }[];
}


// Seller types
export interface Seller {
  id: string;
  businessName: string;
  gstNumber?: string;
  createdAt?: string;
  panNumber?: string;
  businessAddress?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  user: {
    email: string;
    profile?: Profile;
  };
  documents: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  }[];
}