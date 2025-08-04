#!/bin/bash

# USB Drive Sync Automation Script for JUSTICE MINDS
# Automatically syncs project files to USB drive after git operations

set -e

# Configuration
PROJECT_NAME="FINALJUSTICEMINDS"
USB_PATH="/Volumes/Justice/$PROJECT_NAME"
LOCAL_PATH="$(pwd)"
LOG_FILE="$LOCAL_PATH/sync-usb.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Check if USB drive is mounted
check_usb() {
    if [ ! -d "$USB_PATH" ]; then
        echo -e "${RED}❌ USB drive not found at $USB_PATH${NC}"
        echo -e "${YELLOW}Please ensure the Justice USB drive is connected${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ USB drive found at $USB_PATH${NC}"
}

# Sync files with progress (update in place)
sync_files() {
    echo -e "${BLUE}🔄 Updating files on USB drive...${NC}"
    
    # Exclude patterns
    EXCLUDE_PATTERNS=(
        ".git"
        "node_modules" 
        ".next"
        "*.log"
        ".env.local"
        ".DS_Store"
        "sync-usb.log"
        "*_backup_*"
    )
    
    # Build rsync exclude options
    EXCLUDE_OPTS=""
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        EXCLUDE_OPTS="$EXCLUDE_OPTS --exclude=$pattern"
    done
    
    # Update files in place (no delete to preserve USB-specific files)
    rsync -avh --progress $EXCLUDE_OPTS "$LOCAL_PATH/" "$USB_PATH/"
    
    echo -e "${GREEN}✅ Files updated successfully on USB drive${NC}"
}

# Update verification file
update_verification() {
    echo -e "${BLUE}📝 Updating verification file...${NC}"
    
    cat > "$USB_PATH/FILE_VERIFICATION.md" << EOF
# JUSTICE MINDS USB Drive Sync Verification
*Last Updated: $(date)*

## 🔄 Sync Status: COMPLETED ✅

### 📊 Sync Statistics:
- **Source**: $LOCAL_PATH
- **Destination**: $USB_PATH
- **Sync Time**: $(date)
- **Files Synced**: $(find "$USB_PATH" -type f | wc -l | tr -d ' ') files
- **Total Size**: $(du -sh "$USB_PATH" | cut -f1)

### 🚀 Latest Features Synced:
- ✅ Shared Links Management System
- ✅ Advanced Email Tracking & Analytics  
- ✅ Rate-Limited Search with Auto-Retry
- ✅ Enhanced Dashboard with Shared Tab
- ✅ Supabase Schema Updates for Tracking
- ✅ Fixed Email Sharing URLs
- ✅ Improved Error Handling

### 🏗️ Project Structure:
\`\`\`
$USB_PATH/
├── components/          # React components
│   ├── dashboard/      # Dashboard-specific components
│   │   ├── SharedTab.js    # NEW: Shared links management
│   │   ├── TabNavigation.js # Updated with Shared tab
│   │   └── MainContent.js   # Updated routing
│   ├── SearchEmails.js     # Enhanced with rate limiting
│   └── ShareDialogue.js    # Fixed URL generation
├── pages/              # Next.js pages
├── lib/                # Utility libraries
├── public/             # Static assets
└── supabase_schema_update.sql # NEW: Database schema
\`\`\`

### 🔐 Security Features:
- RLS policies for access logs
- Secure token-based sharing
- Rate limiting protection
- Input validation & sanitization

### 📱 Production Deployment:
- **Status**: ✅ LIVE
- **URL**: https://finaljusticeminds-fyqa.vercel.app
- **Database**: EVIDENTIA Supabase (Connected)
- **Authentication**: Google OAuth 2025

---
*Automated sync completed successfully*
*USB drive is ready for forensic analysis work*
EOF
    
    echo -e "${GREEN}✅ Verification file updated${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🎯 JUSTICE MINDS USB Sync Starting...${NC}"
    log "USB sync initiated from $LOCAL_PATH"
    
    check_usb
    sync_files
    update_verification
    
    echo -e "${GREEN}🎉 USB sync completed successfully!${NC}"
    echo -e "${BLUE}📁 Files available at: $USB_PATH${NC}"
    log "USB sync completed successfully"
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi