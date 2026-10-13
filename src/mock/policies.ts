export type PolicyType = 
  | 'TERMS_OF_SERVICE' 
  | 'PRIVACY_POLICY' 
  | 'DRIVER_POLICY' 
  | 'RIDER_POLICY'
  | 'CANCELLATION_POLICY'
  | 'REFUND_POLICY'

export interface MockPolicy {
  id: string
  type: PolicyType
  title: string
  content: string
  version: string
  lastUpdated: string
  updatedBy: string
  isActive: boolean
}

export const mockPolicies: MockPolicy[] = [
  {
    id: 'POL001',
    type: 'TERMS_OF_SERVICE',
    title: 'Terms of Service',
    content: `# Terms of Service

## 1. Acceptance of Terms
By accessing and using the PATULOD platform, you accept and agree to be bound by these Terms of Service.

## 2. User Responsibilities
- Provide accurate information
- Maintain account security
- Comply with local laws and regulations

## 3. Service Description
PATULOD provides a platform connecting riders with drivers for transportation services within Naga City.`,
    version: '1.2',
    lastUpdated: '2026-09-15',
    updatedBy: 'Admin',
    isActive: true,
  },
  {
    id: 'POL002',
    type: 'PRIVACY_POLICY',
    title: 'Privacy Policy',
    content: `# Privacy Policy

## Information We Collect
- Personal identification information
- Location data
- Payment information
- Trip history

## How We Use Your Information
- To provide and improve our services
- To process payments
- To ensure safety and security`,
    version: '1.1',
    lastUpdated: '2026-08-20',
    updatedBy: 'Admin',
    isActive: true,
  },
  {
    id: 'POL003',
    type: 'CANCELLATION_POLICY',
    title: 'Cancellation Policy',
    content: `# Cancellation Policy

## Rider Cancellations
- Free cancellation within 2 minutes of booking
- ₱20 cancellation fee after 2 minutes
- No fee if driver is late by more than 10 minutes

## Driver Cancellations
- Excessive cancellations may result in account suspension
- Valid reasons include safety concerns and rider no-show`,
    version: '1.0',
    lastUpdated: '2026-07-10',
    updatedBy: 'Admin',
    isActive: true,
  },
]
