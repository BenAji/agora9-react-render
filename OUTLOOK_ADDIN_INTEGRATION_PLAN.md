# 📧 AGORA Outlook Add-in Integration Plan

## Overview
This document outlines a gradual, phased approach to integrating AGORA Investment Calendar as an Outlook Add-in. The plan is designed to be implemented incrementally, allowing for testing and refinement at each stage.

---

## 🎯 Integration Goals

### Phase 1-3 (MVP - Initial Release)
- ✅ Basic Task Pane integration
- ✅ Display AGORA calendar within Outlook
- ✅ Read Outlook calendar context (selected date)
- ✅ Create AGORA events in Outlook calendar
- ✅ Offline support with local caching

### Phase 4-6 (Future Enhancements)
- 🔄 Bidirectional sync (AGORA ↔ Outlook)
- 🔄 Microsoft SSO integration
- 🔄 Advanced Outlook API features

---

## 📋 Phase 1: Foundation & Setup ✅ COMPLETE

### 1.1 Project Structure Setup
**Status:** ✅ Complete

**Created:**
- `outlook-addin/` directory
- `outlook-addin/manifest.xml` - Outlook Add-in manifest
- `outlook-addin/taskpane.html` - Entry point HTML
- `outlook-addin/commands.html` - Commands handler
- `src/utils/isOutlook.ts` - Outlook detection utility
- `src/outlook/OfficeContext.tsx` - Office.js context provider
- `scripts/copy-outlook-files.js` - Build script to copy files

### 1.2 Manifest Configuration
**Status:** ✅ Complete

**Key Features:**
- Manifest version 1.1 (supports Outlook Desktop, Web, Mac)
- Task Pane placement
- ReadWriteMailbox permissions
- Custom ribbon button

**⚠️ Action Required:**
- Replace `YOUR-GUID-HERE` in `manifest.xml` with a unique GUID
- Replace `YOUR-APP-URL.onrender.com` with your actual Render deployment URL

### 1.3 Build Configuration
**Status:** ✅ Complete

**Added:**
- `@microsoft/office-js` dependency
- `@types/office-js` (will be added)
- `idb` for offline storage
- `build:outlook` script
- `copy:outlook` script

---

## 📋 Phase 2: Task Pane Integration (Next)

### 2.1 Office.js Integration
**Status:** 🔄 In Progress

**Tasks:**
- [x] Create `OfficeContextProvider` component
- [ ] Integrate `OfficeContextProvider` in `App.tsx`
- [ ] Update `taskpane.html` to load React app
- [ ] Test Office.js initialization

### 2.2 Conditional Rendering
**Status:** ⏳ Pending

**Tasks:**
- [ ] Modify `App.tsx` to detect Outlook environment
- [ ] Create Outlook-specific layout wrapper
- [ ] Adjust routing for Task Pane constraints
- [ ] Hide GlobalHeader navigation in Outlook context

### 2.3 Task Pane HTML Entry Point
**Status:** ✅ Complete

**File:** `outlook-addin/taskpane.html`
- Office.js initialization
- React app root container
- Loading state

---

## 📋 Phase 3: Outlook Calendar Integration (Future)

### 3.1 Read Outlook Context
**Tasks:**
- [ ] Create `src/outlook/OutlookCalendarService.ts`
- [ ] Implement `getSelectedDate()` - read user's selected date
- [ ] Implement `getVisibleDateRange()` - get dates visible in calendar view
- [ ] Sync AGORA calendar view with Outlook calendar position

### 3.2 Create Events in Outlook
**Tasks:**
- [ ] Add "Add to Outlook" button to EventCell component
- [ ] Implement `createOutlookEvent()` function
- [ ] Map AGORA event data to Outlook appointment format
- [ ] Handle success/error feedback

### 3.3 Calendar View Synchronization
**Tasks:**
- [ ] Detect Outlook calendar view mode (Day/Week/Month)
- [ ] Sync AGORA view mode to match Outlook
- [ ] Auto-navigate AGORA to Outlook's visible date range

---

## 📋 Phase 4: Offline Support (Future)

### 4.1 Service Worker Setup
**Tasks:**
- [ ] Create `public/sw.js` service worker
- [ ] Register service worker in `index.html`
- [ ] Cache static assets (JS, CSS, images)
- [ ] Cache API responses (events, companies)

### 4.2 IndexedDB for Local Storage
**Tasks:**
- [ ] Create `src/utils/offlineStorage.ts`
- [ ] Store events, companies, user preferences
- [ ] Sync local data when online

### 4.3 Offline Detection & UI
**Tasks:**
- [ ] Detect online/offline status
- [ ] Show offline indicator in UI
- [ ] Queue actions when offline
- [ ] Sync queued actions when back online

---

## 🛠️ Technical Requirements

### Dependencies Added
```json
{
  "@microsoft/office-js": "^1.1.85",
  "idb": "^8.0.0"
}
```

### Hosting Requirements
- ✅ HTTPS (already have via Render)
- ✅ Manifest accessible at root: `/manifest.xml`
- ✅ Task Pane HTML accessible: `/taskpane.html`

### Security Considerations
- Office.js requires HTTPS in production
- Manifest must be served from same domain as app
- API keys must be secure (environment variables)

---

## 📝 Next Steps

### Immediate (Phase 2):
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update manifest.xml:**
   - Generate GUID: Use [Online GUID Generator](https://www.guidgenerator.com/)
   - Replace `YOUR-GUID-HERE` with generated GUID
   - Replace `YOUR-APP-URL.onrender.com` with your Render URL

3. **Integrate OfficeContextProvider:**
   - Wrap `AppWithAuth` with `OfficeContextProvider`
   - Update `App.tsx` to use Outlook detection

4. **Test locally:**
   - Build: `npm run build:outlook`
   - Serve: `npm run server`
   - Sideload manifest in Outlook Desktop

---

## 🚀 Quick Start Commands

### Development
```bash
# Install dependencies
npm install

# Build for Outlook
npm run build:outlook

# Test locally
npm run server
```

### Testing in Outlook
1. Open Outlook Desktop
2. Go to File → Manage Add-ins
3. Click "My Add-ins" → "Add a Custom Add-in"
4. Select "Add from File"
5. Choose `build/manifest.xml`
6. Click "Add"

---

## 📚 Resources

- [Office Add-ins Documentation](https://docs.microsoft.com/en-us/office/dev/add-ins/)
- [Office.js API Reference](https://docs.microsoft.com/en-us/javascript/api/office)
- [Outlook Add-in Manifest Schema](https://docs.microsoft.com/en-us/office/dev/add-ins/reference/manifest/manifest)
- [Office Add-in Samples](https://github.com/OfficeDev/Office-Add-in-samples)

---

## 🎯 Success Criteria

### MVP (Phase 1-3)
- ✅ Add-in loads in Outlook Task Pane
- ✅ AGORA calendar displays correctly
- ✅ Can read Outlook calendar context
- ✅ Can create events in Outlook calendar
- ✅ Works offline with cached data

---

**Phase 1 Complete!** Ready to proceed with Phase 2. 🎊
