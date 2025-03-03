import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';

export enum Role {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
  DRIVER = 'DRIVER',
}

@Injectable()
export class RolesGuard implements CanActivate {
  
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles) {
      return true; // If no roles are required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Ensure user is set in the request

    if (!user || !user.role) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    const hasRole = () => user.role.some((role: Role) => requiredRoles.includes(role));
    if (!hasRole()) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}