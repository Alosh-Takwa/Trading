/**
 * Comprehensive TypeScript Data Models for SinoTrack ERP
 * Specialized in Chinese Home Appliances Sourcing, Procurement, and Import Management
 */

export type UserRole = 'super_admin' | 'procurement_manager' | 'finance' | 'shipping_manager' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  status: 'active' | 'suspended';
  customPermissions?: string[];
  password?: string;
  createdAt?: string;
  lastLogin?: string;
  notes?: string;
}

export type SupplierType = 'manufacturer' | 'trading_company' | 'distributor' | 'components_supplier' | 'service_provider';
export type SupplierStatus = 'active' | 'potential' | 'negotiating' | 'paused' | 'untrusted';

export interface SupplierContact {
  id: string;
  supplierId: string;
  name: string;
  chineseName?: string;
  position: string;
  department?: string;
  phone: string;
  whatsapp?: string;
  wechatId?: string;
  email: string;
  skype?: string;
  socialLink?: string;
  language: string;
  internalOwner: string;
  contactStartDate: string;
  notes?: string;
  avatar?: string;
  isPrimary: boolean;
}

export type CommunicationChannel = 'email' | 'whatsapp' | 'wechat' | 'call' | 'meeting' | 'factory_visit';

export interface CommunicationLog {
  id: string;
  supplierId: string;
  contactId?: string;
  contactName?: string;
  date: string;
  channel: CommunicationChannel;
  subject: string;
  summary: string;
  nextAction?: string;
  nextFollowUpDate?: string;
  assignedTo: string;
  attachments?: string[];
  createdAt: string;
}

