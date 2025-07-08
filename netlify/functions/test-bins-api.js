const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    console.log('Making direct API call to LaML bins endpoint...');
    
    // Make the exact same request as your curl command
    const response = await fetch('https://sassyspace.signalwire.com/api/laml/2010-04-01/Accounts/9af8a716-ccba-4a38-9a80-c74f3cc31df7/LamlBins', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic OWFmOGE3MTYtY2NiYS00YTM4LTlhODAtYzc0ZjNjYzMxZGY3OlBUNTMyZjMwMWE2ZDAwN2EyZmRjMDlkNDhiNGYxODRlYjBiNjJlNjk2NzBjMjdlOTkx'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Response data keys:', Object.keys(data));
    console.log('Number of bins:', data.laml_bins ? data.laml_bins.length : 'No laml_bins property');
    
    // Return the raw response for inspection
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        data: data,
        summary: {
          totalBins: data.laml_bins ? data.laml_bins.length : 0,
          hasNextPage: !!data.next_page_uri,
          nextPageUri: data.next_page_uri,
          page: data.page,
          pageSize: data.page_size
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