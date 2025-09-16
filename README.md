# Multi-Vendor eCommerce Platform

A complete multi-vendor eCommerce solution built with modern technologies including Next.js, NestJS, PostgreSQL, and Prisma ORM.

## 🎥 Demo Video
[![Watch the video](assets/tst.png)](https://drive.google.com/file/d/1UyssLyHIeOd81Y_3lML6L1It6YduCx1Y/view?usp=sharing)


## 🏗️ Project Structure

```
multi-vendor-ecommerce/
├── backend/                    # NestJS backend API
│   ├── src/                   # Source code
│   ├── prisma/                # Prisma schema and migrations
│   ├── .env                   # Environment variables
│   └── package.json
├── frontend/                  # Next.js storefront
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities and API clients
│   ├── .env.local             # Frontend environment variables
│   └── package.json
├── .gitignore
├── README.md
└── .env.example              # Environment variables template
```

## 🚀 Quick Setup

### Prerequisites
- Node.js 16+
- PostgreSQL database
- npm 

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. **Start development server:**
```bash
npm run start:dev
```

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development server:**
```bash
npm run dev
```

## ⚙️ Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
JWT_EXPIRES_IN="3600s"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_your_key_id_here"
RAZORPAY_SECRET="your_razorpay_secret_here"

# Super Admin
ADMIN_EMAIL="admin@yoursite.com"
ADMIN_PASSWORD="YourSecurePassword123!"
ADMIN_FIRST_NAME="Super"
ADMIN_LAST_NAME="Admin"

# Application
PORT=3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=MultiVendor Store
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_actual_key_id_here
```

## 🛠️ Setup Instructions

### 1. Database Setup
1. Install PostgreSQL
2. Create a new database
3. Update `DATABASE_URL` in `.env`
4. Run migrations: `npx prisma migrate dev`
5. Generate client: `npx prisma generate`

### 2. Backend Configuration
1. Install dependencies: `npm install`
2. Configure environment variables
3. Run development server: `npm run start:dev`
4. Access API at: `http://localhost:3000`

### 3. Frontend Configuration
1. Install dependencies: `npm install`
2. Configure environment variables
3. Run development server: `npm run dev`
4. Access storefront at: `http://localhost:4000`

### 4. Super Admin Setup
The super admin user is automatically created on first application startup:
- **Email**: `admin@yoursite.com`
- **Password**: `YourSecurePassword123!`

## 👤 Sample Login Credentials

### Admin Account
```
Email: admin@yoursite.com
Password: YourSecurePassword123!
Role: ADMIN
Status: Active
```

### Seller Account
```
Email: testseller@gmail.com
Password: test123
Role: SELLER
Status: Approved (after admin approval)
```

### Customer Account
```
Email: testcustomer@gmail.com
Password: test123
Role: CUSTOMER
Status: Active
```

## 🎯 Key Features

### Authentication & Security
- JWT-based authentication
- Role-based access control (Admin, Seller, Customer)
- Two-factor authentication (2FA) with mock OTP
- Password hashing with bcrypt

### Storefront (Customer)
- Product browsing with filters and search
- Multi-seller product listings with price comparison
- Shopping cart management
- Wishlist functionality
- Pincode-based delivery estimation
- Secure checkout with Razorpay integration
- Order tracking and history

### Seller Dashboard
- Product management (CRUD operations)
- Order management and fulfillment
- Profile and document management
- Sales reporting and analytics
- Seller approval workflow

### Admin Dashboard
- Role-based access control (RBAC)
- Seller onboarding and approval
- Product approval workflow
- Category management
- Order management
- User management
- Comprehensive dashboard with analytics

## 📁 Backend Structure

```
backend/src/
├── admin/          # Admin module with RBAC
├── auth/           # Authentication and 2FA
├── cart/           # Shopping cart functionality
├── categories/     # Category management
├── orders/         # Order processing
├── payments/       # Payment integration
├── prisma/         # Prisma service
├── products/       # Product management
├── sellers/        # Seller management
├── users/          # User management
├── wishlist/       # Wishlist functionality
└── main.ts         # Application entry point
```

## 📁 Frontend Structure

```
frontend/app/
├── (auth)/         # Authentication pages
├── (storefront)/   # Main storefront
├── admin/          # Admin dashboard
├── seller/         # Seller dashboard
├── products/       # Product pages
├── cart/           # Cart functionality
├── checkout/       # Checkout process
├── orders/         # Order management
├── wishlist/       # Wishlist pages
└── page.tsx        # Home page
```

## 🔧 Development Commands

### Backend
```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database
npx prisma migrate dev
npx prisma generate
npx prisma studio

# Testing
npm run test
npm run test:e2e
```

### Frontend
```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
npm run lint:fix
```


## 🔐 Security Features

- JWT token authentication
- Password encryption with bcrypt
- Role-based access control
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- CORS protection
- Rate limiting
- Secure file upload validation

## 📱 Responsive Design

- Mobile-first approach
- Responsive layouts for all screen sizes
- Touch-friendly interfaces
- Optimized performance

## 🛠️ Technologies Used

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Razorpay** - Payment processing

### Frontend
- **Next.js 15+** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **React** - UI library
- **TypeScript** - Type safety




**Note**: This is a demonstration platform. For production use, ensure proper security measures, error handling, and performance optimizations are implemented.
