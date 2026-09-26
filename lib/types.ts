export type UserRole = 'MEMBER' | 'PARTNER' | 'MODERATOR' | 'ADMIN';

export interface UserSummary {
  id: string;
  name: string;
  username: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  pilotGlider?: string | null;
  pilotLicenseNumber?: string | null;
  isPilotVerified: boolean;
  mutedUntil?: string | null;
}

export type TaxiStatus = 'OPEN' | 'ALMOST_FULL' | 'FULL' | 'COMPLETED' | 'CANCELLED';

export interface TaxiBookingInfo {
  id: string;
  tripId: string;
  userId: string;
  passengerCount: number;
  contactPhone: string;
  status: 'CONFIRMED' | 'CANCELLED';
  bookedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    phone: string;
  };
}

export interface TaxiTripInfo {
  id: string;
  hostId: string;
  pickupLocation: string;
  destination: string;
  tripDate: string;
  pickupTime: string;
  totalSeats: number;
  availableSeats: number;
  farePerSeat: number;
  driverName: string;
  driverPhone: string;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  notes?: string | null;
  status: TaxiStatus;
  createdAt: string;
  host: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    isPilotVerified: boolean;
  };
  bookings: TaxiBookingInfo[];
}

export interface ChatMessageInfo {
  id: string;
  senderId: string;
  content: string;
  mediaUrl?: string | null;
  mediaType: 'NONE' | 'IMAGE' | 'VIDEO';
  replyToId?: string | null;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    username: string;
    role: string;
    avatarUrl?: string | null;
    isPilotVerified: boolean;
  };
  replyTo?: {
    id: string;
    sender: {
      name: string;
      username: string;
    };
    content: string;
  } | null;
}

export interface LostFoundInfo {
  id: string;
  userId: string;
  type: 'LOST' | 'FOUND';
  title: string;
  category: string;
  description: string;
  photos: string[];
  itemDate: string;
  location: string;
  contactPhone: string;
  status: 'OPEN' | 'CLAIMED' | 'RESOLVED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
}

export interface MarketplaceInfo {
  id: string;
  sellerId: string;
  title: string;
  category: string;
  description: string;
  condition: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR';
  price: number;
  location: string;
  photos: string[];
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  contactPhone: string;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    isPilotVerified: boolean;
  };
}

export interface PartnerDocInfo {
  id: string;
  applicationId: string;
  docType: string;
  title: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface PartnerApplicationInfo {
  id: string;
  partnerId: string;
  companyName: string;
  contactPerson: string;
  businessType: string;
  registrationNumber: string;
  address: string;
  pilotCount: number;
  insurancePolicyNo: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CHANGES_REQUIRED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  adminNotes?: string | null;
  changeRequestReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  partner: {
    id: string;
    name: string;
    username: string;
    email?: string | null;
    phone: string;
  };
  documents: PartnerDocInfo[];
  permit?: PermitInfo | null;
}

export interface PermitInfo {
  id: string;
  permitNumber: string;
  applicationId: string;
  partnerId: string;
  issuedDate: string;
  expiryDate: string;
  scope: string;
  qrCodeData: string;
  status: 'VALID' | 'REVOKED' | 'EXPIRED';
  issuedByAdminId: string;
  createdAt: string;
  partner?: {
    name: string;
    phone: string;
    companyName?: string;
  };
  application?: {
    companyName: string;
    registrationNumber: string;
    businessType: string;
    pilotCount: number;
  };
}
