export type UserRole = "firm" | "auditor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  // Auditor specific
  aadhar?: string;
  upi?: string;
  currentLocation?: string;
  auditLocations?: string[];
}

export interface AuditorSubmission {
  auditorName: string;
  auditorPhone: string;
  auditorEmail: string;
  auditorAadhar: string;
  auditorUPI: string;
  completedAt?: string;
  customReport?: string;
  status: "pending" | "submitted";
}

export interface Assignment {
  id: string;
  firmId: string;
  firmName: string;
  firmPhone: string;
  firmEmail: string;
  auditLocation: string;
  auditType: string;
  requirement: string;
  paymentDetail: string;
  dueDate: string;
  paymentDueDate?: string;
  status: "pending_admin" | "approved" | "assigned" | "completed";
  createdAt: string;
  auditorId?: string;
  auditorSubmission?: AuditorSubmission;
  adminFields: {
    auditorName?: string;
    auditorAadhar?: string;
    auditorPhone?: string;
    auditorEmail?: string;
    paymentInfo?: string;
    termsConditions?: string;
    customFields?: { label: string; value: string }[];
  };
  visibleFields: string[];
}
