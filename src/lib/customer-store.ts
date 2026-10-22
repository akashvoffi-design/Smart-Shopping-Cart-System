export interface CustomerAccount {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  upi_id: string;
  verified: boolean;
  created_at: string;
  updated_at?: string;
}

// In-memory backend customer database to ensure high-availability
const customerDatabase = new Map<string, CustomerAccount>();

// Seed default initial profile
const defaultCustomer: CustomerAccount = {
  id: 'cust_default_01',
  full_name: 'Akash Sharma',
  email: 'akash.sharma@example.com',
  phone: '+91 98765 43210',
  upi_id: 'akash@okhdfcbank',
  verified: true,
  created_at: new Date().toISOString(),
};

customerDatabase.set(defaultCustomer.email.toLowerCase(), defaultCustomer);
customerDatabase.set(defaultCustomer.id, defaultCustomer);

let currentSessionCustomerId: string = defaultCustomer.id;

export function registerCustomer(data: {
  full_name: string;
  email: string;
  phone?: string;
  upi_id?: string;
}): CustomerAccount {
  const cleanEmail = data.email.trim().toLowerCase();
  const existing = customerDatabase.get(cleanEmail);

  if (existing) {
    const updated: CustomerAccount = {
      ...existing,
      full_name: data.full_name || existing.full_name,
      phone: data.phone || existing.phone,
      upi_id: data.upi_id || existing.upi_id,
      updated_at: new Date().toISOString(),
    };
    customerDatabase.set(cleanEmail, updated);
    customerDatabase.set(updated.id, updated);
    currentSessionCustomerId = updated.id;
    return updated;
  }

  const newCustomer: CustomerAccount = {
    id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    full_name: data.full_name || 'Valued Shopper',
    email: cleanEmail,
    phone: data.phone || '',
    upi_id: data.upi_id || '',
    verified: true,
    created_at: new Date().toISOString(),
  };

  customerDatabase.set(cleanEmail, newCustomer);
  customerDatabase.set(newCustomer.id, newCustomer);
  currentSessionCustomerId = newCustomer.id;

  return newCustomer;
}

export function getCustomerByEmail(email: string): CustomerAccount | null {
  if (!email) return null;
  return customerDatabase.get(email.trim().toLowerCase()) || null;
}

export function getCustomerById(id: string): CustomerAccount | null {
  if (!id) return null;
  return customerDatabase.get(id) || null;
}

export function getActiveSessionCustomer(): CustomerAccount {
  const active = customerDatabase.get(currentSessionCustomerId);
  return active || defaultCustomer;
}

export function setActiveSessionCustomer(customerId: string): boolean {
  if (customerDatabase.has(customerId)) {
    currentSessionCustomerId = customerId;
    return true;
  }
  return false;
}
