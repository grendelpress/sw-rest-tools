export const ENDPOINTS = {
    'phone-number-list': {
        title: 'List Phone Numbers',
        method: 'GET',
        description: 'View and download a CSV of all your phone numbers',
        endpoint: '/generate-numbers-csv',
        status: 'active'
    },
    'phone-number-get': {
        title: 'Get Phone Number',
        method: 'GET',
        description: 'Retrieve the details and configuration for one phone number',
        apiPath: '/api/relay/rest/phone_numbers/{id}',
        status: 'active',
        formType: 'single-id',
        fields: [
            { name: 'id', label: 'Phone Number', type: 'picker', pickerType: 'phone-number', required: true }
        ]
    },
    'phone-number-search': {
        title: 'Search Available Phone Numbers',
        method: 'GET',
        description: 'Search available phone numbers by country, area code, number type, and capabilities',
        apiPath: '/api/relay/rest/phone_numbers/search',
        status: 'active',
        formType: 'search',
        fields: [
            { name: 'country_code', label: 'Country Code (ISO 3166-1 alpha-2)', type: 'text', required: false, placeholder: 'US', default: 'US' },
            { name: 'area_code', label: 'Area Code', type: 'text', required: false, placeholder: '415' },
            { name: 'number_type', label: 'Number Type', type: 'select', required: false, options: [
                { value: '', label: 'Any' },
                { value: 'local', label: 'Local' },
                { value: 'toll-free', label: 'Toll-Free' },
                { value: 'national', label: 'National' },
                { value: 'mobile', label: 'Mobile' }
            ]},
            { name: 'capabilities', label: 'Capabilities', type: 'select', required: false, options: [
                { value: '', label: 'Any' },
                { value: 'voice', label: 'Voice' },
                { value: 'sms', label: 'SMS' },
                { value: 'mms', label: 'MMS' },
                { value: 'fax', label: 'Fax' }
            ]}
        ]
    },
    'phone-number-purchase': {
        title: 'Purchase Phone Number',
        method: 'POST',
        description: 'Purchase an available phone number for your project',
        apiPath: '/api/relay/rest/phone_numbers',
        status: 'active',
        formType: 'create',
        fields: [
            { name: 'number', label: 'Phone Number (E.164)', type: 'text', required: true, placeholder: '+15558675309' },
            { name: 'name', label: 'Friendly Name (optional)', type: 'text', required: false, placeholder: 'Jenny' }
        ]
    },
    'phone-number-release': {
        title: 'Release Phone Number',
        method: 'DELETE',
        description: 'Release a phone number from your project. This action cannot be undone.',
        apiPath: '/api/relay/rest/phone_numbers/{id}',
        status: 'active',
        formType: 'delete',
        confirmMessage: 'Are you sure you want to release this phone number? This action cannot be undone.',
        fields: [
            { name: 'id', label: 'Phone Number', type: 'picker', pickerType: 'phone-number', required: true }
        ]
    },
    'phone-number-update': {
        title: 'Update Phone Number',
        method: 'PUT',
        description: 'Update voice, SMS, and forwarding settings for a phone number',
        apiPath: '/api/relay/rest/phone_numbers/{id}',
        status: 'active',
        formType: 'update',
        fields: [
            { name: 'id', label: 'Phone Number', type: 'picker', pickerType: 'phone-number', required: true },
            { name: 'name', label: 'Friendly Name', type: 'text', required: false, placeholder: 'Jenny' },
            { name: 'call_handler', label: 'Call Handler', type: 'select', required: false, options: [
                { value: '', label: 'No change' },
                { value: 'laml_webhooks', label: 'LaML Webhooks' },
                { value: 'laml_application', label: 'LaML Application' },
                { value: 'relay_context', label: 'Relay Context' },
                { value: 'relay_application', label: 'Relay Application' },
                { value: 'relay_topic', label: 'Relay Topic' },
                { value: 'relay_script', label: 'Relay Script' },
                { value: 'relay_connector', label: 'Relay Connector' },
                { value: 'relay_sip_endpoint', label: 'Relay SIP Endpoint' },
                { value: 'relay_verto_endpoint', label: 'Relay Verto Endpoint' },
                { value: 'video_room', label: 'Video Room' }
            ]},
            { name: 'call_receive_mode', label: 'Call Receive Mode', type: 'select', required: false, options: [
                { value: '', label: 'No change' },
                { value: 'voice', label: 'Voice' },
                { value: 'fax', label: 'Fax' }
            ]},
            { name: 'message_handler', label: 'Message Handler', type: 'select', required: false, options: [
                { value: '', label: 'No change' },
                { value: 'laml_webhooks', label: 'LaML Webhooks' },
                { value: 'laml_application', label: 'LaML Application' },
                { value: 'relay_context', label: 'Relay Context' },
                { value: 'relay_application', label: 'Relay Application' },
                { value: 'relay_topic', label: 'Relay Topic' }
            ]}
        ]
    },
    'e911-assign': {
        title: 'Assign E911 Address to Phone Number',
        method: 'POST',
        description: 'Assign an emergency services address to a phone number',
        apiPath: '/api/relay/rest/phone_numbers/{id}/e911_address',
        status: 'active',
        formType: 'create',
        fields: [
            { name: 'id', label: 'Phone Number', type: 'picker', pickerType: 'phone-number', required: true },
            { name: 'e911_address_id', label: 'E911 Address', type: 'picker', pickerType: 'e911-address', required: true }
        ]
    },
    'phone-number-remove-e911': {
        title: 'Remove E911 Address from Phone Number',
        method: 'DELETE',
        description: 'Remove the emergency services address assignment from a phone number',
        apiPath: '/api/relay/rest/phone_numbers/{id}/e911_address',
        status: 'active',
        formType: 'delete',
        confirmMessage: 'Are you sure you want to remove the E911 address from this phone number?',
        fields: [
            { name: 'id', label: 'Phone Number', type: 'picker', pickerType: 'phone-number', required: true }
        ]
    },
    'phone-number-lookup': {
        title: 'Look Up Phone Number',
        method: 'GET',
        description: 'Look up carrier and number type information for a phone number',
        apiPath: '/api/relay/rest/phone_numbers/lookup',
        status: 'active',
        formType: 'search',
        fields: [
            { name: 'number', label: 'Phone Number (E.164)', type: 'text', required: true, placeholder: '+15558675309' }
        ]
    },
    'phone-number-route': {
        title: 'Assign Resource to Phone Route',
        method: 'POST',
        description: 'Connect a voice or messaging resource to a phone route',
        apiPath: '/api/fabric/resources/{id}/phone_routes',
        status: 'active',
        formType: 'create',
        fields: [
            { name: 'id', label: 'Resource ID (UUID)', type: 'text', required: true, placeholder: '3fa85f64-5717-4562-b3fc-2c963f66afa6' },
            { name: 'phone_route_id', label: 'Phone Route ID (UUID)', type: 'text', required: true, placeholder: '691af061-cd86-4893-a605-173f47afc4c2' },
            { name: 'handler_type', label: 'Handler Type', type: 'select', required: true, options: [
                { value: 'calling', label: 'Calling' },
                { value: 'messaging', label: 'Messaging' }
            ]}
        ]
    },
    'e911-create': {
        title: 'Create E911 Address',
        method: 'POST',
        description: 'Create and validate an emergency services address',
        apiPath: '/api/relay/rest/addresses',
        status: 'active',
        formType: 'create',
        fields: [
            { name: 'label', label: 'Label', type: 'text', required: true, placeholder: 'Office HQ' },
            { name: 'first_name', label: 'First Name', type: 'text', required: true, placeholder: 'John' },
            { name: 'last_name', label: 'Last Name', type: 'text', required: true, placeholder: 'Doe' },
            { name: 'street_number', label: 'Street Number', type: 'text', required: true, placeholder: '1640' },
            { name: 'street_name', label: 'Street Name', type: 'text', required: true, placeholder: 'Riverside Drive' },
            { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'Alexandria' },
            { name: 'state', label: 'State/Province', type: 'text', required: true, placeholder: 'CA' },
            { name: 'postal_code', label: 'Postal Code', type: 'text', required: true, placeholder: '91905' },
            { name: 'country', label: 'Country (ISO 3166-1 alpha-2)', type: 'text', required: true, placeholder: 'US', default: 'US' },
            { name: 'address_type', label: 'Address Type (optional)', type: 'select', required: false, default: '', options: [
                { value: '', label: '— None —' },
                { value: 'Apartment', label: 'Apartment' },
                { value: 'Basement', label: 'Basement' },
                { value: 'Building', label: 'Building' },
                { value: 'Department', label: 'Department' },
                { value: 'Floor', label: 'Floor' },
                { value: 'Office', label: 'Office' },
                { value: 'Penthouse', label: 'Penthouse' },
                { value: 'Suite', label: 'Suite' },
                { value: 'Trailer', label: 'Trailer' },
                { value: 'Unit', label: 'Unit' }
            ]},
            { name: 'address_number', label: 'Address Number (optional)', type: 'text', required: false, placeholder: '42' },
            { name: 'emergency_enabled', label: 'Enable E911 emergency validation (US only)', type: 'checkbox', required: false, default: true },
            { name: 'auto_correct_address', label: 'Automatically accept carrier corrections', type: 'checkbox', required: false, default: true }
        ]
    },
    'e911-delete': {
        title: 'Delete E911 Address',
        method: 'DELETE',
        description: 'Permanently delete an E911 address from your project. This action cannot be undone.',
        apiPath: '/api/relay/rest/addresses/{id}',
        status: 'active',
        formType: 'delete',
        confirmMessage: 'Are you sure you want to permanently delete this E911 address? This action cannot be undone.',
        fields: [
            { name: 'id', label: 'E911 Address', type: 'picker', pickerType: 'e911-address', required: true }
        ]
    },
    'e911-get': {
        title: 'Get E911 Address',
        method: 'GET',
        description: 'Retrieve the details for one E911 address',
        apiPath: '/api/relay/rest/addresses/{id}',
        status: 'active',
        formType: 'single-id',
        fields: [
            { name: 'id', label: 'E911 Address', type: 'picker', pickerType: 'e911-address', required: true }
        ]
    },
    'e911-list': {
        title: 'List E911 Addresses',
        method: 'GET',
        description: 'View all E911 addresses in your project',
        apiPath: '/api/relay/rest/addresses',
        status: 'active',
        formType: 'list',
        fields: [
            { name: 'page_number', label: 'Page Number (0-indexed)', type: 'number', required: false, placeholder: '0', default: '0' },
            { name: 'page_size', label: 'Page Size (1-1000)', type: 'number', required: false, placeholder: '50', default: '50' }
        ]
    },
    'e911-update': {
        title: 'Update E911 Address',
        method: 'PUT',
        description: 'Update the details for an E911 address',
        apiPath: '/api/relay/rest/addresses/{id}',
        status: 'active',
        formType: 'update',
        fields: [
            { name: 'id', label: 'E911 Address', type: 'picker', pickerType: 'e911-address', required: true },
            { name: 'label', label: 'Label', type: 'text', required: false, placeholder: 'Office HQ' },
            { name: 'first_name', label: 'First Name', type: 'text', required: false, placeholder: 'John' },
            { name: 'last_name', label: 'Last Name', type: 'text', required: false, placeholder: 'Doe' },
            { name: 'street_number', label: 'Street Number', type: 'text', required: false, placeholder: '1640' },
            { name: 'street_name', label: 'Street Name', type: 'text', required: false, placeholder: 'Riverside Drive' },
            { name: 'city', label: 'City', type: 'text', required: false, placeholder: 'Alexandria' },
            { name: 'state', label: 'State/Province', type: 'text', required: false, placeholder: 'CA' },
            { name: 'postal_code', label: 'Postal Code', type: 'text', required: false, placeholder: '91905' },
            { name: 'country', label: 'Country (ISO 3166-1 alpha-2)', type: 'text', required: false, placeholder: 'US' },
            { name: 'address_type', label: 'Address Type (optional)', type: 'select', required: false, default: '', options: [
                { value: '', label: '— None —' },
                { value: 'Apartment', label: 'Apartment' },
                { value: 'Basement', label: 'Basement' },
                { value: 'Building', label: 'Building' },
                { value: 'Department', label: 'Department' },
                { value: 'Floor', label: 'Floor' },
                { value: 'Office', label: 'Office' },
                { value: 'Penthouse', label: 'Penthouse' },
                { value: 'Suite', label: 'Suite' },
                { value: 'Trailer', label: 'Trailer' },
                { value: 'Unit', label: 'Unit' }
            ]},
            { name: 'address_number', label: 'Address Number (optional)', type: 'text', required: false, placeholder: '42' },
            { name: 'emergency_enabled', label: 'Enable E911 emergency validation (US only)', type: 'checkbox', required: false, default: true },
            { name: 'auto_correct_address', label: 'Automatically accept carrier corrections', type: 'checkbox', required: false, default: true }
        ]
    },
    'messaging-list': {
        title: 'Messages',
        method: 'GET',
        description: 'View and download a CSV of all your messages',
        endpoint: '/generate-messages-csv',
        status: 'active'
    },
    'messaging-analytics': {
        title: 'Messaging Analytics',
        method: 'GET',
        description: 'Query message analytics with custom filters and view comprehensive dashboard',
        type: 'messaging-analytics',
        status: 'active'
    },
    'messaging-high-volume': {
        title: 'High-Volume Message Logs',
        method: 'GET',
        description: 'Fetch large message datasets in weekly chunks to prevent timeouts. Limited by your browser storage.',
        type: 'high-volume-messages',
        status: 'active'
    },
    'messaging-faxes': {
        title: 'Faxes',
        method: 'GET',
        description: 'View and download a CSV of all your faxes',
        endpoint: '/generate-faxes-csv',
        status: 'active'
    },
    'calls-laml': {
        title: 'LaML Calls (Legacy)',
        method: 'GET',
        description: 'Traditional call records from LaML/Compatibility API',
        endpoint: '/generate-calls-csv',
        status: 'active'
    },
    'calls-relay': {
        title: 'RELAY Calls',
        method: 'GET',
        description: 'Modern call logs from RELAY Voice API',
        endpoint: '/generate-relay-calls-csv',
        status: 'active'
    },
    'recordings-list': {
        title: 'Recordings',
        method: 'GET',
        description: 'View and download a CSV of all your recordings',
        endpoint: '/generate-recordings-csv',
        status: 'active'
    },
    'bins-list': {
        title: 'cXML Bins',
        method: 'GET',
        description: 'View and download a CSV of all your LaML bins',
        endpoint: '/test-bins-api',
        status: 'active'
    }
};