export interface SupplierRating {
  productQuality: number; // 1-5
  priceCompetitiveness: number; // 1-5
  responseTime: number; // 1-5
  deliveryTimeliness: number; // 1-5
  packagingQuality: number; // 1-5
  specAccuracy: number; // 1-5
  negotiationFlexibility: number; // 1-5
  communicationQuality: number; // 1-5
  punctuality: number; // 1-5
  problemSolving: number; // 1-5
  overallScore: number; // Calculated average
  notes?: string;
  evaluatedBy?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string; // e.g. "SUP-001"
  nameEn: string;
  nameCn?: string;
  factoryName?: string;
  logo?: string;
  type: SupplierType;
  country: string;
  city: string;
  address: string;
  geolocation?: { lat: number; lng: number };
  website?: string;
  alibabaUrl?: string;
  madeInChinaUrl?: string;
  globalSourcesUrl?: string;
  socialAccounts?: { platform: string; url: string }[];
  phone: string;
  whatsapp?: string;
  email: string;
  wechat?: string;
  qq?: string;
  legalCompanyName?: string;
  commercialRegNo?: string;
  firstContactDate: string;
  sourcingChannel: string; // e.g., Canton Fair, Alibaba, Referral
  status: SupplierStatus;
  rating: SupplierRating;
  internalNotes?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  subFolders?: { [key: string]: string }; // folderType -> driveFolderId
  catalogs?: SupplierCatalog[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCatalog {
  id: string;
  supplierId: string;
  name: string;
  fileDataUrl?: string;
  driveFileId?: string;
  driveViewLink?: string;
  driveDownloadLink?: string;
  fileSize?: string;
  mimeType?: string;
  uploadedAt: string;
}

export type ProductCategoryType = 
  | 'refrigerators' 
  | 'washing_machines' 
  | 'air_conditioners' 
  | 'ovens_stoves' 
  | 'small_kitchen' 
  | 'water_heaters' 
  | 'other';

export interface CategoryAttributeDef {
  key: string;
  labelEn: string;
  labelAr: string;
  unit?: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
}

export interface ProductAttributeValue {
  key: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  caption?: string;
  type: 'primary' | 'angle' | 'spec_label' | 'packaging' | 'manufacturing';
  driveFileId?: string;
}

export interface ProductDocument {
  id: string;
  title: string;
  type: 'catalog' | 'datasheet' | 'quality_cert' | 'conformity_cert' | 'video' | 'design_pack';
  url: string;
  driveFileId?: string;
  uploadedAt: string;
  fileSize?: string;
}

export interface Product {
  id: string; // e.g. "PRD-001"
  nameAr: string;
  nameEn: string;
  nameCn?: string;
  modelNumber: string;
  brand: string;
  category: ProductCategoryType;
  subCategory?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  applicationUsage?: string;
  countryOfOrigin?: string;
  specifications: ProductAttributeValue[];
  images: ProductImage[];
  documents?: ProductDocument[];
  notes?: string;
  image?: string;
  status?: string;
  unitOfMeasure?: string;
  supplierId?: string;
  supplierName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type Incoterm = 'FOB' | 'EXW' | 'CIF' | 'DDP' | 'CFR';
export type CurrencyCode = 'USD' | 'CNY' | 'EUR' | 'SAR' | 'AED' | 'SYP' | string;

export interface Quotation {
  id: string; // e.g. "QT-2026-001"
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  modelNumber: string;
  contactPersonId?: string;
  contactPersonName?: string;
  date: string;
  validUntil: string;
  unitPrice: number;
  currency: CurrencyCode;
  moq: number;
  priceType: Incoterm;
  fobPrice?: number;
  exwPrice?: number;
  cifPrice?: number;
  paymentTerms: string; // e.g. "30% Deposit, 70% against B/L copy"
  productionLeadDays: number; // e.g. 35 days
  packagingCost?: number;
  moldCost?: number;
  sampleCost?: number;
  portOfOrigin: string; // e.g. "Ningbo", "Shenzhen", "Foshan"
  notes?: string;
  attachmentUrl?: string;
  driveFileId?: string;
  status?: string;
  createdAt: string;
}

export interface PriceHistoryRecord {
  id: string;
  productId: string;
  supplierId: string;
  supplierName: string;
  quotationId: string;
  price: number;
  currency: CurrencyCode;
  priceType: Incoterm;
  moq: number;
  date: string;
  percentageChange?: number; // compared to previous price
}

export type POStatus = 
  | 'draft' 
  | 'pending_confirmation' 
  | 'confirmed' 
  | 'in_production' 
  | 'partial_production' 
  | 'production_completed' 
  | 'pending_inspection' 
  | 'ready_to_ship' 
  | 'shipped' 
  | 'received' 
  | 'completed' 
  | 'cancelled';

export interface POItem {
  id: string;
  productId: string;
  productName: string;
  modelNumber: string;
  specsSummary: string;
  quantity: number;
  originalQuotedPrice: number; // Original quote price (preserved)
  negotiatedUnitPrice: number; // Actual agreed price in PO
  currency: CurrencyCode;
  discountPercentage?: number;
  taxPercentage?: number;
  totalItemAmount: number;
}

export interface POStatusHistoryItem {
  status: POStatus;
  date: string;
  note?: string;
  updatedBy: string;
}

export interface PurchaseOrder {
  id: string; // e.g. "PO-2026-001"
  supplierId: string;
  supplierName: string;
  factoryName?: string;
  originalQuotationId?: string;
  assignedManager: string;
  orderDate: string;
  supplierConfirmDate?: string;
  expectedProductionStart?: string;
  expectedProductionEnd?: string;
  actualProductionEnd?: string;
  paymentTerms: string;
  deliveryTerms: Incoterm;
  currency: CurrencyCode;
  exchangeRateToUSD?: number;
  items: POItem[];
  subtotal: number;
  totalDiscount: number;
  additionalCosts: {
    packagingCost: number;
    moldCost: number;
    sampleCost: number;
    freightLocalCost: number;
    otherCost: number;
  };
  totalTax: number;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  status: POStatus;
  statusHistory: POStatusHistoryItem[];
  notes?: string;
  attachments?: string[];
  driveFolderId?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string; // e.g. "INV-2026-001"
  invoiceNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes?: string;
  attachmentUrl?: string;
  driveFileId?: string;
  createdAt: string;
}

export type PaymentMethod = 'bank_wire_tt' | 'letter_of_credit_lc' | 'cash' | 'escrow' | 'other';

export interface Payment {
  id: string; // e.g. "PAY-2026-001"
  invoiceId: string;
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  paymentDate: string;
  amount: number;
  currency: CurrencyCode;
  exchangeRateToUSD?: number;
  paymentMethod: PaymentMethod;
  bankAccountUsed: string;
  transactionReference: string; // SWIFT / Ref #
  executedBy: string;
  proofFileUrl?: string;
  driveFileId?: string;
  notes?: string;
  createdAt: string;
}

export type ShippingType = 'sea' | 'air' | 'land' | 'multimodal';
export type ContainerType = '20GP' | '40GP' | '40HQ' | '45HQ' | 'LCL' | 'Air_Cargo';

export type ShipmentStatus = 
  | 'pending_booking' 
  | 'booked' 
  | 'cargo_ready' 
  | 'loaded' 
  | 'departed_origin' 
  | 'in_transit' 
  | 'arrived_destination' 
  | 'customs_clearance' 
  | 'customs_cleared' 
  | 'delivered' 
  | 'completed' 
  | 'delayed';

export interface ShipmentDocument {
  id: string;
  type: 'bill_of_lading' | 'commercial_invoice' | 'packing_list' | 'certificate_of_origin' | 'insurance_cert' | 'customs_doc' | 'conformity_cert' | 'other';
  title: string;
  url: string;
  driveFileId?: string;
  uploadedAt: string;
}

export interface Shipment {
  id: string; // e.g. "SH-2026-001"
  containerNumber: string;
  supplierId: string;
  supplierName: string;
  linkedPoIds: string[];
  shippingCompany: string; // e.g. Sinotrans, DHL Global, Kuehne+Nagel
  shippingLine: string; // e.g. COSCO, Maersk, MSC, Evergreen, CMA CGM
  shippingAgentName: string;
  shippingAgentContact: string;
  portOfLoading: string; // e.g. Shenzhen, Ningbo, Shanghai
  portOfDischarge: string; // e.g. Jeddah Islamic Port, Jebel Ali, Dammam
  originCountry: string;
  destinationCountry: string;
  shippingType: ShippingType;
  containerType: ContainerType;
  containerCount: number;
  grossWeightKg: number;
  totalVolumeCbm: number;
  cartonsCount: number;
  shippingCost: number;
  currency: CurrencyCode;
  additionalCosts: number;
  billOfLadingNumber: string;
  bookingNumber: string;
  trackingNumber?: string;
  bookingDate?: string;
  cargoReadyDate?: string;
  loadingDate?: string;
  etd: string; // Estimated Time of Departure
  eta: string; // Estimated Time of Arrival
  ata?: string; // Actual Time of Arrival
  customsClearanceDate?: string;
  finalDeliveryDate?: string;
  status: ShipmentStatus;
  documents: ShipmentDocument[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CostDistributionMethod = 'by_value' | 'by_weight' | 'by_cbm' | 'by_quantity' | 'manual';

export interface LandedCostItem {
  productId: string;
  productName: string;
  modelNumber: string;
  quantity: number;
  fobUnitPrice: number;
  totalFobCost: number;
  weightKg?: number;
  volumeCbm?: number;
  allocatedFreightCost: number;
  allocatedInsuranceCost: number;
  allocatedCustomsDuty: number;
  allocatedPortFees: number;
  allocatedInternalTransport: number;
  allocatedOtherCost: number;
  totalImportCosts: number;
  finalLandedUnitCost: number;
  landedMarkupPercent: number; // ((LandedUnitCost - FOB) / FOB) * 100
}

export interface LandedCostCalculation {
  id: string;
  shipmentId: string;
  purchaseOrderId: string;
  distributionMethod: CostDistributionMethod;
  totalFobGoodsCost: number;
  seaFreightCost: number;
  insuranceCost: number;
  customsDutyCost: number; // e.g. 5% - 15%
  portClearanceCost: number;
  internalTruckingCost: number;
  miscInspectionCost: number;
  grandTotalImportCost: number;
  items: LandedCostItem[];
  calculatedAt: string;
}

export type SampleStatus = 'requested' | 'in_preparation' | 'shipped' | 'arrived' | 'testing' | 'accepted' | 'rejected' | 'revision_needed';

export interface SampleRequest {
  id: string; // e.g. "SMP-2026-001"
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  modelNumber: string;
  requestDate: string;
  sampleCost: number;
  shippingCost: number;
  currency: CurrencyCode;
  expectedArrival?: string;
  actualArrival?: string;
  status: SampleStatus;
  testResult?: string;
  inspectorName?: string;
  notes?: string;
  photos?: string[];
  createdAt: string;
}

export interface QualityInspection {
  id: string; // e.g. "QC-2026-001"
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  productName: string;
  inspectorName: string;
  inspectionDate: string;
  quantityInspected: number;
  passedQuantity: number;
  defectiveQuantity: number;
  defectRatePercent: number;
  inspectionPassed: boolean;
  notes: string;
  photos: string[];
  reportPdfUrl?: string;
  createdAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  createdAt: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  relatedEntityType?: 'supplier' | 'product' | 'order' | 'shipment' | 'sample';
  relatedEntityId?: string;
  relatedEntityTitle?: string;
  completedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'create' | 'update' | 'delete' | 'export' | 'sync_drive';
  entity: 'supplier' | 'product' | 'quotation' | 'order' | 'invoice' | 'payment' | 'shipment' | 'sample' | 'qc' | 'settings';
  entityId: string;
  entityName?: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  companyNameAr: string;
  companyNameEn: string;
  companyLogo?: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRegistrationNumber: string;
  baseCurrency: CurrencyCode;
  exchangeRates: { [key: string]: number }; // against USD
  customCurrencies?: {
    code: string;
    nameAr: string;
    nameEn: string;
    symbolAr?: string;
    symbolEn?: string;
    rateToUSD: number;
  }[];
  chinesePorts: string[];
  destinationPorts: string[];
  shippingLines: string[];
  driveRootFolderName: string;
  // Platform Customization
  platformName?: string;
  platformSubtitleAr?: string;
  platformSubtitleEn?: string;
  platformLogoUrl?: string;
}
