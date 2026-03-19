# AWS Deployment Cost — Production Setup (INR/month)

This document outlines a **production-style AWS setup** for running the Qvanto Market (Asset Manager) app: **Application Load Balancer**, **EC2 Auto Scaling**, **RDS PostgreSQL**, **S3** for uploads, plus external APIs. All figures are in **Indian Rupees (₹) per month** and are **indicative** — confirm on the AWS Pricing Calculator and vendor sites.

**Region:** Asia Pacific (Mumbai) — **ap-south-1**.

---

## 1. Architecture Overview

- **Application Load Balancer (ALB)** — distributes traffic to app servers, handles SSL termination (ACM), health checks.
- **EC2 in Auto Scaling Group (ASG)** — Node.js app (Express + Vite static). Min 2 instances for availability; ASG can add instances under load.
- **RDS for PostgreSQL** — managed database; single-AZ or Multi-AZ for higher availability.
- **S3** — listing images and other uploads (no local disk dependency).
- **Route 53** — DNS (optional; can use external registrar DNS).
- **ACM** — TLS certificates (free).

---

## 2. Application Load Balancer (ALB)

| Item | Notes | Est. cost (INR/month)* |
|------|--------|-------------------------|
| **ALB** | LCU-based: new connections, active connections, processed bytes, rule evaluations | **~₹1,500–2,200** |

- Low traffic still incurs a baseline (e.g. ~$18–22/month in ap-south-1).
- **Pricing:** [ELB Pricing — India](https://aws.amazon.com/elasticloadbalancing/pricing/?p=ft).

---

## 3. Compute — EC2 + Auto Scaling Group

| Option | Instance | vCPU | RAM | ASG | Est. cost (INR/month)* |
|--------|----------|------|-----|-----|-------------------------|
| **Recommended** | **t3.medium** × 2 (min) | 2 each | 4 GB each | Min 2, max 6–8 | **~₹5,000** |
| Lighter | t3.small × 2 | 2 each | 2 GB each | Min 2, max 4 | ~₹2,600 |

- **ASG:** No extra fee; you pay only for EC2 (and AMI/storage if custom).
- **OS:** Amazon Linux 2 or Ubuntu 22.04.
- **Pricing:** [EC2 On-Demand — Mumbai](https://aws.amazon.com/ec2/pricing/on-demand/).  
  *Approx: t3.medium ~$0.0416/hr × 2 × 730 hr ≈ $61 → ~₹5,000; t3.small ~₹2,600.*

---

## 4. Database — Amazon RDS for PostgreSQL

| Option | Instance | Storage | Use case | Est. cost (INR/month)* |
|--------|----------|---------|----------|-------------------------|
| **Recommended** | **db.t3.small** (1 vCPU, 2 GB) | 32 GB gp3 | General workload | **~₹2,800** |
| High availability | db.t3.small **Multi-AZ** | 32 GB gp3 | Failover, no single point of failure | **~₹5,600** |
| More headroom | db.t3.medium (2 vCPU, 4 GB) | 32 GB gp3 | Heavier DB load | ~₹5,500 |

- **Pricing:** [RDS PostgreSQL — Mumbai](https://aws.amazon.com/rds/postgresql/pricing/).

---

## 5. File Storage — S3

| Item | Description | Est. cost (INR/month)* |
|------|-------------|-------------------------|
| **S3 Standard** | Listing images and uploads; e.g. 50–100 GB | **~₹400–900** |
| Requests | PUT/GET (thousands per month) | **~₹100–300** |

- **Pricing:** [S3 — Mumbai](https://aws.amazon.com/s3/pricing/).

---

## 6. DNS & SSL

| Item | Notes | Est. cost (INR/month)* |
|------|--------|-------------------------|
| **Route 53** | Hosted zone ~$0.50/month; queries (first 1B free) | **~₹45** |
| **ACM** | Public TLS certificates | **₹0** |

---

## 7. Data Transfer & Other

| Item | Notes | Est. cost (INR/month)* |
|------|--------|-------------------------|
| **Data transfer out** | First 1 GB free; then per GB (India varies by destination) | **~₹200–600** |
| **Backups** | RDS automated backups (within allocated storage) | Usually included |

---

## 8. External APIs (same as any cloud)

| Service | Use case | Est. INR/month |
|---------|----------|-----------------|
| **Email** (Resend / SendGrid) | Welcome, alerts | ₹0 (free tier) or **~₹500–1,500** |
| **SMS** (MSG91 / Twilio) | Invites, OTP | **~₹250–400** |
| **Payments** (Razorpay) | When you enable online payments | **~₹1,000–2,500** (transaction % only) |
| **Domain** | Registrar | **~₹80–100** |

---

## 9. Monthly Cost Summary (AWS + APIs)

All amounts **INR per month**, indicative.

| Category | Item | Est. (₹) |
|----------|------|----------|
| **Load balancer** | ALB | 1,500–2,200 |
| **Compute** | EC2 (e.g. 2 × t3.medium) | 5,000 |
| **Database** | RDS PostgreSQL (db.t3.small, 32 GB) | 2,800 |
| **Database (HA)** | RDS Multi-AZ (optional) | +2,800 |
| **Storage** | S3 (50–100 GB + requests) | 500–1,200 |
| **DNS** | Route 53 | 45 |
| **Data transfer** | Egress | 200–600 |
| **Email** | Resend / SendGrid | 0–500 |
| **SMS** | MSG91 | 250–400 |
| **Payments** | Razorpay (when used) | 0–1,500 |
| **Domain** | Optional | 80–100 |
| **Total (base)** | ALB + EC2 + RDS + S3 + DNS + transfer + APIs | **~₹10,000–12,500** |
| **Total (with RDS Multi-AZ)** | Same + RDS HA | **~₹12,800–15,300** |

---

## 10. One-time / Rare

| Item | Approx. |
|------|--------|
| Domain (first year) | ₹800–1,200 |
| AWS Support | Pay-as-you-go has no upfront; Business/Enterprise plans extra |

---

## 11. Getting Exact AWS Costs in INR

1. **AWS Pricing Calculator:**  
   [calculator.aws](https://calculator.aws/)  
   - Region: **Asia Pacific (Mumbai)**  
   - Add: EC2 (e.g. 2 × t3.medium), ALB, RDS PostgreSQL (db.t3.small, 32 GB), S3 (50 GB), Route 53 hosted zone.  
   - Switch to **INR** in the calculator if available, or convert from USD (e.g. 1 USD ≈ ₹83).
2. **Billing:** Use **Cost Explorer** and **Budgets** (e.g. ₹15,000/month alert) in the AWS console.

---

## 12. Checklist

- [ ] Application Load Balancer (ALB)
- [ ] EC2 Auto Scaling Group (min 2 instances)
- [ ] RDS for PostgreSQL (single-AZ or Multi-AZ)
- [ ] S3 bucket for uploads (+ app configured to use S3)
- [ ] Route 53 hosted zone (optional)
- [ ] ACM certificate for HTTPS
- [ ] Email API (Resend / SendGrid)
- [ ] SMS API (MSG91 / Twilio) if needed
- [ ] Payment gateway (Razorpay) when you enable online payments
- [ ] Domain and DNS

---

*All costs are indicative. Prices vary by region, usage, and time. Confirm on the AWS Pricing Calculator and official AWS/vendor pricing pages.*
