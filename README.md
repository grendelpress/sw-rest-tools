# SignalWire Support Resource Hub

A comprehensive support resource portal featuring curated tools, code examples, integration guides, and troubleshooting utilities created by the SignalWire Support Team. This hub includes the popular API Export Tools along with a growing collection of resources to help customers succeed with SignalWire integrations.

## Overview

The SignalWire Support Resource Hub is a centralized platform where customers can find:

- Interactive tools for working with SignalWire APIs
- Code repositories with ready-to-use examples
- Step-by-step integration guides
- Troubleshooting utilities and validators
- Comprehensive resource search and filtering

All content is created, tested, and maintained by the SignalWire Support Team to ensure quality and reliability.

## Features

### Support Hub Homepage

- Searchable resource directory
- Featured resources and recent additions
- Browse by category (API Tools, Messaging, Voice, Authentication, etc.)
- Statistics dashboard showing available resources
- Quick access cards to popular tools

### API Export Tools (available at `/tools.html`)

#### Data Export Capabilities
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

### Resources Page

- Search across all resources by title and description
- Filter by resource type (tool, guide, utility, example)
- Filter by category and difficulty level
- View resource metadata including tags and view counts
- Direct links to resources and GitHub repositories

### Repositories Showcase

- Browse code examples and integration samples
- Filter by programming language (JavaScript, Python, PHP, Ruby, Go, etc.)
- View prerequisites and quick start instructions
- See GitHub stars and last updated information
- Collapsible sections for use cases and setup guides

### Admin Panel

- Secure authentication for support team members
- Full CRUD operations for resources and repositories
- Category and tag management
- Featured resource selection
- Modal-based editing interface

## Technologies Used

- **Frontend**: Vanilla HTML, CSS, and JavaScript (ES6 modules)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Backend**: Netlify Functions (Node.js)
- **APIs**:
  - SignalWire Compatibility API (LaML)
  - SignalWire RELAY Voice API
  - SignalWire LaML Bins API
- **Deployment**: Netlify

## Site Structure

```
/                    - Homepage with featured resources and categories
/resources.html      - All resources with search and filtering
/repositories.html   - Code repositories showcase
/tools.html          - API Export Tools (original functionality)
/admin.html          - Admin panel for content management
```

## Setup

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- A SignalWire account with API credentials (for using the API tools)
- A Supabase account and project (for the resource hub database)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd signalwire-support-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Supabase:
   - The project is already connected to Supabase
   - Database credentials are in the `.env` file
   - All migrations have been applied automatically

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:8888`

### Database Setup

The Supabase database is already configured with:

- **Categories**: Predefined categories for organizing resources
- **Tags**: System for tagging resources with keywords
- **Resources**: Table for tools, guides, utilities, and examples
- **Repositories**: Table for code examples and integration samples
- **Row Level Security**: Public read access, authenticated write access

Sample data has been added to demonstrate the hub functionality.

## Usage

### For Customers

#### Browsing Resources

1. Visit the homepage to see featured resources and categories
2. Use the search bar to find specific tools or guides
3. Browse by category using the category cards
4. Click on any resource to view details or access the tool/guide

#### Using the API Export Tools

1. Navigate to `/tools.html`
2. Enter your SignalWire credentials:
   - Project ID
   - Auth Token
   - Space URL (e.g., `yourspace.signalwire.com`)
3. Save credentials (stored only in your browser session)
4. Choose which data to export (messages, calls, phone numbers, etc.)
5. Optionally set date range filters
6. View data in interactive tables with analytics
7. Download as CSV files

#### Exploring Code Repositories

1. Visit `/repositories.html`
2. Filter by programming language or category
3. View prerequisites and quick start instructions
4. Click to visit the GitHub repository

### For Support Team (Admin)

#### Managing Content

1. Navigate to `/admin.html`
2. Sign in with your Supabase account credentials
3. Use the tabs to manage:
   - **Resources**: Add/edit tools, guides, utilities, and examples
   - **Repositories**: Add/edit code example repositories
   - **Categories**: Manage resource categories
   - **Tags**: Create and manage tags

#### Adding a New Resource

1. Click "Add Resource" button
2. Fill in the form:
   - Title and description
   - Select category and type
   - Set difficulty level
   - Add URL and GitHub URL (if applicable)
   - Mark as featured to display on homepage
3. Click Save

#### Adding a New Repository

1. Click "Add Repository" button
2. Fill in the form:
   - Name and description
   - GitHub URL
   - Programming language
   - Category and use case
   - Prerequisites and quick start instructions
3. Click Save

## Security & Privacy

### API Tools Security

- **No Data Storage**: SignalWire credentials are not stored on any server
- **Session-Only Storage**: Credentials are stored only in browser session storage
- **Direct API Calls**: All API calls go directly from Netlify Functions to SignalWire
- **No Third-Party Transmission**: Credentials are never sent to third parties

### Database Security

- **Row Level Security (RLS)**: Enabled on all tables
- **Public Read Access**: Anyone can view resources (intended behavior)
- **Authenticated Write Access**: Only authenticated users can manage content
- **No Anonymous Writes**: Public users cannot add, edit, or delete content

### Best Practices for Production

If deploying this publicly, consider:

1. Adding role-based access control (RBAC) for admin functions
2. Implementing rate limiting on API endpoints
3. Adding audit logging for content changes
4. Using environment variables for sensitive configuration
5. Setting up backup and recovery procedures for the database

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
│   ├── index.html                       # Support Hub homepage
│   ├── tools.html                       # API Export Tools interface
│   ├── resources.html                   # All resources page
│   ├── repositories.html                # Code repositories showcase
│   ├── admin.html                       # Admin panel for content management
│   ├── hub-style.css                    # Hub-wide styles
│   ├── resources-style.css              # Resources page styles
│   ├── repositories-style.css           # Repositories page styles
│   ├── admin-style.css                  # Admin panel styles
│   ├── style.css                        # API Tools styles
│   └── js/                              # JavaScript modules
│       ├── home.js                      # Homepage controller
│       ├── resources.js                 # Resources page controller
│       ├── repositories.js              # Repositories page controller
│       ├── admin.js                     # Admin panel controller
│       ├── supabaseClient.js            # Supabase database client
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
├── netlify.toml                         # Netlify configuration with redirects
├── package.json                         # Project dependencies
├── .env                                 # Environment variables (Supabase config)
└── README.md                            # This file
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