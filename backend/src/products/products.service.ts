import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createProductDto: CreateProductDto) {
    // First, verify that the user is a seller
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Create product and associate with seller
    const product = await this.prisma.product.create({
       data:{
        name: createProductDto.name,
        description: createProductDto.description,
        categoryId: createProductDto.categoryId,
        brand: createProductDto.brand,
        // Product is not approved by admin yet
        adminApproved: false,
        productSellers: {
          create: {
            sellerId: seller.id,
            price: createProductDto.price,
            stockQuantity: createProductDto.stockQuantity,
          },
        },
      },
      include: {
        category: true,
        productSellers: {
          include: {
            seller: true,
          },
        },
      },
    });

    return product;
  }

  async findAll(query: ProductQueryDto) {
  let { category, minPrice, maxPrice, search, page = 1, limit = 10 } = query;

 
  page = Number(page) || 1;
  limit = Number(limit) || 10;

  const whereConditions: any = {
    isActive: true,
    adminApproved: true, // Only show admin-approved products
  };

  // Add category filter
  if (category) {
    whereConditions.categoryId = category;
  }

  // Add price filters
  if (minPrice !== undefined || maxPrice !== undefined) {
    whereConditions.productSellers = {
      some: {
        price: {
          ...(minPrice !== undefined && { gte: Number(minPrice) }),
          ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
        },
      },
    };
  }

  // Add search filter
  if (search) {
    whereConditions.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      where: whereConditions,
      include: {
        category: true,
        productSellers: {
          where: {
            isActive: true,
            stockQuantity: { gt: 0 },
          },
          include: {
            seller: true,
          },
          orderBy: {
            price: 'asc', // Show lowest price first
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit, 
    }),
    this.prisma.product.count({
      where: whereConditions,
    }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}


  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
        isActive: true,
        adminApproved: true,
      },
      include: {
        category: true,
        productSellers: {
          where: {
            isActive: true,
            stockQuantity: { gt: 0 },
          },
          include: {
            seller: true,
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(userId: string, id: string, updateProductDto: UpdateProductDto) {
    // Verify that the user owns this product
    const productSeller = await this.prisma.productSeller.findFirst({
      where: {
        productId: id,
        seller: {
          userId: userId,
        },
      },
      include: {
        product: true,
      },
    });

    if (!productSeller) {
      throw new NotFoundException('Product not found or not owned by user');
    }

    // Update product seller info
    const updatedProductSeller = await this.prisma.productSeller.update({
      where: { id: productSeller.id },
       data:{
        ...(updateProductDto.price !== undefined && { price: updateProductDto.price }),
        ...(updateProductDto.stockQuantity !== undefined && { stockQuantity: updateProductDto.stockQuantity }),
      },
    });

    // Update product info if provided
    let updatedProduct = productSeller.product;
    if (updateProductDto.name || updateProductDto.description || updateProductDto.categoryId || updateProductDto.brand) {
      updatedProduct = await this.prisma.product.update({
        where: { id: id },
         data:{
          ...(updateProductDto.name && { name: updateProductDto.name }),
          ...(updateProductDto.description && { description: updateProductDto.description }),
          ...(updateProductDto.categoryId && { categoryId: updateProductDto.categoryId }),
          ...(updateProductDto.brand && { brand: updateProductDto.brand }),
        },
        include: {
          category: true,
          productSellers: {
            include: {
              seller: true,
            },
          },
        },
      });
    } else {
      updatedProduct = await this.prisma.product.findUniqueOrThrow({
  where: { id },
  include: {
    category: true,
    productSellers: {
      include: {
        seller: true,
      },
    },
  },
});

    }

    return updatedProduct;
  }

  async remove(userId: string, id: string) {
    // Verify that the user owns this product
    const productSeller = await this.prisma.productSeller.findFirst({
      where: {
        productId: id,
        seller: {
          userId: userId,
        },
      },
    });

    if (!productSeller) {
      throw new NotFoundException('Product not found or not owned by user');
    }

    // Soft delete - mark as inactive
    await this.prisma.productSeller.update({
      where: { id: productSeller.id },
       data:{
        isActive: false,
      },
    });

    return { message: 'Product removed successfully' };
  }

  // Seller's products
  async findSellerProducts(userId: string, page: number = 1, limit: number = 10) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const [productSellers, total] = await Promise.all([
      this.prisma.productSeller.findMany({
        where: {
          sellerId: seller.id,
        },
        include: {
          product: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.productSeller.count({
        where: {
          sellerId: seller.id,
        },
      }),
    ]);

    return {
      products: productSellers.map(ps => ({
        ...ps.product,
        price: ps.price,
        stockQuantity: ps.stockQuantity,
        isActive: ps.isActive,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Admin: Get all products for approval
  async findAllForAdmin(
  page: number | string = 1,
  limit: number | string = 10,
  approved?: boolean | string,
) {
  // ✅ Ensure proper types
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  const whereConditions: any = {};

  if (approved !== undefined) {
    // ✅ Convert string/boolean to actual boolean
    whereConditions.adminApproved =
      approved === true || approved === 'true';
  }

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      where: whereConditions,
      include: {
        category: true,
        productSellers: {
          include: {
            seller: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (pageNum - 1) * limitNum, 
      take: limitNum,                 
    }),
    this.prisma.product.count({
      where: whereConditions,
    }),
  ]);

  return {
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
}


  // Admin: Approve product
  async approveProduct(productId: string) {
    const product = await this.prisma.product.update({
      where: { id: productId },
       data:{
        adminApproved: true,
      },
    });

    return product;
  }

  // Admin: Reject product
  async rejectProduct(productId: string) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        adminApproved: false,
      },
    });

    return product;
  }
}