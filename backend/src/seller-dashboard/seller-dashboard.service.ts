import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DocumentType } from './dto/upload-document.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SellerDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(sellerId: string) {
    // Get seller info
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Get total products
    const totalProducts = await this.prisma.productSeller.count({
      where: {
        sellerId: sellerId,
        isActive: true,
      },
    });

    // Get total orders
    const totalOrders = await this.prisma.orderItem.count({
      where: {
        productSeller: {
          sellerId: sellerId,
        },
      },
    });

    // Get pending orders
    const pendingOrders = await this.prisma.orderItem.count({
      where: {
        productSeller: {
          sellerId: sellerId,
        },
        order: {
          status: 'PENDING',
        },
      },
    });

    // Get recent orders (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await this.prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            productSeller: {
              sellerId: sellerId,
            },
          },
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        orderItems: {
          where: {
            productSeller: {
              sellerId: sellerId,
            },
          },
          include: {
            productSeller: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Calculate total revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await this.prisma.orderItem.groupBy({
      by: ['orderId'],
      where: {
        productSeller: {
          sellerId: sellerId,
        },
        order: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
          status: 'DELIVERED',
        },
      },
      _sum: {
        total: true,
      },
    });

    const totalRevenue = revenueData.reduce((sum, item) => sum + (item._sum.total || 0), 0);

    return {
      seller: {
        id: seller.id,
        businessName: seller.businessName,
        status: seller.status,
        email: seller.user.email,
        phone: seller.user.profile?.phone,
        createdAt: seller.createdAt,
      },
      stats: {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        recentOrders: recentOrders.length,
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: `${order.user.profile?.firstName} ${order.user.profile?.lastName}`,
        totalAmount: order.totalAmount,
        status: order.status,
        itemsCount: order.orderItems.length,
        createdAt: order.createdAt,
      })),
    };
  }

  async getProducts(sellerId: string, page: number = 1, limit: number = 10) {
    const [productSellers, total] = await Promise.all([
      this.prisma.productSeller.findMany({
        where: {
          sellerId: sellerId,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.productSeller.count({
        where: {
          sellerId: sellerId,
        },
      }),
    ]);

    const products = productSellers.map(ps => ({
      id: ps.id,
      productId: ps.product.id,
      productName: ps.product.name,
      category: ps.product.category?.name,
      price: ps.price,
      stockQuantity: ps.stockQuantity,
      isActive: ps.isActive,
      adminApproved: ps.product.adminApproved,
      createdAt: ps.createdAt,
    }));

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

  async getOrders(sellerId: string, page: number = 1, limit: number = 10, status?: string) {
    const whereConditions: any = {
      productSeller: {
        sellerId: sellerId,
      },
    };

    if (status) {
      whereConditions.order = {
        status: status,
      };
    }

    const [orderItems, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: whereConditions,
        include: {
          order: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
          productSeller: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
      order: {
        createdAt: 'desc', 
      },
    },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.orderItem.count({
        where: whereConditions,
      }),
    ]);

    const orders = orderItems.map(item => ({
      id: item.order.id,
      orderNumber: item.order.orderNumber,
      customer: `${item.order.user.profile?.firstName} ${item.order.user.profile?.lastName}`,
      customerEmail: item.order.user.email,
      productName: item.productSeller.product.name,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      orderStatus: item.order.status,
      paymentStatus: item.order.paymentStatus,
      createdAt: item.order.createdAt,
    }));

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderDetails(sellerId: string, orderId: string) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        orderId: orderId,
        productSeller: {
          sellerId: sellerId,
        },
      },
      include: {
        order: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            statusHistory: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        productSeller: {
          include: {
            product: true,
            seller: true,
          },
        },
      },
    });

    if (orderItems.length === 0) {
      throw new NotFoundException('Order not found or not associated with this seller');
    }

    const order = orderItems[0].order;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        name: `${order.user.profile?.firstName} ${order.user.profile?.lastName}`,
        email: order.user.email,
        phone: order.user.profile?.phone,
      },
      shippingAddress: order.shippingAddress,
      pincode: order.pincode,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      items: orderItems.map(item => ({
        id: item.id,
        productName: item.productSeller.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      statusHistory: order.statusHistory,
    };
  }

  async updateOrderStatus(sellerId: string, orderId: string, status: string) {
    // Verify that the order belongs to this seller
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        orderId: orderId,
        productSeller: {
          sellerId: sellerId,
        },
      },
    });

    if (!orderItem) {
      throw new UnauthorizedException('Order not associated with this seller');
    }

    // Update order status (this should be done by admin in real scenario)
    // For seller dashboard, we'll just add a note to status history
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Add to status history
    await this.prisma.orderStatusHistory.create({
       data:{
        orderId: orderId,
        status: order.status,
        remarks: `Seller updated status to: ${status}`,
        updatedBy: sellerId,
      },
    });

    return {
      success: true,
      message: `Order status note added: ${status}`,
    };
  }

  async getProfile(sellerId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        documents: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return {
      id: seller.id,
      businessName: seller.businessName,
      gstNumber: seller.gstNumber,
      panNumber: seller.panNumber,
      businessAddress: seller.businessAddress,
      status: seller.status,
      rejectionReason: seller.rejectionReason,
      documents: seller.documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        uploadedAt: doc.uploadedAt,
      })),
      user: {
        email: seller.user.email,
        firstName: seller.user.profile?.firstName,
        lastName: seller.user.profile?.lastName,
        phone: seller.user.profile?.phone,
        address: seller.user.profile?.address,
        pincode: seller.user.profile?.pincode,
      },
    };
  }

  async updateProfile(sellerId: string, updateProfileDto: UpdateProfileDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Update seller info
    const updatedSeller = await this.prisma.seller.update({
      where: { id: sellerId },
       data:{
        ...(updateProfileDto.businessName && { businessName: updateProfileDto.businessName }),
        ...(updateProfileDto.gstNumber && { gstNumber: updateProfileDto.gstNumber }),
        ...(updateProfileDto.panNumber && { panNumber: updateProfileDto.panNumber }),
        ...(updateProfileDto.businessAddress && { businessAddress: updateProfileDto.businessAddress }),
      },
    });

    // Update user info if provided
    if (updateProfileDto.email) {
      await this.prisma.user.update({
        where: { id: seller.user.id },
         data:{
          email: updateProfileDto.email,
        },
      });
    }

    // Update profile info if provided
    if (updateProfileDto.phone || updateProfileDto.businessAddress) {
      await this.prisma.profile.update({
        where: { userId: seller.user.id },
         data:{
          ...(updateProfileDto.phone && { phone: updateProfileDto.phone }),
          ...(updateProfileDto.businessAddress && { address: updateProfileDto.businessAddress }),
        },
      });
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      seller: updatedSeller,
    };
  }

  async uploadDocument(sellerId: string, file: Express.Multer.File, documentType: DocumentType) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 2MB limit');
    }

    // Validate file type (PDF only)
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Save document info to database
    const document = await this.prisma.sellerDocument.create({
       data:{
        sellerId: sellerId,
        fileName: file.originalname,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    return {
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
      },
    };
  }

  async deleteDocument(sellerId: string, documentId: string) {
    const document = await this.prisma.sellerDocument.findUnique({
      where: {
        id: documentId,
        sellerId: sellerId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete from database
    await this.prisma.sellerDocument.delete({
      where: { id: documentId },
    });

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  async getSalesReport(sellerId: string, startDate?: string, endDate?: string) {
    const whereConditions: any = {
      productSeller: {
        sellerId: sellerId,
      },
      order: {
        status: 'DELIVERED',
      },
    };

    if (startDate && endDate) {
      whereConditions.order.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereConditions.order.createdAt = {
        gte: thirtyDaysAgo,
      };
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where: whereConditions,
      include: {
        order: true,
        productSeller: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate sales data
    let totalSales = 0;
    let totalOrders = 0;
    const productSales: any = {};

    orderItems.forEach(item => {
      totalSales += item.total;
      totalOrders = new Set([...(Object.keys(productSales).length > 0 ? Object.keys(productSales) : []), item.orderId]).size;
      
      const productId = item.productSeller.productId;
      if (!productSales[productId]) {
        productSales[productId] = {
          productName: item.productSeller.product.name,
          quantity: 0,
          revenue: 0,
        };
      }
      
      productSales[productId].quantity += item.quantity;
      productSales[productId].revenue += item.total;
    });

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      period: {
        startDate: startDate || 'Last 30 days',
        endDate: endDate || 'Today',
      },
      summary: {
        totalSales,
        totalOrders: Object.keys([...new Set(orderItems.map(item => item.orderId))]).length,
        totalProductsSold: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        averageOrderValue: totalSales / (Object.keys([...new Set(orderItems.map(item => item.orderId))]).length || 1),
      },
      topProducts,
    };
  }
}