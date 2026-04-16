-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('OWNER', 'ADMIN', 'CLIENT_ADMIN', 'MANAGER', 'ANALYST', 'FIELD_OPERATOR', 'VIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" "RoleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "plan" TEXT DEFAULT 'ENTERPRISE',
    "status" TEXT DEFAULT 'ACTIVE',
    "legalName" TEXT,
    "type" TEXT,
    "nip" TEXT,
    "regon" TEXT,
    "krs" TEXT,
    "vatEu" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "contactFirstName" TEXT,
    "contactLastName" TEXT,
    "contactPosition" TEXT,
    "street" TEXT,
    "buildingNo" TEXT,
    "unitNo" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "rootFolderId" TEXT,
    "rootFolderUrl" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "storesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrganizationRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOrganizationRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfcWriterJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storeId" TEXT,
    "campaignId" TEXT,
    "redirectLinkId" TEXT,
    "label" TEXT,
    "serialNumber" TEXT,
    "tagType" TEXT,
    "uid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfcWriterJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "zone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "objective" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "interactions" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "name" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT,
    "driveFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveFile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "folderId" TEXT,
    "name" TEXT NOT NULL,
    "mimeType" TEXT,
    "webViewLink" TEXT,
    "size" INTEGER,
    "modifiedTime" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "isFolder" BOOLEAN NOT NULL DEFAULT false,
    "parentDriveFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriveFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedirectLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "slug" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "fallbackUrl" TEXT,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedirectLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfcTag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storeId" TEXT,
    "campaignId" TEXT,
    "redirectLinkId" TEXT,
    "uid" TEXT NOT NULL,
    "serialNumber" TEXT,
    "tagType" TEXT,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfcTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignPage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'landing',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pageMode" TEXT NOT NULL DEFAULT 'hosted',
    "externalUrl" TEXT,
    "customDomain" TEXT,
    "jsonConfig" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "redirectLinkId" TEXT,
    "nfcTagId" TEXT,
    "sessionId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "platformName" TEXT NOT NULL DEFAULT 'LUMEVIO OS',
    "supportEmail" TEXT DEFAULT 'admin@lumevio.pl',
    "appBaseUrl" TEXT DEFAULT 'http://127.0.0.1:3000',
    "apiBaseUrl" TEXT DEFAULT 'http://127.0.0.1:3001',
    "goBaseUrl" TEXT DEFAULT 'http://127.0.0.1:3002',
    "defaultCampaignPreset" TEXT NOT NULL DEFAULT 'landing',
    "defaultPageMode" TEXT NOT NULL DEFAULT 'hosted',
    "defaultUtmSource" TEXT DEFAULT 'lumevio',
    "defaultUtmMedium" TEXT DEFAULT 'nfc',
    "trackIp" BOOLEAN NOT NULL DEFAULT true,
    "trackUserAgent" BOOLEAN NOT NULL DEFAULT true,
    "trackReferer" BOOLEAN NOT NULL DEFAULT true,
    "allowCustomDomains" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "primaryColor" TEXT DEFAULT '#6d7cff',
    "googleDriveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "googleAppsScriptUrl" TEXT,
    "googleDriveRootFolderId" TEXT,
    "googleDriveRootFolderUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreAisle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreAisle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreShelf" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aisleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreShelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreShelfRow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shelfId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreShelfRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreShelfSlot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "nfcTagId" TEXT,
    "productName" TEXT,
    "productSku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreShelfSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "UserOrganizationRole_userId_idx" ON "UserOrganizationRole"("userId");

-- CreateIndex
CREATE INDEX "UserOrganizationRole_organizationId_idx" ON "UserOrganizationRole"("organizationId");

-- CreateIndex
CREATE INDEX "UserOrganizationRole_roleId_idx" ON "UserOrganizationRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganizationRole_userId_organizationId_roleId_key" ON "UserOrganizationRole"("userId", "organizationId", "roleId");

-- CreateIndex
CREATE INDEX "NfcWriterJob_organizationId_createdAt_idx" ON "NfcWriterJob"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "NfcWriterJob_storeId_idx" ON "NfcWriterJob"("storeId");

-- CreateIndex
CREATE INDEX "NfcWriterJob_campaignId_idx" ON "NfcWriterJob"("campaignId");

-- CreateIndex
CREATE INDEX "NfcWriterJob_redirectLinkId_idx" ON "NfcWriterJob"("redirectLinkId");

-- CreateIndex
CREATE INDEX "NfcWriterJob_status_idx" ON "NfcWriterJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");

-- CreateIndex
CREATE INDEX "Store_organizationId_idx" ON "Store"("organizationId");

-- CreateIndex
CREATE INDEX "Store_code_idx" ON "Store"("code");

-- CreateIndex
CREATE INDEX "Store_city_idx" ON "Store"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_organizationId_idx" ON "Campaign"("organizationId");

-- CreateIndex
CREATE INDEX "Campaign_storeId_idx" ON "Campaign"("storeId");

-- CreateIndex
CREATE INDEX "Campaign_slug_idx" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");

-- CreateIndex
CREATE INDEX "Document_campaignId_idx" ON "Document"("campaignId");

-- CreateIndex
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "DriveFile_driveFileId_key" ON "DriveFile"("driveFileId");

-- CreateIndex
CREATE INDEX "DriveFile_organizationId_idx" ON "DriveFile"("organizationId");

-- CreateIndex
CREATE INDEX "DriveFile_driveFileId_idx" ON "DriveFile"("driveFileId");

