import { Body, Controller, Get, InternalServerErrorException, Patch, Post, Put, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { IJwtPayload } from './auth.types';
import { ConfigService } from '@nestjs/config';
import { ValidatedBody } from 'src/custom/decorators/validate.decorator';
import { loginSchema, onboardingSchema, registerSchema, updateSchema } from './auth.dto-schema';
import { CurrentUser } from 'src/custom/decorators/currentUser.decorator';
import { ProtectedRouteGuard } from 'src/custom/guards/protected-route/protected-route.guard';
import { UnProtectedRouteGuard } from 'src/custom/guards/un-protected-route/un-protected-route.guard';
import { SanitizeInterceptor } from 'src/custom/interceptors/sanitize/sanitize.interceptor';
import { EmailService } from 'src/communication/email/email.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService
    ) {}
    
    private time = 7 * 24 * 60 * 60 * 1000;
    
    @UseGuards(ProtectedRouteGuard)
    @UseInterceptors(SanitizeInterceptor)
    @Get()
    public async get(
        @CurrentUser() user: IJwtPayload
    ) {
        return this.authService.getProfile(user.sub);
    }
    
    // @UseGuards(UnProtectedRouteGuard)
    @UseInterceptors(SanitizeInterceptor)
    @Post('register')
    public async register(
        @ValidatedBody(registerSchema) dto: any,
        @Res({ passthrough: true }) res: Response
    ) {
        const output = await this.authService.register(dto);
        
        const token = await this.authService.generateToken(output.newUser.id);
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: this.time // for 7 days
        });

        try {
            // create the verify email token and send email
            const otp = await this.authService.sendOtp({ email: output.newUser.email as string, isPasswordReset: false });
            await this.emailService.verifyAccount(otp, output.newUser.email as string);
        } catch (error) {
            throw new InternalServerErrorException('Failed to send email', error.message);
        }
 
        return output;
    }
    
    // @UseGuards(UnProtectedRouteGuard)
    @UseInterceptors(SanitizeInterceptor)
    @Post('login')
    public async login(
        @ValidatedBody(loginSchema) dto: any,
        @Res({ passthrough: true }) res: Response
    ) {
        const output = await this.authService.login(dto);
        
        const token = await this.authService.generateToken(output.loginUser.id);
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: this.time // for 7 days
        });
        
        return output;
    }
    
    @UseGuards(ProtectedRouteGuard)
    @Post('logout')
    public async logout(
        @Res({ passthrough: true }) res: Response,
    ) {
        res.clearCookie('accessToken');
        return { message: 'Logout' };
    }
    
    @UseGuards(ProtectedRouteGuard)
    @UseInterceptors(SanitizeInterceptor)
    @Patch()
    public async update(
        @ValidatedBody(updateSchema) dto: any,
        @CurrentUser() user: IJwtPayload
    ) {
        return this.authService.update(dto, user.sub);
    }
    
    @UseGuards(ProtectedRouteGuard)
    @Post('onboarding')
    public async onboarding(
        @ValidatedBody(onboardingSchema) dto: any,
        @CurrentUser() user: IJwtPayload,
    ) {
        return this.authService.onboarding(dto, user.sub);
    }

    @Get('settings')
    @UseGuards(ProtectedRouteGuard)
    public async getSettings(
        @CurrentUser() user: IJwtPayload,
    ) {
        return this.authService.getSettings(user.sub);
    }

    @Post('check')
    @UseGuards(ProtectedRouteGuard)
    public async checkAuth(
        @CurrentUser() user: IJwtPayload,
        @Body() body: any
    ){
        return this.authService.checkAuth(user.sub, body.pT);
    }
}
