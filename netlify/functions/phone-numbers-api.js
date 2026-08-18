const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event, context) => {
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
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { projectId, authToken, spaceUrl, method, apiPath, pathParams, queryParams, bodyParams } = body;

    if (!projectId || !authToken || !spaceUrl) {
      throw new Error('Missing required credentials: projectId, authToken, and spaceUrl are required');
    }

    if (!method || !apiPath) {
      throw new Error('Missing required parameters: method and apiPath are required');
    }

    const auth = Buffer.from(`${projectId}:${authToken}`).toString('base64');

    let url = `https://${spaceUrl}${apiPath}`;

    if (pathParams) {
      for (const [key, value] of Object.entries(pathParams)) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }
    }

    if (queryParams) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const options = {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    };

    if (bodyParams && Object.keys(bodyParams).length > 0 && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(bodyParams);
    }

    const response = await fetch(url, options);

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { rawResponse: text };
      }
    }

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: data.error || data.message || `API request failed: ${response.status} ${response.statusText}`,
          statusCode: response.status,
          apiError: data
        }, null, 2)
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: data
      }, null, 2)
    };
  } catch (error) {
    console.error('Error in phone-numbers-api:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      }, null, 2)
    };
  }
};
