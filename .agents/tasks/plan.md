# Implementation Plan: Driver Document Upload Integration

This plan implements full driver document upload capability across backend and mobile apps.

## Overview
- **Backend:** Extend Prisma schema, create file storage layer (Supabase + local fallback), add API routes for upload and status retrieval
- **Mobile:** Install expo-image-picker, create reusable DocumentUploadField component, integrate into driver-docs screen
- **Features:** 3 major features (FEAT-001, FEAT-002, FEAT-003) decomposed for sequential implementation

## Context
- Monorepo with TanStack Start backend and Expo SDK 57 mobile app
- Backend: PostgreSQL via Prisma, Better Auth for sessions, token-based mobile auth
- Mobile: expo-router, panelui-native UI, lucide-react-native icons, expo-secure-store
- No Supabase env vars currently configured - storage must have local fallback
- expo-image-picker NOT in package.json - must be installed

---

## FEAT-001: Backend Database Schema, Storage, and API Routes

### Steps

- [ ] 1. **Extend Prisma schema with DriverDocument model**
      
      File: `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin\prisma\schema.prisma`
      
      Add DriverDocument model with fields:
      - `id` (String, @id, @default(cuid()))
      - `driverApplicationId` (String)
      - `documentType` (String) - values: DRIVERS_LICENSE_FRONT, DRIVERS_LICENSE_BACK, VEHICLE_OR_CR, GOVERNMENT_ID, VEHICLE_PHOTO_FRONT, VEHICLE_PHOTO_SIDE, VEHICLE_PHOTO_PLATE
      - `storageUrl` (String)
      - `uploadedAt` (DateTime, @default(now()))
      - `reviewStatus` (String, @default("PENDING")) - values: PENDING, APPROVED, REJECTED
      - `rejectionReason` (String?)
      - `createdAt` (DateTime, @default(now()))
      - `updatedAt` (DateTime, @updatedAt)
      
      Add relation to DriverApplication model:
      ```prisma
      model DriverApplication {
        // ... existing fields
        documents DriverDocument[]
      }
      
      model DriverDocument {
        // fields above
        driverApplication DriverApplication @relation(fields: [driverApplicationId], references: [id], onDelete: Cascade)
        
        @@map("driver_documents")
      }
      ```
      
      Verify: Schema is syntactically correct

- [ ] 2. **Apply schema changes and regenerate Prisma client**
      
      Commands:
      ```powershell
      cd c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin
      pnpm db:push
      pnpm db:generate
      ```
      
      Verify: Commands complete successfully, `prisma/generated/client/` contains DriverDocument types

