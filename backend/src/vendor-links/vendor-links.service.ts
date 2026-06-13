import { Injectable } from '@nestjs/common';

export type VendorLinkKey = 'booking' | 'telehealth' | 'forms' | 'documents' | 'billing' | 'privacy';
type VendorLinks = Record<VendorLinkKey, string>;

@Injectable()
export class VendorLinksService {
  getPublicLinks(): VendorLinks {
    return {
      booking: process.env.VENDOR_BOOKING_URL || '',
      telehealth: process.env.VENDOR_TELEHEALTH_URL || '',
      forms: process.env.VENDOR_FORMS_URL || '',
      documents: process.env.VENDOR_DOCUMENTS_URL || '',
      billing: process.env.VENDOR_BILLING_URL || '',
      privacy: process.env.PRIVACY_URL || '',
    };
  }

  getReadiness() {
    const links = this.getPublicLinks();
    const missing = Object.entries(links).filter(([, value]) => !value).map(([key]) => key);
    return {
      mode: 'compliance-gateway',
      storesClinicalRecords: false,
      storesPatientDocuments: false,
      storesTelehealthMedia: false,
      localClinicalCaptureEnabled: false,
      missingVendorLinks: missing,
    };
  }
}
