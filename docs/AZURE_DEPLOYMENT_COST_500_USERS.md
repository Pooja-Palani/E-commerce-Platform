# Azure & Services Cost Estimate — 500 Users (INR/month)

This document lists **real services and APIs** you can use to run the Qvanto Market (Asset Manager) app for **~500 users**, with costs in **Indian Rupees (₹) per month**. All figures are **indicative**; verify on vendor sites and Azure Pricing Calculator before committing.

---

## 1. Azure Compute (VM)

You need a VM to run the Node.js server (Express + Vite static build) and handle ~500 users with moderate traffic (listings, forums, orders, auth).

| Option | VM Size | vCPU | RAM | Use case | Est. cost (INR/month)* |
|--------|---------|------|-----|----------|-------------------------|
| **Recommended** | **B2ms** | 2 | 8 GB | 500 users, comfortable headroom | **~₹5,000** |
| Budget | B2s | 2 | 4 GB | 500 users, light traffic | ~₹2,500 |

- **Region:** South India / Central India (lower latency in India).
- **OS:** Ubuntu 22.04 LTS (no Windows licence cost).
- **Pricing:** [Azure Linux VMs — India](https://azure.microsoft.com/en-in/pricing/details/virtual-machines/linux/).  
  *Rough conversion used: 1 USD ≈ ₹83; pay-as-you-go, no reserved capacity.*

**Recommendation for 500 users:** Use **B2ms** so you have headroom for spikes (e.g. many users browsing/listing at once). You can start with B2s and scale up if needed.

---

## 2. Database — Azure Database for PostgreSQL

The app uses **PostgreSQL** (Drizzle ORM). Use Azure Database for PostgreSQL Flexible Server in the same region as the VM.

| Tier | Compute | Storage | Use case | Est. cost (INR/month)* |
|------|---------|---------|----------|-------------------------|
| **Recommended** | Burstable B1ms (1 vCore, 2 GB RAM) | 32 GB | 500 users, normal DB load | **~₹2,200** |
| More headroom | Burstable B2s (2 vCore, 4 GB RAM) | 32 GB | Higher concurrency / growth | ~₹4,500 |

- **Pricing:** [Azure PostgreSQL Flexible Server — India](https://azure.microsoft.com/en-in/pricing/details/postgresql/flexible-server/).  
  Select **Central India / South India** and **INR** for exact numbers.

**Recommendation for 500 users:** **B1ms + 32 GB** is enough. Bump to B2s if you add heavy reporting or many concurrent writes.

---

## 3. File Storage (Uploads)

Listing images and other uploads are stored on disk. You can keep them on the VM disk or move to Azure Blob for durability and scaling.

| Option | Description | Est. cost (INR/month)* |
|--------|-------------|-------------------------|
| **On VM** | Use VM OS disk or extra data disk (e.g. 64 GB) | Included in VM or **~₹600** (premium SSD) |
| **Azure Blob** | Standard LRS, e.g. 32–64 GB for 500 users | **~₹400–800** |

- **Pricing:** [Azure Blob Storage](https://azure.microsoft.com/en-in/pricing/details/storage/blobs/).  
For 500 users, 32–64 GB is usually enough unless you expect very image-heavy listings.

---

## 4. Domain & DNS (Optional)

| Item | Notes | Est. cost |
|------|--------|-----------|
| Domain (.in / .com) | From GoDaddy, Namecheap, etc. | ~₹800–1,200/year → **~₹80–100/month** |
| DNS | Azure DNS or registrar’s DNS | Often free with domain |

---

## 5. Real APIs You Can Use (with costs in INR)

### 5.1 Email (welcome, alerts, support)

Used for: welcome emails, platform alerts, support contact (your app already has `supportEmail`, `welcomeEmailSubject`, `emailAlerts` in settings).

| Provider | Free tier | Paid (approx.) | Est. INR/month for 500 users |
|----------|-----------|----------------|------------------------------|
| **Resend** | 3,000 emails/month | From ~$0.80 for 5k emails | **₹0** (free tier enough for ~500 users, ~2–3 emails each) or **~₹70–200** if you exceed |
| **SendGrid** | 100 emails/day trial | $19.95/mo for 50k emails | **₹0** (trial) or **~₹1,650** (paid) |
| **Mailgun** | 5,000 emails/ month (first month) | Pay-as-you-go | **₹0** (trial) or **~₹800–1,500** |

**Recommendation:** Start with **Resend** (free 3k/month). If you cross 3k emails, move to Resend Pro or SendGrid and budget **~₹500–1,500/month**.

- Resend: https://resend.com/pricing  
- SendGrid: https://sendgrid.com/pricing  

---

### 5.2 SMS (invites, OTP if you add later)

Used for: community invites by phone (your app already uses phone for invites). Optional: OTP for login/2FA.

| Provider | Per SMS (India) | Est. INR/month (e.g. 1,000 SMS) |
|----------|------------------|----------------------------------|
| **MSG91** | ₹0.20–0.25 | **~₹200–250** |
| **Twilio** | ~₹0.30–0.35 | **~₹300–350** |
| **TextLocal** | ~₹0.25–0.30 | **~₹250–300** |

**Estimate for 500 users:** Assume 2–3 SMS per user per month (invites + optional OTP) → ~1,000–1,500 SMS → **~₹250–400/month**.

- MSG91: https://msg91.com/in/pricing/sms  
- Twilio: https://www.twilio.com/en-in/sms/pricing/in  

---

### 5.3 Payment gateway (when you enable online payments)

Currently the app supports **direct** payment (UPI/card/cash outside the app). When you add **in-app** payments:

| Provider | Model | Est. cost for 500 users (indicative) |
|----------|--------|--------------------------------------|
| **Razorpay** | No monthly fee. **2% + 18% GST** on successful transactions | **₹0** fixed. If 100 orders/month × ₹500 avg = ₹50,000 GMV → ~**₹1,180** (2% + GST) |
| **Paytm Payment Gateway** | Similar % + GST | In same ballpark as Razorpay |

- Razorpay: https://razorpay.com/pricing  

**Recommendation:** No fixed monthly cost. Budget **~₹1,000–2,500/month** as a rough reserve for gateway fees once you enable payments and have real volume.

---

### 5.4 Maps (optional)

Not required by the current app. If you add “near me” or address autocomplete:

| Provider | Free tier | Paid (approx.) |
|----------|-----------|-----------------|
| **Mapbox** | 50k loads/month | ~$5/mo for more → **~₹400** |
| **Google Maps** | $200 free credit/month | After that, pay per use |

---

## 6. Other Azure / Running Costs

| Item | Notes | Est. INR/month |
|------|--------|-----------------|
| **Bandwidth (egress)** | First 5 GB free (India). 500 users × ~50 MB ≈ 25 GB → ~20 GB billable | **~₹100–200** |
| **SSL** | Let’s Encrypt (free) with Nginx/Caddy on VM | **₹0** |
| **Backups** | Azure PostgreSQL automated backups (7–35 days); often included or small add-on | **~₹0–500** |

---

## 7. Monthly Cost Summary (500 users)

All amounts in **INR per month**, indicative.

| Category | Item | Low (₹) | Recommended (₹) |
|----------|------|---------|------------------|
| Compute | VM (B2s / B2ms) | 2,500 | **5,000** |
| Database | PostgreSQL Flexible (B1ms, 32 GB) | 2,200 | **2,200** |
| Storage | VM disk or Blob (uploads) | 400 | **700** |
| Domain | Optional | 0 | **100** |
| Email | Resend free / paid | 0 | **500** |
| SMS | MSG91 (~1k SMS) | 200 | **350** |
| Payments | Razorpay (when used) | 0 | **1,200** |
| Bandwidth / misc | Egress, backups | 100 | **300** |
| **Total (approx.)** | | **~₹5,400** | **~₹10,350** |

- **Budget setup (no domain, no SMS, no payments):** **~₹5,500–6,000/month**.  
- **Recommended setup (VM B2ms, DB, email, SMS, domain, payment reserve):** **~₹9,500–10,500/month**.

---

## 8. One-time / Rare Costs

| Item | Approx. |
|------|--------|
| Domain (first year) | ₹800–1,200 |
| Azure account / support | Pay-as-you-go has no upfront; optional support plans extra |

---

## 9. How to Get Exact Azure Costs in INR

1. **Azure Pricing Calculator (INR):**  
   https://azure.microsoft.com/en-in/pricing/calculator/  
   - Add: Virtual Machine (Linux, B2ms, South India), Database for PostgreSQL (Flexible, B1ms, 32 GB, South India), Blob Storage (32 GB LRS).  
   - Set currency to **INR** and region to **India**.
2. **In Azure Portal:** Use **Cost Management + Billing** and set budget alerts (e.g. ₹12,000/month) so you get notified before overspend.

---

## 10. Checklist for “Everything We Pay For”

- [ ] Azure VM (B2ms recommended for 500 users)
- [ ] Azure Database for PostgreSQL Flexible (B1ms + 32 GB)
- [ ] VM disk or Azure Blob for uploads
- [ ] Domain (optional)
- [ ] Email API (Resend free tier or paid)
- [ ] SMS API (MSG91 / Twilio) if using invites or OTP
- [ ] Payment gateway (Razorpay) only when you enable online payments — then 2% + GST per transaction
- [ ] Bandwidth (egress) and optional backups
- [ ] SSL (Let’s Encrypt = free)

---

*All costs are indicative. Prices change with region, SKU, and vendor. Always confirm on official Azure and vendor pricing pages and with your billing currency (INR) before deployment.*
