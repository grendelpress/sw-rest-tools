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
    
    // Build query options for date filtering
    const queryOptions = {};
    if (startDate) {
      queryOptions.dateSentAfter = new Date(startDate + 'T00:00:00Z');
    }
    if (endDate) {
      queryOptions.dateSentBefore = new Date(endDate + 'T23:59:59Z');
    }
    
    const messages = await client.messages.list(queryOptions);
    
    const data = messages.map((record) => ({
      messageSid: record.sid || '',
      from: record.from || '',
      to: record.to || '',
      dateSent: record.dateSent ? record.dateSent.toString() : '',
      status: record.status || '',
      direction: record.direction || '',
      price: record.price || '',
      body: record.body || '',
      numSegments: record.numSegments || ''
    }));

    // Create CSV content
    const headers = ['Message SID', 'From', 'To', 'Date Sent', 'Status', 'Direction', 'Price', 'Body', 'Number of Segments'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.messageSid}"`,
        `"${row.from}"`,
        `"${row.to}"`,
        `"${row.dateSent}"`,
        `"${row.status}"`,
        `"${row.direction}"`,
        `"${row.price}"`,
        `"${row.body.replace(/"/g, '""')}"`, // Escape quotes in message body
        `"${row.numSegments}"`
      ].join(','))
    ].join('\n');

    // Create filename with project name and API type
    const filename = `Messages-${cleanProjectName}.csv`;

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