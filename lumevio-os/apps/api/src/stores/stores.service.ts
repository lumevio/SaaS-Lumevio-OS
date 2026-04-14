import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.store.findMany({
      include: {
        organization: true,
        campaigns: true,
        nfcTags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.store.findUnique({
      where: { id },
      include: {
        organization: true,
        campaigns: true,
        nfcTags: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Store not found');
    }

    return item;
  }

  async create(dto: CreateStoreDto) {
    return this.prisma.store.create({
      data: {
        organization: {
          connect: { id: dto.organizationId },
        },
        name: dto.name,
        code: dto.code,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        zone: dto.zone,
        isActive: dto.isActive ?? true,
      },
      include: {
        organization: true,
      },
    });
  }

  async update(id: string, dto: UpdateStoreDto) {
    await this.findOne(id);

    return this.prisma.store.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        zone: dto.zone,
        isActive: dto.isActive,
        organization: dto.organizationId
          ? {
              connect: { id: dto.organizationId },
            }
          : undefined,
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