const { RestClient } = require('@signalwire/compatibility-api');

exports.handler = async (event, context) => {
  console.log('Function called with method:', event.httpMethod);
  console.log('Event body:', event.body);
  
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
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { projectId, authToken, spaceUrl } = JSON.parse(event.body);
    
    const client = new RestClient(projectId, authToken, { signalwireSpaceUrl: spaceUrl });
    
    // Fetch project details to get the friendly name
    const project = await client.api.accounts(projectId).fetch();
    const projectName = project.friendlyName || 'UnnamedProject';
    
    // Clean project name for filename (remove invalid characters)
    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list();
    
    const data = incomingPhoneNumbers.map((record) => ({
      phoneNumber: record.phoneNumber,
      friendlyName: record.friendlyName,
      phoneNumberSid: record.sid
    }));

    // Create CSV content
    const headers = ['Phone Number', 'Name', 'Phone Number SID'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.phoneNumber,
        row.friendlyName || '',
        row.phoneNumberSid
      ].join(','))
    ].join('\n');

    // Create filename with project name and API type
    const filename = `Numbers-${cleanProjectName}.csv`;

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