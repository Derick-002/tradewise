import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'; 
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as idTools from 'id-tools';
import * as crypto from 'crypto';
import { 
    IJwtPayload, 
    TLoginDetails, 
    TOnboardingDetails, 
    TRegisterDetails, 
    TResetPasswordDetails, 
    TSendOtpDetails, 
    TUpdateDetails,
    TVerifyOtpDetails,
} from './auth.types';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { MTrader } from 'generated/prisma';
import generateOtp from 'src/custom/utils/generate.otp';
import { CurrencyService } from 'src/custom/utils/currency.md';
import { EPaymentMethod } from 'src/graphql/circular-dependency';
import { generatePT, generatePTId, verifyPT } from 'src/custom/utils/passanger-encrypt';

@Injectable()
export class AuthService {
    public constructor(
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly currencyService: CurrencyService
    ) {}
    
    private phoneOrEmail(phone?: string, email?: string, allowBoth = true) {
        if (!phone && !email) 
            throw new BadRequestException('Either phone or email is required');
        if (phone && email && !allowBoth)
            throw new BadRequestException('Phone and email cannot be used together');
    }

    public async getProfile(id: string) {
        const user = await this.prismaService.mTrader.findUnique({ where: { id } });
        if (!user) 
            throw new BadRequestException('User not found');
        return user;
    }

    public async generateToken(sub: string) {
        const payload: IJwtPayload = { sub, lastLoginAt: new Date() };
        return await this.jwtService.signAsync(payload, { expiresIn: '7d' });
    }

    public async register(details: TRegisterDetails) {
        const { email, phone, enterpriseName, password } = details;
        this.phoneOrEmail(phone, email);

        const existingUser = await this.prismaService.mTrader.findFirst({
            where: {
                OR: [ { email }, { phone } ]
            }
        });
        if (existingUser) 
            throw new BadRequestException('User with this phone or email already exists');

        const id = idTools.generateUlid();
        const pTId = generatePTId();
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await this.prismaService.mTrader.create({
            data: {
                id,
                pTId,
                email,
                phone,
                enterpriseName,
                password: hashedPassword,
                lastLogin: new Date()
            }
        });

        // initializing the settings
        await this.prismaService.mTraderSettings.create({
            data: {
                traderId: id,
                enterpriseDescription: '',
                name: enterpriseName
            }
        });

        // creating a stock
        await this.prismaService.mStock.create({
            data: {
                id: idTools.generateUlid(),
                traderId: id,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        return { newUser, pT: generatePT(pTId) };
    }

    public async login(details: TLoginDetails) {
        const { email, phone, password } = details;
        this.phoneOrEmail(phone, email, false);

        const user = await this.prismaService.mTrader.findFirst({
            where: {
                OR: [ { email }, { phone } ]
            }
        });
        if (!user) 
            throw new BadRequestException('Invalid credentials');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) 
            throw new BadRequestException('Invalid credentials');

        const pTId = generatePTId();
        const loginUser = await this.prismaService.mTrader.update({
            where: { id: user.id },
            data: { lastLogin: new Date(), pTId },
        });

        return { loginUser, pT: generatePT(pTId) };
    }

    public async update(details: TUpdateDetails, id: string) {
        let { email, phone, enterpriseName, password } = details;
        try {
            const updateData: Record<any, string> = {};
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updateData.password = hashedPassword;
            }
            if (email) updateData.email = email;
            if (phone) updateData.phone = phone;
            if (enterpriseName) updateData.enterpriseName = enterpriseName;
    
            const user = await this.prismaService.mTrader.update({
                where: { id },
                data: updateData
            });
    
            return user;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') 
                    throw new BadRequestException('Phone or email already exists');
                if (error.code === 'P2025') 
                    throw new BadRequestException('User not found');
            }

            throw new InternalServerErrorException(error.message ?? "Something went wrong");
        }
    }

    public async sendOtp(details: TSendOtpDetails) {
        const { email, phone, isPasswordReset } = details;
        this.phoneOrEmail(phone, email, false);

        const otp = generateOtp();
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        const user = await this.prismaService.mTrader.findFirst({
            where: {
                OR: [ { email }, { phone } ].filter(Boolean) as any
            },
        });

        if (!user) 
            throw new BadRequestException('User with this email not found');

        let updateData: Partial<MTrader>;
        if (isPasswordReset) {
            updateData = {
                resetPasswordToken: hashedOtp,
                resetPasswordExpires: new Date(Date.now() + 10 * 60 * 1000)
            };
        } else {
            updateData = {
                verifyAccountToken: hashedOtp,
                verifyAccountExpires: new Date(Date.now() + 10 * 60 * 1000)
            };
        }

        await this.prismaService.mTrader.update({
            where: { id: user.id },
            data: updateData
        });

        return otp;
    }

