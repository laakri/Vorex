import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@GetUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Get('me')
  getMe(@GetUser() user: any) {
    return user;
  }

  @Get('users')
  async getUsers() {
    console.log("Fetching all users");
    const users = await this.usersService.getUsers();
    console.log(`Returning ${users.length} users`);
    return users;
  }

  @Get('admin-only')
  @Roles(Role.ADMIN)
  adminOnly(@GetUser() user: any) {
    return {
      message: 'This is admin only content',
      user,
    };
  }
}
