import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.store.findMany({
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!store) {
      throw new NotFoundException("Store not found");
    }

    return store;
  }

  async create(dto: CreateStoreDto) {
    if (!dto.organizationId) {
      throw new BadRequestException("organizationId is required");
    }

    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException("name is required");
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    return this.prisma.store.create({
      data: {
        organization: {
          connect: {
            id: dto.organizationId,
          },
        },
        name: dto.name.trim(),
        code: dto.code?.trim() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        country: dto.country?.trim() || null,
        zone: dto.zone?.trim() || null,
        isActive: dto.isActive ?? true,
      },
      include: {
        organization: true,
      },
    });
  }

  async update(id: string, dto: UpdateStoreDto) {
    await this.findOne(id);

    if (dto.organizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
      });

      if (!organization) {
        throw new NotFoundException("Organization not found");
      }
    }

    return this.prisma.store.update({
      where: { id },
      data: {
        ...(dto.organizationId
          ? {
              organization: {
                connect: {
                  id: dto.organizationId,
                },
              },
            }
          : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code?.trim() || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address?.trim() || null } : {}),
        ...(dto.city !== undefined ? { city: dto.city?.trim() || null } : {}),
        ...(dto.country !== undefined ? { country: dto.country?.trim() || null } : {}),
        ...(dto.zone !== undefined ? { zone: dto.zone?.trim() || null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        organization: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.store.delete({
      where: { id },
    });
  }
}