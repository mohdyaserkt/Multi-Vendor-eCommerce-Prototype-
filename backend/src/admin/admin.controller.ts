import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ApproveSellerDto } from './dto/approve-seller.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // === Role Management ===

  @Post('roles')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.adminService.createRole(
      createRoleDto.name,
      createRoleDto.description,
      createRoleDto.permissions,
    );
  }

  @Get('roles')
  findAllRoles() {
    return this.adminService.findAllRoles();
  }

  @Get('roles/:id')
  findOneRole(@Param('id') id: string) {
    return this.adminService.findOneRole(id);
  }

  @Patch('roles/:id')
  updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: Partial<CreateRoleDto>,
  ) {
    return this.adminService.updateRole(
      id,
      updateRoleDto.name,
      updateRoleDto.description,
      updateRoleDto.permissions,
    );
  }

  @Delete('roles/:id')
  deleteRole(@Param('id') id: string) {
    return this.adminService.deleteRole(id);
  }

  // === User Role Management ===

  @Post('user-roles')
  assignRole(@Request() req, @Body() assignRoleDto: AssignRoleDto) {
    return this.adminService.assignRole(
      assignRoleDto.userId,
      assignRoleDto.roleId,
      req.user.userId,
    );
  }

  @Delete('user-roles/:userId/:roleId')
  removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.adminService.removeRole(userId, roleId);
  }

  @Get('users/:userId/roles')
  getUserRoles(@Param('userId') userId: string) {
    return this.adminService.getUserRoles(userId);
  }

  // === Seller Management ===

  @Get('sellers')
  findAllSellers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.findAllSellers(page, limit, status);
  }

  @Get('sellers/:id')
  findOneSeller(@Param('id') id: string) {
    return this.adminService.findOneSeller(id);
  }

  @Post('sellers/:id/approve')
  approveSeller(@Request() req, @Param('id') id: string) {
    return this.adminService.approveSeller(id, req.user.userId);
  }

  @Post('sellers/:id/reject')
  rejectSeller(
    @Request() req,
    @Param('id') id: string,
    @Body() approveSellerDto: ApproveSellerDto,
  ) {
    return this.adminService.rejectSeller(
      id,
      req.user.userId,
      approveSellerDto.rejectionReason,
    );
  }

  @Delete('sellers/:id')
  deleteSeller(@Param('id') id: string) {
    return this.adminService.deleteSeller(id);
  }

  // === Product Management ===

  @Get('products')
  findAllProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('approved') approved?: boolean,
  ) {
    return this.adminService.findAllProducts(page, limit, approved);
  }

  @Post('products/:id/approve')
  approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(id);
  }

  @Post('products/:id/reject')
  rejectProduct(@Param('id') id: string) {
    return this.adminService.rejectProduct(id);
  }

  // === Category Management ===

  @Get('categories')
  findAllCategories() {
    return this.adminService.findAllCategories();
  }

  @Post('categories')
  createCategory(
    @Body() createCategoryDto: { name: string; description?: string; parentId?: string },
  ) {
    return this.adminService.createCategory(
      createCategoryDto.name,
      createCategoryDto.description,
      createCategoryDto.parentId,
    );
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: { name?: string; description?: string; isActive?: boolean },
  ) {
    return this.adminService.updateCategory(
      id,
      updateCategoryDto.name,
      updateCategoryDto.description,
      updateCategoryDto.isActive,
    );
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // === Order Management ===

  @Get('orders')
  findAllOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.findAllOrders(page, limit, status);
  }

  @Get('orders/:id')
  findOneOrder(@Param('id') id: string) {
    return this.adminService.findOneOrder(id);
  }

  @Post('orders/:id/status')
  updateOrderStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStatusDto: { status: string },
  ) {
    return this.adminService.updateOrderStatus(
      id,
      updateStatusDto.status,
      req.user.userId,
    );
  }

  // === User Management ===

  @Get('users')
  findAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.findAllUsers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }
}