# SignalWire API Tools

A web-based tool for exporting SignalWire project data to CSV files. This application allows you to easily download your phone numbers, messages, faxes, calls, and recordings data from your SignalWire projects.

## Features

- **Phone Numbers Export**: Download a CSV of all your phone numbers with their friendly names and SIDs
- **Messages Export**: Export all SMS/MMS messages with details like sender, recipient, date, status, and content
- **Faxes Export**: Download fax records including status, direction, page count, and media URLs
- **Calls Export**: Export call logs with duration, status, direction, and pricing information
- **Recordings Export**: Download recording metadata including duration, status, and URIs

## Technologies Used

- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Backend**: Netlify Functions (Node.js)
- **API**: SignalWire Compatibility API
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

1. **Enter Your Credentials**:
   - Project ID: Your SignalWire project ID
   - Auth Token: Your SignalWire authentication token
   - Space URL: Your SignalWire space URL (e.g., `yourspace.signalwire.com`)

2. **Save Credentials**: Click "Save Credentials" to store them in your browser session

3. **Export Data**: Click on any of the available export options:
   - Phone Numbers Export
   - Messages Export
   - Faxes Export
   - Calls Export
   - Recordings Export

4. **Download**: The CSV file will automatically download with a filename that includes your project name

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
│   └── functions/          # Serverless functions for API calls
│       ├── generate-calls-csv.js
│       ├── generate-faxes-csv.js
│       ├── generate-messages-csv.js
│       ├── generate-numbers-csv.js
│       └── generate-recordings-csv.js
├── public/
│   ├── index.html         # Main application interface
│   ├── script.js          # Frontend JavaScript
│   └── style.css          # Application styles
├── netlify.toml           # Netlify configuration
└── package.json           # Project dependencies
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

- `/generate-numbers-csv` - Export phone numbers
- `/generate-messages-csv` - Export messages
- `/generate-faxes-csv` - Export faxes
- `/generate-calls-csv` - Export calls
- `/generate-recordings-csv` - Export recordings

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

1. Check the [SignalWire Documentation](https://docs.signalwire.com/)
2. Review your API credentials and permissions
3. Ensure your SignalWire space URL is correct
4. Open an issue in this repository

## Acknowledgments

- Built with the [SignalWire Compatibility API](https://docs.signalwire.com/reference/compatibility-sdks/v3/)
- Deployed on [Netlify](https://netlify.com/)