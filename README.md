# SignalWire API Tools

A comprehensive web-based tool for exporting SignalWire project data to CSV files. This application allows you to easily download your phone numbers, messages, faxes, calls, recordings, and LaML bins data from your SignalWire projects with advanced filtering, analytics, and data visualization capabilities.

## Features

### Data Export Capabilities
- **Phone Numbers Export**: Download a CSV of all your phone numbers with their friendly names and SIDs
- **Messages Export**: Export all SMS/MMS messages with details like sender, recipient, date, status, and content
- **Faxes Export**: Download fax records including status, direction, page count, and media URLs
- **LaML Calls Export**: Export traditional call logs from the LaML/Compatibility API with duration, status, direction, and pricing
- **RELAY Calls Export**: Export modern call logs from the RELAY Voice API with comprehensive call details
- **Recordings Export**: Download recording metadata including duration, status, and URIs
- **cXML Bins Export**: Export LaML bins with contents, request URLs, and usage statistics

### Advanced Features
- **Date Range Filtering**: Filter exports by custom date ranges or use preset options (Yesterday, Last 7/30/90 Days)
- **Real-time Data Display**: View your data in an interactive table before downloading
- **Search & Filter**: Search across all fields and apply date filters to displayed data
- **Analytics Dashboard**: Get insights with metrics, breakdowns, and top lists for your data
- **Complete Pagination**: Automatically fetches ALL records, not just the first page
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Session Storage**: Securely stores credentials only in your browser session

## Technologies Used

- **Frontend**: Vanilla HTML, CSS, and JavaScript (ES6 modules)
- **Backend**: Netlify Functions (Node.js)
- **APIs**: 
  - SignalWire Compatibility API (LaML)
  - SignalWire RELAY Voice API
  - SignalWire LaML Bins API
- **Deployment**: Netlify

