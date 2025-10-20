# LinkedIn Analytics — Local PWA

Private-first analytics for LinkedIn export files. Runs fully in the browser as a PWA with no servers or external APIs. Upload your LinkedIn Page export files (XLS/XLSX/CSV) or try realistic sample data to explore comprehensive analytics dashboards.

🔒 **100% Private**: All data processing happens client-side. No servers, no data transmission, no tracking.  
📊 **Comprehensive Analytics**: Overview, timing strategy, and content intelligence with actionable insights.  
🚀 **Sample Data**: Try the full experience with 120 realistic LinkedIn posts spanning 90 days.  
📱 **PWA Ready**: Works offline, installable on desktop and mobile.

---

## ✨ Current Features

### 🔄 Data Upload & Management
- **Two-Path Upload Design**: Choose between sample data or real LinkedIn Page exports
- **Privacy-First Interface**: Clear messaging about client-side processing with GitHub source link
- **Data Replacement Warnings**: Alerts when uploading new data will replace existing analytics
- **Clear Data Functionality**: Safe data deletion with confirmation dialogs
- **LinkedIn Export Guide**: Official step-by-step instructions with screenshot for LinkedIn Pages

### 🎲 Sample Data Generator
- **120 Realistic Posts** across 90 days with proper statistical distributions
- **5 Content Categories**: Professional insights, industry news, personal stories, job posts, company updates
- **Realistic Engagement Patterns**: Weekday multipliers, content type variations, and proper ER distributions
- **No External Links**: Privacy-focused sample data without real LinkedIn URLs

### 📊 Analytics Dashboards

#### Overview Dashboard
- **Enhanced KPI Cards** with growth indicators and trend analysis
- **Time Period Selector**: 7, 30, 60, 90-day views with dynamic insights
- **Interactive Charts**: Impressions and engagement rate trends with drill-down capabilities
- **Quick Insights Panel**: Automatically generated performance highlights
- **Recent Activity Feed**: Latest posts with performance indicators
- **Mobile Responsive**: Optimized for all screen sizes

#### Timing Strategy Dashboard
- **Statistical Confidence Analysis**: High/Medium/Low confidence indicators based on sample sizes
- **Weekday vs Weekend Performance**: Comparative analysis with strategic recommendations
- **Day-of-Week Optimization**: Detailed performance breakdown with actionable insights
- **Content Intelligence**: 
  - Performance by content type (Video, Newsletter, Jobs, Lists, External Links, etc.)
  - Content length analysis (Short <200, Medium 200-500, Long 500-1000, Very Long 1000+)
  - Emoji usage impact analysis (None, Light 1-2, Moderate 3-4, Heavy 5+)
- **Strategic Recommendations**: AI-powered content strategy suggestions based on performance patterns

#### Content Performance Dashboard
- **Content Type Analysis**: Performance breakdown by detected content categories
- **Link Impact Analysis**: External vs LinkedIn vs no-link performance comparison
- **Text Length Optimization**: Scatter plots and binned analysis of content length vs engagement
- **Format Performance**: Comparison across different post formats

### 🏗️ Technical Architecture
- **React + Vite**: Modern, fast development experience
- **React Router**: Client-side navigation with URL-based routing
- **Tailwind CSS**: Utility-first styling with responsive design
- **ECharts Integration**: Interactive, performant data visualizations
- **IndexedDB Storage**: Local data persistence via Dexie
- **PWA Capabilities**: Service Worker for offline functionality (production builds)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm

### Installation
```bash
# Clone the repository
git clone [repository-url]
cd linkedin-analytics

# Install dependencies
bun install
# or
npm install

# Start development server
bun run dev
# or
npm run dev
```

### Using the Application

1. **Try Sample Data** (Recommended first step):
   - Click "Generate Sample Data" to explore with 120 realistic posts
   - Experience all analytics features without uploading real data

2. **Upload LinkedIn Page Data**:
   - Must be a LinkedIn Page admin (not personal profile)
   - Export from Page Analytics: Analytics → Content/Visitors/etc → Export button
   - Upload the XLS file to analyze your actual performance

