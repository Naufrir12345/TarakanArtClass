import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) return true;

        const request = context.switchToHttp().getRequest();

        // DEBUG: Log seluruh object request
        console.log("DEBUG - Request User Object:", request.user);

        const user = request.user;
        if (!user) return false;

        // Pastikan user.role (dari JWT payload) cocok dengan requiredRoles
        return requiredRoles.includes(user.role);
    }
}