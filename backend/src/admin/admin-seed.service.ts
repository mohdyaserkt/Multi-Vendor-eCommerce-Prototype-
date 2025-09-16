import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminSeedService {
  constructor(private prisma: PrismaService) {}

  async seedRoles() {
    const roles = [
      {
        name: 'ADMIN',
        description: 'Full administrative access',
        permissions: [
          'manage_users',
          'manage_roles',
          'manage_sellers',
          'manage_products',
          'manage_categories',
          'manage_orders',
          'view_reports',
        ],
      },
      {
        name: 'SELLER_MANAGER',
        description: 'Manage sellers and their products',
        permissions: [
          'manage_sellers',
          'manage_products',
          'view_orders',
        ],
      },
      {
        name: 'ORDER_MANAGER',
        description: 'Manage orders and customer service',
        permissions: [
          'manage_orders',
          'view_customers',
          'handle_refunds',
        ],
      },
      {
        name: 'CONTENT_MANAGER',
        description: 'Manage categories and content',
        permissions: [
          'manage_categories',
          'manage_content',
        ],
      },
      {
        name: 'ACCOUNTS',
        description: 'Financial and accounting operations',
        permissions: [
          'view_financials',
          'manage_payments',
          'handle_refunds',
          'view_reports',
        ],
      },
    ];

    for (const roleData of roles) {
      try {
        await this.prisma.roleModel.create({
           data:{
            name: roleData.name,
            description: roleData.description,
            permissions: JSON.stringify(roleData.permissions),
          },
        });
        console.log(`Created role: ${roleData.name}`);
      } catch (error) {
        console.log(`Role ${roleData.name} already exists or creation failed`);
      }
    }
  }
}