    public async verifyOtp(details: TVerifyOtpDetails) {
        const { email, phone, otp, isPasswordReset } = details;

        await this.phoneOrEmail(phone, email, false);
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await this.prismaService.mTrader.findFirst({
            where: {
                OR: [ { email }, { phone } ].filter(Boolean) as any,
                ...(isPasswordReset 
                    ? { resetPasswordToken: hashedOtp } 
                    : { verifyAccountToken: hashedOtp }
                ),
                ...(isPasswordReset 
                    ? { resetPasswordExpires: { gte: new Date() } } 
                    : { verifyAccountExpires: { gte: new Date() } }),
            },
        });

        if (!user) 
            throw new BadRequestException('Invalid or expired OTP');

        if(!isPasswordReset)
            await this.clearOtp(user.id);

        return user;
    }

    private async clearOtp(id: string) {
        await this.prismaService.mTrader.update({
            where: { id },
            data: { 
                verifyAccountToken: null,
                verifyAccountExpires: null,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });
    }

    public async resetPassword(details: TResetPasswordDetails, id: string) {
        const { password } = details;

        const user = await this.prismaService.mTrader.update({
            where: { id },
            data: { 
                password: await bcrypt.hash(password, 10),
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        return user;
    }

    public async checkAuth(traderId: string, passengerToken: string) {
        const pTpayload = verifyPT(passengerToken);
        if (!pTpayload)
            throw new UnauthorizedException('Invalid Passenger Token1');

        const pTId = generatePTId();
        const pT = generatePT(pTId);
        
        console.log("pTId", pTId);
        console.log("pTpayload.ulid", pTpayload.ulid);
        console.log("traderId", traderId);
        console.log("pT", pT);

        const traderExists = await this.prismaService.mTrader.findUnique({
            where: { pTId: pTpayload.ulid, id: traderId },
        });
        if (!traderExists) 
            throw new UnauthorizedException('Invalid Passenger Token2');

        const trade = await this.prismaService.mTrader.update({
            where: { id: traderId },
            data: { pTId }
        });

        return {
            verified: true,
            pT: pT
        };
    }

    public async getOnboarding(id: string) {
        const settings = await this.prismaService.mTraderSettings.findUnique({ where: { traderId: id } });
        if (!settings) 
            throw new BadRequestException('Trader onboarding settings not found');
        return settings;
    }

    public async onboarding(details: TOnboardingDetails, id: string) {
        const { 
            enterpriseDescription, 
            name,
            currency,
            businessType,
            industry,
            foundedYear,
            description,
            website,
            address,
            businessHours,
            phoneNumber,
            anualRevenue,
            numberOfEmployees,
            paymentMethod,
            targetMarket,
            competitors,
            goals,
        } = details;

        try {
            const updateData: Partial<{
                enterpriseDescription: string;
                name: string;
                currency: string;
                businessType: string;
                industry: string;
                foundedYear: number;
                description: string;
                website: string;
                address: string;
                businessHours: string;
                phoneNumber: string;
                anualRevenue: number;
                numberOfEmployees: number;
                paymentMethod: EPaymentMethod;
                targetMarket: string;
                competitors: string;
                goals: string;
            }> = {};

            if (enterpriseDescription) updateData.enterpriseDescription = enterpriseDescription;
            if (name) updateData.name = name;
            if (currency) updateData.currency = currency;
            if (businessType) updateData.businessType = businessType;
            if (industry) updateData.industry = industry;
            if (foundedYear) updateData.foundedYear = foundedYear;
            if (description) updateData.description = description;
            if (website) updateData.website = website;
            if (address) updateData.address = address;
            if (businessHours) updateData.businessHours = businessHours;
            if (phoneNumber) updateData.phoneNumber = phoneNumber;
            if (anualRevenue) updateData.anualRevenue = anualRevenue;
            if (numberOfEmployees) updateData.numberOfEmployees = numberOfEmployees;
            if (paymentMethod) updateData.paymentMethod = paymentMethod;
            if (targetMarket) updateData.targetMarket = targetMarket;
            if (competitors) updateData.competitors = competitors;
            if (goals) updateData.goals = goals;

            const settings = await this.prismaService.mTraderSettings.update({
                where: { traderId: id }, 
                data: updateData
            });
    
            return settings;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025')
                    throw new Error('User not found');
            }

            throw new InternalServerErrorException(error.message ?? "Something went wrong");
        }
    }
}
