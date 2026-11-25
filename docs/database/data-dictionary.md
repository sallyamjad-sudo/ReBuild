
# ReBuild — Database Data Dictionary

Version: 0.2  
Status: Reviewed Draft — Not Migration-Ready  
Database: PostgreSQL  
ORM: Prisma 7

---

# Part 1 — Company, Projects & Locations

## 1. Company

Represents a construction company using ReBuild.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(200) | NOT NULL |
| status | ENUM | ACTIVE, SUSPENDED |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Relationships:
- One Company has many Projects.
- One Company has many Warehouses.

## 2. Project

Represents a construction project managed by a company.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | FK -> Company.id |
| code | VARCHAR(50) | NOT NULL |
| name | VARCHAR(200) | NOT NULL |
| description | TEXT | NULL |
| status | ENUM | PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED, ARCHIVED |
| startDate | DATE | NULL |
| endDate | DATE | NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- UNIQUE(companyId, code).
- endDate >= startDate when both dates exist.
- A project must have at least one Site before activation.
- Project status transitions require authorization.

Relationships:
- Each Project belongs to one Company.
- One Project has many Sites.
- One Project may have dedicated Warehouses.

## 3. Site

Represents a physical construction site belonging to a Project.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| projectId | UUID | FK -> Project.id |
| name | VARCHAR(200) | NOT NULL |
| address | TEXT | NULL |
| status | ENUM | ACTIVE, INACTIVE |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Relationships:
- Each Site belongs to one Project.
- A Site may have one InventoryLocation.

## 4. Warehouse

Represents a central or project-dedicated warehouse.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | FK -> Company.id |
| projectId | UUID | NULL, FK -> Project.id |
| name | VARCHAR(200) | NOT NULL |
| warehouseType | ENUM | CENTRAL, PROJECT |
| address | TEXT | NULL |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- CENTRAL warehouse: projectId must be NULL.
- PROJECT warehouse: projectId must be NOT NULL.
- The assigned project must belong to the same company.

Relationships:
- Each Warehouse belongs to one Company.
- A PROJECT Warehouse belongs to one Project.
- A Warehouse may have one InventoryLocation.

## 5. InventoryLocation

Represents a physical location where material batches can be stored and tracked.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | FK -> Company.id |
| siteId | UUID | NULL, UNIQUE, FK -> Site.id |
| warehouseId | UUID | NULL, UNIQUE, FK -> Warehouse.id |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- Exactly one of siteId or warehouseId must be NOT NULL.
- The referenced Site or Warehouse must belong to the same company.
- One Site or Warehouse can have at most one InventoryLocation.
- Inventory movements must respect location access permissions.

Relationships:
- Each InventoryLocation represents either one Site or one Warehouse.
- InventoryStock will reference InventoryLocation.
- Transfers will reference source and destination InventoryLocations.

## Design Notes — Part 1

1. UUID is used for primary keys.
2. All data must respect company ownership boundaries.
3. Physical storage location and project stock allocation are different concepts.
4. InventoryStock and MaterialBatch are defined in Part 2.
5. Project lifecycle transitions will be defined explicitly.
6. Cross-company transfers are outside the initial scope.
7. Referential integrity and cross-table ownership rules must be enforced through database constraints and/or transaction-safe application logic.
8. ENUM values and indexing strategies are preliminary.
9. No database migrations are approved at this stage.

---

# Part 2 — Material & Inventory Data Dictionary

## 6. MaterialCategory

Represents a category of construction materials.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(150) | NOT NULL |
| code | VARCHAR(50) | UNIQUE, NOT NULL |
| description | TEXT | NULL |
| isActive | BOOLEAN | DEFAULT true |

Relationships:
- One MaterialCategory has many Materials.
- One category defines multiple technical attributes.

## 7. AttributeDefinition

Defines a technical attribute used by material categories.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR(100) | UNIQUE, NOT NULL |
| name | VARCHAR(150) | NOT NULL |
| dataType | ENUM | STRING, NUMBER, BOOLEAN, ENUM |
| unit | VARCHAR(30) | NULL |

## 8. CategoryAttribute

Defines which technical attributes apply to each category.

| Field | Type | Constraints |
|---|---|---|
| categoryId | UUID | FK -> MaterialCategory.id |
| attributeId | UUID | FK -> AttributeDefinition.id |
| isRequired | BOOLEAN | DEFAULT false |
| isHardConstraint | BOOLEAN | DEFAULT false |

Constraints:
- Composite PK (categoryId, attributeId).

## 9. Material

Represents a standardized construction material.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| categoryId | UUID | FK -> MaterialCategory.id |
| code | VARCHAR(100) | UNIQUE, NOT NULL |
| name | VARCHAR(200) | NOT NULL |
| baseUnit | VARCHAR(30) | NOT NULL |
| description | TEXT | NULL |
| isActive | BOOLEAN | DEFAULT true |

Additional design decision:
- MaterialCategory, AttributeDefinition, and Material form a shared
  platform reference catalog in v1. Company ownership applies to
  inventory, suppliers, projects, and transactions, not to these definitions.
- Company-specific catalog extensions may be added in a later version.

Relationships:
- Each Material belongs to one category.
- One Material can have multiple batches.
- One Material has technical attribute values.

## 10. MaterialAttributeValue

Stores the technical specification of a material.

| Field | Type | Constraints |
|---|---|---|
| materialId | UUID | FK -> Material.id |
| attributeId | UUID | FK -> AttributeDefinition.id |
| value | JSONB | NOT NULL |

Constraints:
- Composite PK (materialId, attributeId).
- Attribute values must follow the declared dataType.
- Attribute must be applicable to the material's category.

## 11. MaterialBatch

Represents a traceable batch of material.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| materialId | UUID | FK -> Material.id |
| batchCode | VARCHAR(100) | NOT NULL |
| supplierId | UUID | NULL, FK -> Supplier.id (future) |
| receivedAt | TIMESTAMP | NULL |
| manufacturedAt | DATE | NULL |
| expiresAt | DATE | NULL |
| createdAt | TIMESTAMP | NOT NULL |

Design decision:
- A batch has a stable internal UUID across multiple storage locations.
- Batch supplier is optional; the company owning a physical stock balance
  is derived from InventoryLocation, not from Supplier.

Constraints:
- Batch identity must remain traceable across locations.
- Batch uniqueness scope will be defined with Supplier design.

## 12. InventoryStock

Represents the quantity of a material batch at an inventory location.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| batchId | UUID | FK -> MaterialBatch.id |
| locationId | UUID | FK -> InventoryLocation.id |
| usableQuantity | DECIMAL(18,3) | DEFAULT 0 |
| quarantinedQuantity | DECIMAL(18,3) | DEFAULT 0 |
| damagedQuantity | DECIMAL(18,3) | DEFAULT 0 |
| updatedAt | TIMESTAMP | NOT NULL |

Quantity semantics:
- All InventoryStock quantities use Material.baseUnit after validated conversion.
- usableQuantity is physically present and usable; it includes quantities
  administratively allocated or operationally reserved (neither is subtracted
  from the stored balance).
- quarantinedQuantity and damagedQuantity cannot be reserved for normal use.
- In-transit quantities are not included in any location's InventoryStock
  until confirmed receipt; they are accounted for in TransferItem.

Constraints:
- UNIQUE(batchId, locationId).
- All quantities must be >= 0.
- OnHand = usable + quarantined + damaged.
- Available = usable - active reserved quantity.
- Reserved quantity cannot exceed usable quantity.

## 13. StockMovement

Records inventory quantity changes and movements.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| batchId | UUID | FK -> MaterialBatch.id |
| sourceLocationId | UUID | NULL, FK -> InventoryLocation.id |
| destinationLocationId | UUID | NULL, FK -> InventoryLocation.id |
| quantity | DECIMAL(18,3) | NOT NULL |
| movementType | ENUM | RECEIPT, ISSUE, TRANSFER, ADJUSTMENT, DISPOSAL |
| referenceId | UUID | NULL |
| performedById | UUID | FK -> User.id |
| createdAt | TIMESTAMP | NOT NULL |

Constraints:
- quantity > 0.
- Stock movement must preserve an audit trail.
- Transfer dispatch and receipt must be recorded consistently.
- Source and destination cannot be the same for a transfer.

## 14. ProjectAllocation

Represents stock quantities administratively allocated to construction projects.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| inventoryStockId | UUID | FK -> InventoryStock.id |
| projectId | UUID | FK -> Project.id |
| quantity | DECIMAL(18,3) | NOT NULL |
| createdAt | TIMESTAMP | NOT NULL |

Allocation semantics:
- Allocation is an administrative earmark of usable stock for a project.
- The sum of all project allocations on a stock row may not exceed
  usableQuantity.
- A project reservation using allocated stock references that allocation.
- Shared unallocated stock is usable only under company access policy;
  it does not require a synthetic project allocation.

Constraints:
- quantity >= 0.
- Project allocations must not exceed the applicable stock quantity.
- Allocation and reservation are separate concepts.
- Project allocations represent administrative stock assignments, while reservations represent operational holds.
- A reservation must respect the project's authorized allocation and the physically usable, unreserved stock.

Relationships:
- Each ProjectAllocation references one InventoryStock.
- Each ProjectAllocation references one Project.
- One InventoryStock may have allocations for multiple projects.

## Design Notes — Part 2

1. Materials have category-based technical specifications.
2. Batches are traceable independently of storage locations.
3. InventoryStock tracks batch quantities at each location.
4. Reserved quantities are derived from active reservations.
5. Damaged and quarantined quantities remain physically on-hand.
6. Project allocations and reservations must not be conflated.
7. Stock movements must be transaction-safe.
8. Supplier, User, and Reservation are defined in Parts 3, 6, and 7; their physical FK mappings still require validation.
9. Units of measurement and conversion rules require a shared design.
10. Company ownership and access constraints must be enforced.
11. The relationship between project allocations and active reservations must be enforced during reservation transactions.
12. Shared unallocated stock and project-specific stock must be distinguished to prevent unauthorized use.
13. This dictionary is a design draft, not an executable schema.


