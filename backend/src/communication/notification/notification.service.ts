import { Injectable } from '@nestjs/common';
import { ENFinancialType, ENNotificationFilterType, ENNotificationImpact } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()  // for returning messsage - working with schedule
export class NotificationService {
    public constructor(
        private readonly prismaService: PrismaService
    ) {}

    public async financialRemainder(traderId: string, type: ENFinancialType) {
        // if trader exists
        const traderExists = await this.prismaService.mTrader.findUnique({
            where: { id: traderId }
        });
        if(!traderExists)
            return;

        const title = 'Financial Reminder';
        const message =
            type === ENFinancialType.Credit
                ? 'You have an upcoming payment due. Please ensure you have sufficient balance before the deadline.'
                : 'A debit transaction reminder: please review your recent transactions.';

        const notification = await this.prismaService.mNotification.create({
            data: {
                traderId, title, message,
                type: 'financial_remainder',
                impact: ENNotificationImpact.High,
                filterType: ENNotificationFilterType.WARNING
            }
        });
    }

    public async lowStockAlert(traderId: string, stockImageId: string) {
        // if trader exists
        const traderExists = await this.prismaService.mTrader.findUnique({
            where: { id: traderId }
        });
        if(!traderExists) return;

        const stockImage = await this.prismaService.mStockImage.findUnique({
            where: { id: stockImageId }
        });
        if(!stockImage) return;

        const title = 'Low Stock Alert';
        const message = `You have low stock. On ${stockImage.name}. Please ensure you have sufficient balance before the deadline.`;

        const notification = await this.prismaService.mNotification.create({
            data: {
                traderId, title, message,
                type: 'low_stock_alert',
                impact: ENNotificationImpact.High,
                filterType: ENNotificationFilterType.WARNING
            }
        });

        // update the stockimage
        await this.prismaService.mStockImage.update({
            where: { id: stockImageId },
            data: { notified: true }
        });
    }
}
