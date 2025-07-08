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
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'No bins found',
          data: [],
          summary: {
            totalBins: 0,
            detailedBins: 0
          }
        }, null, 2)
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
    
    // Format the data for table display
    const tableData = detailedBins.map((bin, index) => ({
      index: index + 1,
      sid: bin.sid || 'N/A',
      name: bin.friendly_name || bin.name || 'Unnamed',
      dateCreated: bin.date_created || 'N/A',
      dateUpdated: bin.date_updated || 'N/A',
      dateLastAccessed: bin.date_last_accessed || 'Never',
      accountSid: bin.account_sid || 'N/A',
      requestUrl: bin.request_url || 'N/A',
      numRequests: bin.num_requests || 0,
      apiVersion: bin.api_version || 'N/A',
      contentsPreview: bin.contents ? 
        (bin.contents.length > 100 ? bin.contents.substring(0, 100) + '...' : bin.contents) : 
        'No content',
      contentsLength: bin.contents ? bin.contents.length : 0,
      uri: bin.uri || 'N/A'
    }));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `Successfully fetched ${detailedBins.length} bins with detailed information`,
        tableData: tableData,
        rawData: detailedBins,
        summary: {
          totalBins: bins.length,
          detailedBins: detailedBins.length,
          withContents: detailedBins.filter(bin => bin.contents && bin.contents.trim()).length,
          averageContentLength: detailedBins.reduce((sum, bin) => sum + (bin.contents ? bin.contents.length : 0), 0) / detailedBins.length,
          recentlyAccessed: detailedBins.filter(bin => bin.date_last_accessed && bin.date_last_accessed !== 'Never').length
        }
      }, null, 2)
    };
  } catch (error) {
    console.error('Error in test-bins-api:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }, null, 2)
    };
  }
};