---

# Part 3 — Material Requests, Reservations & Transfers

## 15. MaterialRequest

Represents a request for construction materials submitted
by a project or construction site.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| projectId | UUID | NOT NULL, FK -> Project.id |
| siteId | UUID | NOT NULL, FK -> Site.id |
| requestedById | UUID | NOT NULL, FK -> User.id |
| status | ENUM | DRAFT, SUBMITTED, PARTIALLY_FULFILLED, FULFILLED, CANCELLED |
| priority | ENUM | LOW, NORMAL, HIGH, URGENT |
| requiredByDate | DATE | NULL |
| notes | TEXT | NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- The Project must belong to the specified Company.
- The Site must belong to the specified Project.
- Only authorized users may submit requests.
- A cancelled request cannot receive new reservations.
- Request status must reflect confirmed fulfillment,
  not merely proposed matching results.

Relationships:
- Each MaterialRequest belongs to one Project and Site.
- Each MaterialRequest is created by one User.
- One MaterialRequest contains multiple MaterialRequestItems.

## 16. MaterialRequestItem

Represents one material requirement within a request.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| requestId | UUID | NOT NULL, FK -> MaterialRequest.id |
| materialId | UUID | NOT NULL, FK -> Material.id |
| requestedQuantity | DECIMAL(18,3) | NOT NULL |
| unit | VARCHAR(30) | NOT NULL |
| singleBatchOnly | BOOLEAN | DEFAULT false |
| technicalRequirements | JSONB | NULL |
| notes | TEXT | NULL |

Constraints:
- requestedQuantity > 0.
- The unit must be compatible with the material's base unit.
- Technical requirements must follow the material category's
  defined attributes and validation rules.
- A request item may be fulfilled using multiple batches
  unless singleBatchOnly is true.
- Total confirmed fulfillment cannot exceed requestedQuantity
  without an explicitly authorized amendment.

Relationships:
- Each MaterialRequestItem belongs to one MaterialRequest.
- Each MaterialRequestItem references one Material.
- One request item may have multiple matching candidates.
- One request item may have multiple reservations.

## 17. MatchResult

Represents one execution of the Intelligent Material
Matching Engine for a material request item.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| requestItemId | UUID | NOT NULL, FK -> MaterialRequestItem.id |
| algorithmVersion | VARCHAR(50) | NOT NULL |
| status | ENUM | FULL_MATCH, PARTIAL_MATCH, NO_MATCH |
| requestedQuantity | DECIMAL(18,3) | NOT NULL |
| proposedCoveredQuantity | DECIMAL(18,3) | NOT NULL |
| remainingQuantity | DECIMAL(18,3) | NOT NULL |
| executedAt | TIMESTAMP | NOT NULL |
| expiresAt | TIMESTAMP | NULL |

Constraints:
- requestedQuantity > 0.
- proposedCoveredQuantity >= 0.
- remainingQuantity >= 0.
- proposedCoveredQuantity <= requestedQuantity.
- remainingQuantity =
  requestedQuantity - proposedCoveredQuantity.
- Matching results are recommendations, not reservations.
- A matching result must not modify inventory quantities.
- A new matching execution creates a new result record.

Relationships:
- Each MatchResult belongs to one MaterialRequestItem.
- One MatchResult contains multiple MatchCandidates.

## 18. MatchCandidate

Represents an eligible material batch and source location
identified by the Matching Engine.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| matchResultId | UUID | NOT NULL, FK -> MatchResult.id |
| inventoryStockId | UUID | NOT NULL, FK -> InventoryStock.id |
| eligibleQuantity | DECIMAL(18,3) | NOT NULL |
| proposedQuantity | DECIMAL(18,3) | NOT NULL |
| matchScore | DECIMAL(5,2) | NOT NULL |
| rank | INTEGER | NOT NULL |
| explanation | JSONB | NULL |

Constraints:
- eligibleQuantity >= 0.
- proposedQuantity >= 0.
- proposedQuantity <= eligibleQuantity.
- matchScore must be between 0 and 100.
- rank must be greater than 0.
- Hard constraints must be satisfied before ranking.
- Proposed quantities must respect single-batch
  restrictions and compatibility requirements.
- Candidate availability must be revalidated before
  creating a reservation.
- UNIQUE(matchResultId, rank).

Relationships:
- Each MatchCandidate belongs to one MatchResult.
- Each MatchCandidate references one InventoryStock record.
- Matching results may be consumed by Jana's
  Transfer vs. Purchase Optimization component.

## 19. Reservation

Represents an operational hold on material quantities
from a specific inventory stock record.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| requestItemId | UUID | NOT NULL, FK -> MaterialRequestItem.id |
| inventoryStockId | UUID | NOT NULL, FK -> InventoryStock.id |
| projectAllocationId | UUID | NULL, FK -> ProjectAllocation.id |
| quantity | DECIMAL(18,3) | NOT NULL |
| status | ENUM | ACTIVE, RELEASED, CONSUMED, EXPIRED, CANCELLED |
| reservedById | UUID | NOT NULL, FK -> User.id |
| reservedAt | TIMESTAMP | NOT NULL |
| expiresAt | TIMESTAMP | NULL |
| releasedAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Reservation accounting:
- ActiveReserved(stock) = sum(quantity) for ACTIVE reservations on that stock.
- GlobalFree(stock) = usableQuantity - ActiveReserved(stock).
- UnallocatedPool(stock) = usableQuantity - sum(active project allocations).
- For an allocated reservation: available project allocation =
  allocation.quantity - sum(ACTIVE reservations against that allocation).
- For an unallocated reservation: unallocated remaining =
  UnallocatedPool(stock) - sum(ACTIVE reservations with no allocation).
- The maximum new reservation is bounded by both GlobalFree(stock)
  and its applicable allocated/unallocated remaining balance.
- These are computed values, not separate stored inventory balances.

Constraints:
- quantity > 0.
- A reservation must reference physically usable stock.
- Active reservations cannot exceed usable stock.
- Reservations must respect project allocations and
  company authorization boundaries.
- Project allocation must reference the same InventoryStock.
- A project cannot consume stock assigned to another
  project without an authorized reallocation.
- Reservation creation must be transaction-safe.
- Concurrent reservations must not cause double booking.
- Released, expired, or cancelled reservations no longer
  reduce available quantity.
- Consumed reservations must not be consumed again.
- Reservation status transitions require validation.

Relationships:
- Each Reservation belongs to one MaterialRequestItem.
- Each Reservation references one InventoryStock.
- A Reservation may reference one ProjectAllocation.
- One Reservation may be fulfilled through transfer
  operations or authorized local stock issue.

## 20. Transfer

Represents a material transfer operation between
two inventory locations belonging to the same company.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| sourceLocationId | UUID | NOT NULL, FK -> InventoryLocation.id |
| destinationLocationId | UUID | NOT NULL, FK -> InventoryLocation.id |
| requestedById | UUID | NOT NULL, FK -> User.id |
| status | ENUM | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, IN_TRANSIT, PARTIALLY_RECEIVED, COMPLETED, CANCELLED |
| requestedAt | TIMESTAMP | NOT NULL |
| approvedAt | TIMESTAMP | NULL |
| dispatchedAt | TIMESTAMP | NULL |
| completedAt | TIMESTAMP | NULL |
| notes | TEXT | NULL |

Transfer accounting:
- A dispatch atomically reduces the source usable stock and changes
  the relevant reserved quantity/state within the same transaction.
- During transit, dispatched-but-unsettled units are represented by
  TransferItem, not in source or destination InventoryStock.
- Receipt atomically adds confirmed received usable/damaged/quarantined
  quantities to destination stock according to inspection results.
- Partial receipts and transport loss must be reconciled explicitly.
- Cancellation after dispatch requires a return/settlement operation,
  not simply reverting the transfer to DRAFT or CANCELLED.

Constraints:
- Source and destination must be different locations.
- Both locations must belong to the specified company.
- Cross-company transfers are not supported.
- Cross-project transfers require applicable approval.
- Transfer execution requires authorization.
- A rejected transfer cannot be dispatched.
- Dispatch requires the necessary active reservations.
- Physical stock is deducted at dispatch.
- Destination stock increases upon confirmed receipt.
- In-transit quantities must remain traceable.
- Transfer state transitions must be validated.
- Stock updates must be transaction-safe.

Relationships:
- Each Transfer belongs to one Company.
- Each Transfer has one source and one destination.
- One Transfer contains multiple TransferItems.
- A Transfer may require an ApprovalRequest.

## 21. TransferItem

Represents a specific batch quantity transferred
between inventory locations.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| transferId | UUID | NOT NULL, FK -> Transfer.id |
| reservationId | UUID | NOT NULL, FK -> Reservation.id |
| batchId | UUID | NOT NULL, FK -> MaterialBatch.id |
| plannedQuantity | DECIMAL(18,3) | NOT NULL |
| dispatchedQuantity | DECIMAL(18,3) | DEFAULT 0 |
| receivedQuantity | DECIMAL(18,3) | DEFAULT 0 |
| damagedInTransitQuantity | DECIMAL(18,3) | DEFAULT 0 |
| notes | TEXT | NULL |

In-transit calculation:
- outstandingInTransit = dispatchedQuantity - receivedQuantity
  - damagedInTransitQuantity - documentedLossQuantity.
- documentedLossQuantity must be implemented through an explicit,
  auditable loss/settlement record or added as a controlled field
  before transport-loss support is released.
- A TransferItem may only move the source batch from its reserved
  location; repeated partial dispatch must respect remaining quantity.

