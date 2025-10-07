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
    const body = JSON.parse(event.body);
    const { projectId, authToken, spaceUrl, to, from, startDate, endDate } = body;

    console.log('Received request:', { to, from, startDate, endDate });

    // Validate E.164 format for phone numbers if provided
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    if (to && !e164Regex.test(to)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid "To" phone number format. Must be E.164 format (e.g., +12345678901)' })
      };
    }

    if (from && !e164Regex.test(from)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid "From" phone number format. Must be E.164 format (e.g., +12345678901)' })
      };
    }

    // Build URL with query parameters
    const baseUrl = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages.json`;
    const queryParams = new URLSearchParams();

    if (to) {
      queryParams.append('To', to);
    }
    if (from) {
      queryParams.append('From', from);
    }
    if (startDate) {
      queryParams.append('DateSent>', startDate);
    }
    if (endDate) {
      queryParams.append('DateSent<', endDate);
    }

    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    console.log('Request URL:', url);

    // Make direct HTTP request with Basic Auth
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${projectId}:${authToken}`).toString('base64'),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SignalWire API error:', errorText);
      throw new Error(`SignalWire API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const messages = result.messages || [];

    console.log('Messages received from API:', messages.length);

    // Format message data for analytics
    const data = messages.map((record) => ({
      sid: record.sid || '',
      from: record.from || '',
      to: record.to || '',
      dateSent: record.date_sent || record.dateSent || '',
      status: record.status || '',
      direction: record.direction || '',
      errorCode: record.error_code || record.errorCode || null,
      errorMessage: record.error_message || record.errorMessage || null,
      body: record.body || '',
      numSegments: record.num_segments || record.numSegments || 0,
      price: record.price || 0,
      priceUnit: record.price_unit || record.priceUnit || 'USD'
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: data,
        filters: {
          to: to || null,
          from: from || null,
          startDate: startDate || null,
          endDate: endDate || null
        },
        totalCount: data.length
      })
    };
  } catch (error) {
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
