import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],   // <-- this makes PrismaService available
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
