import type { Listing, MarketplaceId, Payment } from './types';
import { sleep, uid } from './utils';

export async function runDemoPayment(listing: Listing, marketplaceId: MarketplaceId): Promise<Payment> {
  await sleep(600);

  return {
    id: uid('pay'),
    orderId: '',
    listingId: listing.id,
    amount: listing.price + listing.shippingPrice,
    provider: 'DemoPay',
    status: 'succeeded',
    createdAt: new Date().toISOString()
  };
}

export function stripeTestModeReady() {
  return {
    publishableKeyEnv: 'NEXT_PUBLIC_STRIPE_PUBLIC_KEY',
    suggestedServerRoute: '/api/checkout/session',
    note: 'Real Stripe checkout should create PaymentIntents or Checkout Sessions server-side. This demo uses DemoPay only.'
  };
}
