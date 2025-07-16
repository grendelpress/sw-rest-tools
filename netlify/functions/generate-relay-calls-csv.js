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
    
    console.log('Fetching RELAY calls with direct API approach...');
    console.log('Project ID:', projectId);
    console.log('Space URL:', spaceUrl);
    console.log('Date range:', startDate, 'to', endDate);
    
    // Create basic auth header
    const auth = Buffer.from(`${projectId}:${authToken}`).toString('base64');
    
    // Fetch project details to get the friendly name
    const projectResponse = await fetch(`https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });
    
    let projectName = 'UnnamedProject';
    if (projectResponse.ok) {
      const projectData = await projectResponse.json();
      projectName = projectData.friendly_name || 'UnnamedProject';
    }
    
    // Clean project name for filename (remove invalid characters)
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Fetch all RELAY calls with pagination
    async function fetchAllLogs() {
      const allLogs = [];
      let nextPageToken = null;
      let pageCount = 0;
      
      do {
        pageCount++;
        console.log(`Fetching RELAY calls page ${pageCount}...`);
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('page_size', '1000'); // Use larger page size for efficiency
        
        if (nextPageToken) {
          queryParams.append('next_page_token', nextPageToken);
        }
        
        // Add date filters if provided
        if (startDate) {
          queryParams.append('start_time_after', startDate + 'T00:00:00Z');
        }
        if (endDate) {
          queryParams.append('start_time_before', endDate + 'T23:59:59Z');
        }
        
        const url = `https://${spaceUrl}/api/voice/logs?${queryParams.toString()}`;
        console.log(`Page ${pageCount} URL:`, url);
        
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
          console.error(`API request failed on page ${pageCount}:`, response.status, errorText);
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const pageLogs = data.data || [];
        
        console.log(`Page ${pageCount}: Found ${pageLogs.length} RELAY calls`);
        
        if (pageLogs.length > 0) {
          allLogs.push(...pageLogs);
        }
        
        nextPageToken = data.next_page_token || null;
        console.log(`Page ${pageCount}: Next page token:`, nextPageToken ? 'Present' : 'None');
        
        // Add a small delay between requests to be respectful to the API
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } while (nextPageToken); // Continue until no more pages
      
      console.log(`Total RELAY calls fetched: ${allLogs.length} across ${pageCount} pages`);
      return allLogs;
    }
    
    // Get all RELAY calls
    const calls = await fetchAllLogs();
    
    console.log(`Successfully fetched ${calls.length} RELAY calls`);
    
    if (calls.length === 0) {
      // Return empty CSV with headers
      const headers = ['Call SID', 'Parent Call SID', 'From', 'To', 'Start Time', 'End Time', 'Duration (seconds)', 'Status', 'Direction', 'Answered By', 'Forwarded From', 'Caller Name', 'Price', 'Price Unit'];
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
    
    // Transform RELAY calls to CSV format
    const data = calls.map((record) => ({
      callSid: record.call_id || '',
      parentCallSid: record.parent_call_id || '',
      from: record.from || '',
      to: record.to || '',
      startTime: record.start_time || '',
      endTime: record.end_time || '',
      duration: record.duration || '',
      status: record.call_state || '',
      direction: record.direction || '',
      answeredBy: record.answered_by || '',
      forwardedFrom: record.forwarded_from || '',
      callerName: record.caller_name || '',
      price: record.price || '',
      priceUnit: record.price_unit || ''
    }));

    // Create CSV content
    const headers = ['Call SID', 'Parent Call SID', 'From', 'To', 'Start Time', 'End Time', 'Duration (seconds)', 'Status', 'Direction', 'Answered By', 'Forwarded From', 'Caller Name', 'Price', 'Price Unit'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.callSid}"`,
        `"${row.parentCallSid}"`,
        `"${row.from}"`,
        `"${row.to}"`,
        `"${row.startTime}"`,
        `"${row.endTime}"`,
        `"${row.duration}"`,
        `"${row.status}"`,
        `"${row.direction}"`,
        `"${row.answeredBy}"`,
        `"${row.forwardedFrom}"`,
        `"${row.callerName}"`,
        `"${row.price}"`,
        `"${row.priceUnit}"`
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