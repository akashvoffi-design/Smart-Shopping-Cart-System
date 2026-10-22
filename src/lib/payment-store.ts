import { PaymentDetails } from '@/types';

// Global singleton for Next.js dev server HMR stability
const globalForPayments = globalThis as unknown as {
  smartcartPaymentSessions: Map<string, PaymentDetails>;
};

export const paymentSessions =
  globalForPayments.smartcartPaymentSessions ||
  (globalForPayments.smartcartPaymentSessions = new Map<string, PaymentDetails>());
