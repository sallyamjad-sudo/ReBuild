-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('CENTRAL', 'PROJECT');

-- CreateEnum
CREATE TYPE "AttributeDataType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'ENUM');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'DISPOSAL');

-- CreateEnum
CREATE TYPE "MaterialRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('FULL_MATCH', 'PARTIAL_MATCH', 'NO_MATCH');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONSUMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalWorkflowOperationType" AS ENUM ('TRANSFER', 'PROCUREMENT', 'STOCK_ADJUSTMENT', 'DAMAGE_DISPOSAL', 'PROJECT_REALLOCATION');

-- CreateEnum
CREATE TYPE "ApprovalRequestOperationType" AS ENUM ('TRANSFER', 'PROCUREMENT', 'STOCK_ADJUSTMENT', 'DAMAGE_DISPOSAL', 'PROJECT_REALLOCATION');

-- CreateEnum
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalDecisionDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStepInstanceStatus" AS ENUM ('WAITING', 'ACTIVE', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "DamageReportReason" AS ENUM ('TRANSPORT_DAMAGE', 'STORAGE_DAMAGE', 'EXPIRED', 'DEFECTIVE', 'ACCIDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DamageReportStatus" AS ENUM ('REPORTED', 'UNDER_INSPECTION', 'ASSESSED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DamageAssessmentCondition" AS ENUM ('USABLE', 'RECOVERABLE', 'RECYCLABLE', 'UNUSABLE');

-- CreateEnum
CREATE TYPE "MaterialRecoveryRecoveryType" AS ENUM ('RETURN_TO_STOCK', 'ALTERNATIVE_USE', 'REPAIR', 'REPROCESS');

-- CreateEnum
CREATE TYPE "MaterialRecoveryStatus" AS ENUM ('PROPOSED', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WasteRecordWasteType" AS ENUM ('RECYCLING', 'DISPOSAL');

-- CreateEnum
CREATE TYPE "WasteRecordStatus" AS ENUM ('PLANNED', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TraceabilityCodeCodeType" AS ENUM ('QR', 'BARCODE');

-- CreateEnum
CREATE TYPE "TraceabilityCodeStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "ScanEventScanType" AS ENUM ('LOOKUP', 'RECEIPT', 'DISPATCH', 'TRANSFER', 'INSPECTION', 'INVENTORY_CHECK');

-- CreateEnum
CREATE TYPE "ScanEventResult" AS ENUM ('SUCCESS', 'DENIED', 'INVALID');

-- CreateEnum
CREATE TYPE "InventoryInspectionInspectionType" AS ENUM ('ROUTINE', 'DAMAGE_CHECK', 'STOCK_COUNT', 'RECEIPT_CHECK');

-- CreateEnum
CREATE TYPE "InventoryInspectionStatus" AS ENUM ('PENDING', 'COMPLETED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CompanyMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "RoleAssignmentScopeType" AS ENUM ('COMPANY', 'PROJECT', 'SITE');

-- CreateEnum
CREATE TYPE "MaterialDemandSource" AS ENUM ('BOQ', 'MATERIAL_REQUEST', 'FORECAST', 'MANUAL');

-- CreateEnum
CREATE TYPE "MaterialDemandStatus" AS ENUM ('OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BOQStatus" AS ENUM ('DRAFT', 'APPROVED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OptimizationRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OptimizationRunObjective" AS ENUM ('MINIMUM_COST', 'BALANCED');

-- CreateEnum
CREATE TYPE "OptimizationOptionOptionType" AS ENUM ('TRANSFER', 'PURCHASE', 'MIXED');

-- CreateEnum
CREATE TYPE "SimulationScenarioStatus" AS ENUM ('DRAFT', 'READY', 'RUNNING', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SimulationRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SimulationOutcomeOutcomeType" AS ENUM ('COST', 'TIME', 'MATERIAL_USAGE', 'WASTE', 'RESOURCE_ALLOCATION');

-- CreateEnum
CREATE TYPE "SustainabilityMetricMetricType" AS ENUM ('WASTE_REDUCTION', 'MATERIAL_REUSE', 'RECYCLING', 'TRANSPORT_EMISSIONS');

-- CreateEnum
CREATE TYPE "PredictionRunPredictionType" AS ENUM ('DEMAND_FORECAST', 'SHORTAGE_RISK', 'ANOMALY_DETECTION');

-- CreateEnum
CREATE TYPE "PredictionRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AnomalyRecordSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AnomalyRecordStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DocumentRecordDocumentType" AS ENUM ('BOQ', 'PURCHASE_ORDER', 'INVOICE', 'DELIVERY_NOTE', 'CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "OptimizationOptionSourceType" AS ENUM ('INVENTORY', 'SUPPLIER_OFFER');

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" "CompanyStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" TEXT,
    "status" "SiteStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "name" VARCHAR(200) NOT NULL,
    "warehouseType" "WarehouseType" NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "siteId" UUID,
    "warehouseId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialCategory" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MaterialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "dataType" "AttributeDataType" NOT NULL,
    "unit" VARCHAR(30),

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryAttribute" (
    "categoryId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isHardConstraint" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("categoryId","attributeId")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "baseUnit" VARCHAR(30) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialAttributeValue" (
    "materialId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "MaterialAttributeValue_pkey" PRIMARY KEY ("materialId","attributeId")
);

-- CreateTable
CREATE TABLE "MaterialBatch" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "batchCode" VARCHAR(100) NOT NULL,
    "supplierId" UUID,
    "receivedAt" TIMESTAMP(3),
    "manufacturedAt" DATE,
    "expiresAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryStock" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "usableQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "quarantinedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "damagedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "sourceLocationId" UUID,
    "destinationLocationId" UUID,
    "quantity" DECIMAL(18,3) NOT NULL,
    "movementType" "StockMovementType" NOT NULL,
    "referenceId" UUID,
    "performedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAllocation" (
    "id" UUID NOT NULL,
    "inventoryStockId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequest" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "status" "MaterialRequestStatus" NOT NULL,
    "priority" "RequestPriority" NOT NULL,
    "requiredByDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequestItem" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "requestedQuantity" DECIMAL(18,3) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "singleBatchOnly" BOOLEAN NOT NULL DEFAULT false,
    "technicalRequirements" JSONB,
    "notes" TEXT,

    CONSTRAINT "MaterialRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" UUID NOT NULL,
    "requestItemId" UUID NOT NULL,
    "algorithmVersion" VARCHAR(50) NOT NULL,
    "status" "MatchStatus" NOT NULL,
    "requestedQuantity" DECIMAL(18,3) NOT NULL,
    "proposedCoveredQuantity" DECIMAL(18,3) NOT NULL,
    "remainingQuantity" DECIMAL(18,3) NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchCandidate" (
    "id" UUID NOT NULL,
    "matchResultId" UUID NOT NULL,
    "inventoryStockId" UUID NOT NULL,
    "eligibleQuantity" DECIMAL(18,3) NOT NULL,
    "proposedQuantity" DECIMAL(18,3) NOT NULL,
    "matchScore" DECIMAL(5,2) NOT NULL,
    "rank" INTEGER NOT NULL,
    "explanation" JSONB,

    CONSTRAINT "MatchCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" UUID NOT NULL,
    "requestItemId" UUID NOT NULL,
    "inventoryStockId" UUID NOT NULL,
    "projectAllocationId" UUID,
    "quantity" DECIMAL(18,3) NOT NULL,
    "status" "ReservationStatus" NOT NULL,
    "reservedById" UUID NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "sourceLocationId" UUID NOT NULL,
    "destinationLocationId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "status" "TransferStatus" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "dispatchedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferItem" (
    "id" UUID NOT NULL,
    "transferId" UUID NOT NULL,
    "reservationId" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "plannedQuantity" DECIMAL(18,3) NOT NULL,
    "dispatchedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "receivedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "damagedInTransitQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "TransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflow" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "operationType" "ApprovalWorkflowOperationType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "requiredPermissionId" UUID NOT NULL,
    "minimumApprovals" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "operationType" "ApprovalRequestOperationType" NOT NULL,
    "operationId" UUID NOT NULL,
    "status" "ApprovalRequestStatus" NOT NULL,
    "currentStepOrder" INTEGER,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDecision" (
    "id" UUID NOT NULL,
    "approvalRequestId" UUID NOT NULL,
    "approvalStepId" UUID NOT NULL,
    "decidedById" UUID NOT NULL,
    "approvalStepInstanceId" UUID NOT NULL,
    "decision" "ApprovalDecisionDecision" NOT NULL,
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStepInstance" (
    "id" UUID NOT NULL,
    "approvalRequestId" UUID NOT NULL,
    "approvalStepId" UUID NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "requiredApprovals" INTEGER NOT NULL,
    "status" "ApprovalStepInstanceStatus" NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalStepInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageReport" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "inventoryStockId" UUID NOT NULL,
    "reportedById" UUID NOT NULL,
    "reportedQuantity" DECIMAL(18,3) NOT NULL,
    "reason" "DamageReportReason" NOT NULL,
    "description" TEXT,
    "status" "DamageReportStatus" NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DamageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DamageAssessment" (
    "id" UUID NOT NULL,
    "damageReportId" UUID NOT NULL,
    "assessedById" UUID NOT NULL,
    "assessedQuantity" DECIMAL(18,3) NOT NULL,
    "condition" "DamageAssessmentCondition" NOT NULL,
    "findings" TEXT,
    "recommendations" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DamageAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRecovery" (
    "id" UUID NOT NULL,
    "damageAssessmentId" UUID NOT NULL,
    "inventoryStockId" UUID NOT NULL,
    "recoveryType" "MaterialRecoveryRecoveryType" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "status" "MaterialRecoveryStatus" NOT NULL,
    "approvedById" UUID,
    "recoveryCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteRecord" (
    "id" UUID NOT NULL,
    "damageAssessmentId" UUID,
    "inventoryStockId" UUID NOT NULL,
    "wasteType" "WasteRecordWasteType" NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    "status" "WasteRecordStatus" NOT NULL,
    "reason" TEXT,
    "handlingCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "recordedById" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WasteRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraceabilityCode" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "materialBatchId" UUID,
    "inventoryStockId" UUID,
    "codeValue" VARCHAR(255) NOT NULL,
    "codeType" "TraceabilityCodeCodeType" NOT NULL,
    "status" "TraceabilityCodeStatus" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TraceabilityCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanEvent" (
    "id" UUID NOT NULL,
    "traceabilityCodeId" UUID NOT NULL,
    "scannedById" UUID NOT NULL,
    "locationId" UUID,
    "scanType" "ScanEventScanType" NOT NULL,
    "result" "ScanEventResult" NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ScanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryInspection" (
    "id" UUID NOT NULL,
    "inventoryStockId" UUID NOT NULL,
    "inspectedById" UUID NOT NULL,
    "inspectionType" "InventoryInspectionInspectionType" NOT NULL,
    "recordedQuantity" DECIMAL(18,3),
    "observedQuantity" DECIMAL(18,3),
    "conditionNotes" TEXT,
    "status" "InventoryInspectionStatus" NOT NULL,
    "inspectedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30),
    "status" "UserStatus" NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "CompanyMemberStatus" NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "code" VARCHAR(150) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" UUID NOT NULL,
    "companyMemberId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "scopeType" "RoleAssignmentScopeType" NOT NULL,
    "projectId" UUID,
    "siteId" UUID,
    "assignedById" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "actorUserId" UUID,
    "action" VARCHAR(150) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" UUID,
    "previousValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialDemand" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "siteId" UUID,
    "materialId" UUID NOT NULL,
    "requestItemId" UUID,
    "requiredQuantity" DECIMAL(18,3) NOT NULL,
    "fulfilledQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "requiredByDate" DATE,
    "source" "MaterialDemandSource" NOT NULL,
    "status" "MaterialDemandStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurplusAssessment" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "availableQuantity" DECIMAL(18,3) NOT NULL,
    "projectedDemand" DECIMAL(18,3) NOT NULL,
    "safetyStock" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "surplusQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "shortageQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "planningHorizonDays" INTEGER NOT NULL,

    CONSTRAINT "SurplusAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOQ" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "BOQStatus" NOT NULL,
    "preparedById" UUID NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BOQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOQItem" (
    "id" UUID NOT NULL,
    "boqId" UUID NOT NULL,
    "itemCode" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "materialId" UUID,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "estimatedUnitCost" DECIMAL(18,2),

    CONSTRAINT "BOQItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "contactEmail" VARCHAR(255),
    "contactPhone" VARCHAR(30),
    "address" TEXT,
    "status" "SupplierStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierMaterialOffer" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "minimumOrderQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "estimatedLeadTimeDays" INTEGER,
    "validFrom" DATE,
    "validUntil" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierMaterialOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "status" "PurchaseRequestStatus" NOT NULL,
    "requiredByDate" DATE,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequestItem" (
    "id" UUID NOT NULL,
    "purchaseRequestId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "demandId" UUID,
    "requestedQuantity" DECIMAL(18,3) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "estimatedUnitCost" DECIMAL(18,2),
    "notes" TEXT,

    CONSTRAINT "PurchaseRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "orderNumber" VARCHAR(100) NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "expectedDeliveryDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" UUID NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "purchaseRequestItemId" UUID,
    "materialId" UUID NOT NULL,
    "orderedQuantity" DECIMAL(18,3) NOT NULL,
    "receivedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationRun" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "requestItemId" UUID NOT NULL,
    "matchResultId" UUID,
    "algorithmVersion" VARCHAR(50) NOT NULL,
    "status" "OptimizationRunStatus" NOT NULL,
    "objective" "OptimizationRunObjective" NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "parameters" JSONB,

    CONSTRAINT "OptimizationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationOption" (
    "id" UUID NOT NULL,
    "optimizationRunId" UUID NOT NULL,
    "optionType" "OptimizationOptionOptionType" NOT NULL,
    "totalCost" DECIMAL(18,2) NOT NULL,
    "transportCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "purchaseCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estimatedLeadTimeDays" INTEGER,
    "coveredQuantity" DECIMAL(18,3) NOT NULL,
    "remainingQuantity" DECIMAL(18,3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,

    CONSTRAINT "OptimizationOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "createdById" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "SimulationScenarioStatus" NOT NULL,
    "baselineDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationRun" (
    "id" UUID NOT NULL,
    "scenarioId" UUID NOT NULL,
    "algorithmVersion" VARCHAR(50) NOT NULL,
    "status" "SimulationRunStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "inputSnapshot" JSONB NOT NULL,
    "parameters" JSONB NOT NULL,
    "resultSummary" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationOutcome" (
    "id" UUID NOT NULL,
    "simulationRunId" UUID NOT NULL,
    "outcomeType" "SimulationOutcomeOutcomeType" NOT NULL,
    "metricName" VARCHAR(150) NOT NULL,
    "metricValue" DECIMAL(18,4) NOT NULL,
    "unit" VARCHAR(30),
    "details" JSONB,

    CONSTRAINT "SimulationOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "metricCode" VARCHAR(150) NOT NULL,
    "metricValue" DECIMAL(18,4) NOT NULL,
    "metricUnit" VARCHAR(30),
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SustainabilityMetric" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "metricType" "SustainabilityMetricMetricType" NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "calculationMethod" VARCHAR(200) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "SustainabilityMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionRun" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "modelName" VARCHAR(150) NOT NULL,
    "modelVersion" VARCHAR(50) NOT NULL,
    "predictionType" "PredictionRunPredictionType" NOT NULL,
    "status" "PredictionRunStatus" NOT NULL,
    "inputPeriodStart" TIMESTAMP(3),
    "inputPeriodEnd" TIMESTAMP(3),
    "parameters" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PredictionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictionResult" (
    "id" UUID NOT NULL,
    "predictionRunId" UUID NOT NULL,
    "materialId" UUID,
    "locationId" UUID,
    "predictedValue" DECIMAL(18,4) NOT NULL,
    "unit" VARCHAR(30) NOT NULL,
    "forecastDate" DATE,
    "confidenceScore" DECIMAL(5,4),
    "details" JSONB,

    CONSTRAINT "PredictionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnomalyRecord" (
    "id" UUID NOT NULL,
    "predictionRunId" UUID NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" UUID NOT NULL,
    "anomalyType" VARCHAR(150) NOT NULL,
    "severity" "AnomalyRecordSeverity" NOT NULL,
    "anomalyScore" DECIMAL(5,4),
    "explanation" TEXT,
    "status" "AnomalyRecordStatus" NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "AnomalyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierEvaluation" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "evaluatedById" UUID NOT NULL,
    "qualityScore" DECIMAL(5,2),
    "deliveryScore" DECIMAL(5,2),
    "priceScore" DECIMAL(5,2),
    "overallScore" DECIMAL(5,2),
    "evaluationPeriodStart" DATE,
    "evaluationPeriodEnd" DATE,
    "notes" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRecord" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "projectId" UUID,
    "documentType" "DocumentRecordDocumentType" NOT NULL,
    "originalFileName" VARCHAR(255) NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "mimeType" VARCHAR(150) NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationOptionLine" (
    "id" UUID NOT NULL,
    "optimizationOptionId" UUID NOT NULL,
    "sourceType" "OptimizationOptionSourceType" NOT NULL,
    "inventoryStockId" UUID,
    "supplierMaterialOfferId" UUID,
    "quantity" DECIMAL(18,3) NOT NULL,
    "estimatedUnitCost" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierId" UUID,

    CONSTRAINT "OptimizationOptionLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReceiptLine" (
    "id" UUID NOT NULL,
    "purchaseOrderItemId" UUID NOT NULL,
    "materialBatchId" UUID NOT NULL,
    "receivedQuantity" DECIMAL(18,3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" UUID NOT NULL,
    "notes" TEXT,
    "purchaseOrderId" UUID,

    CONSTRAINT "PurchaseReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_companyId_code_key" ON "Project"("companyId", "code");

-- CreateIndex
CREATE INDEX "Site_projectId_idx" ON "Site"("projectId");

-- CreateIndex
CREATE INDEX "Warehouse_companyId_idx" ON "Warehouse"("companyId");

-- CreateIndex
CREATE INDEX "Warehouse_projectId_idx" ON "Warehouse"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_siteId_key" ON "InventoryLocation"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_warehouseId_key" ON "InventoryLocation"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryLocation_companyId_idx" ON "InventoryLocation"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialCategory_code_key" ON "MaterialCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_code_key" ON "AttributeDefinition"("code");

-- CreateIndex
CREATE INDEX "CategoryAttribute_categoryId_idx" ON "CategoryAttribute"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryAttribute_attributeId_idx" ON "CategoryAttribute"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE INDEX "Material_categoryId_idx" ON "Material"("categoryId");

-- CreateIndex
CREATE INDEX "MaterialAttributeValue_materialId_idx" ON "MaterialAttributeValue"("materialId");

-- CreateIndex
CREATE INDEX "MaterialAttributeValue_attributeId_idx" ON "MaterialAttributeValue"("attributeId");

-- CreateIndex
CREATE INDEX "MaterialBatch_materialId_idx" ON "MaterialBatch"("materialId");

-- CreateIndex
CREATE INDEX "MaterialBatch_supplierId_idx" ON "MaterialBatch"("supplierId");

-- CreateIndex
CREATE INDEX "InventoryStock_batchId_idx" ON "InventoryStock"("batchId");

-- CreateIndex
CREATE INDEX "InventoryStock_locationId_idx" ON "InventoryStock"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryStock_batchId_locationId_key" ON "InventoryStock"("batchId", "locationId");

-- CreateIndex
CREATE INDEX "StockMovement_batchId_idx" ON "StockMovement"("batchId");

-- CreateIndex
CREATE INDEX "StockMovement_sourceLocationId_idx" ON "StockMovement"("sourceLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_destinationLocationId_idx" ON "StockMovement"("destinationLocationId");

-- CreateIndex
CREATE INDEX "StockMovement_performedById_idx" ON "StockMovement"("performedById");

-- CreateIndex
CREATE INDEX "ProjectAllocation_inventoryStockId_idx" ON "ProjectAllocation"("inventoryStockId");

-- CreateIndex
CREATE INDEX "ProjectAllocation_projectId_idx" ON "ProjectAllocation"("projectId");

-- CreateIndex
CREATE INDEX "MaterialRequest_companyId_idx" ON "MaterialRequest"("companyId");

-- CreateIndex
CREATE INDEX "MaterialRequest_projectId_idx" ON "MaterialRequest"("projectId");

-- CreateIndex
CREATE INDEX "MaterialRequest_siteId_idx" ON "MaterialRequest"("siteId");

-- CreateIndex
CREATE INDEX "MaterialRequest_requestedById_idx" ON "MaterialRequest"("requestedById");

-- CreateIndex
CREATE INDEX "MaterialRequestItem_requestId_idx" ON "MaterialRequestItem"("requestId");

-- CreateIndex
CREATE INDEX "MaterialRequestItem_materialId_idx" ON "MaterialRequestItem"("materialId");

-- CreateIndex
CREATE INDEX "MatchResult_requestItemId_idx" ON "MatchResult"("requestItemId");

-- CreateIndex
CREATE INDEX "MatchCandidate_matchResultId_idx" ON "MatchCandidate"("matchResultId");

-- CreateIndex
CREATE INDEX "MatchCandidate_inventoryStockId_idx" ON "MatchCandidate"("inventoryStockId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchCandidate_matchResultId_rank_key" ON "MatchCandidate"("matchResultId", "rank");

-- CreateIndex
CREATE INDEX "Reservation_requestItemId_idx" ON "Reservation"("requestItemId");

-- CreateIndex
CREATE INDEX "Reservation_inventoryStockId_idx" ON "Reservation"("inventoryStockId");

-- CreateIndex
CREATE INDEX "Reservation_projectAllocationId_idx" ON "Reservation"("projectAllocationId");

-- CreateIndex
CREATE INDEX "Reservation_reservedById_idx" ON "Reservation"("reservedById");

-- CreateIndex
CREATE INDEX "Transfer_companyId_idx" ON "Transfer"("companyId");

-- CreateIndex
CREATE INDEX "Transfer_sourceLocationId_idx" ON "Transfer"("sourceLocationId");

-- CreateIndex
CREATE INDEX "Transfer_destinationLocationId_idx" ON "Transfer"("destinationLocationId");

-- CreateIndex
CREATE INDEX "Transfer_requestedById_idx" ON "Transfer"("requestedById");

-- CreateIndex
CREATE INDEX "TransferItem_transferId_idx" ON "TransferItem"("transferId");

-- CreateIndex
CREATE INDEX "TransferItem_reservationId_idx" ON "TransferItem"("reservationId");

-- CreateIndex
CREATE INDEX "TransferItem_batchId_idx" ON "TransferItem"("batchId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_companyId_idx" ON "ApprovalWorkflow"("companyId");

-- CreateIndex
CREATE INDEX "ApprovalStep_workflowId_idx" ON "ApprovalStep"("workflowId");

-- CreateIndex
CREATE INDEX "ApprovalStep_requiredPermissionId_idx" ON "ApprovalStep"("requiredPermissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStep_workflowId_stepOrder_key" ON "ApprovalStep"("workflowId", "stepOrder");

-- CreateIndex
CREATE INDEX "ApprovalRequest_workflowId_idx" ON "ApprovalRequest"("workflowId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedById_idx" ON "ApprovalRequest"("requestedById");

-- CreateIndex
CREATE INDEX "ApprovalDecision_approvalRequestId_idx" ON "ApprovalDecision"("approvalRequestId");

-- CreateIndex
CREATE INDEX "ApprovalDecision_approvalStepId_idx" ON "ApprovalDecision"("approvalStepId");

-- CreateIndex
CREATE INDEX "ApprovalDecision_decidedById_idx" ON "ApprovalDecision"("decidedById");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalDecision_approvalStepInstanceId_decidedById_key" ON "ApprovalDecision"("approvalStepInstanceId", "decidedById");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_approvalRequestId_idx" ON "ApprovalStepInstance"("approvalRequestId");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_approvalStepId_idx" ON "ApprovalStepInstance"("approvalStepId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStepInstance_approvalRequestId_stepOrder_key" ON "ApprovalStepInstance"("approvalRequestId", "stepOrder");

-- CreateIndex
CREATE INDEX "DamageReport_companyId_idx" ON "DamageReport"("companyId");

-- CreateIndex
CREATE INDEX "DamageReport_inventoryStockId_idx" ON "DamageReport"("inventoryStockId");

-- CreateIndex
CREATE INDEX "DamageReport_reportedById_idx" ON "DamageReport"("reportedById");

-- CreateIndex
CREATE INDEX "DamageAssessment_damageReportId_idx" ON "DamageAssessment"("damageReportId");

-- CreateIndex
CREATE INDEX "DamageAssessment_assessedById_idx" ON "DamageAssessment"("assessedById");

-- CreateIndex
CREATE INDEX "MaterialRecovery_damageAssessmentId_idx" ON "MaterialRecovery"("damageAssessmentId");

-- CreateIndex
CREATE INDEX "MaterialRecovery_inventoryStockId_idx" ON "MaterialRecovery"("inventoryStockId");

-- CreateIndex
CREATE INDEX "MaterialRecovery_approvedById_idx" ON "MaterialRecovery"("approvedById");

-- CreateIndex
CREATE INDEX "WasteRecord_damageAssessmentId_idx" ON "WasteRecord"("damageAssessmentId");

-- CreateIndex
CREATE INDEX "WasteRecord_inventoryStockId_idx" ON "WasteRecord"("inventoryStockId");

-- CreateIndex
CREATE INDEX "WasteRecord_recordedById_idx" ON "WasteRecord"("recordedById");

-- CreateIndex
CREATE INDEX "TraceabilityCode_companyId_idx" ON "TraceabilityCode"("companyId");

-- CreateIndex
CREATE INDEX "TraceabilityCode_materialBatchId_idx" ON "TraceabilityCode"("materialBatchId");

-- CreateIndex
CREATE INDEX "TraceabilityCode_inventoryStockId_idx" ON "TraceabilityCode"("inventoryStockId");

-- CreateIndex
CREATE INDEX "ScanEvent_traceabilityCodeId_idx" ON "ScanEvent"("traceabilityCodeId");

-- CreateIndex
CREATE INDEX "ScanEvent_scannedById_idx" ON "ScanEvent"("scannedById");

-- CreateIndex
CREATE INDEX "ScanEvent_locationId_idx" ON "ScanEvent"("locationId");

-- CreateIndex
CREATE INDEX "InventoryInspection_inventoryStockId_idx" ON "InventoryInspection"("inventoryStockId");

-- CreateIndex
CREATE INDEX "InventoryInspection_inspectedById_idx" ON "InventoryInspection"("inspectedById");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_idx" ON "CompanyMember"("companyId");

-- CreateIndex
CREATE INDEX "CompanyMember_userId_idx" ON "CompanyMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_companyId_userId_key" ON "CompanyMember"("companyId", "userId");

-- CreateIndex
CREATE INDEX "Role_companyId_idx" ON "Role"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_companyId_code_key" ON "Role"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "RoleAssignment_companyMemberId_idx" ON "RoleAssignment"("companyMemberId");

-- CreateIndex
CREATE INDEX "RoleAssignment_roleId_idx" ON "RoleAssignment"("roleId");

-- CreateIndex
CREATE INDEX "RoleAssignment_projectId_idx" ON "RoleAssignment"("projectId");

-- CreateIndex
CREATE INDEX "RoleAssignment_siteId_idx" ON "RoleAssignment"("siteId");

-- CreateIndex
CREATE INDEX "RoleAssignment_assignedById_idx" ON "RoleAssignment"("assignedById");

-- CreateIndex
CREATE INDEX "AuditLog_companyId_idx" ON "AuditLog"("companyId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "MaterialDemand_companyId_idx" ON "MaterialDemand"("companyId");

-- CreateIndex
CREATE INDEX "MaterialDemand_projectId_idx" ON "MaterialDemand"("projectId");

-- CreateIndex
CREATE INDEX "MaterialDemand_siteId_idx" ON "MaterialDemand"("siteId");

-- CreateIndex
CREATE INDEX "MaterialDemand_materialId_idx" ON "MaterialDemand"("materialId");

-- CreateIndex
CREATE INDEX "MaterialDemand_requestItemId_idx" ON "MaterialDemand"("requestItemId");

-- CreateIndex
CREATE INDEX "SurplusAssessment_companyId_idx" ON "SurplusAssessment"("companyId");

-- CreateIndex
CREATE INDEX "SurplusAssessment_materialId_idx" ON "SurplusAssessment"("materialId");

-- CreateIndex
CREATE INDEX "SurplusAssessment_locationId_idx" ON "SurplusAssessment"("locationId");

-- CreateIndex
CREATE INDEX "BOQ_projectId_idx" ON "BOQ"("projectId");

-- CreateIndex
CREATE INDEX "BOQ_preparedById_idx" ON "BOQ"("preparedById");

-- CreateIndex
CREATE UNIQUE INDEX "BOQ_projectId_code_version_key" ON "BOQ"("projectId", "code", "version");

-- CreateIndex
CREATE INDEX "BOQItem_boqId_idx" ON "BOQItem"("boqId");

-- CreateIndex
CREATE INDEX "BOQItem_materialId_idx" ON "BOQItem"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "BOQItem_boqId_itemCode_key" ON "BOQItem"("boqId", "itemCode");

-- CreateIndex
CREATE INDEX "Supplier_companyId_idx" ON "Supplier"("companyId");

-- CreateIndex
CREATE INDEX "SupplierMaterialOffer_supplierId_idx" ON "SupplierMaterialOffer"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierMaterialOffer_materialId_idx" ON "SupplierMaterialOffer"("materialId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_companyId_idx" ON "PurchaseRequest"("companyId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_projectId_idx" ON "PurchaseRequest"("projectId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_requestedById_idx" ON "PurchaseRequest"("requestedById");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_purchaseRequestId_idx" ON "PurchaseRequestItem"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_materialId_idx" ON "PurchaseRequestItem"("materialId");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_demandId_idx" ON "PurchaseRequestItem"("demandId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_companyId_idx" ON "PurchaseOrder"("companyId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_projectId_idx" ON "PurchaseOrder"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_companyId_orderNumber_key" ON "PurchaseOrder"("companyId", "orderNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseRequestItemId_idx" ON "PurchaseOrderItem"("purchaseRequestItemId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_materialId_idx" ON "PurchaseOrderItem"("materialId");

-- CreateIndex
CREATE INDEX "OptimizationRun_companyId_idx" ON "OptimizationRun"("companyId");

-- CreateIndex
CREATE INDEX "OptimizationRun_requestItemId_idx" ON "OptimizationRun"("requestItemId");

-- CreateIndex
CREATE INDEX "OptimizationRun_matchResultId_idx" ON "OptimizationRun"("matchResultId");

-- CreateIndex
CREATE INDEX "OptimizationOption_optimizationRunId_idx" ON "OptimizationOption"("optimizationRunId");

-- CreateIndex
CREATE UNIQUE INDEX "OptimizationOption_optimizationRunId_rank_key" ON "OptimizationOption"("optimizationRunId", "rank");

-- CreateIndex
CREATE INDEX "SimulationScenario_companyId_idx" ON "SimulationScenario"("companyId");

-- CreateIndex
CREATE INDEX "SimulationScenario_projectId_idx" ON "SimulationScenario"("projectId");

-- CreateIndex
CREATE INDEX "SimulationScenario_createdById_idx" ON "SimulationScenario"("createdById");

-- CreateIndex
CREATE INDEX "SimulationRun_scenarioId_idx" ON "SimulationRun"("scenarioId");

-- CreateIndex
CREATE INDEX "SimulationOutcome_simulationRunId_idx" ON "SimulationOutcome"("simulationRunId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_companyId_idx" ON "AnalyticsSnapshot"("companyId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_projectId_idx" ON "AnalyticsSnapshot"("projectId");

-- CreateIndex
CREATE INDEX "SustainabilityMetric_companyId_idx" ON "SustainabilityMetric"("companyId");

-- CreateIndex
CREATE INDEX "SustainabilityMetric_projectId_idx" ON "SustainabilityMetric"("projectId");

-- CreateIndex
CREATE INDEX "PredictionRun_companyId_idx" ON "PredictionRun"("companyId");

-- CreateIndex
CREATE INDEX "PredictionRun_projectId_idx" ON "PredictionRun"("projectId");

-- CreateIndex
CREATE INDEX "PredictionResult_predictionRunId_idx" ON "PredictionResult"("predictionRunId");

-- CreateIndex
CREATE INDEX "PredictionResult_materialId_idx" ON "PredictionResult"("materialId");

-- CreateIndex
CREATE INDEX "PredictionResult_locationId_idx" ON "PredictionResult"("locationId");

-- CreateIndex
CREATE INDEX "AnomalyRecord_predictionRunId_idx" ON "AnomalyRecord"("predictionRunId");

-- CreateIndex
CREATE INDEX "AnomalyRecord_reviewedById_idx" ON "AnomalyRecord"("reviewedById");

-- CreateIndex
CREATE INDEX "SupplierEvaluation_supplierId_idx" ON "SupplierEvaluation"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierEvaluation_evaluatedById_idx" ON "SupplierEvaluation"("evaluatedById");

-- CreateIndex
CREATE INDEX "DocumentRecord_companyId_idx" ON "DocumentRecord"("companyId");

-- CreateIndex
CREATE INDEX "DocumentRecord_uploadedById_idx" ON "DocumentRecord"("uploadedById");

-- CreateIndex
CREATE INDEX "DocumentRecord_projectId_idx" ON "DocumentRecord"("projectId");

-- CreateIndex
CREATE INDEX "OptimizationOptionLine_optimizationOptionId_idx" ON "OptimizationOptionLine"("optimizationOptionId");

-- CreateIndex
CREATE INDEX "OptimizationOptionLine_inventoryStockId_idx" ON "OptimizationOptionLine"("inventoryStockId");

-- CreateIndex
CREATE INDEX "OptimizationOptionLine_supplierMaterialOfferId_idx" ON "OptimizationOptionLine"("supplierMaterialOfferId");

-- CreateIndex
CREATE INDEX "PurchaseReceiptLine_purchaseOrderItemId_idx" ON "PurchaseReceiptLine"("purchaseOrderItemId");

-- CreateIndex
CREATE INDEX "PurchaseReceiptLine_materialBatchId_idx" ON "PurchaseReceiptLine"("materialBatchId");

-- CreateIndex
CREATE INDEX "PurchaseReceiptLine_receivedById_idx" ON "PurchaseReceiptLine"("receivedById");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaterialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaterialCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttributeValue" ADD CONSTRAINT "MaterialAttributeValue_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialAttributeValue" ADD CONSTRAINT "MaterialAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialBatch" ADD CONSTRAINT "MaterialBatch_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialBatch" ADD CONSTRAINT "MaterialBatch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStock" ADD CONSTRAINT "InventoryStock_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MaterialBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStock" ADD CONSTRAINT "InventoryStock_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MaterialBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAllocation" ADD CONSTRAINT "ProjectAllocation_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAllocation" ADD CONSTRAINT "ProjectAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaterialRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_requestItemId_fkey" FOREIGN KEY ("requestItemId") REFERENCES "MaterialRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchCandidate" ADD CONSTRAINT "MatchCandidate_matchResultId_fkey" FOREIGN KEY ("matchResultId") REFERENCES "MatchResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchCandidate" ADD CONSTRAINT "MatchCandidate_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_requestItemId_fkey" FOREIGN KEY ("requestItemId") REFERENCES "MaterialRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_projectAllocationId_fkey" FOREIGN KEY ("projectAllocationId") REFERENCES "ProjectAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_reservedById_fkey" FOREIGN KEY ("reservedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MaterialBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflow" ADD CONSTRAINT "ApprovalWorkflow_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_requiredPermissionId_fkey" FOREIGN KEY ("requiredPermissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_approvalStepId_fkey" FOREIGN KEY ("approvalStepId") REFERENCES "ApprovalStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_approvalStepInstanceId_fkey" FOREIGN KEY ("approvalStepInstanceId") REFERENCES "ApprovalStepInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_approvalStepId_fkey" FOREIGN KEY ("approvalStepId") REFERENCES "ApprovalStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageAssessment" ADD CONSTRAINT "DamageAssessment_damageReportId_fkey" FOREIGN KEY ("damageReportId") REFERENCES "DamageReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DamageAssessment" ADD CONSTRAINT "DamageAssessment_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRecovery" ADD CONSTRAINT "MaterialRecovery_damageAssessmentId_fkey" FOREIGN KEY ("damageAssessmentId") REFERENCES "DamageAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRecovery" ADD CONSTRAINT "MaterialRecovery_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRecovery" ADD CONSTRAINT "MaterialRecovery_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRecord" ADD CONSTRAINT "WasteRecord_damageAssessmentId_fkey" FOREIGN KEY ("damageAssessmentId") REFERENCES "DamageAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRecord" ADD CONSTRAINT "WasteRecord_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRecord" ADD CONSTRAINT "WasteRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceabilityCode" ADD CONSTRAINT "TraceabilityCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceabilityCode" ADD CONSTRAINT "TraceabilityCode_materialBatchId_fkey" FOREIGN KEY ("materialBatchId") REFERENCES "MaterialBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceabilityCode" ADD CONSTRAINT "TraceabilityCode_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_traceabilityCodeId_fkey" FOREIGN KEY ("traceabilityCodeId") REFERENCES "TraceabilityCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanEvent" ADD CONSTRAINT "ScanEvent_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryInspection" ADD CONSTRAINT "InventoryInspection_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryInspection" ADD CONSTRAINT "InventoryInspection_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_companyMemberId_fkey" FOREIGN KEY ("companyMemberId") REFERENCES "CompanyMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDemand" ADD CONSTRAINT "MaterialDemand_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDemand" ADD CONSTRAINT "MaterialDemand_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDemand" ADD CONSTRAINT "MaterialDemand_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDemand" ADD CONSTRAINT "MaterialDemand_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDemand" ADD CONSTRAINT "MaterialDemand_requestItemId_fkey" FOREIGN KEY ("requestItemId") REFERENCES "MaterialRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurplusAssessment" ADD CONSTRAINT "SurplusAssessment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurplusAssessment" ADD CONSTRAINT "SurplusAssessment_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurplusAssessment" ADD CONSTRAINT "SurplusAssessment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOQ" ADD CONSTRAINT "BOQ_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOQ" ADD CONSTRAINT "BOQ_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOQItem" ADD CONSTRAINT "BOQItem_boqId_fkey" FOREIGN KEY ("boqId") REFERENCES "BOQ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOQItem" ADD CONSTRAINT "BOQItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMaterialOffer" ADD CONSTRAINT "SupplierMaterialOffer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMaterialOffer" ADD CONSTRAINT "SupplierMaterialOffer_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequestItem" ADD CONSTRAINT "PurchaseRequestItem_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "MaterialDemand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseRequestItemId_fkey" FOREIGN KEY ("purchaseRequestItemId") REFERENCES "PurchaseRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_requestItemId_fkey" FOREIGN KEY ("requestItemId") REFERENCES "MaterialRequestItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_matchResultId_fkey" FOREIGN KEY ("matchResultId") REFERENCES "MatchResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationOption" ADD CONSTRAINT "OptimizationOption_optimizationRunId_fkey" FOREIGN KEY ("optimizationRunId") REFERENCES "OptimizationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "SimulationScenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationOutcome" ADD CONSTRAINT "SimulationOutcome_simulationRunId_fkey" FOREIGN KEY ("simulationRunId") REFERENCES "SimulationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SustainabilityMetric" ADD CONSTRAINT "SustainabilityMetric_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SustainabilityMetric" ADD CONSTRAINT "SustainabilityMetric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionRun" ADD CONSTRAINT "PredictionRun_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionRun" ADD CONSTRAINT "PredictionRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionResult" ADD CONSTRAINT "PredictionResult_predictionRunId_fkey" FOREIGN KEY ("predictionRunId") REFERENCES "PredictionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionResult" ADD CONSTRAINT "PredictionResult_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictionResult" ADD CONSTRAINT "PredictionResult_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnomalyRecord" ADD CONSTRAINT "AnomalyRecord_predictionRunId_fkey" FOREIGN KEY ("predictionRunId") REFERENCES "PredictionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnomalyRecord" ADD CONSTRAINT "AnomalyRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierEvaluation" ADD CONSTRAINT "SupplierEvaluation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierEvaluation" ADD CONSTRAINT "SupplierEvaluation_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationOptionLine" ADD CONSTRAINT "OptimizationOptionLine_optimizationOptionId_fkey" FOREIGN KEY ("optimizationOptionId") REFERENCES "OptimizationOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationOptionLine" ADD CONSTRAINT "OptimizationOptionLine_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationOptionLine" ADD CONSTRAINT "OptimizationOptionLine_supplierMaterialOfferId_fkey" FOREIGN KEY ("supplierMaterialOfferId") REFERENCES "SupplierMaterialOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationOptionLine" ADD CONSTRAINT "OptimizationOptionLine_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceiptLine" ADD CONSTRAINT "PurchaseReceiptLine_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceiptLine" ADD CONSTRAINT "PurchaseReceiptLine_materialBatchId_fkey" FOREIGN KEY ("materialBatchId") REFERENCES "MaterialBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceiptLine" ADD CONSTRAINT "PurchaseReceiptLine_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceiptLine" ADD CONSTRAINT "PurchaseReceiptLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
