# LinkedIn Job Stats Revealer 🔍

A Chrome extension that reveals the real number of applications and views for LinkedIn job postings, including competition level analysis.

## ✨ Features

- **Real Data Exposure** - Displays actual application counts and view numbers
- **Competition Analysis** - Automatically calculates competition level based on data
- **Modern Design** - Colorful tags with Tailwind-style design using Rubik font
- **Full SPA Support** - Works on all LinkedIn job pages
- **Continuous Monitoring** - Detects page changes and updates automatically
- **Advanced Debugging** - Detailed logs for troubleshooting

## 🚀 Installation

### Manual Installation:

1. **Download the files:**
   - `manifest.json`
   - `content.js`
   - `injected.js`
   - `background.js`
   - `styles.css`
   - `icon-32.svg`
   - `icon-64.svg`
   - `icon-128.svg`

2. **Open Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"

3. **Install the extension:**
   - Click "Load unpacked"
   - Select the folder containing the files

4. **Grant permissions:**
   - Click "Details" for the extension
   - Allow access to LinkedIn

## 📊 How It Works

### Job Page Detection:
- Individual job pages (`/jobs/view/`)
- Job search pages (`/jobs/search/`)
- Job collection pages (`/jobs/collections/`)

### Data Interception:
- Intercepts LinkedIn API requests
- Extracts application and view data
- Processes data in real-time

### Display:
- Colorful tags next to job titles
- Automatic updates when navigating between pages
- Responsive design for mobile

## 🎨 Competition Levels

| Level | Color | Conditions |
|-------|-------|------------|
| **Very Low** | 🟢 Green | Less than 50 applications |
| **Low** | 🟢 Green | 50-199 applications |
| **Medium** | 🟠 Orange | 200-499 applications |
| **High** | 🔴 Red | 500-999 applications |
| **Very High** | 🔴 Red | 1000+ applications |

## 🔧 Troubleshooting

### Extension Not Appearing:
1. Refresh the page
2. Check if extension is enabled in `chrome://extensions/`
3. Open Console (F12) and check logs

### Data Not Updating:
1. Wait a few seconds for data to load
2. Refresh the page
3. Verify you're on a relevant job page

### Console Errors:
- The extension displays detailed logs with timestamps
- Look for messages starting with `LIDOR:`
- Check if extension is running in `chrome://extensions/`

## 🛠️ Development

### File Structure:
```
linkedin-job-stats-extension/
├── manifest.json      # Extension configuration
├── content.js         # Main content script
├── injected.js        # Injected script for API interception
├── background.js      # Background script
├── styles.css         # Display styling
├── icon-32.svg        # 32x32 icon
├── icon-64.svg        # 64x64 icon
├── icon-128.svg       # 128x128 icon
└── README.md
```

### Adding Features:
1. Edit `content.js` for display
2. Edit `injected.js` for data interception
3. Edit `styles.css` for styling
4. Test in `chrome://extensions/` with "Reload"

## 📝 Technical Notes

### Network Interception:
- Uses `fetch` and `XMLHttpRequest` interception
- Searches for URLs containing `voyager/api/jobs`
- Processes JSON and text responses

### Display:
- Uses MutationObserver to track changes
- Searches for job titles with various selectors
- Supports SPA navigation

### Performance:
- Periodic checks every 3 seconds
- Maximum 5 retry attempts for recreation
- Logs with detailed timestamps

## 🔒 Privacy

- The extension **does not** send data to external servers
- All data remains in your browser
- No tracking or data storage

## 📞 Support

If you encounter issues:
1. Check Console (F12) for logs
2. Refresh the page
3. Restart the extension
4. Verify extension is enabled in `chrome://extensions/`

## 🎯 Purpose

This extension is designed to help job seekers understand the competition level for LinkedIn job postings, enabling them to make more informed decisions about applying.

## 🌍 International Support

The extension supports multiple languages and LinkedIn domains:
- English (www.linkedin.com)
- Hebrew (il.linkedin.com)
- Spanish (es.linkedin.com)
- French (fr.linkedin.com)
- German (de.linkedin.com)
- Italian (it.linkedin.com)
- Portuguese (pt.linkedin.com)
- Dutch (nl.linkedin.com)
- Swedish (se.linkedin.com)
- And more...

## ⚠️ Disclaimer

**Note:** This extension uses reverse engineering techniques and may stop working if LinkedIn changes their API structure.

---

**Contributions welcome!** Feel free to submit issues, feature requests, or pull requests to improve this extension.