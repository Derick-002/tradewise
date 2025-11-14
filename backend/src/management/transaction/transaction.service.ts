import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TTransactionCreateDetails } from './transaction.types';
import { ENTransactionType, MProduct } from 'generated/prisma';
import { generateUlid } from 'id-tools';
import { TFinancialCreateDetails } from '../financials/financials.types';
import { FinancialsService } from '../financials/financials.service';
import { ApolloError } from 'apollo-server-express';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

@Injectable()
export class TransactionService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly financialService: FinancialsService,
    ) { }

    public async getAllTransactions(traderId: string, type?: string) {
        const stock = await this.prismaService.mStock.findUnique({
            where: { traderId }
        });
        if (!stock) throw new BadRequestException("Stock not found");

        let transactionType: ENTransactionType | undefined;
        if (type === "Sale") transactionType = ENTransactionType.Sale;
        else if (type === "Purchase") transactionType = ENTransactionType.Purchase;

        console.log("Transaction Type: ", transactionType);
        const transactions = await this.prismaService.mTransaction.findMany({
            where: {
                stockId: stock.id,
                ...(transactionType ? { type: transactionType } : {})
            },
            orderBy: { createdAt: 'desc' },
            include: {
                products: true,
                stock: { include: { trader: true } },
                financials: true,
            },
        });

        return transactions;
    }

    public async getTransactionById(traderId: string, transactionId: string) {
        const stock = await this.prismaService.mStock.findUnique({
            where: { traderId }
        });
        if (!stock)
            throw new BadRequestException("Stock not found");

        const transaction = await this.prismaService.mTransaction.findFirst({
            where: { id: transactionId, stockId: stock.id },
            include: {
                products: true,
                stock: { include: { trader: true } },
                financials: true,
            },
        });
        if (!transaction)
            throw new BadRequestException("Transaction not found");

        return transaction;
    }

    public async createTransaction(
        traderId: string,
        details: TTransactionCreateDetails,
        financialDetails?: TFinancialCreateDetails,
    ) {
        const { type, description, secondParty, products } = details;

        const stock = await this.prismaService.mStock.findFirst({
            where: { traderId },
        });
        if (!stock) throw new BadRequestException("Stock not found");

        const now = new Date();
        const stockImagesMap: Record<string, { id: string; quantity: number }> = {};
        const missingProducts: string[] = [];
        const quantityErrors: string[] = [];

        for (const product of products) {
            if (!stockImagesMap[product.name]) {
                const stockImg = await this.prismaService.mStockImage.findUnique({
                    where: { name_stockId: { name: product.name, stockId: stock.id } },
                    select: { id: true, quantity: true },
                });
                if (!stockImg) {
                    missingProducts.push(product.name);
                } else {
                    stockImagesMap[product.name] = { id: stockImg.id, quantity: stockImg.quantity };
                }
            }
        }

        if (missingProducts.length > 0) {
            quantityErrors.push(
                `The following products are missing stock images: ${missingProducts.join(", ")}`
            );
        }

        const combinedProducts: Record<string, { quantity: number; price: number }> = {};
        for (const product of products) {
            if (!combinedProducts[product.name]) {
                combinedProducts[product.name] = { quantity: product.quantity, price: product.price };
            } else {
                combinedProducts[product.name].quantity += product.quantity;
            }
        }

        for (const [name, { quantity }] of Object.entries(combinedProducts)) {
            const stockImg = stockImagesMap[name];
            if (type === "Sale" && stockImg.quantity < quantity) {
                quantityErrors.push(
                    `Not enough stock for ${name}. Available: ${stockImg.quantity}, requested: ${quantity}`
                );
            }
        }

        // if (quantityErrors.length > 0) {
        //     throw new BadRequestException({ error: quantityErrors});
        // }

        if (quantityErrors.length > 0) {
            throw new ApolloError(
                JSON.stringify(quantityErrors),
                'BAD_REQUEST'
            );
        }

        return await this.prismaService.$transaction(async prisma => {
            for (const [name, { quantity }] of Object.entries(combinedProducts)) {
                const stockImg = stockImagesMap[name];
                await prisma.mStockImage.update({
                    where: { id: stockImg.id },
                    data:
                        type === "Purchase"
                            ? { quantity: { increment: quantity } }
                            : { quantity: { decrement: quantity } },
                });
            }

            const validatedProducts = products.map(p => ({
                id: generateUlid(),
                name: p.name,
                price: p.price,
                stockImageId: stockImagesMap[p.name].id,
                quantity: p.quantity,
                createdAt: now,
                updatedAt: now,
            }));

            const transaction = await prisma.mTransaction.create({
                data: {
                    id: generateUlid(),
                    type,
                    description,
                    secondParty,
                    stockId: stock.id,
                    products: { create: validatedProducts },
                    financials: financialDetails
                        ? {
                            create: {
                                id: generateUlid(),
                                type: financialDetails.type,
                                amount: financialDetails.amount,
                                description: financialDetails.description,
                                collateral: financialDetails.collateral,
                                deadline: financialDetails.deadline ?? undefined,
                                stockId: stock.id,
                            },
                        }
                        : undefined,
                },
                include: {
                    products: { orderBy: { createdAt: "desc" } },
                    stock: { include: { trader: true } },
                    financials: true,
                },
            });

            return transaction;
        });
    }

}