Constraints:
- plannedQuantity > 0.
- dispatchedQuantity >= 0.
- receivedQuantity >= 0.
- damagedInTransitQuantity >= 0.
- dispatchedQuantity <= plannedQuantity.
- receivedQuantity + damagedInTransitQuantity
  <= dispatchedQuantity.
- A TransferItem must reference a reservation
  belonging to the source InventoryStock.
- The referenced Batch must match the reserved stock.
- Total dispatched quantities must not exceed the
  quantity authorized for dispatch.
- Dispatch and receipt operations must be recorded
  through StockMovement.
- Partial receipts must preserve the remaining
  in-transit quantity.

Relationships:
- Each TransferItem belongs to one Transfer.
- Each TransferItem references one Reservation.
- Each TransferItem references one MaterialBatch.
- StockMovement records document its physical movements.

## Design Notes — Part 3

1. MaterialRequest and MaterialRequestItem represent demand
   submitted by construction projects.

2. Matching results are recommendations and must not
   directly change inventory balances.

3. Matching candidates are validated using mandatory
   technical constraints before scoring.

4. Multi-batch fulfillment is supported when technically
   permitted.

5. Partial fulfillment is supported, with remaining
   demand tracked separately.

6. Reservation creates an operational hold on usable stock.

7. Reservation and ProjectAllocation are separate concepts.

8. Active reservations must respect both physically
   available stock and authorized project allocations.

9. Reservation creation and stock deduction must use
   concurrency-safe database transactions.

10. Transfers can occur between sites, warehouses,
    and different projects within the same company.

11. Cross-project transfers require applicable approvals.

12. Transfer dispatch and receipt are distinct events.

13. In-transit stock must remain traceable until receipt,
    approved return, or documented loss.

14. TransferItem quantities support partial receipt and
    documented transport damage.

15. ApprovalRequest is defined in Part 4; the physical operation link requires validation.

16. Material demand forecasting and procurement decisions
    remain within Jana's assigned features.

17. This section defines a preliminary logical model,
    not an executable Prisma schema.

18. Before implementation, reservation consumption,
    project reallocation, partial dispatch, cancellation,
    and transport loss handling must be specified as
    explicit transaction and state-transition rules.

19. Units of measurement must use validated conversions
    when request units differ from inventory base units.

20. Matching scores must use documented and testable
    scoring criteria.


---

# Part 4 — Dynamic Approval Workflow

## 22. ApprovalWorkflow

Defines an approval workflow for a specific business operation.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| name | VARCHAR(200) | NOT NULL |
| operationType | ENUM | TRANSFER, PROCUREMENT, STOCK_ADJUSTMENT, DAMAGE_DISPOSAL, PROJECT_REALLOCATION |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- Each workflow belongs to one Company.
- A workflow must have at least one active step before activation.
- Workflows must apply only to authorized company operations.
- Workflow changes must not modify existing approval instances.
- Active workflow selection must be deterministic.

Relationships:
- One Company has many ApprovalWorkflows.
- One ApprovalWorkflow has multiple ApprovalSteps.
- One ApprovalWorkflow can have multiple ApprovalRequests.

## 23. ApprovalStep

Defines one step within an approval workflow.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| workflowId | UUID | NOT NULL, FK -> ApprovalWorkflow.id |
| stepOrder | INTEGER | NOT NULL |
| name | VARCHAR(150) | NOT NULL |
| requiredPermissionId | UUID | FK -> Permission.id |
| minimumApprovals | INTEGER | DEFAULT 1 |
| isRequired | BOOLEAN | DEFAULT true |

Constraints:
- UNIQUE(workflowId, stepOrder).
- stepOrder > 0.
- minimumApprovals > 0.
- Required permission must exist and be active.
- A step cannot be approved by an unauthorized user.
- Step configuration must be preserved for existing requests.

Relationships:
- Each ApprovalStep belongs to one ApprovalWorkflow.
- One ApprovalStep may have multiple ApprovalDecisions.

## 24. ApprovalRequest

Represents an approval instance for a business operation.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| workflowId | UUID | NOT NULL, FK -> ApprovalWorkflow.id |
| requestedById | UUID | NOT NULL, FK -> User.id |
| operationType | ENUM | TRANSFER, PROCUREMENT, STOCK_ADJUSTMENT, DAMAGE_DISPOSAL, PROJECT_REALLOCATION |
| operationId | UUID | NOT NULL |
| status | ENUM | PENDING, IN_PROGRESS, APPROVED, REJECTED, CANCELLED |
| currentStepOrder | INTEGER | NULL |
| requestedAt | TIMESTAMP | NOT NULL |
| completedAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Integrity decision:
- operationType + operationId is a polymorphic reference, not a native FK.
- The service must validate existence, ownership, type, and current
  operation revision in the same transaction before approval creation.
- A typed operation-link table or explicit nullable foreign keys may
  replace this reference in the physical Prisma design.

Constraints:
- The operation must exist and belong to the same Company.
- The workflow must match the operation type.
- Requests must follow their configured approval steps.
- Rejected requests cannot proceed to execution.
- Only authorized users can approve or reject.
- The requester cannot approve their own request
  unless explicitly permitted by company policy.
- Approval history must remain immutable.
- Approval transitions must be transaction-safe.

Relationships:
- Each ApprovalRequest belongs to one ApprovalWorkflow.
- Each ApprovalRequest is submitted by one User.
- One ApprovalRequest has multiple ApprovalDecisions.
- Business operations reference their applicable
  ApprovalRequest.

## 25. ApprovalDecision

Records an approval or rejection made by an authorized user.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| approvalRequestId | UUID | NOT NULL, FK -> ApprovalRequest.id |
| approvalStepId | UUID | NOT NULL, FK -> ApprovalStep.id |
| decidedById | UUID | NOT NULL, FK -> User.id |
| decision | ENUM | APPROVED, REJECTED |
| comment | TEXT | NULL |
| decidedAt | TIMESTAMP | NOT NULL |

Execution identity:
- Decisions should reference the exact ApprovalStepInstance in the
  physical model (not only the reusable ApprovalStep template).
- Step permissions, approval thresholds and workflow version must be
  snapshotted so later workflow edits do not change pending approvals.

Constraints:
- The user must have the required permission.
- A user cannot cast duplicate decisions for the
  same step and approval request.
- UNIQUE(approvalRequestId, approvalStepId, decidedById).
- Decisions must belong to the active workflow step.
- Rejected decisions must follow the configured
  rejection policy.
- Decisions are append-only audit records.
- Approval counts must be calculated from valid decisions.

Relationships:
- Each ApprovalDecision belongs to one ApprovalRequest.
- Each ApprovalDecision references one ApprovalStep.
- Each ApprovalDecision is made by one User.

## 26. ApprovalStepInstance

Represents the execution state of one approval step
within a particular ApprovalRequest.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| approvalRequestId | UUID | NOT NULL, FK -> ApprovalRequest.id |
| approvalStepId | UUID | NOT NULL, FK -> ApprovalStep.id |
| stepOrder | INTEGER | NOT NULL |
| requiredApprovals | INTEGER | NOT NULL |
| status | ENUM | WAITING, ACTIVE, APPROVED, REJECTED, SKIPPED |
| activatedAt | TIMESTAMP | NULL |
| completedAt | TIMESTAMP | NULL |

Constraints:
- UNIQUE(approvalRequestId, stepOrder).
- requiredApprovals > 0.
- The step belongs to the request's workflow.
- Step instances preserve the approval requirements
  in effect when the request was created.
- A step becomes APPROVED only after receiving
  the required number of valid approvals.
- Future steps remain WAITING until activated.
- Step transitions must be transaction-safe.
- Decisions must correspond to the correct
  ApprovalStepInstance.

Relationships:
- Each ApprovalStepInstance belongs to one ApprovalRequest.
- Each ApprovalStepInstance references one ApprovalStep.
- Each instance represents one step in an approval execution.

## Approval Workflow Example

Operation: Inter-project Material Transfer

Step 1:
- Site Manager submits the transfer request.

Step 2:
- Authorized Project Manager approves the release
  of materials from the source project.

Step 3:
- Authorized destination Project Manager confirms
  acceptance when company policy requires it.

Step 4:
- Inventory Manager verifies stock availability
  and authorizes dispatch.

Step 5:
- Transfer becomes eligible for execution after
  all mandatory approvals are completed.

Important:
- The number and order of approval steps are configurable.
- Users may have multiple roles.
- Authorization is determined by permissions and scope.
- Approval does not automatically dispatch materials.
- Stock availability must be revalidated before dispatch.

## Design Notes — Part 4

1. ApprovalWorkflow defines reusable approval rules.

2. ApprovalStep defines the configured sequence.

3. ApprovalRequest represents a specific approval process.

4. ApprovalStepInstance preserves the execution state
   and required approval count for each request.

5. ApprovalDecision records individual user decisions.

6. Approval rules must support company-specific
   configurations and scoped permissions.

7. Approved operations may proceed only when all
   mandatory steps are satisfied.

8. Approval requests must preserve their original
   workflow configuration, even if the workflow
   is modified later.

9. Approval requests and decisions require complete
   audit logging.

10. Cross-project transfers require the applicable
    authorized approval process.

11. Procurement approval integration belongs to
    the shared API contract with Jana's module.

12. Dynamic operationId references require explicit
    application validation or a dedicated relational
    linking strategy before implementation.

13. The final schema must define workflow versioning,
    rejection policies, and approval invalidation
    after material changes to the underlying operation.

14. ApprovalDecision may require a direct
    ApprovalStepInstance reference to enforce
    execution-specific consistency.

15. This section is a logical design draft,
    not an executable Prisma schema.


---

# Part 5 — Damage, Waste & QR/Barcode Traceability

## 27. DamageReport

