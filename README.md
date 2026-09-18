# NutriSphere — integrated full-stack build

React + Vite + Tailwind frontend, Node + Express + MongoDB backend.

## Included business rules
- CUSTOMER and OWNER/SELLER roles with backend authorization.
- Signup requires both email OTP and SMS OTP before activation.
- Profile setup: name, age, gender, height, current weight, goal, then monthly/yearly diet subscription purchase.
- Goals: Weight Gain, Weight Loss, Physical Fitness/Gym, PCOS/PCOD.
- Categories: Fruits, Dry Fruits & Nuts, Juices, Milkshakes. Milkshakes are browse-only and never part of diet boxes/custom diet recommendations.
- Recommendations are goal-based diet boxes with timing, portions, price and transparency.
- Individual cart purchases are separate from subscription billing.
- Persistent cart and backend stock checks.
- Saved addresses with map coordinates, configurable delivery radius and delivery hours.
- Customer Profile: Edit Profile, Manage Address, My Orders/Track, Subscription management, Log Out, Delete Account.
- Delivered orders expose a short 1–5 star Rate & Feedback feature; reviews are stored in MongoDB and visible to the owner.
- Seller portal: Home, Orders, Products, Customers, Reviews, Subscriptions, Logout.
- Seller can update order statuses, manage products/availability/new-arrival flag and subscription plan pricing.
- Order tracking uses backend status/timestamps; customer tracking polls the backend.
- Only the approximately-five-minutes-away delivery SMS is sent for orders; the worker marks it once sent.
- Monthly cancellation requires one week. First subscription has no ₹600 deduction; returning monthly subscriptions have ₹600 deduction. Refund uses recorded subscription delivery value.
- Yearly switching/cancellation requires one completed month. Yearly→monthly uses actual recorded diet-box value + ₹1,500 switching deduction.
- Yearly monthly continuation supports Continue, Continue without asking again, Change to Monthly, or Stop. No response pauses future diet-box deliveries; after one week a cancellation prompt SMS is attempted.

## Setup
1. Copy `backend/.env.example` to `backend/.env` and fill in your MongoDB/JWT/provider settings.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. From `backend`: `npm install`, then `npm run seed`, then `npm run dev`.
4. From `frontend`: `npm install`, then `npm run dev`.
5. For live Razorpay, set `PAYMENT_MODE=razorpay`, backend Razorpay secrets and `VITE_RAZORPAY_KEY_ID`.
6. For real OTP delivery, configure SMTP and MSG91. Provider template IDs/variables must match your approved provider templates.

## Security
No real credentials are included in this archive. Do not commit `.env`. If credentials from an older copy were ever real, rotate them.
