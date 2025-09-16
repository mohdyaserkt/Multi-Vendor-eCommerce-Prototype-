import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // === Role Management ===

  async createRole(name: string, description?: string, permissions?: string[]) {
    // Check if role already exists
    const existingRole = await this.prisma.roleModel.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new BadRequestException('Role with this name already exists');
    }

    const role = await this.prisma.roleModel.create({
      data: {
        name,
        description,
        permissions: permissions ? JSON.stringify(permissions) : null,
      },
    });

    return {
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : [],
    };
  }

  async findAllRoles() {
    const roles = await this.prisma.roleModel.findMany({
      orderBy: { name: 'asc' },
    });

    return roles.map(role => ({
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : [],
    }));
  }

  async findOneRole(id: string) {
    const role = await this.prisma.roleModel.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : [],
    };
  }

  async updateRole(id: string, name?: string, description?: string, permissions?: string[]) {
    const role = await this.prisma.roleModel.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(permissions && { permissions: JSON.stringify(permissions) }),
      },
    });

    return {
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : [],
    };
  }

  async deleteRole(id: string) {
    // Check if role is assigned to any users
    const userRoles = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userRoles > 0) {
      throw new BadRequestException('Cannot delete role that is assigned to users');
    }

    await this.prisma.roleModel.delete({
      where: { id },
    });

    return { message: 'Role deleted successfully' };
  }

  // === User Role Management ===

  async assignRole(userId: string, roleId: string, assignedById: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if role exists
    const role = await this.prisma.roleModel.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if already assigned
    const existingAssignment = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingAssignment) {
      throw new BadRequestException('Role already assigned to this user');
    }

    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy: assignedById,
      },
    });

    return userRole;
  }

  async removeRole(userId: string, roleId: string) {
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!userRole) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return { message: 'Role removed successfully' };
  }

  async getUserRoles(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.map(ur => ({
      id: ur.id,
      roleId: ur.roleId,
      roleName: ur.role.name,
      assignedAt: ur.createdAt,
      assignedBy: ur.assignedBy,
    }));
  }

  // === Seller Management ===
async findAllSellers(page: number = 1, limit: number = 10, status?: string) {
  // Ensure page & limit are numbers
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  const whereConditions: any = {};
  if (status) {
    whereConditions.status = status;
  }

  const [sellers, total] = await Promise.all([
    this.prisma.seller.findMany({
      where: whereConditions,
      include: {
        user: { include: { profile: true } },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum, 
    }),
    this.prisma.seller.count({ where: whereConditions }),
  ]);

  return {
    sellers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
}


  async findOneSeller(id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
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

    return seller;
  }

  async approveSeller(id: string, approvedById: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const updatedSeller = await this.prisma.seller.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approvedById,
        approvedAt: new Date(),
      },
    });

    return updatedSeller;
  }

  async rejectSeller(id: string, approvedById: string, rejectionReason?: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const updatedSeller = await this.prisma.seller.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: approvedById,
        rejectionReason,
      },
    });

    return updatedSeller;
  }

  async deleteSeller(id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Delete related data
    await this.prisma.$transaction([
      this.prisma.productSeller.deleteMany({
        where: { sellerId: id },
      }),
      this.prisma.sellerDocument.deleteMany({
        where: { sellerId: id },
      }),
      this.prisma.seller.delete({
        where: { id },
      }),
    ]);

    return { message: 'Seller deleted successfully' };
  }

  // === Product Management ===

 async findAllProducts(page: number | string = 1, limit: number | string = 10, approved?: boolean) {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  const whereConditions: any = {};
  
  if (approved !== undefined) {
    whereConditions.adminApproved = approved;
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

  async approveProduct(productId: string) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        adminApproved: true,
      },
    });

    return product;
  }

  async rejectProduct(productId: string) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        adminApproved: false,
      },
    });

    return product;
  }

  // === Category Management ===

  async findAllCategories() {
    return this.prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createCategory(name: string, description?: string, parentId?: string) {
    return this.prisma.category.create({
      data: {
        name,
        description,
        parentId,
        isActive: true,
      },
    });
  }

  async updateCategory(id: string, name?: string, description?: string, isActive?: boolean) {
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  // === Order Management ===

  async findAllOrders(
  page: number | string = 1,
  limit: number | string = 10,
  status?: string,
) {

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  const whereConditions: any = {};
  if (status) {
    whereConditions.status = status;
  }

  const [orders, total] = await Promise.all([
    this.prisma.order.findMany({
      where: whereConditions,
      include: {
        user: {
          include: { profile: true },
        },
        orderItems: {
          include: {
            productSeller: {
              include: {
                product: true,
                seller: {
                  include: {
                    user: {
                      include: { profile: true },
                    },
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
    this.prisma.order.count({ where: whereConditions }),
  ]);

  return {
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  };
}


  async findOneOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        orderItems: {
          include: {
            productSeller: {
              include: {
                product: true,
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
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: string, updatedById?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
      },
    });

    // Add to status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: orderId,
        status: status,
        updatedBy: updatedById,
      },
    });

    return updatedOrder;
  }

  // === User Management ===

  async findAllUsers(page: number = 1, limit: number = 10) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          profile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || '',
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}