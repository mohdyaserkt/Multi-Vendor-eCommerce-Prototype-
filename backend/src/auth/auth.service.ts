import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
  const user = await this.prisma.user.findUnique({
    where: { email },
    include: { 
      profile: true,
      seller: true  // Include seller info
    },
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    // Additional check for sellers - must be approved
    if (user.role === 'SELLER') {
      if (!user.seller) {
        throw new UnauthorizedException('Seller profile not found');
      }
      if (user.seller.status !== 'APPROVED') {
        throw new UnauthorizedException('Seller account pending approval. Please contact administrator.');
      }
    }
    
    const { password: _, ...result } = user;
    return result;
  }
  return null;
}
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        requires2FA: user.twoFactorEnabled,
      },
    };
  }

  async register(email: string, password: string, role: string, profile: any) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as any,
        twoFactorEnabled: true, // 2FA enabled by default
        profile: {
          create: profile,
        },
      },
      include: { profile: true },
    });

    // If seller, create seller record
    if (role === 'SELLER') {
      await this.prisma.seller.create({
        data: {
          userId: user.id,
          businessName: profile.firstName + ' ' + profile.lastName,
        },
      });
    }

    const { password: _, ...result } = user;
    return result;
  }


  async initiate2FA(email: string, password: string) {
    // Validate credentials
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate 6-digit OTP
    const otpToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create auth challenge that expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    const authChallenge = await this.prisma.authChallenge.create({
      data: {
        userId: user.id,
        passwordPassed: true,
        otpToken: otpToken,
        expiresAt: expiresAt,
      },
      include: { user: true }
    });

    // In production, you would send this OTP via SMS/email
    console.log(`OTP for ${email}: ${otpToken}`); // For testing

    return {
      authChallengeId: authChallenge.id,
      message: 'OTP sent to your registered email/phone',
      // In production, don't return the OTP! This is just for testing
      testOtp: otpToken, // Remove in production
    };
  }

  // Step 2: OTP verification - completes authentication
  async verify2FA(authChallengeId: string, otp: string) {
    // Find the auth challenge
    const authChallenge = await this.prisma.authChallenge.findUnique({
      where: { id: authChallengeId },
      include: { user: { include: { profile: true } } }
    });

    // Check if challenge exists
    if (!authChallenge) {
      throw new BadRequestException('Invalid authentication challenge');
    }

    // Check if challenge is expired
    if (new Date() > authChallenge.expiresAt) {
      throw new BadRequestException('Authentication challenge expired');
    }

    // Check if password was verified
    if (!authChallenge.passwordPassed) {
      throw new BadRequestException('Password verification not completed');
    }

    // Check if already verified
    if (authChallenge.otpVerified) {
      throw new BadRequestException('OTP already verified');
    }

    // Verify OTP
    if (authChallenge.otpToken !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Mark OTP as verified
    await this.prisma.authChallenge.update({
      where: { id: authChallengeId },
      data: { otpVerified: true }
    });

    // Generate JWT token
    const result = await this.login(authChallenge.user);
    
    return {
      ...result,
      message: '2FA verification successful'
    };
  }

  async resend2FA(authChallengeId: string) {
    // Find the auth challenge
    const authChallenge = await this.prisma.authChallenge.findUnique({
      where: { id: authChallengeId },
      include: { user: true }
    });

    // Check if challenge exists and is valid
    if (!authChallenge) {
      throw new BadRequestException('Invalid authentication challenge');
    }

    if (new Date() > authChallenge.expiresAt) {
      throw new BadRequestException('Authentication challenge expired');
    }

    if (authChallenge.otpVerified) {
      throw new BadRequestException('OTP already verified');
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update the challenge with new OTP
    await this.prisma.authChallenge.update({
      where: { id: authChallengeId },
      data: { otpToken: newOtp }
    });

    // In production, send via SMS/email
    console.log(`Resent OTP for ${authChallenge.user.email}: ${newOtp}`); // For testing

    return {
      success: true,
      message: 'New OTP sent successfully',
      // In production, don't return the OTP!
      testOtp: newOtp, // Remove in production
    };
  }

  // Clean up expired challenges (can be called periodically)
  async cleanupExpiredChallenges() {
    const now = new Date();
    await this.prisma.authChallenge.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
  }
}