const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
    
    // Build query parameters for date filtering
    const queryParams = new URLSearchParams();
    queryParams.append('page_size', '1000'); // Maximum page size
    
    if (startDate) {
      queryParams.append('created_after', startDate);
    }
    if (endDate) {
      queryParams.append('created_before', endDate);
    }
    
    // Fetch all logs with pagination
    async function fetchAllLogs() {
      const allLogs = [];
      let currentPage = 1;
      let hasMorePages = true;
      const maxPages = 50; // Safety limit
      
      while (hasMorePages && currentPage <= maxPages) {
        const url = `https://${spaceUrl}/api/voice/logs?${queryParams.toString()}&page=${currentPage}`;
        
        console.log(`Fetching RELAY calls page ${currentPage}: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${auth}`
          }
        });

        console.log(`Page ${currentPage} response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const pageLogs = data.data || [];
        
        console.log(`Page ${currentPage}: Found ${pageLogs.length} logs`);
        
        if (pageLogs.length > 0) {
          allLogs.push(...pageLogs);
        }
        
        // Check if there are more pages
        hasMorePages = data.has_next_page || false;
        currentPage++;
      }
      
      console.log(`Total RELAY logs fetched: ${allLogs.length} across ${currentPage - 1} pages`);
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
          'Content-Disposition': 'attachment; filename=RELAY_Calls-NoData.csv'
        },
        body: csvContent
      };
    }
    
    // Get project name for filename (use first log's project_id or fallback)
    const projectName = logs[0]?.project_id || 'UnnamedProject';
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Transform logs to CSV format
    const data = logs.map((log) => ({
      callId: log.call_id || '',
      from: log.from || '',
      to: log.to || '',
      direction: log.direction || '',
      status: log.status || '',
      startTime: log.start_time || '',
      endTime: log.end_time || '',
      duration: log.duration || '',
      projectId: log.project_id || '',
      createdAt: log.created_at || '',
      updatedAt: log.updated_at || ''
    }));

    // Create CSV content
    const headers = ['Call ID', 'From', 'To', 'Direction', 'Status', 'Start Time', 'End Time', 'Duration (seconds)', 'Project ID', 'Created At', 'Updated At'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.callId}"`,
        `"${row.from}"`,
        `"${row.to}"`,
        `"${row.direction}"`,
        `"${row.status}"`,
        `"${row.startTime}"`,
        `"${row.endTime}"`,
        `"${row.duration}"`,
        `"${row.projectId}"`,
        `"${row.createdAt}"`,
        `"${row.updatedAt}"`
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