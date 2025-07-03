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
      queryOptions.dateCreatedAfter = new Date(startDate + 'T00:00:00Z');
    }
    if (endDate) {
      queryOptions.dateCreatedBefore = new Date(endDate + 'T23:59:59Z');
    }
    
    const recordings = await client.recordings.list(queryOptions);
    
    const data = recordings.map((record) => ({
      recordingSid: record.sid || '',
      callSid: record.callSid || '',
      conferenceSid: record.conferenceSid || '',
      dateCreated: record.dateCreated ? record.dateCreated.toString() : '',
      dateUpdated: record.dateUpdated ? record.dateUpdated.toString() : '',
      duration: record.duration || '',
      status: record.status || '',
      source: record.source || '',
      channels: record.channels || '',
      startTime: record.startTime ? record.startTime.toString() : '',
      price: record.price || '',
      priceUnit: record.priceUnit || '',
      uri: record.uri || '',
      encryptionDetails: record.encryptionDetails ? JSON.stringify(record.encryptionDetails) : ''
    }));

    // Create CSV content
    const headers = ['Recording SID', 'Call SID', 'Conference SID', 'Date Created', 'Date Updated', 'Duration (seconds)', 'Status', 'Source', 'Channels', 'Start Time', 'Price', 'Price Unit', 'URI', 'Encryption Details'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.recordingSid}"`,
        `"${row.callSid}"`,
        `"${row.conferenceSid}"`,
        `"${row.dateCreated}"`,
        `"${row.dateUpdated}"`,
        `"${row.duration}"`,
        `"${row.status}"`,
        `"${row.source}"`,
        `"${row.channels}"`,
        `"${row.startTime}"`,
        `"${row.price}"`,
        `"${row.priceUnit}"`,
        `"${row.uri}"`,
        `"${row.encryptionDetails.replace(/"/g, '""')}"` // Escape quotes in JSON
      ].join(','))
    ].join('\n');

    // Create filename with project name and API type
    const filename = `Recordings_${cleanProjectName}.csv`;

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