Represents a report of damaged, defective, or potentially
unusable construction materials.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| inventoryStockId | UUID | NOT NULL, FK -> InventoryStock.id |
| reportedById | UUID | NOT NULL, FK -> User.id |
| reportedQuantity | DECIMAL(18,3) | NOT NULL |
| reason | ENUM | TRANSPORT_DAMAGE, STORAGE_DAMAGE, EXPIRED, DEFECTIVE, ACCIDENT, OTHER |
| description | TEXT | NULL |
| status | ENUM | REPORTED, UNDER_INSPECTION, ASSESSED, RESOLVED, CANCELLED |
| reportedAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- reportedQuantity > 0.
- The referenced stock must belong to the same company.
- Reported quantity must not exceed eligible physical stock.
- Suspected damaged quantities must be quarantined.
- Quarantined quantities cannot be reserved for normal use.
- A damage report must not automatically dispose of stock.
- Stock condition changes must be transaction-safe.
- A report cannot be resolved without a documented outcome.
- Duplicate reporting of the same affected quantity must
  be prevented through inventory state validation.

Relationships:
- Each DamageReport belongs to one Company.
- Each DamageReport references one InventoryStock.
- Each DamageReport is created by one User.
- One DamageReport may have multiple DamageAssessments.

## 28. DamageAssessment

Records the technical inspection and assessment
of reported damaged materials.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| damageReportId | UUID | NOT NULL, FK -> DamageReport.id |
| assessedById | UUID | NOT NULL, FK -> User.id |
| assessedQuantity | DECIMAL(18,3) | NOT NULL |
| condition | ENUM | USABLE, RECOVERABLE, RECYCLABLE, UNUSABLE |
| findings | TEXT | NULL |
| recommendations | TEXT | NULL |
| assessedAt | TIMESTAMP | NOT NULL |

Constraints:
- assessedQuantity > 0.
- Total assessed quantities must not exceed
  the reported quantity.
- Only authorized users can perform technical assessments.
- Structural or safety-critical materials require
  appropriate technical authorization before reuse.
- Assessments must preserve inspection history.
- A new assessment must not silently overwrite
  a previous assessment.
- Assessment decisions must respect material
  safety and compliance requirements.

Relationships:
- Each DamageAssessment belongs to one DamageReport.
- Each DamageAssessment is performed by one User.
- One DamageAssessment may produce multiple
  MaterialRecovery records.

## 29. MaterialRecovery

Records the approved recovery or alternative use
of assessed material quantities.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| damageAssessmentId | UUID | NOT NULL, FK -> DamageAssessment.id |
| inventoryStockId | UUID | NOT NULL, FK -> InventoryStock.id |
| recoveryType | ENUM | RETURN_TO_STOCK, ALTERNATIVE_USE, REPAIR, REPROCESS |
| quantity | DECIMAL(18,3) | NOT NULL |
| status | ENUM | PROPOSED, APPROVED, COMPLETED, REJECTED, CANCELLED |
| approvedById | UUID | NULL, FK -> User.id |
| recoveryCost | DECIMAL(18,2) | DEFAULT 0 |
| notes | TEXT | NULL |
| completedAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | NOT NULL |

Constraints:
- quantity > 0.
- recoveryCost >= 0.
- Recovery quantity must not exceed the eligible
  assessed quantity.
- Only authorized users may approve recovery.
- Recovery must comply with technical assessment results.
- A recovery proposal must not automatically
  increase usable inventory.
- Inventory is updated only after recovery completion
  and any required verification.
- Recovered material must not be counted twice.
- Alternative use must respect the approved
  material application and technical limitations.

Relationships:
- Each MaterialRecovery belongs to one DamageAssessment.
- Each MaterialRecovery references one InventoryStock.
- One MaterialRecovery may be approved by one User.

## 30. WasteRecord

Records material recycling, disposal,
or other approved waste handling activities.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| damageAssessmentId | UUID | NULL, FK -> DamageAssessment.id |
| inventoryStockId | UUID | NOT NULL, FK -> InventoryStock.id |
| wasteType | ENUM | RECYCLING, DISPOSAL |
| quantity | DECIMAL(18,3) | NOT NULL |
| status | ENUM | PLANNED, PENDING_APPROVAL, APPROVED, COMPLETED, CANCELLED |
| reason | TEXT | NULL |
| handlingCost | DECIMAL(18,2) | DEFAULT 0 |
| recordedById | UUID | NOT NULL, FK -> User.id |
| completedAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | NOT NULL |

Constraints:
- quantity > 0.
- handlingCost >= 0.
- Waste processing must respect inventory ownership
  and company authorization.
- Damaged quantities must not be counted twice
  across recovery and waste operations.
- Disposal or recycling must follow the applicable
  approval policy.
- Physical inventory decreases only when material
  leaves stock through a confirmed handling operation.
- Completed waste operations must produce
  appropriate StockMovement records.
- Waste records must preserve historical data.

Relationships:
- Each WasteRecord references one InventoryStock.
- Each WasteRecord may reference one DamageAssessment.
- Each WasteRecord is recorded by one User.
- Waste information may be used by Jana's
  Analytics & Sustainability module.

## 31. TraceabilityCode

Represents a unique QR code or barcode assigned
to a traceable inventory entity.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| materialBatchId | UUID | NULL, FK -> MaterialBatch.id |
| inventoryStockId | UUID | NULL, FK -> InventoryStock.id |
| codeValue | VARCHAR(255) | NOT NULL |
| codeType | ENUM | QR, BARCODE |
| status | ENUM | ACTIVE, REVOKED |
| generatedAt | TIMESTAMP | NOT NULL |
| revokedAt | TIMESTAMP | NULL |

Constraints:
- UNIQUE(codeValue).
- Exactly one of materialBatchId or inventoryStockId
  must be NOT NULL.
- The referenced entity must belong to the same company.
- Codes must not contain passwords or sensitive credentials.
- Codes must identify records rather than grant access.
- A revoked code cannot authorize inventory actions.
- Code values must not be reassigned to unrelated records.
- Code scanning must respect user permissions.

Relationships:
- Each TraceabilityCode belongs to one Company.
- Each code identifies one MaterialBatch
  or one InventoryStock record.
- One TraceabilityCode may have multiple ScanEvents.

## 32. ScanEvent

Records a QR/barcode scanning event.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| traceabilityCodeId | UUID | NOT NULL, FK -> TraceabilityCode.id |
| scannedById | UUID | NOT NULL, FK -> User.id |
| locationId | UUID | NULL, FK -> InventoryLocation.id |
| scanType | ENUM | LOOKUP, RECEIPT, DISPATCH, TRANSFER, INSPECTION, INVENTORY_CHECK |
| result | ENUM | SUCCESS, DENIED, INVALID |
| scannedAt | TIMESTAMP | NOT NULL |
| notes | TEXT | NULL |

Constraints:
- Each scan must reference an existing traceability code.
- Sensitive operations require authentication
  and authorization.
- Scanning a code must not automatically
  modify inventory.
- Inventory changes require an authorized
  business operation and transaction.
- Scan events must preserve audit history.
- A scan result must reflect validation
  of the code and user permissions.

Relationships:
- Each ScanEvent references one TraceabilityCode.
- Each ScanEvent is performed by one User.
- A ScanEvent may reference one InventoryLocation.

## 33. InventoryInspection

Represents a physical inventory inspection,
stock count, or condition verification.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| inventoryStockId | UUID | NOT NULL, FK -> InventoryStock.id |
| inspectedById | UUID | NOT NULL, FK -> User.id |
| inspectionType | ENUM | ROUTINE, DAMAGE_CHECK, STOCK_COUNT, RECEIPT_CHECK |
| recordedQuantity | DECIMAL(18,3) | NULL |
| observedQuantity | DECIMAL(18,3) | NULL |
| conditionNotes | TEXT | NULL |
| status | ENUM | PENDING, COMPLETED, REQUIRES_REVIEW |
| inspectedAt | TIMESTAMP | NOT NULL |
| createdAt | TIMESTAMP | NOT NULL |

Constraints:
- Quantities must be >= 0 when provided.
- Only authorized users may submit inspections.
- Stock discrepancies must be documented.
- Inspection findings must not silently overwrite
  inventory balances.
- Any stock adjustment requires a separate
  authorized StockMovement operation.
- Inspection history must be preserved.

Relationships:
- Each InventoryInspection references one InventoryStock.
- Each InventoryInspection is performed by one User.
- Inspection findings may initiate DamageReports
  or authorized stock adjustments.

## Design Notes — Part 5

1. Partial batch damage is supported.

2. Damaged and quarantined quantities remain
   physically on-hand until confirmed removal.

3. Damage reporting and technical assessment
   are separate operations.

4. Recovery decisions require applicable
   technical authorization.

5. The system supports return to usable stock,
   alternative use, recycling, and disposal.

6. Recovery and waste operations must not
   process the same affected quantity twice.

7. Inventory changes must be recorded through
   transaction-safe stock operations.

8. QR/barcode identifiers support batch-level
   and inventory-stock-level traceability.

9. Scanning an identifier does not automatically
   authorize a stock movement.

10. ScanEvent stores scanning activities,
    while StockMovement stores inventory changes.

11. Traceability must preserve material origin,
    location history, and related operations.

12. Damage and waste data may be consumed by
    Jana's Analytics & Sustainability module.

13. Material condition and waste handling
    must respect technical safety requirements.

14. Inspection findings must not directly
    modify inventory without an authorized operation.

15. Approval integration will use the
    workflow definitions from Part 4.

16. Before implementation, the design must define
    how affected quantities are allocated among
    assessments, recoveries, and waste outcomes.

17. A physical stock count discrepancy must be
    distinguished from a damage assessment.

18. Batch-level and stock-level codes must remain
    consistent when material quantities move between
    inventory locations.

19. Unique physical package tracking may require
    an additional serialized unit or handling-unit model.

20. This section is a logical design draft,
    not an executable Prisma schema.


---

# Part 6 — Authentication, Users, Roles & Permissions

