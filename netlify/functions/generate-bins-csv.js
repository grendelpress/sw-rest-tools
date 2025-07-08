const { RestClient } = require('@signalwire/compatibility-api');
const fetch = require('node-fetch');

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
    
    // Use direct API calls for LaML bins since SDK method doesn't return all results
    const auth = Buffer.from(`${projectId}:${authToken}`).toString('base64');
    
    async function fetchAllBins() {
      const allBins = [];
      let nextPageUri = null;
      let pageCount = 0;
      const maxPages = 100; // Safety limit
      
      do {
        pageCount++;
        let url;
        
        if (nextPageUri) {
          // Use the next page URI provided by the API
          url = `https://${spaceUrl}${nextPageUri}`;
        } else {
          // Build initial URL
          const baseUrl = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/LamlBins`;
          const queryParams = new URLSearchParams();
          
          // Add date filters if provided
          if (startDate) {
            queryParams.append('DateCreatedAfter', startDate + 'T00:00:00Z');
          }
          if (endDate) {
            queryParams.append('DateCreatedBefore', endDate + 'T23:59:59Z');
          }
          
          // Set page size to maximum
          queryParams.append('PageSize', '50');
          
          url = queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
        }
        
        console.log(`Fetching page ${pageCount}: ${url}`);
        
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
        const pageBins = result.laml_bins || [];
        
        console.log(`Page ${pageCount}: Found ${pageBins.length} bins`);
        
        if (pageBins.length > 0) {
          allBins.push(...pageBins);
        }
        
        // Check for next page URI in the response
        nextPageUri = result.next_page_uri || null;
        
      } while (nextPageUri && pageCount < maxPages);
      
      console.log(`Total bins fetched: ${allBins.length} across ${pageCount} pages`);
      return allBins;
    }
    
    // Directly call fetchAllBins() instead of trying SDK first
    const bins = await fetchAllBins();
    
    const data = bins.map((record) => ({
      binSid: record.sid || '',
      name: record.friendlyName || record.name || '',
      dateCreated: record.dateCreated ? record.dateCreated.toString() : (record.date_created || ''),
      dateUpdated: record.dateUpdated ? record.dateUpdated.toString() : (record.date_updated || ''),
      dateLastAccessed: record.dateLastAccessed ? record.dateLastAccessed.toString() : (record.date_last_accessed || ''),
      accountSid: record.accountSid || record.account_sid || '',
      contents: record.contents || '',
      requestUrl: record.requestUrl || record.request_url || '',
      apiVersion: record.apiVersion || record.api_version || '',
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