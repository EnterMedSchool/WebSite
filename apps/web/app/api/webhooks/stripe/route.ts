import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response('Missing STRIPE_WEBHOOK_SECRET', { status: 500 })

  const raw = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' })
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Handle relevant events here (checkout.session.completed, customer.subscription.updated, etc.)
  switch (event.type) {
    case 'checkout.session.completed':
      // TODO: link session to user, activate subscription
      break
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // TODO: sync subscription state
      break
    default:
      break
  }

  return new Response('ok')
}