## 34. User

Represents a registered user of the ReBuild platform.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| passwordHash | VARCHAR(255) | NOT NULL |
| firstName | VARCHAR(100) | NOT NULL |
| lastName | VARCHAR(100) | NOT NULL |
| phone | VARCHAR(30) | NULL |
| status | ENUM | ACTIVE, INACTIVE, SUSPENDED |
| emailVerifiedAt | TIMESTAMP | NULL |
| lastLoginAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- Email addresses must be normalized before storage.
- Passwords must be stored using a secure password hash.
- Plaintext passwords must never be stored.
- Suspended users cannot authenticate.
- Sensitive user information must be access-controlled.
- User deletion must preserve required audit history.

Relationships:
- One User may belong to multiple Companies.
- One User may have multiple role assignments.
- One User may create projects, requests, and other
  authorized business records.

## 35. CompanyMember

Associates a user with a construction company.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| userId | UUID | NOT NULL, FK -> User.id |
| status | ENUM | INVITED, ACTIVE, SUSPENDED, REMOVED |
| joinedAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- UNIQUE(companyId, userId).
- A user must have active membership to access
  protected company resources.
- Company membership does not automatically
  grant administrative permissions.
- Removed or suspended membership must block
  access to company-scoped resources.
- Historical activity must remain traceable.

Relationships:
- Each CompanyMember belongs to one Company.
- Each CompanyMember references one User.
- One CompanyMember may have multiple RoleAssignments.

## 36. Role

Defines a configurable role within a company.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| name | VARCHAR(100) | NOT NULL |
| code | VARCHAR(100) | NOT NULL |
| description | TEXT | NULL |
| isSystemRole | BOOLEAN | DEFAULT false |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- UNIQUE(companyId, code).
- Each Role belongs to one Company.
- System role protections must be enforced.
- Only authorized administrators may create
  or modify company roles.
- Roles cannot grant permissions beyond
  the administrator's allowed delegation authority.
- Inactive roles cannot be newly assigned.

Relationships:
- One Company has multiple Roles.
- One Role has multiple RolePermissions.
- One Role may have multiple RoleAssignments.

## 37. Permission

Defines an action that can be authorized in ReBuild.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR(150) | UNIQUE, NOT NULL |
| resource | VARCHAR(100) | NOT NULL |
| action | VARCHAR(100) | NOT NULL |
| description | TEXT | NULL |
| isActive | BOOLEAN | DEFAULT true |

Constraints:
- Permission codes must be unique.
- Permission definitions are managed by
  the platform, not arbitrary company users.
- Inactive permissions cannot authorize actions.
- Permissions must be enforced by backend services.
- Frontend visibility controls alone are insufficient.

Examples:
- PROJECT_CREATE
- PROJECT_UPDATE
- INVENTORY_VIEW
- INVENTORY_ADJUST
- TRANSFER_REQUEST
- TRANSFER_APPROVE
- PROCUREMENT_APPROVE
- DAMAGE_ASSESS
- ROLE_MANAGE

Relationships:
- One Permission may belong to multiple Roles.
- Permission assignments are represented
  through RolePermission.

## 38. RolePermission

Associates permissions with company roles.

| Field | Type | Constraints |
|---|---|---|
| roleId | UUID | NOT NULL, FK -> Role.id |
| permissionId | UUID | NOT NULL, FK -> Permission.id |
| createdAt | TIMESTAMP | NOT NULL |

Constraints:
- Composite PK (roleId, permissionId).
- Only authorized users can modify role permissions.
- Permission changes must be audited.
- Permission assignment must respect
  delegation and least-privilege rules.
- Changes to a role affect its applicable
  assignments after authorization reevaluation.

Relationships:
- Each RolePermission references one Role.
- Each RolePermission references one Permission.

## 39. RoleAssignment

Assigns a company role to a company member
within a specified authorization scope.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyMemberId | UUID | NOT NULL, FK -> CompanyMember.id |
| roleId | UUID | NOT NULL, FK -> Role.id |
| scopeType | ENUM | COMPANY, PROJECT, SITE |
| projectId | UUID | NULL, FK -> Project.id |
| siteId | UUID | NULL, FK -> Site.id |
| assignedById | UUID | NOT NULL, FK -> User.id |
| assignedAt | TIMESTAMP | NOT NULL |
| expiresAt | TIMESTAMP | NULL |
| isActive | BOOLEAN | DEFAULT true |

Constraints:
- Role and CompanyMember must belong
  to the same Company.
- COMPANY scope requires both projectId
  and siteId to be NULL.
- PROJECT scope requires projectId,
  while siteId must be NULL.
- SITE scope requires siteId,
  while projectId must be NULL.
- Scoped projects and sites must belong
  to the same Company.
- Only authorized users may assign roles.
- A user cannot grant roles outside
  their authorized delegation scope.
- Expired or inactive assignments
  must not grant permissions.
- Duplicate active role assignments
  for the same member and scope
  must be prevented.

Relationships:
- Each RoleAssignment belongs to one CompanyMember.
- Each RoleAssignment references one Role.
- Each RoleAssignment applies to one authorization scope.

## 40. AuditLog

Records security-sensitive and important
business activities performed in the platform.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NULL, FK -> Company.id |
| actorUserId | UUID | NULL, FK -> User.id |
| action | VARCHAR(150) | NOT NULL |
| entityType | VARCHAR(100) | NOT NULL |
| entityId | UUID | NULL |
| previousValues | JSONB | NULL |
| newValues | JSONB | NULL |
| ipAddress | VARCHAR(45) | NULL |
| occurredAt | TIMESTAMP | NOT NULL |

Constraints:
- Audit records must not be arbitrarily modified
  by regular application users.
- Sensitive information such as passwords,
  access tokens, and secrets must never
  be recorded in audit payloads.
- Important permission changes must be logged.
- Approval decisions must remain traceable.
- Audit records must preserve the responsible
  actor when available.
- System-generated actions may have
  a NULL actorUserId.
- Audit retention and access policies
  must be defined before production deployment.

Relationships:
- Each AuditLog may reference one Company.
- Each AuditLog may reference one User.
- AuditLog can reference business entities
  through entityType and entityId.

## Proposed Default Roles

The following roles are recommended initial templates:

1. Company Admin
2. Project Manager
3. Site Manager
4. Inventory Manager
5. Procurement Officer
6. Logistics Coordinator

These roles are configurable and do not
automatically grant unrestricted access.

Users may receive multiple roles according
to their responsibilities and authorization scope.

## Authorization Example

Scenario:
A Site Manager requests a material transfer
from Project A to Project B.

Step 1:
- Verify the user is authenticated.

Step 2:
- Verify active company membership.

Step 3:
- Verify TRANSFER_REQUEST permission
  for the applicable project or site.

Step 4:
- Validate source and destination locations
  belong to the same company.

Step 5:
- Create the transfer request.

Step 6:
- Execute the required approval workflow.

Step 7:
- Revalidate permissions and stock availability
  before authorizing dispatch.

Important:
- Authentication does not imply authorization.
- Permissions must be checked on the backend.
- Approval authority may differ by project or site.
- Permission changes must take effect according
  to the defined session and authorization policy.

## Design Notes — Part 6

1. ReBuild uses customizable Role-Based
   Access Control (RBAC).

2. Roles belong to individual companies.

3. Permission definitions are platform-managed.

4. Users may belong to multiple companies.

5. Company membership determines company affiliation.

6. RoleAssignment defines the authorization scope.

7. Authorization supports COMPANY, PROJECT,
   and SITE scopes.

8. Users may hold multiple roles.

9. Least privilege must be enforced.

10. Users must not grant permissions beyond
    their permitted delegation authority.

11. Company ownership checks must protect
    all company-scoped business records.

12. Authentication credentials and authorization
    permissions are distinct concerns.

13. Important security events and business
    operations must be auditable.

14. Approval permissions must integrate with
    Part 4 — Dynamic Approval Workflow.

15. The final schema must define whether
    warehouse-specific access requires an
    additional WAREHOUSE scope or a separate
    resource-access policy.

16. Permission evaluation must account for
    active membership, role status, assignment
    expiration, and resource ownership.

17. System roles require protected modification
    and deletion policies.

18. Authentication sessions, password reset,
    and refresh-token persistence will be
    designed separately if required.

19. This section is a logical database draft,
    not an executable Prisma schema.


---

# Part 7 — Demand, BOQ, Procurement, Suppliers & Optimization

## 41. MaterialDemand

Represents a material demand requirement for a construction
project, derived from planning or operational requests.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| projectId | UUID | NOT NULL, FK -> Project.id |
| siteId | UUID | NULL, FK -> Site.id |
| materialId | UUID | NOT NULL, FK -> Material.id |
| requestItemId | UUID | NULL, FK -> MaterialRequestItem.id |
| requiredQuantity | DECIMAL(18,3) | NOT NULL |
| fulfilledQuantity | DECIMAL(18,3) | DEFAULT 0 |
| requiredByDate | DATE | NULL |
| source | ENUM | BOQ, MATERIAL_REQUEST, FORECAST, MANUAL |
| status | ENUM | OPEN, PARTIALLY_FULFILLED, FULFILLED, CANCELLED |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- requiredQuantity > 0.
- fulfilledQuantity >= 0.
- fulfilledQuantity <= requiredQuantity.
- Project and Site must belong to the specified Company.
- A referenced request item must belong to the same Project.
- Demand must not be counted twice when linked to BOQ
  and MaterialRequest records.
- Forecast demand must be distinguished from confirmed demand.
- Demand fulfillment must reflect confirmed operations.

Relationships:
- Each MaterialDemand belongs to one Project.
- Each MaterialDemand references one Material.
- A MaterialDemand may reference a MaterialRequestItem.
- Demand may be generated from BOQ or planning data.

## 42. SurplusAssessment

