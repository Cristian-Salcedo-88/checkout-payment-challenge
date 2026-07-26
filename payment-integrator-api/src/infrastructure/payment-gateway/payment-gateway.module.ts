import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PAYMENT_GATEWAY } from '../../domain/payment/payment-gateway.port';
import { PaymentGatewayHttpClient } from './payment-gateway-http.client';

@Module({
  imports: [ConfigModule, HttpModule.register({ timeout: 10_000 })],
  providers: [{ provide: PAYMENT_GATEWAY, useClass: PaymentGatewayHttpClient }],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentGatewayModule {}
