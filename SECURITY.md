# Security Policy

## Database Access Control

AgriFlow implements role-based access control (RBAC) across all data stores:

### Firestore Rules
- ✅ **Users Collection**: Only authenticated users can access their own profile; admins have full access
- ✅ **Crops Collection**: Only authenticated users can read; farmers can create their own crops
- ✅ **Orders Collection**: Only involved parties (buyer, farmer, admin, logistics) can access orders
- ✅ **Escrow Vault**: Immutable; writes via Cloud Functions Admin SDK only
- ✅ **Telematics**: Restricted to logistics and admin roles
- ✅ **AI Conversations**: Private; only conversation owner can access

### Firebase Storage Rules
- ✅ Crop images: Authenticated users only, images only (<10MB)
- ✅ QC Certificates: QC officers and admins only (<15MB)
- ✅ Avatars: User uploads own avatar only (<5MB)

### SQLite Database (servers/agriflow.db)
- ⚠️ LOCAL DEVELOPMENT ONLY
- Never commit production database to version control
- Use environment variables for database paths
- Implement row-level security in production

## Authentication Hardening

### OTP Flow
1. OTP expires after 5 minutes
2. Maximum 3 verification attempts
3. Demo OTPs only work in development mode
4. Phone numbers validated (10-13 digits)
5. OTP not returned in production responses

### Input Validation
- Phone: `^[0-9]{10,13}$`
- OTP: `^[0-9]{4}$`
- Quantities: 0-10,000 tons
- Brix values: 0-30

## Secrets Management

🚨 **NEVER** commit to GitHub:
- Database files (*.db, *.sqlite, *.sqlite3)
- Firebase credentials (.firebaserc, firebase-key.json)
- API keys or secrets
- Private keys (*.key, *.pem)

## Audit Trail

- All withdrawals are logged with timestamp
- Orders cannot be deleted (audit trail preservation)
- AI conversations cannot be deleted

## Known Issues & Fixes

### Bug Fixes Implemented
1. **BUG #1**: OTP validation operator precedence - FIXED ✅
2. **BUG #2**: Null checks on database queries - FIXED ✅
3. **BUG #3**: API proxy path construction - FIXED ✅
4. **BUG #4**: Microservice error handling - FIXED ✅

### Remaining Security Tasks
- [ ] Add rate limiting to auth endpoints
- [ ] Implement JWT token validation
- [ ] Add request logging/monitoring
- [ ] Set up database backups
- [ ] Implement password hashing for admin accounts
- [ ] Add HTTPS enforcement in production
- [ ] Conduct security audit of buyer/logistics servers
- [ ] Implement request signing for API calls

## Reporting Security Issues

Please report security vulnerabilities privately to the development team.
Do not create public GitHub issues for security vulnerabilities.

## Compliance

This application handles agricultural transactions involving:
- Personal identification data
- Financial information
- Agricultural produce data

Ensure compliance with:
- Data Protection Act (India)
- GDPR (if applicable)
- Agricultural regulations
