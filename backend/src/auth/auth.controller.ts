import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      const result = await this.authService.initiate2FA(
        loginDto.email,
        loginDto.password,
      );
      
      return {
        success: true,
        data: result,
        requires2FA: true,
        message: 'Please provide OTP to complete authentication'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  @Post('register')
  async register(
    @Body() registerDto: {
      email: string;
      password: string;
      role: string;
      profile: any;
    },
  ) {
    try {
      const user = await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.role,
        registerDto.profile,
      );
      
      return {
        success: true,
        message: 'Registration successful. Please check your email for verification code.',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed',
        error: error.message,
      };
    }
  }

  @Post('verify-2fa')
  async verify2FA(
    @Body() verifyDto: { authChallengeId: string; otp: string },
  ) {
    try {
      const result = await this.authService.verify2FA(
        verifyDto.authChallengeId,
        verifyDto.otp,
      );
      
      return {
        success: true,
        message: '2FA verification successful',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '2FA verification failed',
      };
    }
  }

  @Post('resend-2fa')
  async resend2FA(@Body() resendDto: { authChallengeId: string }) {
    try {
      const result = await this.authService.resend2FA(resendDto.authChallengeId);
      return {
        success: true,
        message: result.message,
        // For testing convenience - remove in production
        testOtp: result.testOtp,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to resend 2FA code',
      };
    }
  }
}