Represents an assessment of surplus or shortage
for a specific material and inventory location.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| materialId | UUID | NOT NULL, FK -> Material.id |
| locationId | UUID | NOT NULL, FK -> InventoryLocation.id |
| availableQuantity | DECIMAL(18,3) | NOT NULL |
| projectedDemand | DECIMAL(18,3) | NOT NULL |
| safetyStock | DECIMAL(18,3) | DEFAULT 0 |
| surplusQuantity | DECIMAL(18,3) | DEFAULT 0 |
| shortageQuantity | DECIMAL(18,3) | DEFAULT 0 |
| assessmentDate | TIMESTAMP | NOT NULL |
| planningHorizonDays | INTEGER | NOT NULL |

Constraints:
- All quantity values must be >= 0.
- planningHorizonDays > 0.
- Assessment must use consistent units.
- Assessment must reflect available inventory
  and demand for the specified planning horizon.
- Surplus and shortage must not both be positive
  for the same assessment under the basic model.
- Historical assessments must remain traceable.
- Assessments do not modify physical inventory.

Relationships:
- Each SurplusAssessment references one Material.
- Each SurplusAssessment references one InventoryLocation.
- Assessments may be consumed by Matching
  and Optimization services.

## 43. BOQ

Represents a Bill of Quantities for a construction project.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| projectId | UUID | NOT NULL, FK -> Project.id |
| code | VARCHAR(100) | NOT NULL |
| title | VARCHAR(200) | NOT NULL |
| version | INTEGER | NOT NULL |
| status | ENUM | DRAFT, APPROVED, SUPERSEDED, ARCHIVED |
| preparedById | UUID | NOT NULL, FK -> User.id |
| approvedAt | TIMESTAMP | NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- UNIQUE(projectId, code, version).
- version > 0.
- Approved BOQ versions must preserve their history.
- Only authorized users may approve BOQs.
- BOQ version changes must not silently overwrite
  previously approved requirements.

Relationships:
- Each BOQ belongs to one Project.
- One BOQ contains multiple BOQItems.

## 44. BOQItem

Represents a material or work-related line item
within a Bill of Quantities.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| boqId | UUID | NOT NULL, FK -> BOQ.id |
| itemCode | VARCHAR(100) | NOT NULL |
| description | TEXT | NOT NULL |
| materialId | UUID | NULL, FK -> Material.id |
| quantity | DECIMAL(18,3) | NOT NULL |
| unit | VARCHAR(30) | NOT NULL |
| estimatedUnitCost | DECIMAL(18,2) | NULL |

Constraints:
- UNIQUE(boqId, itemCode).
- quantity > 0.
- estimatedUnitCost >= 0 when provided.
- Material units must be compatible when materialId
  references the standardized material catalog.
- BOQItem may represent a work item without
  a direct Material reference.
- Work quantities must not automatically be treated
  as inventory demand without an explicit mapping.

Relationships:
- Each BOQItem belongs to one BOQ.
- A BOQItem may reference one Material.
- BOQItem data may contribute to MaterialDemand.

## 45. Supplier

Represents a supplier providing construction materials
or related procurement services.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| name | VARCHAR(200) | NOT NULL |
| contactEmail | VARCHAR(255) | NULL |
| contactPhone | VARCHAR(30) | NULL |
| address | TEXT | NULL |
| status | ENUM | ACTIVE, INACTIVE, BLOCKED |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- Supplier records are company-scoped.
- Blocked suppliers cannot receive new purchase orders.
- Supplier contact information must be access-controlled.
- Supplier duplicates must be handled through
  an agreed deduplication policy.
- Supplier historical purchase data must remain traceable.

Relationships:
- Each Supplier belongs to one Company.
- One Supplier may have multiple PurchaseOrders.
- One Supplier may be referenced by MaterialBatches.

## 46. SupplierMaterialOffer

Represents a supplier's quoted or listed offer
for a particular construction material.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| supplierId | UUID | NOT NULL, FK -> Supplier.id |
| materialId | UUID | NOT NULL, FK -> Material.id |
| unitPrice | DECIMAL(18,2) | NOT NULL |
| currencyCode | CHAR(3) | NOT NULL |
| minimumOrderQuantity | DECIMAL(18,3) | DEFAULT 0 |
| estimatedLeadTimeDays | INTEGER | NULL |
| validFrom | DATE | NULL |
| validUntil | DATE | NULL |
| isActive | BOOLEAN | DEFAULT true |
| createdAt | TIMESTAMP | NOT NULL |

Unit and currency semantics:
- Add offerUnit (VARCHAR(30), NOT NULL) to the physical schema or mandate
  that every quoted unitPrice is per Material.baseUnit.
- Optimization must normalize comparable offer prices to a selected
  currency using a dated exchange rate, if currencies differ.

Constraints:
- unitPrice >= 0.
- minimumOrderQuantity >= 0.
- estimatedLeadTimeDays >= 0 when provided.
- validUntil >= validFrom when both dates exist.
- Offer currency and unit must be interpreted consistently.
- Expired or inactive offers must not be treated
  as confirmed current prices.
- Supplier must be authorized for procurement.

Relationships:
- Each SupplierMaterialOffer belongs to one Supplier.
- Each offer references one Material.
- Offers may be evaluated by the Optimization Engine.

## 47. PurchaseRequest

Represents a procurement request for material
requirements not satisfied through internal stock.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| projectId | UUID | NOT NULL, FK -> Project.id |
| requestedById | UUID | NOT NULL, FK -> User.id |
| status | ENUM | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, ORDERED, CANCELLED |
| requiredByDate | DATE | NULL |
| justification | TEXT | NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- PurchaseRequest must belong to the specified Company.
- The Project must belong to the same Company.
- Only authorized users can submit procurement requests.
- Approval must follow the applicable ApprovalWorkflow.
- Rejected or cancelled requests cannot be ordered.
- Procurement requests must not automatically
  modify inventory quantities.

Relationships:
- Each PurchaseRequest belongs to one Project.
- Each PurchaseRequest is created by one User.
- One PurchaseRequest contains multiple PurchaseRequestItems.

## 48. PurchaseRequestItem

Represents one material requirement in a purchase request.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| purchaseRequestId | UUID | NOT NULL, FK -> PurchaseRequest.id |
| materialId | UUID | NOT NULL, FK -> Material.id |
| demandId | UUID | NULL, FK -> MaterialDemand.id |
| requestedQuantity | DECIMAL(18,3) | NOT NULL |
| unit | VARCHAR(30) | NOT NULL |
| estimatedUnitCost | DECIMAL(18,2) | NULL |
| notes | TEXT | NULL |

Constraints:
- requestedQuantity > 0.
- estimatedUnitCost >= 0 when provided.
- Unit must be compatible with Material.baseUnit.
- Demand linkage must not create duplicate demand.
- Purchased quantities must be tracked separately
  from requested and received quantities.

Relationships:
- Each PurchaseRequestItem belongs to one PurchaseRequest.
- Each item references one Material.
- An item may reference one MaterialDemand.
- A request item may be ordered in multiple PurchaseOrders.

## 49. PurchaseOrder

Represents an approved purchase order issued to a supplier.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| supplierId | UUID | NOT NULL, FK -> Supplier.id |
| projectId | UUID | NOT NULL, FK -> Project.id |
| orderNumber | VARCHAR(100) | NOT NULL |
| status | ENUM | DRAFT, ISSUED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED |
| currencyCode | CHAR(3) | NOT NULL |
| issuedAt | TIMESTAMP | NULL |
| expectedDeliveryDate | DATE | NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- UNIQUE(companyId, orderNumber).
- Supplier and Project must belong to the same Company.
- PurchaseOrder must satisfy applicable approval rules.
- Only authorized users may issue purchase orders.
- Order cancellation must respect already received quantities.
- Receipt must create appropriate inventory records
  through authorized stock operations.

Relationships:
- Each PurchaseOrder belongs to one Company.
- Each PurchaseOrder references one Supplier.
- One PurchaseOrder contains multiple PurchaseOrderItems.

## 50. PurchaseOrderItem

Represents one material line within a purchase order.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| purchaseOrderId | UUID | NOT NULL, FK -> PurchaseOrder.id |
| purchaseRequestItemId | UUID | NULL, FK -> PurchaseRequestItem.id |
| materialId | UUID | NOT NULL, FK -> Material.id |
| orderedQuantity | DECIMAL(18,3) | NOT NULL |
| receivedQuantity | DECIMAL(18,3) | DEFAULT 0 |
| unitPrice | DECIMAL(18,2) | NOT NULL |
| unit | VARCHAR(30) | NOT NULL |

Constraints:
- orderedQuantity > 0.
- receivedQuantity >= 0.
- receivedQuantity <= orderedQuantity.
- unitPrice >= 0.
- Unit must be compatible with Material.baseUnit.
- Purchase receipt must preserve batch traceability.
- Received quantities must correspond to
  confirmed inventory receipt transactions.
- Supplier and purchase order information
  must remain traceable.

Relationships:
- Each PurchaseOrderItem belongs to one PurchaseOrder.
- Each item references one Material.
- One item may reference one PurchaseRequestItem.
- One item may be fulfilled through multiple
  received MaterialBatches.

## 51. OptimizationRun

Represents one execution of the Transfer vs. Purchase
Optimization Engine.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| requestItemId | UUID | NOT NULL, FK -> MaterialRequestItem.id |
| matchResultId | UUID | NULL, FK -> MatchResult.id |
| algorithmVersion | VARCHAR(50) | NOT NULL |
| status | ENUM | RUNNING, COMPLETED, FAILED |
| objective | ENUM | MINIMUM_COST, BALANCED |
| currencyCode | CHAR(3) | NOT NULL |
| startedAt | TIMESTAMP | NOT NULL |
| completedAt | TIMESTAMP | NULL |
| parameters | JSONB | NULL |

