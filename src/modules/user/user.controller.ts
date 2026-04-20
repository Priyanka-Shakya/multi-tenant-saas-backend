import { Request, Response } from 'express';
import { createUser, getUsersByTenant } from './user.service';
import { successResponse, errorResponse } from '../../utils/response';
import { Role } from '@prisma/client';
import { queueEmail } from '../email/email.service';
import { inviteTemplate } from '../email/templates/invite.template';
import { createAuditLog } from '../audit/audit.service';

// POST /users
export const createUserController = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        const tenantName = req.tenant?.name;

        if (!tenantId) {
            return errorResponse(res, 'UNAUTHORIZED', 'Tenant not found', 401);
        }

        const { name, email, role } = req.body;

        if (!name || !email || !role) {
            return errorResponse(res, 'VALIDATION_ERROR', 'All fields are required', 400);
        }

        if (!Object.values(Role).includes(role)) {
            return errorResponse(res, 'VALIDATION_ERROR', 'Role must be OWNER or MEMBER', 400);
        }

        const user = await createUser(name, email, role, tenantId);

        // Audit log create karo
        await createAuditLog({
            tenantId,
            userId: req.user?.id,
            action: 'CREATE_USER',
            resourceType: 'User',
            resourceId: user.id,
            previousValue: null,
            newValue: {
                name: user.name,
                email: user.email,
                role: user.role
            },
            ipAddress: req.ip,
            apiKeyUsed: req.apiKey,
        });

        // Invite email queue mein add karo
        const template = inviteTemplate(tenantName || 'Our Platform', email);
        await queueEmail(
            email,
            'invite',
            template.subject,
            template.body,
            tenantId
        );

        return successResponse(res, user, 201);

    } catch (error: any) {
        if (error.code === 'P2002') {
            return errorResponse(res, 'DUPLICATE_ERROR', 'Email already exists', 409);
        }
        return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
    }
};

// GET /users
export const getUsersController = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;

        if (!tenantId) {
            return errorResponse(res, 'UNAUTHORIZED', 'Tenant not found', 401);
        }

        const users = await getUsersByTenant(tenantId);
        return successResponse(res, users);

    } catch (error) {
        return errorResponse(res, 'SERVER_ERROR', 'Something went wrong', 500, error);
    }
};