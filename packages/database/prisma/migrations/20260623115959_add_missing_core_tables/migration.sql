-- Catch-up: CREATE missing core tables/enums that schema.prisma defines
-- but no prior migration created. Placed immediately before
-- 20260623120000_social_post_persona_types (which ALTERs SocialPost).
--
-- Intentionally OMITTED from SocialPost (added by the next migration):
-- authorRole, type, linkedProductId, linkedServiceId, linkedCampaignId,
-- adoptionMeta, isPinned, isFeatured (+ indexes on type/authorRole).
-- SocialPostType enum is also created by that next migration — not here.

-- CreateEnum
CREATE TYPE "SupportCategory" AS ENUM ('ACCOUNT', 'ORDER', 'PAYMENT', 'PET', 'PARTNER', 'ONG', 'TECHNICAL', 'OTHER');

CREATE TYPE "MessageReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED');

CREATE TYPE "ConversationContextType" AS ENUM ('GENERAL', 'PRODUCT', 'SERVICE', 'ORDER', 'APPOINTMENT', 'ADOPTION', 'CAMPAIGN', 'SUPPORT');

CREATE TYPE "AdoptionRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TYPE "CampaignCategory" AS ENUM ('FOOD', 'MEDICINE', 'NEUTERING', 'FOSTER', 'RESCUE', 'TRANSPORT', 'EVENT', 'MAINTENANCE');

CREATE TYPE "CampaignUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TYPE "SocialPostVisibility" AS ENUM ('PUBLIC', 'FOLLOWERS', 'PRIVATE');

CREATE TYPE "SocialPostStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REPORTED', 'REMOVED');

CREATE TYPE "SocialCommentStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REPORTED', 'REMOVED');

CREATE TYPE "SocialMediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

CREATE TYPE "SocialReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED');

CREATE TYPE "SocialReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE', 'VIOLENCE', 'SEXUAL_CONTENT', 'ANIMAL_ABUSE', 'SCAM', 'MISINFORMATION', 'OTHER');

CREATE TYPE "PublicProfileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

CREATE TYPE "DataPrivacyRequestType" AS ENUM ('EXPORT', 'DELETE_ACCOUNT', 'RECTIFY', 'REVOKE_CONSENT');

CREATE TYPE "DataPrivacyRequestStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageReport" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "MessageReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdoptionRequest" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "ongId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "AdoptionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "history" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdoptionRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "ongId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "CampaignCategory" NOT NULL,
    "urgency" "CampaignUrgency" NOT NULL DEFAULT 'NORMAL',
    "goalAmount" DOUBLE PRECISION,
    "raisedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "neededItems" JSONB,
    "photos" JSONB,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "petId" TEXT,
    "content" TEXT NOT NULL,
    "visibility" "SocialPostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "SocialPostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "locationText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "moderatedAt" TIMESTAMP(3),
    "moderatedById" TEXT,
    "moderationReason" TEXT,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialPostMedia" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mediaType" "SocialMediaType" NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialPostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostLike_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "content" TEXT NOT NULL,
    "status" "SocialCommentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "moderatedAt" TIMESTAMP(3),
    "moderatedById" TEXT,
    "moderationReason" TEXT,

    CONSTRAINT "SocialComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialCommentLike_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialPostSave" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostSave_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialPostShare" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetConversationId" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialReport" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "reporterId" TEXT NOT NULL,
    "reason" "SocialReportReason" NOT NULL,
    "description" TEXT,
    "status" "SocialReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialPostHashtag" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPostHashtag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublicProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "visibility" "PublicProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSocialBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSocialBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataPrivacyRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DataPrivacyRequestType" NOT NULL,
    "status" "DataPrivacyRequestStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedById" TEXT,
    "resolution" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataPrivacyRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UploadAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'cloudinary',
    "secureUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "resourceType" TEXT,
    "format" TEXT,
    "bytes" INTEGER,
    "originalFilename" TEXT,
    "folder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

CREATE INDEX "PushSubscription_userId_revokedAt_idx" ON "PushSubscription"("userId", "revokedAt");

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId");

CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId", "userId", "emoji");

CREATE INDEX "MessageReport_status_idx" ON "MessageReport"("status");

CREATE INDEX "MessageReport_conversationId_idx" ON "MessageReport"("conversationId");

CREATE INDEX "MessageReport_messageId_idx" ON "MessageReport"("messageId");

CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

CREATE INDEX "AdoptionRequest_ongId_idx" ON "AdoptionRequest"("ongId");

CREATE INDEX "AdoptionRequest_requesterId_idx" ON "AdoptionRequest"("requesterId");

CREATE INDEX "AdoptionRequest_listingId_idx" ON "AdoptionRequest"("listingId");

CREATE INDEX "AdoptionRequest_status_idx" ON "AdoptionRequest"("status");

CREATE INDEX "Campaign_ongId_idx" ON "Campaign"("ongId");

CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

CREATE INDEX "SocialPost_authorId_idx" ON "SocialPost"("authorId");

CREATE INDEX "SocialPost_createdAt_idx" ON "SocialPost"("createdAt");

CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");

CREATE INDEX "SocialPost_visibility_idx" ON "SocialPost"("visibility");

