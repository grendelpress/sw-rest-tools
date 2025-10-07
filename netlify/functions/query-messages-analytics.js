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
    const { projectId, authToken, spaceUrl, to, from, startDate, endDate } = JSON.parse(event.body);

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

    const client = new RestClient(projectId, authToken, { signalwireSpaceUrl: spaceUrl });

    // Build query options for filtering
    const queryOptions = {};

    // Use dateSent for date filtering as per SignalWire API
    if (startDate && endDate) {
      // For date range, we need to use both dateSentAfter and dateSentBefore
      queryOptions.dateSentAfter = new Date(startDate + 'T00:00:00Z');
      queryOptions.dateSentBefore = new Date(endDate + 'T23:59:59Z');
    } else if (startDate) {
      queryOptions.dateSentAfter = new Date(startDate + 'T00:00:00Z');
    } else if (endDate) {
      queryOptions.dateSentBefore = new Date(endDate + 'T23:59:59Z');
    }

    if (to) {
      queryOptions.to = to;
    }
    if (from) {
      queryOptions.from = from;
    }

    console.log('Query options:', JSON.stringify(queryOptions, null, 2));

    // Fetch all messages matching the criteria
    const messages = await client.messages.list(queryOptions);

    console.log('Messages received from API:', messages.length);

    // Format message data for analytics
    const data = messages.map((record) => ({
      sid: record.sid || '',
      from: record.from || '',
      to: record.to || '',
      dateSent: record.dateSent ? record.dateSent.toISOString() : '',
      status: record.status || '',
      direction: record.direction || '',
      errorCode: record.errorCode || null,
      errorMessage: record.errorMessage || null,
      body: record.body || '',
      numSegments: record.numSegments || 0,
      price: record.price || 0,
      priceUnit: record.priceUnit || 'USD'
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
