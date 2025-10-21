import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import * as path from 'path';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AuthModule } from './auth/auth.module';
import { CommunicationModule } from './communication/communication.module';
import { EmailService } from './communication/email/email.service';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsMiddleware } from './custom/middlewares/settings/settings.middleware';
import { ManagementModule } from './management/management.module';
import { IJwtPayload } from './auth/auth.types';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>("jwt_secret"),
                signOptions: { expiresIn: '7d' }
            }),
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: path.join(process.cwd(), 'src/graphql/schema.gql'),
            sortSchema: true,
            context: ({ req, res }) => {
                const jwtService = new JwtService();
                const configService = new ConfigService();
                const token = req.cookies?.accessToken || req.headers['authorization']?.split(' ')[1];

                let user: IJwtPayload | undefined = undefined;
                if (token) {
                    try {
                        user = jwtService.verify(token, { secret: configService.get('jwt_secret') }) as IJwtPayload;
                    } catch (err) {
                        user = undefined;
                    }
                }
                
                req.user = user;
                return { req, res, user }; 
            },
        }),
        ThrottlerModule.forRoot([{
            ttl: 60,
            limit: 5,
        }]),
        ScheduleModule,
        AuthModule,
        CommunicationModule,
        PrismaModule,
        ManagementModule,
    ],
    controllers: [AppController],
    providers: [AppService, AppResolver, EmailService],
})
export class AppModule implements NestModule {
    public configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(SettingsMiddleware)
            .forRoutes('*path')
    }
}
