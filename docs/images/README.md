# 📸 Documentation Images

This folder contains visual assets for ARC Lending Protocol documentation.

## Current Images

### MetaMask Alert Screenshots (REAL!)

✅ **redalrt.png** (1200x800px)
   - Red alert WITHOUT warning banner
   - Shows what users see when confused
   - Used in: METAMASK_RED_ALERT_RPC_DELAY.md (Visual Guide section)

✅ **redalrtfix.png** (1200x800px)
   - Red alert WITH warning banner
   - Shows what users see when informed
   - Used in: METAMASK_RED_ALERT_RPC_DELAY.md (Visual Guide section)

## How to Reference in Markdown

```markdown
![MetaMask Red Alert Before](redalrt.png)
![MetaMask Red Alert After](redalrtfix.png)
```

## Available for Future Screenshots

When adding more images, use this structure:

### Naming Convention
```
[feature]-[scenario]-[state].png
metamask-alert-before.png
swap-page-after.png
approval-process-step1.png
```

### Recommended Format
- Format: PNG-24 (supports transparency)
- Size: Max 1200x800px (mobile-friendly)
- DPI: 72 (web standard)
- Quality: Maximum compression without losing clarity

## Current Status

- ✅ Red alert screenshots (REAL)
- ✅ Before/After comparison ready
- ⏳ Swap page banner screenshots (optional)
- ⏳ Annotated versions with labels (optional)

## Using the Screenshots

### In Documentation
```markdown
## Before (Confusing)
![Alert Before](redalrt.png)
```

### In README
```markdown
![Demo](redalrt.png)
```

### In Web/Blog
Use full URL if serving from GitHub:
```
https://raw.githubusercontent.com/dharmanan/ARC-Testnet-Lend/main/docs/images/redalrt.png
```

---

**Note**: All images should be web-optimized (compressed) to keep documentation load time fast.



