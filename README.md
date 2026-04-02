# SignalWire API Tools

A simple, clean gateway to powerful SignalWire data export utilities. Export phone numbers, messages, calls, recordings, faxes, and more from your SignalWire account with comprehensive analytics.

## Overview

SignalWire API Tools is a streamlined web application that provides easy access to export tools for your SignalWire data. All data is processed securely in your browser with no server-side storage.

## Features

### Landing Page
- Clean, modern interface with sidebar for support links
- Quick access to the SWML IVR Helper tool
- Feature overview showcasing all export capabilities
- Mobile-responsive design

### API Export Tools

Export your SignalWire data to CSV with these capabilities:

- **Phone Numbers Export**: Download all your phone numbers with friendly names and SIDs
- **Messages Export**: Export SMS/MMS messages with comprehensive details and analytics
- **Faxes Export**: Download fax records with status, direction, and media URLs
- **LaML Calls Export**: Export traditional call logs from the Compatibility API
- **RELAY Calls Export**: Export modern call logs from the RELAY Voice API
- **Recordings Export**: Download recording metadata with duration and URIs
- **cXML Bins Export**: Export LaML bins with contents and usage statistics

### Advanced Features

- **Date Range Filtering**: Filter exports by custom date ranges or use preset options
- **Real-time Data Display**: View your data in interactive tables before downloading
- **Search & Filter**: Search across all fields and apply date filters
- **Analytics Dashboard**: Get insights with metrics, breakdowns, and top lists
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
   git clone https://github.com/grendelpress/sw-rest-tools.git
   cd sw-rest-tools
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

### Using the API Export Tools

1. Navigate to the landing page
2. Click "Go to API Export Tools" or visit `/tools.html`
3. Enter your SignalWire credentials:
   - Project ID
   - Auth Token
   - Space URL (e.g., `yourspace.signalwire.com`)
4. Save credentials (stored only in your browser session)
5. Choose which data to export
6. Optionally set date range filters
7. View data in interactive tables with analytics
8. Download as CSV files

## Security & Privacy

### API Tools Security

- **No Data Storage**: SignalWire credentials are not stored on any server
- **Session-Only Storage**: Credentials are stored only in browser session storage
- **Direct API Calls**: All API calls go directly from Netlify Functions to SignalWire
- **No Third-Party Transmission**: Credentials are never sent to third parties

### Best Practices for Production

If deploying this publicly, consider:

1. Implementing rate limiting on API endpoints
2. Adding environment variables for sensitive configuration
3. Setting up monitoring and logging
4. Regular security audits

## File Structure

```
├── netlify/
│   └── functions/                       # Serverless functions for API calls
│       ├── generate-calls-csv.js        # LaML calls export
│       ├── generate-relay-calls-csv.js  # RELAY calls export
│       ├── generate-faxes-csv.js        # Faxes export
│       ├── generate-messages-csv.js     # Messages export
│       ├── generate-numbers-csv.js      # Phone numbers export
│       ├── generate-recordings-csv.js   # Recordings export
│       ├── generate-bins-csv.js         # LaML bins export
│       └── test-bins-api.js             # Bins API testing endpoint
├── public/
│   ├── index.html                       # Landing page
│   ├── tools.html                       # API Export Tools interface
│   ├── style.css                        # Application styles
│   └── js/                              # JavaScript modules
│       ├── app.js                       # API Tools main controller
│       ├── analytics.js                 # Analytics processing
│       ├── analyticsRenderer.js         # Analytics UI rendering
│       ├── apiClient.js                 # API request handling
│       ├── csvUtils.js                  # CSV utilities
│       ├── dataFilter.js                # Data filtering
│       ├── dataTable.js                 # Table rendering
│       ├── dateUtils.js                 # Date utilities
│       ├── storage.js                   # Session storage
│       └── uiManager.js                 # UI state management
├── netlify.toml                         # Netlify configuration
├── package.json                         # Project dependencies
└── README.md                            # This file
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

### Breakdowns Available
- **Status Breakdown**: Distribution of record statuses
- **Direction Breakdown**: Inbound vs outbound distribution
- **Custom Breakdowns**: Varies by data type

### Top Lists
- **Top Senders/Callers**: Most active phone numbers
- **Top Recipients**: Most contacted numbers
- **Usage Patterns**: Identifies high-activity periods

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you encounter any issues or have questions:

1. Review your API credentials and permissions
2. Ensure your SignalWire space URL is correct (format: `yourspace.signalwire.com`)
3. Check browser console for detailed error messages
4. Verify date range filters are not too restrictive
5. Open an issue in this repository

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with the [SignalWire Compatibility API](https://docs.signalwire.com/reference/compatibility-sdks/v3/)
- Uses [SignalWire RELAY Voice API](https://docs.signalwire.com/reference/relay/voice/)
- Deployed on [Netlify](https://netlify.com/)
- Designed with SignalWire brand guidelines and colors

## Support Links

- [SWML IVR Helper](https://swml-helper.netlify.app/) - Interactive SWML configuration tool