-- CreateIndex
CREATE INDEX "DriveFile_folderId_idx" ON "DriveFile"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "RedirectLink_slug_key" ON "RedirectLink"("slug");

-- CreateIndex
CREATE INDEX "RedirectLink_organizationId_idx" ON "RedirectLink"("organizationId");

-- CreateIndex
CREATE INDEX "RedirectLink_campaignId_idx" ON "RedirectLink"("campaignId");

-- CreateIndex
CREATE INDEX "RedirectLink_slug_idx" ON "RedirectLink"("slug");

-- CreateIndex
CREATE INDEX "RedirectLink_isActive_idx" ON "RedirectLink"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NfcTag_uid_key" ON "NfcTag"("uid");

-- CreateIndex
CREATE INDEX "NfcTag_organizationId_idx" ON "NfcTag"("organizationId");

-- CreateIndex
CREATE INDEX "NfcTag_storeId_idx" ON "NfcTag"("storeId");

-- CreateIndex
CREATE INDEX "NfcTag_campaignId_idx" ON "NfcTag"("campaignId");

-- CreateIndex
CREATE INDEX "NfcTag_redirectLinkId_idx" ON "NfcTag"("redirectLinkId");

-- CreateIndex
CREATE INDEX "NfcTag_uid_idx" ON "NfcTag"("uid");

-- CreateIndex
CREATE INDEX "NfcTag_status_idx" ON "NfcTag"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignPage_slug_key" ON "CampaignPage"("slug");

-- CreateIndex
CREATE INDEX "CampaignPage_organizationId_idx" ON "CampaignPage"("organizationId");

-- CreateIndex
CREATE INDEX "CampaignPage_campaignId_idx" ON "CampaignPage"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignPage_slug_idx" ON "CampaignPage"("slug");

-- CreateIndex
CREATE INDEX "CampaignPage_status_idx" ON "CampaignPage"("status");

-- CreateIndex
CREATE INDEX "CampaignPage_pageMode_idx" ON "CampaignPage"("pageMode");

-- CreateIndex
CREATE INDEX "Event_organizationId_idx" ON "Event"("organizationId");

-- CreateIndex
CREATE INDEX "Event_campaignId_idx" ON "Event"("campaignId");

-- CreateIndex
CREATE INDEX "Event_redirectLinkId_idx" ON "Event"("redirectLinkId");

-- CreateIndex
CREATE INDEX "Event_nfcTagId_idx" ON "Event"("nfcTagId");

-- CreateIndex
CREATE INDEX "Event_sessionId_idx" ON "Event"("sessionId");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "StoreZone_storeId_idx" ON "StoreZone"("storeId");

-- CreateIndex
CREATE INDEX "StoreAisle_zoneId_idx" ON "StoreAisle"("zoneId");

-- CreateIndex
CREATE INDEX "StoreShelf_aisleId_idx" ON "StoreShelf"("aisleId");

-- CreateIndex
CREATE INDEX "StoreShelfRow_shelfId_idx" ON "StoreShelfRow"("shelfId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreShelfSlot_nfcTagId_key" ON "StoreShelfSlot"("nfcTagId");

-- CreateIndex
CREATE INDEX "StoreShelfSlot_rowId_idx" ON "StoreShelfSlot"("rowId");

-- AddForeignKey
ALTER TABLE "UserOrganizationRole" ADD CONSTRAINT "UserOrganizationRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganizationRole" ADD CONSTRAINT "UserOrganizationRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganizationRole" ADD CONSTRAINT "UserOrganizationRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfcWriterJob" ADD CONSTRAINT "NfcWriterJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfcWriterJob" ADD CONSTRAINT "NfcWriterJob_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfcWriterJob" ADD CONSTRAINT "NfcWriterJob_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfcWriterJob" ADD CONSTRAINT "NfcWriterJob_redirectLinkId_fkey" FOREIGN KEY ("redirectLinkId") REFERENCES "RedirectLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveFile" ADD CONSTRAINT "DriveFile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedirectLink" ADD CONSTRAINT "RedirectLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RedirectLink" ADD CONSTRAINT "RedirectLink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfcTag" ADD CONSTRAINT "NfcTag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfcTag" ADD CONSTRAINT "NfcTag_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfcTag" ADD CONSTRAINT "NfcTag_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfcTag" ADD CONSTRAINT "NfcTag_redirectLinkId_fkey" FOREIGN KEY ("redirectLinkId") REFERENCES "RedirectLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignPage" ADD CONSTRAINT "CampaignPage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignPage" ADD CONSTRAINT "CampaignPage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_redirectLinkId_fkey" FOREIGN KEY ("redirectLinkId") REFERENCES "RedirectLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_nfcTagId_fkey" FOREIGN KEY ("nfcTagId") REFERENCES "NfcTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreZone" ADD CONSTRAINT "StoreZone_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreAisle" ADD CONSTRAINT "StoreAisle_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "StoreZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreShelf" ADD CONSTRAINT "StoreShelf_aisleId_fkey" FOREIGN KEY ("aisleId") REFERENCES "StoreAisle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreShelfRow" ADD CONSTRAINT "StoreShelfRow_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "StoreShelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreShelfSlot" ADD CONSTRAINT "StoreShelfSlot_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "StoreShelfRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreShelfSlot" ADD CONSTRAINT "StoreShelfSlot_nfcTagId_fkey" FOREIGN KEY ("nfcTagId") REFERENCES "NfcTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