## Setup

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- A SignalWire account with API credentials

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd signalwire-api-tools
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:8888`

## Usage

### Getting Started

1. **Enter Your Credentials**:
   - Project ID: Your SignalWire project ID
   - Auth Token: Your SignalWire authentication token
   - Space URL: Your SignalWire space URL (e.g., `yourspace.signalwire.com`)

2. **Save Credentials**: Click "Save Credentials" to store them in your browser session

3. **Optional Date Range**: Set a date range filter or leave blank for all data

### Available Export Options

#### Phone Numbers & Resources
- **Phone Numbers**: Export all your phone numbers with names and SIDs
- **Recordings**: Export recording metadata with duration and URIs
- **cXML Bins**: Export LaML bins with contents and usage statistics

#### Messaging
- **Messages**: Export SMS/MMS messages with full details
- **Faxes**: Export fax records with status and page counts

#### Call Records
- **LaML Calls (Legacy)**: Traditional call records from LaML/Compatibility API
- **RELAY Calls**: Modern call logs from RELAY Voice API with enhanced details

### Data Interaction Features

4. **View Data**: After export, data is displayed in an interactive table
5. **Analytics**: Click "Show Analytics" to view data insights and summaries
6. **Filter & Search**: Use the search box and date filters to narrow down results
7. **Download Options**: 
   - Download All Data: Complete original dataset
   - Download Filtered CSV: Only the currently filtered/searched results

## Security & Privacy

⚠️ **Important Security Notes**:

- **No Data Storage**: This application does not store any of your SignalWire credentials or data on any server
- **Session-Only Storage**: Credentials are only stored in your browser's session storage and are cleared when you close the browser
- **Direct API Calls**: All API calls are made directly from Netlify Functions to SignalWire's servers
- **Safe for Public Repos**: This codebase contains no hardcoded credentials or sensitive information

Your SignalWire credentials are only used temporarily to make API calls and generate CSV files. They are never logged, stored permanently, or transmitted to any third-party services.

## File Structure

```
├── netlify/
│   └── functions/              # Serverless functions for API calls
│       ├── generate-calls-csv.js       # LaML calls export
│       ├── generate-relay-calls-csv.js # RELAY calls export
│       ├── generate-faxes-csv.js       # Faxes export
│       ├── generate-messages-csv.js    # Messages export
│       ├── generate-numbers-csv.js     # Phone numbers export
│       ├── generate-recordings-csv.js  # Recordings export
│       ├── generate-bins-csv.js        # LaML bins export
│       └── test-bins-api.js            # Bins API testing endpoint
├── public/
│   ├── index.html                      # Main application interface
│   ├── style.css                       # Application styles
│   └── js/                             # Modular JavaScript components
│       ├── app.js                      # Main application controller
│       ├── analytics.js                # Analytics data processing
│       ├── analyticsRenderer.js        # Analytics UI rendering
│       ├── apiClient.js                # API request handling
│       ├── csvUtils.js                 # CSV parsing and generation
│       ├── dataFilter.js               # Data filtering and search
│       ├── dataTable.js                # Table rendering
│       ├── dateUtils.js                # Date handling utilities
│       ├── storage.js                  # Session storage management
│       └── uiManager.js                # UI state management
├── netlify.toml                        # Netlify configuration
├── package.json                        # Project dependencies
└── README.md                           # This file
```

## Development

### Local Development

```bash
npm run dev
```

This starts the Netlify Dev server which provides local access to Netlify Functions.

### Building for Production

```bash
npm run build
```

### Deployment

The application is designed to be deployed on Netlify:

```bash
npm run deploy
```

## API Endpoints

The application includes the following Netlify Functions:

### Data Export Functions
- `/generate-numbers-csv` - Export phone numbers
- `/generate-messages-csv` - Export messages  
- `/generate-faxes-csv` - Export faxes
- `/generate-calls-csv` - Export LaML calls (legacy)
- `/generate-relay-calls-csv` - Export RELAY calls (modern)
- `/generate-recordings-csv` - Export recordings
- `/generate-bins-csv` - Export LaML bins

### Testing Functions
- `/test-bins-api` - Test and display bins data with JSON response

## Analytics Features

The application provides comprehensive analytics for your SignalWire data:

### Metrics Displayed
- **Total Records**: Count of all records in the dataset
- **Date Range**: Span of dates covered by the data
- **Total Cost**: Sum of all charges (where applicable)
- **Duration Statistics**: Total and average call/fax durations
- **Content Analysis**: For bins, shows content statistics

### Breakdowns Available
- **Status Breakdown**: Distribution of record statuses
- **Direction Breakdown**: Inbound vs outbound distribution
- **Custom Breakdowns**: Varies by data type

### Top Lists
- **Top Senders/Callers**: Most active phone numbers
- **Top Recipients**: Most contacted numbers
- **Usage Patterns**: Identifies high-activity periods

## Pagination & Data Completeness

The application is designed to fetch **ALL** your data, not just the first page:

- **Automatic Pagination**: Continues fetching until all records are retrieved
- **No Arbitrary Limits**: Removes artificial page limits that could truncate data
- **Progress Tracking**: Shows pagination progress in console logs
- **Rate Limiting**: Includes delays between requests to respect API limits
- **Error Handling**: Gracefully handles API timeouts and errors

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Review your API credentials and permissions
2. Ensure your SignalWire space URL is correct (format: `yourspace.signalwire.com`)
3. Check browser console for detailed error messages
4. Verify date range filters are not too restrictive
5. Open an issue in this repository

## Changelog

### Recent Updates
- Added RELAY calls export with complete pagination
- Implemented cXML bins export functionality
- Added comprehensive analytics dashboard
- Enhanced data filtering and search capabilities
- Improved responsive design for mobile devices
- Added date range filtering with preset options
- Implemented modular JavaScript architecture
- Enhanced error handling and user feedback

## Acknowledgments

- Built with the [SignalWire Compatibility API](https://docs.signalwire.com/reference/compatibility-sdks/v3/)
- Uses [SignalWire RELAY Voice API](https://docs.signalwire.com/reference/relay/voice/)
- Deployed on [Netlify](https://netlify.com/)
- Designed with SignalWire brand guidelines and colors