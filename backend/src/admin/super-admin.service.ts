import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createSuperAdmin(): Promise<void> {
    try {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
      const adminFirstName = this.configService.get<string>('ADMIN_FIRST_NAME', 'Super');
      const adminLastName = this.configService.get<string>('ADMIN_LAST_NAME', 'Admin');

      if (!adminEmail || !adminPassword) {
        this.logger.log('Super admin credentials not found in environment variables');
        return;
      }

      // Check if super admin already exists
      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log(`Super admin already exists: ${adminEmail}`);
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create super admin user
      const adminUser = await this.prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          twoFactorEnabled: false, // Disable 2FA for super admin for easier setup
          profile: {
            create: {
              firstName: adminFirstName,
              lastName: adminLastName,
            },
          },
        },
        include: { profile: true },
      });

      this.logger.log(`Super admin created successfully: ${adminEmail}`);

      // Create default admin roles if they don't exist
      await this.createDefaultRoles();

      // Assign ADMIN role to super admin
      await this.assignAdminRole(adminUser.id);

    } catch (error) {
      this.logger.error('Error creating super admin:', error);
    }
  }

  private async createDefaultRoles(): Promise<void> {
    const defaultRoles = [
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

    for (const roleData of defaultRoles) {
      try {
        // Check if role already exists
        const existingRole = await this.prisma.roleModel.findUnique({
          where: { name: roleData.name },
        });

        if (!existingRole) {
          await this.prisma.roleModel.create({
            data: {
              name: roleData.name,
              description: roleData.description,
              permissions: JSON.stringify(roleData.permissions),
            },
          });
          this.logger.log(`Created default role: ${roleData.name}`);
        } else {
          this.logger.log(`Role already exists: ${roleData.name}`);
        }
      } catch (error) {
        this.logger.error(`Error creating role ${roleData.name}:`, error);
      }
    }
  }

  private async assignAdminRole(userId: string): Promise<void> {
    try {
      // Find the ADMIN role
      const adminRole = await this.prisma.roleModel.findUnique({
        where: { name: 'ADMIN' },
      });

      if (!adminRole) {
        this.logger.error('ADMIN role not found');
        return;
      }

      // Check if user already has ADMIN role
      const existingAssignment = await this.prisma.userRole.findUnique({
        where: {
          userId_roleId: {
            userId,
            roleId: adminRole.id,
          },
        },
      });

      if (!existingAssignment) {
        // Assign ADMIN role to super admin
        await this.prisma.userRole.create({
          data: {
            userId,
            roleId: adminRole.id,
          },
        });
        this.logger.log('Assigned ADMIN role to super admin');
      } else {
        this.logger.log('Super admin already has ADMIN role');
      }
    } catch (error) {
      this.logger.error('Error assigning ADMIN role:', error);
    }
  }
}