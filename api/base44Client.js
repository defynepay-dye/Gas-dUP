import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68a334aa9ca93e41b1199773", 
  requiresAuth: true // Ensure authentication is required for all operations
});
