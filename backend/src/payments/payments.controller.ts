import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('razorpay/order/:orderId')
  createRazorpayOrder(@Request() req, @Param('orderId') orderId: string) {
    return this.paymentsService.createOrderPayment(orderId, req.user.userId);
  }

  @Post('razorpay/verify')
  @HttpCode(HttpStatus.OK)
  verifyRazorpayPayment(@Request() req, @Body() verifyPaymentDto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(
      verifyPaymentDto.razorpay_order_id,
      verifyPaymentDto.razorpay_payment_id,
      verifyPaymentDto.razorpay_signature,
    );
  }

  @Post('razorpay/failure')
  @HttpCode(HttpStatus.OK)
  handleRazorpayFailure(
    @Request() req,
    @Body() failureDto: { razorpay_order_id: string; reason?: string },
  ) {
    return this.paymentsService.handlePaymentFailure(
      failureDto.razorpay_order_id,
      failureDto.reason,
    );
  }

  @Post('refund/:orderId')
  processRefund(@Request() req, @Param('orderId') orderId: string, @Body() refundDto: { amount?: number }) {
    return this.paymentsService.refundPayment(orderId, req.user.userId, refundDto.amount);
  }

  @Get('status/:orderId')
  getPaymentStatus(@Request() req, @Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId, req.user.userId);
  }
}