import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ENNotificationFilterType } from 'generated/prisma';
import { ENNotificationTimeFilters } from './notification.types';
import { Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';



@Injectable()
export class Notification2Service {
    constructor(private readonly prismaService: PrismaService) {}

    public async getAll(
        traderId: string,
        filters?: ENNotificationFilterType,
        timeFilters?: ENNotificationTimeFilters
    ) {
        const now = new Date();
        let timeCondition: Record<string, any> = {};

        if (timeFilters) {
            switch (timeFilters) {
                case ENNotificationTimeFilters.Read:
                    timeCondition = { read: true };
                    break;
                case ENNotificationTimeFilters.Unread:
                    timeCondition = { read: false };
                    break;
                case ENNotificationTimeFilters.Recent:
                    timeCondition = {
                        createdAt: {
                            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // last 7 days
                        },
                    };
                    break;
                case ENNotificationTimeFilters.Old:
                    timeCondition = {
                        createdAt: {
                            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),  // last 7 days
                        },
                    };
                    break;
            }
        }

        return this.prismaService.mNotification.findMany({
            where: {
                traderId,
                ...(filters ? { filterType: filters } : {}),
                ...timeCondition,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    public async getA(traderId: string, not_id: string) {
        const notification = await this.prismaService.mNotification.findFirst({
            where: { id: not_id, traderId },
        });

        if (!notification)
            throw new NotFoundException('Notification does not exist or does not belong to you');

        return notification;
    }

    public async markAsRead(traderId: string, not_id: string) {
        try {
            const updated = await this.prismaService.mNotification.updateMany({
                where: { id: not_id, traderId },
                data: { read: true },
            });

            if (updated.count === 0)
                throw new NotFoundException('Notification does not exist or does not belong to you');

            return { success: true, message: 'Notification marked as read' };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('Notification not found');
                }
            }
            throw error;
        }
    }
}
