import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';
import { UpdateNfcTagDto } from './dto/update-nfc-tag.dto';

@Injectable()
export class NfcTagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
  return this.prisma.nfcTag.findUnique({
    where: { id },
    include: {
      redirectLink: true,
      organization: true,
      campaign: true,
      store: true,
    },
  });
}

  async findAll() {
    return this.prisma.nfcTag.findMany({
      include: {
        organization: true,
        store: true,
        campaign: true,
        redirectLink: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.nfcTag.findUnique({
      where: { id },
      include: {
        organization: true,
        store: true,
        campaign: true,
        redirectLink: true,
      },
    });

    if (!item) {
      throw new NotFoundException('NFC tag not found');
    }

    return item;
  }

  async create(dto: CreateNfcTagDto) {
    return this.prisma.nfcTag.create({
      data: {
        organization: {
          connect: { id: dto.organizationId },
        },
        store: dto.storeId
          ? {
              connect: { id: dto.storeId },
            }
          : undefined,
        campaign: dto.campaignId
          ? {
              connect: { id: dto.campaignId },
            }
          : undefined,
        redirectLink: dto.redirectLinkId
          ? {
              connect: { id: dto.redirectLinkId },
            }
          : undefined,
        uid: dto.uid,
        serialNumber: dto.serialNumber,
        tagType: dto.tagType,
        label: dto.label,
        status: dto.status ?? 'ACTIVE',
      },
      include: {
        organization: true,
        store: true,
        campaign: true,
        redirectLink: true,
      },
    });
  }

  async update(id: string, dto: UpdateNfcTagDto) {
    await this.findOne(id);

    return this.prisma.nfcTag.update({
      where: { id },
      data: {
        uid: dto.uid,
        serialNumber: dto.serialNumber,
        tagType: dto.tagType,
        label: dto.label,
        status: dto.status,
        organization: dto.organizationId
          ? {
              connect: { id: dto.organizationId },
            }
          : undefined,
        store: dto.storeId
          ? {
              connect: { id: dto.storeId },
            }
          : undefined,
        campaign: dto.campaignId
          ? {
              connect: { id: dto.campaignId },
            }
          : undefined,
        redirectLink: dto.redirectLinkId
          ? {
              connect: { id: dto.redirectLinkId },
            }
          : undefined,
      },
      include: {
        organization: true,
        store: true,
        campaign: true,
        redirectLink: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.nfcTag.delete({
      where: { id },
    });
  }
}