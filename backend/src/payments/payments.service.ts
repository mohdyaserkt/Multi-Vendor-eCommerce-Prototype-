import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get<string>('RAZORPAY_SECRET'),
    });
  }

  async createOrderPayment(orderId: string, userId: string) {
    // Get order details
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== 'PENDING') {
      throw new BadRequestException('Payment already processed for this order');
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(order.totalAmount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: order.orderNumber,
      payment_capture: 1, // Auto-capture payment
    };

    try {
      const razorpayOrder = await this.razorpay.orders.create(options);

      // Update order with payment intent ID
      await this.prisma.order.update({
        where: { id: orderId },
         data:{
          paymentIntentId: razorpayOrder.id,
        },
      });

      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      };
    } catch (error) {
      throw new BadRequestException('Failed to create payment order: ' + error.message);
    }
  }

  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    // Verify payment signature
    const shasum = crypto.createHmac('sha256', this.configService.get<string>('RAZORPAY_SECRET')!);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      throw new BadRequestException('Payment verification failed');
    }

    // Get order by payment intent ID
    const order = await this.prisma.order.findFirst({
      where: {
        paymentIntentId: razorpayOrderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found for this payment');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
       data:{
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    });

    // Add to status history
    await this.prisma.orderStatusHistory.create({
       data:{
        orderId: order.id,
        status: 'CONFIRMED',
        remarks: 'Payment successful via Razorpay',
      },
    });

    return {
      success: true,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      paymentId: razorpayPaymentId,
      message: 'Payment verified successfully',
    };
  }

  async handlePaymentFailure(razorpayOrderId: string, reason?: string) {
    // Get order by payment intent ID
    const order = await this.prisma.order.findFirst({
      where: {
        paymentIntentId: razorpayOrderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found for this payment');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
       data:{
        paymentStatus: 'FAILED',
      },
    });

    // Add to status history
    await this.prisma.orderStatusHistory.create({
       data:{
        orderId: order.id,
        status: 'PENDING',
        remarks: `Payment failed: ${reason || 'Unknown reason'}`,
      },
    });

    return {
      success: true,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      message: 'Payment failure recorded',
    };
  }

  async refundPayment(orderId: string, userId: string, amount?: number) {
    // Get order details
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== 'PAID') {
      throw new BadRequestException('Order payment not completed');
    }

    if (!order.paymentIntentId) {
      throw new BadRequestException('Payment intent not found');
    }

    // For Razorpay, we would typically create a refund
    // This is a mock implementation - in production, you'd use Razorpay's refund API
    const refundAmount = amount ? Math.round(amount * 100) : Math.round(order.totalAmount * 100);

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
       data:{
        paymentStatus: 'REFUNDED',
      },
    });

    // Add to status history
    await this.prisma.orderStatusHistory.create({
       data:{
        orderId: orderId,
        status: 'CANCELLED',
        remarks: `Refund processed for ₹${(refundAmount / 100).toFixed(2)}`,
      },
    });

    return {
      success: true,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      refundAmount: refundAmount / 100,
      message: 'Refund processed successfully',
    };
  }

  async getPaymentStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      paymentIntentId: order.paymentIntentId,
    };
  }
}