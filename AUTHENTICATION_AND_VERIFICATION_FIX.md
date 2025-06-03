# Document Upload Authentication Fix

## Problem Analysis
The verification document upload system fails because:
1. Sessions exist but user claims are not being properly deserialized
2. Authentication middleware blocks access even with valid sessions
3. Passport.js session management not correctly configured for file uploads

## Root Cause
The session logs show:
- Session ID exists: `RhjzwDdFU-gx_bIsB_NWkk50Ka8AD2yD`
- User claims: `undefined`
- Authentication status: `false`

This indicates sessions are created but user data isn't being properly stored/retrieved.

## Implementation Strategy

### 1. Session Serialization Fix
The passport serialization/deserialization needs to properly handle user claims:

```typescript
passport.serializeUser((user: any, cb) => {
  cb(null, { claims: user.claims, ...user });
});

passport.deserializeUser((userData: any, cb) => {
  cb(null, userData);
});
```

### 2. Authentication Middleware Update
Modify isAuthenticated to handle session-based user data:

```typescript
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user as any;
  if (!user.claims || !user.claims.sub) {
    return res.status(401).json({ message: "Invalid user session" });
  }
  
  return next();
};
```

### 3. Upload Endpoint Authentication
Restore proper authentication to the upload endpoint:

```typescript
app.post('/api/verification/upload', 
  isAuthenticated, 
  upload.fields([...]), 
  async (req: any, res) => {
    const userId = req.user.claims.sub;
    // Process upload...
  }
);
```

## Current Status
- Document upload forms: ✅ Complete
- File validation and processing: ✅ Complete  
- Admin review panel: ✅ Complete
- Database schema: ✅ Complete
- Authentication flow: ❌ Requires session fix

## Next Steps
1. Fix passport session serialization
2. Update authentication middleware
3. Restore authentication to upload endpoint
4. Test complete verification workflow