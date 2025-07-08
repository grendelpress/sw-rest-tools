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
    
    // Create basic auth header
    const auth = Buffer.from(`${projectId}:${authToken}`).toString('base64');
    
    // Fetch project details to get the friendly name
    const projectResponse = await fetch(`https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    
    if (!projectResponse.ok) {
      throw new Error(`Failed to fetch project details: ${projectResponse.status}`);
    }
    
    const project = await projectResponse.json();
    const projectName = project.friendly_name || project.friendlyName || 'UnnamedProject';
    
    // Clean project name for filename (remove invalid characters)
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Fetch all bins with pagination
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
        
        console.log(`Fetching bins page ${pageCount}: ${url}`);
        
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
    
    // Fetch detailed information for each bin
    async function fetchBinDetails(binUri) {
      try {
        const response = await fetch(`https://${spaceUrl}${binUri}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
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
    
    // Fetch detailed information for each bin (with rate limiting)
    const detailedBins = [];
    const batchSize = 5; // Process 5 bins at a time to avoid rate limits
    
    for (let i = 0; i < bins.length; i += batchSize) {
      const batch = bins.slice(i, i + batchSize);
      const batchPromises = batch.map(bin => fetchBinDetails(bin.uri));
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((details, index) => {
        const originalBin = batch[index];
        if (details) {
          detailedBins.push({
            ...originalBin,
            ...details
          });
        } else {
          // Use basic info if detailed fetch failed
          detailedBins.push(originalBin);
        }
      });
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < bins.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Map the data to CSV format
    const data = detailedBins.map((record) => {
      // Extract SID from URI if not directly available
      let binSid = record.sid;
      if (!binSid && record.uri) {
        const sidMatch = record.uri.match(/LamlBins\/([^\/]+)$/);
        binSid = sidMatch ? sidMatch[1] : '';
      }
      
      return {
        binSid: binSid || '',
        name: record.friendly_name || record.friendlyName || record.name || '',
        dateCreated: record.date_created || record.dateCreated || '',
        dateUpdated: record.date_updated || record.dateUpdated || '',
        dateLastAccessed: record.date_last_accessed || record.dateLastAccessed || '',
        accountSid: record.account_sid || record.accountSid || projectId,
        contents: record.contents || '',
        requestUrl: record.request_url || record.requestUrl || '',
        apiVersion: record.api_version || record.apiVersion || '',
        uri: record.uri || ''
      };
    });

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