Constraints:
- The request and MatchResult must refer
  to the same material requirement.
- Optimization must use technically eligible
  material candidates.
- An optimization run must not directly reserve,
  transfer, or purchase materials.
- Algorithm parameters must be traceable.
- Optimization results must preserve
  the algorithm version and assumptions.
- Company ownership must be validated.

Relationships:
- Each OptimizationRun belongs to one Company.
- Each OptimizationRun references one MaterialRequestItem.
- An OptimizationRun may reference one MatchResult.
- One OptimizationRun contains multiple OptimizationOptions.

## 52. OptimizationOption

Represents one evaluated solution produced
by an optimization run.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| optimizationRunId | UUID | NOT NULL, FK -> OptimizationRun.id |
| optionType | ENUM | TRANSFER, PURCHASE, MIXED |
| totalCost | DECIMAL(18,2) | NOT NULL |
| transportCost | DECIMAL(18,2) | DEFAULT 0 |
| purchaseCost | DECIMAL(18,2) | DEFAULT 0 |
| estimatedLeadTimeDays | INTEGER | NULL |
| coveredQuantity | DECIMAL(18,3) | NOT NULL |
| remainingQuantity | DECIMAL(18,3) | NOT NULL |
| rank | INTEGER | NOT NULL |
| isRecommended | BOOLEAN | DEFAULT false |
| details | JSONB | NULL |

Source traceability:
- The option details JSONB is descriptive, not a reliable substitute
  for normalized chosen source lines (matched stock / supplier offers).
- Define OptimizationOptionLine before implementing approval or execution
  of an optimization recommendation.

Constraints:
- totalCost >= 0.
- transportCost >= 0.
- purchaseCost >= 0.
- coveredQuantity >= 0.
- remainingQuantity >= 0.
- estimatedLeadTimeDays >= 0 when provided.
- rank > 0.
- UNIQUE(optimizationRunId, rank).
- At most one option per run may be marked recommended.
- Quantities must not exceed the requested quantity.
- Option costs must use consistent currencies
  and documented assumptions.
- Options must not bypass technical constraints
  established by the Matching Engine.
- Options are recommendations and do not
  automatically execute transactions.

Relationships:
- Each OptimizationOption belongs to one OptimizationRun.
- Option details may reference eligible transfer
  candidates and supplier offers.
- A selected option may initiate approval-controlled
  transfers or procurement requests.

## Design Notes — Part 7

1. MaterialDemand represents project material requirements.

2. Demand from BOQ and MaterialRequest must not
   be counted twice.

3. SurplusAssessment represents a time-specific
   analysis, not a physical inventory balance.

4. Surplus and shortage calculations must use
   a consistent planning horizon and unit of measure.

5. BOQ versions must preserve approved history.

6. Suppliers and offers are company-scoped.

7. Supplier offers must preserve price validity,
   currency, and procurement conditions.

8. Procurement requests require applicable approvals.

9. Purchase orders do not increase inventory
   until material receipt is confirmed.

10. Material receipt must preserve supplier
    and batch traceability.

11. Matching and optimization have distinct ownership:
    - Sally: Technical compatibility and eligible stock.
    - Jana: Cost comparison and economic recommendations.

12. Optimization uses Matching Engine outputs
    without modifying their technical eligibility.

13. Optimization results are recommendations only.

14. Inventory reservations, transfers, and purchases
    require separate authorized execution.

15. Partial fulfillment and mixed sourcing
    are supported.

16. The final implementation must define
    the detailed source allocations for each
    optimization option, not only JSONB summaries.

17. Cost calculations must define tax, freight,
    handling, currency conversion, and other
    applicable cost components.

18. Simulation data must remain isolated from
    actual stock and procurement transactions.

19. Supplier evaluation history is documented in Part 8;
    evaluation weights and score formulas remain to be finalized.

20. Shared identifiers, units, and API contracts
    must remain consistent across both team members.

21. Cross-company procurement and inventory
    ownership rules must be enforced.

22. This section is a logical database draft,
    not an executable Prisma schema.


---

# Part 8 — Simulation, Analytics, Sustainability, Predictions & Supporting Entities

## 53. SimulationScenario

Represents a hypothetical What-If simulation
without modifying real operational data.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| projectId | UUID | NULL, FK -> Project.id |
| createdById | UUID | NOT NULL, FK -> User.id |
| name | VARCHAR(200) | NOT NULL |
| description | TEXT | NULL |
| status | ENUM | DRAFT, READY, RUNNING, COMPLETED, FAILED, ARCHIVED |
| baselineDate | TIMESTAMP | NOT NULL |
| createdAt | TIMESTAMP | NOT NULL |
| updatedAt | TIMESTAMP | NOT NULL |

Constraints:
- A scenario belongs to one Company.
- The optional Project must belong to the same Company.
- Simulation must not modify real inventory.
- Simulation must not create real reservations,
  transfers, or purchase orders.
- Scenario ownership and access permissions
  must be validated.
- Historical completed scenarios must preserve
  their original assumptions and results.

Relationships:
- Each SimulationScenario belongs to one Company.
- One SimulationScenario may contain multiple
  SimulationRuns.

## 54. SimulationRun

Represents one execution of a What-If scenario.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| scenarioId | UUID | NOT NULL, FK -> SimulationScenario.id |
| algorithmVersion | VARCHAR(50) | NOT NULL |
| status | ENUM | RUNNING, COMPLETED, FAILED |
| startedAt | TIMESTAMP | NOT NULL |
| completedAt | TIMESTAMP | NULL |
| inputSnapshot | JSONB | NOT NULL |
| parameters | JSONB | NOT NULL |
| resultSummary | JSONB | NULL |
| errorMessage | TEXT | NULL |

Constraints:
- Input assumptions must be preserved.
- Each run must use an immutable input snapshot.
- Re-running a scenario creates a new SimulationRun.
- Simulation computations must remain isolated
  from operational database mutations.
- Algorithm version must be recorded.
- Failed runs must preserve diagnostic information
  without exposing sensitive credentials.
- Results must reflect their input assumptions.

Relationships:
- Each SimulationRun belongs to one SimulationScenario.
- One SimulationRun may produce multiple
  SimulationOutcome records.

## 55. SimulationOutcome

Stores structured outcomes of a simulation run.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| simulationRunId | UUID | NOT NULL, FK -> SimulationRun.id |
| outcomeType | ENUM | COST, TIME, MATERIAL_USAGE, WASTE, RESOURCE_ALLOCATION |
| metricName | VARCHAR(150) | NOT NULL |
| metricValue | DECIMAL(18,4) | NOT NULL |
| unit | VARCHAR(30) | NULL |
| details | JSONB | NULL |

Constraints:
- Metric units must be documented.
- Numeric results must correspond to
  the simulation's assumptions.
- Results must not be treated as real transactions.
- Historical outcomes must remain traceable.
- Metrics must be associated with the
  correct SimulationRun.

Relationships:
- Each SimulationOutcome belongs to one SimulationRun.

## 56. AnalyticsSnapshot

Stores historical computed indicators for
project operations and resource management.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| projectId | UUID | NULL, FK -> Project.id |
| metricCode | VARCHAR(150) | NOT NULL |
| metricValue | DECIMAL(18,4) | NOT NULL |
| metricUnit | VARCHAR(30) | NULL |
| periodStart | TIMESTAMP | NOT NULL |
| periodEnd | TIMESTAMP | NOT NULL |
| calculatedAt | TIMESTAMP | NOT NULL |
| metadata | JSONB | NULL |

Constraints:
- periodEnd > periodStart.
- Project must belong to the specified Company.
- Metric definitions must be consistent.
- Historical snapshots must preserve
  the calculation period and assumptions.
- Snapshots must not replace source
  transaction records.
- Company-level and project-level metrics
  must be distinguishable.

Relationships:
- Each AnalyticsSnapshot belongs to one Company.
- Each snapshot may belong to one Project.

## 57. SustainabilityMetric

Stores environmental and resource-efficiency
indicators related to construction operations.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| projectId | UUID | NULL, FK -> Project.id |
| metricType | ENUM | WASTE_REDUCTION, MATERIAL_REUSE, RECYCLING, TRANSPORT_EMISSIONS |
| value | DECIMAL(18,4) | NOT NULL |
| unit | VARCHAR(30) | NOT NULL |
| calculationMethod | VARCHAR(200) | NOT NULL |
| periodStart | TIMESTAMP | NOT NULL |
| periodEnd | TIMESTAMP | NOT NULL |
| calculatedAt | TIMESTAMP | NOT NULL |
| metadata | JSONB | NULL |

Constraints:
- periodEnd > periodStart.
- Project must belong to the specified Company.
- Calculations must use documented methodology.
- Measurement units must be consistent.
- Estimated values must not be presented
  as directly measured values.
- Sustainability metrics must remain traceable
  to source data or documented assumptions.
- Negative values must be permitted only
  for metrics whose definition supports them.

Relationships:
- Each SustainabilityMetric belongs to one Company.
- Each metric may belong to one Project.
- Metrics may be derived from WasteRecord,
  MaterialRecovery, StockMovement, and Transfer data.

## 58. PredictionRun

Represents one execution of a predictive
analytics or anomaly detection model.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| projectId | UUID | NULL, FK -> Project.id |
| modelName | VARCHAR(150) | NOT NULL |
| modelVersion | VARCHAR(50) | NOT NULL |
| predictionType | ENUM | DEMAND_FORECAST, SHORTAGE_RISK, ANOMALY_DETECTION |
| status | ENUM | RUNNING, COMPLETED, FAILED |
| inputPeriodStart | TIMESTAMP | NULL |
| inputPeriodEnd | TIMESTAMP | NULL |
| parameters | JSONB | NULL |
| startedAt | TIMESTAMP | NOT NULL |
| completedAt | TIMESTAMP | NULL |

