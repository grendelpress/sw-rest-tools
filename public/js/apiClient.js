// API client for making requests to Netlify functions
export class APIClient {
    static async makeRequest(endpoint, credentials, dateParams = {}) {
        const requestBody = { ...credentials, ...dateParams };
        
        const response = await fetch(`/.netlify/functions${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/csv, application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate CSV');
        }

        return response;
    }
    
    static getDataTypeTitle(endpoint) {
        const titles = {
            '/generate-numbers-csv': 'Phone Numbers',
            '/generate-messages-csv': 'Messages',
            '/generate-faxes-csv': 'Faxes',
            '/generate-calls-csv': 'Calls',
            '/generate-recordings-csv': 'Recordings',
            '/generate-bins-csv': 'Bins',
            '/test-bins-api': 'Test Bins API'
        };
        return titles[endpoint] || 'Data';
    }
    
    static extractFilename(response) {
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'Data.csv'; // fallback filename
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }
        
        return filename;
    }
}