- [ ] 3. **Create file storage helper with Supabase + local fallback**
      
      File: `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin\src\lib\storage.ts`
      
      Implementation:
      - Check for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` in process.env
      - If present: implement `uploadToSupabase(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string>` using @supabase/supabase-js (install if needed)
      - If missing: implement local fallback that creates `.uploads/` directory, saves file with unique name, returns local path, logs warning
      - Export `uploadFile(fileBuffer: Buffer, filename: string, mimeType: string, applicationId: string, documentType: string): Promise<string>`
      
      Decision: Since SUPABASE env vars are NOT in .env.local, local fallback will be used initially. Supabase can be configured later by adding env vars.
      
      Verify: File compiles without TypeScript errors

- [ ] 4. **Create upload-document API route**
      
      File: `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin\src\routes\api\mobile\drivers\upload-document.ts`
      
      Implementation:
      - Method: POST
      - Parse multipart: `const formData = await request.formData()`
      - Extract fields: `file` (File), `applicationId` (string), `documentType` (string)
      - Auth: Extract token from `Authorization: Bearer <token>` header, query `db.session.findUnique({ where: { token }, include: { user: true } })`, return 401 if not found, lookup PatulodUser by userId, verify role is DRIVER
      - Validate: file exists, size <= 10MB (from file.size), mimeType in [image/jpeg, image/png, application/pdf], applicationId exists in DriverApplication, documentType is one of 7 valid values
      - Read file: `const buffer = Buffer.from(await file.arrayBuffer())`
      - Upload: call `uploadFile(buffer, file.name, file.type, applicationId, documentType)`
      - Upsert DriverDocument: `db.driverDocument.findFirst({ where: { driverApplicationId: applicationId, documentType } })`, if exists update, else create
      - Response: 201 `{ success: true, documentId: string, uploadedUrl: string }`
      - Errors: 400 for validation, 401 for auth, 500 for server errors (follow apply.ts patterns)
      
      Auth pattern follows existing mobile-auth.ts: Bearer token lookup in session table, verify user and role.
      
      Verify: Route compiles, TypeScript types correct

- [ ] 5. **Create application status API route**
      
      File: `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin\src\routes\api\mobile\drivers\application.ts`
      
      Implementation:
      - Method: GET
      - Auth: Extract Bearer token, query db.session with user include, verify user is DRIVER
      - Find DriverApplication by email (from PatulodUser linked to session user)
      - Include related DriverDocuments: `include: { documents: { select: { documentType: true, reviewStatus: true, uploadedAt: true } } }`
      - Response: 200 `{ success: true, application: { id, status, submittedAt, documents: [...] } }`
      - Errors: 401 if not authenticated, 404 if no application found
      
      Verify: Route compiles, returns correct structure

### Verification
```powershell
cd c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-admin
pnpm db:push
pnpm db:generate
# Should complete without errors
```

Manual API testing:
- Test upload-document with curl/Postman: multipart request with valid token, verify 201 response
- Test application route with valid token, verify 200 response with documents array

---

## FEAT-002: Mobile Image Picker, API Client, and DocumentUploadField Component

### Steps

- [ ] 6. **Install expo-image-picker**
      
      Command:
      ```powershell
      cd c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-mobile
      npx expo install expo-image-picker
      ```
      
      Verify: expo-image-picker appears in package.json dependencies

- [ ] 7. **Add TypeScript interfaces to API client**
      
      File: `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-mobile\lib\api.ts`
      
      Add interfaces:
      ```typescript
      export interface DriverDocumentData {
        applicationId: string;
        documentType: string;
        fileUri: string;
        fileName: string;
        mimeType: string;
      }
      
      export interface DriverDocumentResponse {
        success: boolean;
        documentId?: string;
        uploadedUrl?: string;
        error?: string;
      }
      
      export interface DriverApplicationStatus {
        success: boolean;
        application?: {
          id: string;
          status: string;
          documents: Array<{
            documentType: string;
            reviewStatus: string;
            uploadedAt: string;
          }>;
        };
        error?: string;
      }
      ```
      
      Verify: TypeScript compiles

- [ ] 8. **Add uploadDriverDocument method to API client**
      
      File: `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-mobile\lib\api.ts`
      
      Implementation:
      ```typescript
      uploadDriverDocument: async (data: DriverDocumentData): Promise<DriverDocumentResponse> => {
        const formData = new FormData();
        formData.append('file', {
          uri: data.fileUri,
          name: data.fileName,
          type: data.mimeType,
        } as any);
        formData.append('applicationId', data.applicationId);
        formData.append('documentType', data.documentType);
        
        const baseUrl = getBaseUrl();
        const token = await getToken();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
        
        try {
          const response = await fetch(`${baseUrl}/api/mobile/drivers/upload-document`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              // DO NOT set Content-Type - let fetch set multipart boundary
            },
            body: formData,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          const data = await response.json();
          return data;
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Upload timed out. Please try again.');
          }
          throw error;
        }
      },
      ```
      
      Key decision: DO NOT set Content-Type header - let fetch handle multipart boundary automatically.
      
      Verify: TypeScript compiles

- [ ] 9. **Add getDriverApplication method to API client**
      
      File: `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-mobile\lib\api.ts`
      
      Implementation:
      ```typescript
      getDriverApplication: async (): Promise<DriverApplicationStatus> => {
        return await apiRequest<DriverApplicationStatus>('/api/mobile/drivers/application', {
          method: 'GET',
        });
      },
      ```
      
      Verify: TypeScript compiles

- [ ] 10. **Create DocumentUploadField component**
      
      File: `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-mobile\components\DocumentUploadField.tsx`
      
      Implementation:
      - Props interface as specified in task description
      - Color constants: PRIMARY_GREEN = '#0d5f3a', ERROR_RED = '#dc2626', SUCCESS_GREEN = '#10b981'
      - State: uploadState, errorMessage, uploadedFile
      - Import expo-image-picker: `import * as ImagePicker from 'expo-image-picker'`
      - Handle existing documents: check existingDocument prop, show approved/rejected badges
      - UI states:
        * idle: Upload button with Upload icon
        * picking: Disabled with spinner
        * uploading: Progress indicator with file name
        * success: Thumbnail or file icon with green checkmark
        * error: Red error message with retry button
      - onPress handler:
        1. Request permissions: `ImagePicker.requestMediaLibraryPermissionsAsync()`
        2. Launch picker: `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 })`
        3. Validate file size: fetch uri to get blob, check size <= 10MB
        4. Call api.uploadDriverDocument
        5. On success: call onUploadComplete prop
        6. On error: show error message
      - Use lucide-react-native icons (Upload, CheckCircle2, AlertCircle, FileText, X, RefreshCw)
      - Use panelui-native Button and Text components
      - Accessibility: proper accessibilityLabel on touchables
      
      Design matches driver-apply.tsx patterns.
      
      Verify: TypeScript compiles, component renders all states correctly

### Verification
```powershell
cd c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-mobile
pnpm typecheck
# Should pass with no errors
```

Visual testing: Render component in a test screen, verify all UI states display correctly

---

## FEAT-003: Driver Docs Screen Integration

### Steps

- [ ] 11. **Replace driver-docs.tsx with full integration**
      
      File: `c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-mobile\app\driver-docs.tsx`
      
      Implementation:
      - Remove mock UI, keep color constants
      - Import DocumentUploadField, api, useLocalSearchParams
      - State: `const params = useLocalSearchParams()`, `const applicationId = params.applicationId as string`
      - State: `uploadedDocuments: Record<string, { documentId: string, url: string }>`, computed `uploadedCount = Object.keys(uploadedDocuments).length`
      - State: `isSubmitting`, `submitError`
      - Header: back button (ArrowLeft), title "Upload Documents", progress text (X/7), progress bar (green fill)
      - Info section: yellow card with Info icon, title "Document Requirements", description about clear photos
      - 7 DocumentUploadField instances:
        1. Driver's License - Front (DRIVERS_LICENSE_FRONT, hint: 'Clear photo of front side')
        2. Driver's License - Back (DRIVERS_LICENSE_BACK, hint: 'Clear photo of back side')
        3. Vehicle OR/CR (VEHICLE_OR_CR, hint: 'Official Receipt or Certificate of Registration')
        4. Valid Government ID (GOVERNMENT_ID, hint: 'Any valid government-issued ID')
        5. Vehicle Photo - Front (VEHICLE_PHOTO_FRONT, hint: 'Clear front view of your vehicle')
        6. Vehicle Photo - Side (VEHICLE_PHOTO_SIDE, hint: 'Clear side view of your vehicle')
        7. Vehicle Photo - Plate (VEHICLE_PHOTO_PLATE, hint: 'Clear photo of your plate number')
      - Each DocumentUploadField has applicationId prop, onUploadComplete callback that updates uploadedDocuments
      - Submit button: disabled until uploadedCount === 7, text shows progress "Submit Documents (X/7)" or "Submit Application"
      - onPress: navigate to /driver-status with router.push
      - Error handling: if applicationId empty/undefined, show error with back button
      - Design: ScrollView, SafeAreaView insets, KeyboardAvoidingView, match colors/icons/components from driver-apply.tsx
      
      Verify: TypeScript compiles

### Verification
```powershell
cd c:\Users\ADMIN\Documents\workspace\active\patulod\patulod-mobile
pnpm typecheck
# Should pass with no errors
```

End-to-end testing:
1. Complete driver-apply.tsx form
2. Navigate to driver-docs.tsx, verify applicationId passed
3. Upload all 7 documents, verify progress updates
4. Verify submit button enables when all uploaded
5. Tap submit, verify navigation to /driver-status

---

## Risk Assessment

### Identified Risks
1. **Supabase configuration:** Env vars not present, will use local fallback initially. May need to configure Supabase later.
2. **expo-image-picker compatibility:** Verified compatible with Expo SDK 57 from official docs.
3. **Bearer auth pattern:** No existing backend route uses Bearer token auth yet. We're establishing the pattern. Must ensure token extraction and validation is correct.
4. **Multipart parsing:** TanStack Start should support request.formData() Web API. If not, may need alternative parsing library.
5. **File size validation:** Must validate on both mobile (before upload) and backend (for security).

### Mitigations
- Local file storage fallback ensures feature works without Supabase
- expo-image-picker is official Expo package, well-maintained
- Bearer auth follows standard pattern, similar to existing session lookup
- request.formData() is Web standard, supported by Nitro/H3
- Double validation (client + server) for file size

---

## Notes
- All commits should be made locally, NOT pushed
- Prisma client regeneration required after schema changes
- Mobile typecheck must pass before considering feature complete
- Design system consistency: PRIMARY_GREEN #0d5f3a, lucide-react-native icons, panelui-native components
