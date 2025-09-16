import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }
async create(name: string, description?: string, parentId?: string) {
  return this.prisma.category.create({
    data: {
      name,
      description,
      parentId,
      isActive: true,
    },
  });
}
async update(id: string, name?: string, description?: string, isActive?: boolean) {
  return this.prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(isActive !== undefined && { isActive }),
    },
  });
}

async remove(id: string) {
  return this.prisma.category.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}
}