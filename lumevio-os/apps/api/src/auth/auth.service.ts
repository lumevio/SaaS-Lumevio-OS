import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        organizationRoles: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                plan: true,
              },
            },
            role: {
              select: {
                id: true,
                key: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Nieprawidłowy email lub hasło");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Nieprawidłowy email lub hasło");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isPlatformAdmin: user.isPlatformAdmin ?? false,
      organizations: user.organizationRoles.map((item) => ({
        organizationId: item.organization.id,
        organizationName: item.organization.name,
        organizationSlug: item.organization.slug,
        roleKey: item.role.key,
        roleName: item.role.name,
      })),
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isPlatformAdmin: user.isPlatformAdmin ?? false,
        organizations: user.organizationRoles.map((item) => ({
          organizationId: item.organization.id,
          organizationName: item.organization.name,
          organizationSlug: item.organization.slug,
          organizationStatus: item.organization.status,
          organizationPlan: item.organization.plan,
          roleKey: item.role.key,
          roleName: item.role.name,
        })),
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationRoles: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                plan: true,
              },
            },
            role: {
              select: {
                id: true,
                key: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async seedAdmin() {
    const email = "admin@lumevio.pl";
    const password = "123456";

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        firstName: "Przemek",
        lastName: "Admin",
        isPlatformAdmin: true,
      },
      create: {
        email,
        passwordHash,
        firstName: "Przemek",
        lastName: "Admin",
        isPlatformAdmin: true,
      },
    });

    return {
      message: "Admin gotowy",
      email,
      password,
      userId: user.id,
    };
  }
}