Constraints:
- Model name and version must be recorded.
- Company and Project ownership must be validated.
- Prediction runs must not modify
  operational inventory automatically.
- Input data periods must be valid.
- Model assumptions must be documented.
- Failed executions must be traceable.

Relationships:
- Each PredictionRun belongs to one Company.
- One PredictionRun may produce multiple
  PredictionResults and AnomalyRecords.

## 59. PredictionResult

Stores the estimated output of a prediction model.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| predictionRunId | UUID | NOT NULL, FK -> PredictionRun.id |
| materialId | UUID | NULL, FK -> Material.id |
| locationId | UUID | NULL, FK -> InventoryLocation.id |
| predictedValue | DECIMAL(18,4) | NOT NULL |
| unit | VARCHAR(30) | NOT NULL |
| forecastDate | DATE | NULL |
| confidenceScore | DECIMAL(5,4) | NULL |
| details | JSONB | NULL |

Constraints:
- confidenceScore must be between 0 and 1
  when provided and explicitly defined.
- Forecast results must preserve the
  model version through PredictionRun.
- Forecasts must not be treated as
  confirmed material demand.
- Material and Location references must
  belong to the appropriate company scope.
- Prediction units and dates must
  be interpreted consistently.

Relationships:
- Each PredictionResult belongs to one PredictionRun.
- A result may reference one Material.
- A result may reference one InventoryLocation.

## 60. AnomalyRecord

Stores detected anomalies in inventory,
procurement, transfers, or material usage.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| predictionRunId | UUID | NOT NULL, FK -> PredictionRun.id |
| entityType | VARCHAR(100) | NOT NULL |
| entityId | UUID | NOT NULL |
| anomalyType | VARCHAR(150) | NOT NULL |
| severity | ENUM | LOW, MEDIUM, HIGH, CRITICAL |
| anomalyScore | DECIMAL(5,4) | NULL |
| explanation | TEXT | NULL |
| status | ENUM | OPEN, UNDER_REVIEW, RESOLVED, DISMISSED |
| detectedAt | TIMESTAMP | NOT NULL |
| reviewedById | UUID | NULL, FK -> User.id |
| reviewedAt | TIMESTAMP | NULL |

Constraints:
- anomalyScore must be between 0 and 1
  when provided.
- Detected anomalies are alerts,
  not confirmed misconduct or errors.
- Anomaly review must be authorized.
- Historical anomaly records must be preserved.
- Entity references must be validated
  according to entityType.
- Anomalies must not automatically modify
  inventory or procurement transactions.

Relationships:
- Each AnomalyRecord belongs to one PredictionRun.
- An AnomalyRecord may be reviewed by one User.
- Entity references identify the affected
  business record.

## 61. SupplierEvaluation

Stores a structured evaluation of a supplier.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| supplierId | UUID | NOT NULL, FK -> Supplier.id |
| evaluatedById | UUID | NOT NULL, FK -> User.id |
| qualityScore | DECIMAL(5,2) | NULL |
| deliveryScore | DECIMAL(5,2) | NULL |
| priceScore | DECIMAL(5,2) | NULL |
| overallScore | DECIMAL(5,2) | NULL |
| evaluationPeriodStart | DATE | NULL |
| evaluationPeriodEnd | DATE | NULL |
| notes | TEXT | NULL |
| evaluatedAt | TIMESTAMP | NOT NULL |

Constraints:
- Scores must be between 0 and 100
  when provided.
- Evaluation period must be valid.
- Only authorized users can evaluate suppliers.
- Overall score calculation must follow
  a documented weighting method.
- Historical evaluations must remain traceable.
- Supplier evaluation must not overwrite
  previous evaluation records.

Relationships:
- Each SupplierEvaluation belongs to one Supplier.
- Each SupplierEvaluation is created by one User.
- Evaluations may support Supplier Intelligence.

## 62. DocumentRecord

Stores metadata for documents associated
with projects, procurement, or operations.

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| companyId | UUID | NOT NULL, FK -> Company.id |
| uploadedById | UUID | NOT NULL, FK -> User.id |
| projectId | UUID | NULL, FK -> Project.id |
| documentType | ENUM | BOQ, PURCHASE_ORDER, INVOICE, DELIVERY_NOTE, CERTIFICATE, OTHER |
| originalFileName | VARCHAR(255) | NOT NULL |
| storageKey | VARCHAR(500) | NOT NULL |
| mimeType | VARCHAR(150) | NOT NULL |
| fileSizeBytes | BIGINT | NOT NULL |
| uploadedAt | TIMESTAMP | NOT NULL |
| metadata | JSONB | NULL |

Constraints:
- fileSizeBytes > 0.
- Document ownership must respect company scope.
- The referenced Project must belong to the Company.
- File access must require authorization.
- Storage keys must not expose secret credentials.
- Uploaded files must be validated for type and size.
- File storage must be protected from unauthorized access.
- Documents should be stored outside the
  primary database; metadata remains in PostgreSQL.
- Document deletion and retention policies
  must be defined before production use.

Relationships:
- Each DocumentRecord belongs to one Company.
- Each DocumentRecord is uploaded by one User.
- A document may be associated with one Project.
- Links to BOQ, PurchaseOrder, Supplier, or other
  records require an explicit relational design
  or a validated association mechanism.

## Design Notes — Part 8

1. Simulation scenarios are hypothetical and must
   not mutate real operational inventory.

2. Every simulation execution preserves an
   immutable input snapshot.

3. Simulation runs maintain algorithm versions
   and historical results.

4. AnalyticsSnapshot stores computed indicators,
   not operational source-of-truth records.

5. Sustainability calculations must preserve
   their methodology, assumptions, and units.

6. Predictions represent estimates, not
   confirmed future events or demand.

7. Anomaly detection results are alerts requiring
   interpretation and potential review.

8. Supplier evaluations preserve historical
   scores and evaluation criteria.

9. DocumentRecord stores file metadata while
   actual files reside in protected file storage.

10. Company ownership and role-based authorization
    apply to analytics, simulations, documents,
    and prediction records.

11. Prediction and simulation results must not
    trigger transfers or purchasing without
    separate authorized business operations.

12. Source references, model versions, and
    calculation parameters must be traceable.

13. The final design must establish retention
    and access policies for historical records.

14. Large operational datasets may require
    indexing, pagination, partitioning, or
    archival policies based on measured scale.

15. Prediction reliability must be evaluated
    using appropriate historical data and
    documented validation metrics.

16. The final design should consider whether
    calculated analytics can be generated on demand
    instead of storing redundant snapshot tables.

17. The generic entity references used by
    AnomalyRecord and DocumentRecord require
    explicit integrity and authorization rules.

18. This section is a logical database draft,
    not an executable Prisma schema.

---

# Cross-Cutting Consistency Rules — Design Review

## Inventory and Reservation Rules

1. Quantities are stored in a material's canonical base unit.
2. ProjectAllocation earmarks stock but does not physically subtract it.
3. Reservation creates a hold but does not physically subtract it.
4. Only ACTIVE reservations reduce computed free availability.
5. Reserving unallocated stock must never consume another project's allocation.
6. Creation, expiration, release, dispatch and stock adjustments require
   concurrency-safe transactions and ownership checks.
7. Allocation and reservation balances must be revalidated when usable
   quantity is reduced by damage, issue, adjustment or dispatch.
8. Physical stock balances may change only through an auditable business
   operation accompanied by corresponding StockMovement records.

## Transfer and Fulfillment Rules

1. Matching and optimization results never mutate stock or create holds.
2. Dispatch removes physical quantity from source stock; received quantity
   enters destination stock only on confirmed receipt.
3. In-transit balances are tracked separately and reconciled on receipt,
   loss, return or damage settlement.
4. Reservations must support atomic consumption/dispatch and prevent repeat
   fulfillment. An explicit fulfillment ledger may be needed where partial
   consumption of a single reservation is allowed.
5. Demand, reserved, dispatched and received quantities are distinct;
   request fulfillment status should derive from confirmed business events.
6. Inter-project transfers must preserve allocation ownership and approvals.

## Multi-Company and Permission Rules

1. Every operational company-scoped entity must be associated with the
   same company as its referenced project/location/supplier/stock.
2. Catalog entities Material, MaterialCategory and AttributeDefinition are
   shared definitions in v1; operational inventory remains company-isolated.
3. Permissions must be checked at execution time, not merely at request time.
4. Approval operations must be linked to an existing correctly typed entity;
   polymorphic references require explicit service-level integrity checks
   or redesign using normal foreign keys.
5. Any generic entityType/entityId references must not be treated as
   database-enforced FKs without an additional association structure.

## Prisma / PostgreSQL Implementation Gates

Before the first migration, define and validate:
- all relation names and required/optional FK cardinality;
- CHECK constraints for positive quantities, date order and XOR relationships;
- scoped uniqueness and multi-company integrity enforcement;
- explicit approval workflow versioning and decision-to-instance FKs;
- stock movement references, transit-loss handling and partial reservation
  fulfillment/settlement;
- units/conversions, supplier-offer units and currency conversions;
- procurement receipt lines and traceable received batches;
- normalized optimization source lines for committed plans;
- transaction isolation/locking and idempotency for stock modifications;
- indexes on companyId, projectId, locationId, materialId and status based
  on actual query patterns.

These design gates are not claims that the listed constraints are already
implemented in Prisma or PostgreSQL.

# Current Design Status

- Parts documented: 8 of 8.
- Entity definitions: 62 (numbered 1 through 62, no duplicated definitions).
- Document version: 0.2 — Reviewed Draft.
- Logical design: Documented; implementation decisions remain open.
- ERD: Not yet finalized.
- Prisma models: Not yet implemented.
- Database migrations: Not started.
- Git status: This document may be committed as a draft on the
  design/database-foundation branch, without merging into main.

The Data Dictionary is a design reference, not an executable database schema.
Do not run production migrations from this document alone.
