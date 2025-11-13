import { Injectable, Logger } from '@nestjs/common';
import { Interval, Timeout } from '@nestjs/schedule';
import { NotificationService } from 'src/communication/notification/notification.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScheduleService {
    private readonly logger = new Logger(ScheduleService.name);

    public constructor(
        private readonly prismaService: PrismaService,
        private readonly notificationService: NotificationService,
    ) {}

    @Interval(5 * 60 * 1_000)  // for testing, in production it is for every_hour
    public async sendingFinancials() {
        const now = new Date();
        const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const financials = await this.prismaService.mFinancial.findMany({
            where: { isPaidBack: false },
            include: {
                stock: {
                    include: { trader: true }
                }
            }
        });

        let sentNotifications = 0;

        for (const f of financials) {
            const traderId = f.stock.trader.id;

            if(f.deadline && f.deadline >= now && f.deadline <= nextDay && !f.isNotified) {
                await this.notificationService.financialRemainder(traderId, f.type);
                await this.prismaService.mFinancial.update({
                    where: { id: f.id }, data: { isNotified: true },
                });
                sentNotifications++;
                continue;
            }

            if(!f.deadline) {
                const diffTime = now.getTime() - f.createdAt.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0 && diffDays % 2 === 0) {
                    await this.notificationService.financialRemainder(traderId, f.type);
                    sentNotifications++;
                }
            }

            this.logger.log(`Sent ${sentNotifications} financial notifications.`);
        }
    }

    @Interval(5 * 60 * 1_000)
    public async alertLowStocks() {
        const stockImages = await this.prismaService.mStockImage.findMany({
            where: { notified: false },
            include: { stock: { include: { trader: true } } }
        });

        const lowStockImages = stockImages.filter(si => si.quantity <= si.low_stock_quantity);
        let sentNotifications = 0;

        for (const s of lowStockImages) {
            const traderId = s.stock.trader.id;
            await this.notificationService.lowStockAlert(traderId, s.id);
            sentNotifications++;
        }

        this.logger.log(`Sent ${sentNotifications} low stock notifications.`);
    }

    @Interval(10 * 60 * 1_000)
    public async clearOldForgotPasswordOtps() {
        const cutoffDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

        const deleted = await this.prismaService.mTrader.updateMany({
            where: { resetPasswordExpires: { lt: cutoffDate } },
            data: { resetPasswordExpires: null, resetPasswordToken: null },
        });

        this.logger.log(`Cleared ${deleted.count} old forgot password OTPs(Tokens).`);
    }

    @Interval(10 * 60 * 1_000)
    public async clearOldVerifyEmailOtps() {
        const cutoffDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

        const deleted = await this.prismaService.mTrader.updateMany({
            where: { verifyAccountExpires: { lt: cutoffDate } },
            data: { verifyAccountExpires: null, verifyAccountToken: null },
        });

        this.logger.log(`Cleared ${deleted.count} old verify email OTPs(Tokens).`);
    }
}
