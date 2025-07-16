const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Import the SignalWire compatibility API for project name fetching
const { RestClient } = require('@signalwire/compatibility-api');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { projectId, authToken, spaceUrl, startDate, endDate } = JSON.parse(event.body);
    
    if (!projectId || !authToken || !spaceUrl) {
      throw new Error('Missing required credentials: projectId, authToken, and spaceUrl are required');
    }
    
    console.log('Fetching RELAY calls from:', spaceUrl);
    
    // Create basic auth header from provided credentials
    const auth = Buffer.from(`${projectId}:${authToken}`).toString('base64');
    
    // Fetch project details to get the friendly name using the compatibility API
    let projectName = 'UnnamedProject';
    try {
      const client = new RestClient(projectId, authToken, { signalwireSpaceUrl: spaceUrl });
      const project = await client.api.accounts(projectId).fetch();
      projectName = project.friendlyName || 'UnnamedProject';
      console.log('Fetched project name:', projectName);
    } catch (error) {
      console.warn('Failed to fetch project name, using default:', error.message);
    }
    
    // Clean project name for filename (remove invalid characters)
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Build query parameters for date filtering
    const queryParams = new URLSearchParams();
    
    if (startDate) {
      queryParams.append('created_after', startDate);
    }
    if (endDate) {
      queryParams.append('created_before', endDate);
    }
    
    // Fetch all logs with pagination
    async function fetchAllLogs() {
      const allLogs = [];
      let nextPageToken = null;
      let pageCount = 0;
      
      do {
        pageCount++;
        const currentParams = new URLSearchParams(queryParams);
        
        if (nextPageToken) {
          currentParams.append('page_token', nextPageToken);
        }
        
        const url = `https://${spaceUrl}/api/voice/logs?${currentParams.toString()}`;
        
        console.log(`Fetching RELAY calls page ${pageCount}...`);
        console.log(`URL: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${auth}`
          }
        });

        console.log(`Page ${pageCount} response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const pageLogs = data.data || [];
        
        console.log(`Page ${pageCount}: Found ${pageLogs.length} logs, Total so far: ${allLogs.length + pageLogs.length}`);
        
        if (pageLogs.length > 0) {
          allLogs.push(...pageLogs);
        }
        
        // Get next page token for pagination
        nextPageToken = data.next_page_token || null;
        console.log(`Next page token: ${nextPageToken ? 'EXISTS' : 'NULL'}`);
        
        // Add a small delay between requests to be respectful to the API  
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 200)); // Slightly longer delay
        }
        
      } while (nextPageToken);
      
      console.log(`FINAL: Total RELAY logs fetched: ${allLogs.length} across ${pageCount} pages`);
      
      return allLogs;
    }
    
    // Get all logs
    const logs = await fetchAllLogs();
    
    if (logs.length === 0) {
      // Return empty CSV with headers
      const headers = ['Call ID', 'From', 'To', 'Direction', 'Status', 'Start Time', 'End Time', 'Duration (seconds)', 'Project ID', 'Created At', 'Updated At'];
      const csvContent = headers.join(',');
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=RELAY_Calls-${cleanProjectName}.csv`
        },
        body: csvContent
      };
    }
    
    // Transform logs to CSV format
    const data = logs.map((log) => ({
      id: log.id || '',
      from: log.from || '',
      to: log.to || '',
      direction: log.direction || '',
      status: log.status || '',
      duration: log.duration || '',
      durationMs: log.duration_ms || '',
      billingMs: log.billing_ms || '',
      source: log.source || '',
      type: log.type || '',
      url: log.url || '',
      charge: log.charge || '',
      chargeDetails: log.charge_details ? JSON.stringify(log.charge_details) : '',
      createdAt: log.created_at || ''
    }));

    // Create CSV content
    const headers = ['ID', 'From', 'To', 'Direction', 'Status', 'Duration', 'Duration (ms)', 'Billing (ms)', 'Source', 'Type', 'URL', 'Charge', 'Charge Details', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.id}"`,
        `"${row.from}"`,
        `"${row.to}"`,
        `"${row.direction}"`,
        `"${row.status}"`,
        `"${row.duration}"`,
        `"${row.durationMs}"`,
        `"${row.billingMs}"`,
        `"${row.source}"`,
        `"${row.type}"`,
        `"${row.url}"`,
        `"${row.charge}"`,
        `"${row.chargeDetails.replace(/"/g, '""')}"`, // Escape quotes in JSON
        `"${row.createdAt}"`
      ].join(','))
    ].join('\n');

    // Create filename with project name and API type
    const filename = `RELAY_Calls-${cleanProjectName}.csv`;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${filename}`
      },
      body: csvContent
    };
  } catch (error) {
    console.error('Error in generate-relay-calls-csv:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      })
    };
  }
};