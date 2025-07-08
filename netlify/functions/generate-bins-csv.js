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
    
    const client = new RestClient(projectId, authToken, { signalwireSpaceUrl: spaceUrl });
    
    // Fetch project details to get the friendly name
    const project = await client.api.accounts(projectId).fetch();
    const projectName = project.friendlyName || 'UnnamedProject';
    
    // Clean project name for filename (remove invalid characters)
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Use direct API calls like your working code, but with pagination
    const auth = Buffer.from(`${projectId}:${authToken}`).toString('base64');
    
    // Function to fetch all pages of results using direct API calls
    async function fetchAllBins() {
      const allBins = [];
      let page = 0;
      let hasMorePages = true;
      const maxPages = 100; // Safety limit
      
      while (hasMorePages && page < maxPages) {
        // Build URL with pagination and filters
        const baseUrl = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/LamlBins`;
        const queryParams = new URLSearchParams();
        
        // Add pagination
        queryParams.append('Page', page.toString());
        queryParams.append('PageSize', '1000'); // Maximum page size
        
        // Add date filters if provided
        if (startDate) {
          queryParams.append('DateCreatedAfter', startDate + 'T00:00:00Z');
        }
        if (endDate) {
          queryParams.append('DateCreatedBefore', endDate + 'T23:59:59Z');
        }
        
        const url = `${baseUrl}?${queryParams}`;
        console.log(`Fetching page ${page}: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        const bins = result.laml_bins || [];
        
        console.log(`Page ${page}: Found ${bins.length} bins`);
        
        if (bins.length === 0) {
          hasMorePages = false;
        } else {
          allBins.push(...bins);
          page++;
          
          // If we got less than the page size, we're on the last page
          if (bins.length < 1000) {
            hasMorePages = false;
          }
        }
      }
      
      console.log(`Total bins fetched: ${allBins.length} across ${page} pages`);
      return allBins;
    }
    
    // Fetch all bins across all pages
    const bins = await fetchAllBins();
    
    const data = bins.map((record) => ({
      binSid: record.sid || '',
      name: record.name || '',
      dateCreated: record.date_created || '',
      dateUpdated: record.date_updated || '',
      dateLastAccessed: record.date_last_accessed || '',
      accountSid: record.account_sid || '',
      contents: record.contents || '',
      requestUrl: record.request_url || '',
      apiVersion: record.api_version || '',
      uri: record.uri || ''
    }));

    // Create CSV content
    const headers = ['Bin SID', 'Name', 'Date Created', 'Date Updated', 'Date Last Accessed', 'Account SID', 'Contents', 'Request URL', 'API Version', 'URI'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.binSid}"`,
        `"${row.name}"`,
        `"${row.dateCreated}"`,
        `"${row.dateUpdated}"`,
        `"${row.dateLastAccessed}"`,
        `"${row.accountSid}"`,
        `"${row.contents.replace(/"/g, '""')}"`, // Escape quotes in XML content
        `"${row.requestUrl}"`,
        `"${row.apiVersion}"`,
        `"${row.uri}"`
      ].join(','))
    ].join('\n');

    // Create filename with project name and API type
    const filename = `Bins-${cleanProjectName}.csv`;

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
    console.error('Error in generate-bins-csv:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};