3. **Explore Analytics**:
   - **Overview**: Get high-level performance insights and trends
   - **Timing**: Discover optimal posting times and content strategies  
   - **Content**: Analyze what content types perform best

---

## 📈 LinkedIn Data Export Guide

### ⚠️ Important Limitation
LinkedIn analytics export is **only available for LinkedIn Pages** (company/organization pages), **not personal profiles**.

### Export Process for LinkedIn Pages
1. Access your Page admin view
2. Click **Analytics** in the left menu
3. Select data type: Content, Visitors, Followers, Search Appearances, Leads, Newsletters, or Competitors
4. Click the **Export** button in the upper-right corner
5. Select timeframe and click **Export**
6. Download the XLS file and upload it to this application

---

## 🔒 Privacy & Security

- **100% Client-Side Processing**: Your data never leaves your browser
- **No Server Communication**: Zero network requests for data processing
- **Local Storage Only**: Data stored in your browser's IndexedDB
- **Open Source**: Full transparency - view the source code
- **No Tracking**: No analytics, cookies, or user tracking
- **Data Control**: Clear and export your data anytime

---

## 🏗️ Architecture & Technology

### Frontend Stack
- **React 18**: Modern React with hooks and concurrent features
- **Vite**: Fast build tool and development server
- **React Router 7**: Client-side routing and navigation
- **Tailwind CSS**: Utility-first CSS framework
- **ECharts**: Rich, interactive data visualizations

### Data & Storage
- **IndexedDB**: Browser-native database via Dexie
- **Client-Side Parsing**: XLSX/CSV parsing with SheetJS
- **Statistical Analysis**: Custom algorithms for engagement analysis
- **Sample Data Generation**: Realistic LinkedIn-style data creation

### PWA Features
- **Service Worker**: Offline functionality (production only)
- **Installable**: Add to home screen on mobile/desktop
- **Responsive Design**: Works on all screen sizes
- **Performance Optimized**: Fast loading and smooth interactions

---

## 📊 Analytics Capabilities

### Metrics Calculated
- **Engagement Rate**: (Likes + Comments + Reposts) / Impressions
- **Content Type Detection**: Automatic categorization of post types
- **Timing Analysis**: Day-of-week and time-based performance patterns
- **Content Intelligence**: Length, emoji usage, and format analysis
- **Statistical Confidence**: Sample size validation for reliable insights

### Insights Generated
- **Best Performing Days**: Optimal posting schedule recommendations
- **Content Strategy**: What types of content work best for your audience
- **Engagement Optimization**: Tactical recommendations for better performance
- **Trend Analysis**: Growth patterns and performance changes over time

---

## 🛠️ Development

### Local Development with devenv.sh
```bash
# Install Nix and devenv
nix profile install github:cachix/devenv/latest

# Enter development shell
devenv shell

# Available tasks
devenv tasks list
devenv tasks run app:dev
devenv tasks run app:build
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

### Project Structure
```
/src
  /app            # Main app shell and routing
  /components     # Reusable UI components
  /features       # Feature modules (upload, dashboards)
    /upload       # Upload page and sample data generator
    /dashboards   # Analytics dashboard pages
  /data           # Data layer (IndexedDB, repositories)
  /lib            # Utilities (formatting, statistics)
  /images         # Static assets and screenshots
```

---

## 🤝 Contributing

This is a privacy-first, client-side application. All contributions should maintain:
- Zero server dependencies
- No external data transmission
- Full client-side functionality
- Privacy-by-design principles

---

## 📄 License

This project is licensed under the GNU General Public License v3.0. See `LICENSE` for full terms.

---

## 🔮 Roadmap

### Current Status: ✅ MVP Complete
- ✅ Privacy-first upload interface with sample data
- ✅ Comprehensive analytics dashboards
- ✅ Content intelligence and timing strategy
- ✅ LinkedIn export guidance with screenshots
- ✅ Mobile-responsive PWA architecture

### Future Enhancements
- 🔄 Advanced content classification
- 📊 Competitor benchmarking
- 🎯 A/B testing recommendations
- 📈 Predictive performance modeling
- 🔍 Hashtag and mention analysis
