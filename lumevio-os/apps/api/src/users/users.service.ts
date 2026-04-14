import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        organizationRoles: {
          select: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            role: {
              select: {
                key: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async create(dto: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    organizationId: string;
  }) {
    const email = dto.email.trim().toLowerCase();

    if (!email || !dto.password || !dto.organizationId) {
      throw new BadRequestException("Brakuje wymaganych pól");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException("Użytkownik o tym emailu już istnieje");
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true, name: true },
    });

    if (!organization) {
      throw new BadRequestException("Organizacja nie istnieje");
    }

    const role = await this.prisma.role.findUnique({
      where: { key: "CLIENT_ADMIN" },
      select: { id: true, key: true, name: true },
    });

    if (!role) {
      throw new BadRequestException(
        "Brak roli CLIENT_ADMIN w bazie. Uruchom seed."
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName?.trim() || null,
        lastName: dto.lastName?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    await this.prisma.userOrganizationRole.create({
      data: {
        userId: user.id,
        organizationId: dto.organizationId,
        roleId: role.id,
      },
    });

    return {
      success: true,
      user,
      organization: {
        id: organization.id,
        name: organization.name,
      },
      role: {
        key: role.key,
        name: role.name,
      },
    };
  }
}