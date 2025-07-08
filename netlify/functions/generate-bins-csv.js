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
    const { projectId, authToken, spaceUrl } = JSON.parse(event.body);
    
    if (!projectId || !authToken || !spaceUrl) {
      throw new Error('Missing required credentials: projectId, authToken, and spaceUrl are required');
    }
    
    console.log('Using provided credentials for API call...');
    console.log('Project ID:', projectId);
    console.log('Space URL:', spaceUrl);
    
    // Create basic auth header from provided credentials
    const auth = Buffer.from(`${projectId}:${authToken}`).toString('base64');
    
    // Fetch project details to get the friendly name
    let projectName = 'UnnamedProject';
    try {
      const projectResponse = await fetch(`https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${auth}`
        }
      });
      
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        projectName = projectData.friendly_name || projectData.name || 'UnnamedProject';
      }
    } catch (error) {
      console.warn('Could not fetch project name:', error.message);
    }
    
    // Clean project name for filename (remove invalid characters)
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Fetch all bins with pagination
    async function fetchAllBins() {
      const allBins = [];
      let nextPageUri = null;
      let pageCount = 0;
      const maxPages = 10; // Reasonable limit for testing
      
      do {
        pageCount++;
        let url;
        
        if (nextPageUri) {
          url = `https://${spaceUrl}${nextPageUri}`;
        } else {
          url = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/LamlBins?PageSize=50`;
        }
        
        console.log(`Fetching bins page ${pageCount}: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${auth}`
          }
        });

        console.log(`Page ${pageCount} response status:`, response.status);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const pageBins = data.laml_bins || [];
        
        console.log(`Page ${pageCount}: Found ${pageBins.length} bins`);
        
        if (pageBins.length > 0) {
          allBins.push(...pageBins);
        }
        
        nextPageUri = data.next_page_uri || null;
        
      } while (nextPageUri && pageCount < maxPages);
      
      console.log(`Total bins fetched: ${allBins.length} across ${pageCount} pages`);
      return allBins;
    }
    
    // Fetch detailed information for each bin
    async function fetchBinDetails(binUri) {
      try {
        const response = await fetch(`https://${spaceUrl}${binUri}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${auth}`
          }
        });
        
        if (!response.ok) {
          console.warn(`Failed to fetch details for bin ${binUri}: ${response.status}`);
          return null;
        }
        
        return await response.json();
      } catch (error) {
        console.warn(`Error fetching bin details for ${binUri}:`, error.message);
        return null;
      }
    }
    
    // Get all bins
    const bins = await fetchAllBins();
    
    if (bins.length === 0) {
      // Return empty CSV with headers
      const headers = ['Bin SID', 'Name', 'Date Created', 'Date Updated', 'Date Last Accessed', 'Account SID', 'Request URL', 'Num Requests', 'API Version', 'Contents', 'Contents Length', 'URI'];
      const csvContent = headers.join(',');
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
    }
    
    // Fetch detailed information for each bin (with rate limiting)
    const detailedBins = [];
    const batchSize = 3; // Smaller batch size for testing
    
    console.log(`Fetching detailed information for ${bins.length} bins...`);
    
    for (let i = 0; i < bins.length; i += batchSize) {
      const batch = bins.slice(i, i + batchSize);
      const batchPromises = batch.map(bin => fetchBinDetails(bin.uri));
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((details, index) => {
        const originalBin = batch[index];
        if (details) {
          detailedBins.push(details);
        } else {
          // Use basic info if detailed fetch failed
          detailedBins.push(originalBin);
        }
      });
      
      // Small delay between batches
      if (i + batchSize < bins.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`Successfully fetched details for ${detailedBins.length} bins`);
    
    // Convert to CSV format
    const data = detailedBins.map((bin) => ({
      binSid: bin.sid || '',
      name: bin.friendly_name || bin.name || '',
      dateCreated: bin.date_created || '',
      dateUpdated: bin.date_updated || '',
      dateLastAccessed: bin.date_last_accessed || '',
      accountSid: bin.account_sid || '',
      requestUrl: bin.request_url || '',
      numRequests: bin.num_requests || '',
      apiVersion: bin.api_version || '',
      contents: bin.contents || '',
      contentsLength: bin.contents ? bin.contents.length : '',
      uri: bin.uri || ''
    }));

    // Create CSV content
    const headers = ['Bin SID', 'Name', 'Date Created', 'Date Updated', 'Date Last Accessed', 'Account SID', 'Request URL', 'Num Requests', 'API Version', 'Contents', 'Contents Length', 'URI'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.binSid}"`,
        `"${row.name}"`,
        `"${row.dateCreated}"`,
        `"${row.dateUpdated}"`,
        `"${row.dateLastAccessed}"`,
        `"${row.accountSid}"`,
        `"${row.requestUrl}"`,
        `"${row.numRequests}"`,
        `"${row.apiVersion}"`,
        `"${row.contents.replace(/"/g, '""')}"`, // Escape quotes in contents
        `"${row.contentsLength}"`,
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
      body: JSON.stringify({ 
        error: error.message
      })
    };
  }
};