CREATE INDEX "SocialPost_petId_idx" ON "SocialPost"("petId");

CREATE INDEX "SocialPostMedia_postId_idx" ON "SocialPostMedia"("postId");

CREATE INDEX "SocialPostLike_postId_idx" ON "SocialPostLike"("postId");

CREATE INDEX "SocialPostLike_userId_idx" ON "SocialPostLike"("userId");

CREATE UNIQUE INDEX "SocialPostLike_postId_userId_key" ON "SocialPostLike"("postId", "userId");

CREATE INDEX "SocialComment_postId_idx" ON "SocialComment"("postId");

CREATE INDEX "SocialComment_authorId_idx" ON "SocialComment"("authorId");

CREATE INDEX "SocialComment_parentCommentId_idx" ON "SocialComment"("parentCommentId");

CREATE INDEX "SocialCommentLike_commentId_idx" ON "SocialCommentLike"("commentId");

CREATE INDEX "SocialCommentLike_userId_idx" ON "SocialCommentLike"("userId");

CREATE UNIQUE INDEX "SocialCommentLike_commentId_userId_key" ON "SocialCommentLike"("commentId", "userId");

CREATE INDEX "SocialPostSave_userId_idx" ON "SocialPostSave"("userId");

CREATE UNIQUE INDEX "SocialPostSave_postId_userId_key" ON "SocialPostSave"("postId", "userId");

CREATE INDEX "SocialPostShare_userId_idx" ON "SocialPostShare"("userId");

CREATE INDEX "SocialPostShare_postId_idx" ON "SocialPostShare"("postId");

CREATE INDEX "SocialReport_status_idx" ON "SocialReport"("status");

CREATE INDEX "SocialReport_postId_idx" ON "SocialReport"("postId");

CREATE INDEX "SocialReport_commentId_idx" ON "SocialReport"("commentId");

CREATE INDEX "SocialReport_reporterId_idx" ON "SocialReport"("reporterId");

CREATE INDEX "SocialPostHashtag_hashtagId_idx" ON "SocialPostHashtag"("hashtagId");

CREATE UNIQUE INDEX "SocialPostHashtag_postId_hashtagId_key" ON "SocialPostHashtag"("postId", "hashtagId");

CREATE UNIQUE INDEX "PublicProfile_userId_key" ON "PublicProfile"("userId");

CREATE INDEX "PublicProfile_userId_idx" ON "PublicProfile"("userId");

CREATE INDEX "UserFollow_followerId_idx" ON "UserFollow"("followerId");

CREATE INDEX "UserFollow_followingId_idx" ON "UserFollow"("followingId");

CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

CREATE INDEX "UserSocialBlock_blockerId_idx" ON "UserSocialBlock"("blockerId");

CREATE INDEX "UserSocialBlock_blockedId_idx" ON "UserSocialBlock"("blockedId");

CREATE UNIQUE INDEX "UserSocialBlock_blockerId_blockedId_key" ON "UserSocialBlock"("blockerId", "blockedId");

CREATE INDEX "DataPrivacyRequest_userId_status_idx" ON "DataPrivacyRequest"("userId", "status");

CREATE INDEX "DataPrivacyRequest_status_requestedAt_idx" ON "DataPrivacyRequest"("status", "requestedAt");

CREATE INDEX "DataPrivacyRequest_type_idx" ON "DataPrivacyRequest"("type");

CREATE INDEX "UploadAsset_ownerId_idx" ON "UploadAsset"("ownerId");

CREATE INDEX "UploadAsset_purpose_idx" ON "UploadAsset"("purpose");

CREATE INDEX "UploadAsset_publicId_idx" ON "UploadAsset"("publicId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AdoptionListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdoptionRequest" ADD CONSTRAINT "AdoptionRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialPostMedia" ADD CONSTRAINT "SocialPostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialPostLike" ADD CONSTRAINT "SocialPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialPostLike" ADD CONSTRAINT "SocialPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "SocialComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialCommentLike" ADD CONSTRAINT "SocialCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SocialComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialCommentLike" ADD CONSTRAINT "SocialCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialPostSave" ADD CONSTRAINT "SocialPostSave_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialPostSave" ADD CONSTRAINT "SocialPostSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialPostShare" ADD CONSTRAINT "SocialPostShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialPostShare" ADD CONSTRAINT "SocialPostShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialPostShare" ADD CONSTRAINT "SocialPostShare_targetConversationId_fkey" FOREIGN KEY ("targetConversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialReport" ADD CONSTRAINT "SocialReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialReport" ADD CONSTRAINT "SocialReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SocialComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialReport" ADD CONSTRAINT "SocialReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialReport" ADD CONSTRAINT "SocialReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SocialPostHashtag" ADD CONSTRAINT "SocialPostHashtag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialPostHashtag" ADD CONSTRAINT "SocialPostHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PublicProfile" ADD CONSTRAINT "PublicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSocialBlock" ADD CONSTRAINT "UserSocialBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSocialBlock" ADD CONSTRAINT "UserSocialBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DataPrivacyRequest" ADD CONSTRAINT "DataPrivacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DataPrivacyRequest" ADD CONSTRAINT "DataPrivacyRequest_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
