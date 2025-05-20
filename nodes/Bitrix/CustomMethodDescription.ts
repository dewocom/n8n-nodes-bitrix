import type { INodeProperties } from 'n8n-workflow';

export const customMethodOperations: INodeProperties[] = [
	{
		displayName: 'Method',
		name: 'operation',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['custom'],
			},
		},
		default: '',
		placeholder: 'crm.contact.add',
		description:
			'Enter the name of the Bitrix24 REST API method you want to call. Refer to the Bitrix24 API documentation for available methods.',
		required: true,
	},
	{
		displayName: 'Input Type',
		name: 'inputType',
		type: 'options',
		options: [
			{
				name: 'Using Fields',
				value: 'fields',
				description: 'Fill fields individually',
			},
			{
				name: 'Using JSON',
				value: 'json',
				description: 'Provide raw JSON data',
			},
		],
		default: 'fields',
		displayOptions: {
			show: {
				resource: ['custom'],
			},
		},
	},
	{
		displayName: 'Additional Parameters',
		name: 'Additional Parameters',
		displayOptions: {
			show: {
				resource: ['custom'],
				inputType: ['fields'],
			},
		},
		description:
			'Key-value pairs to send as request parameters (e.g., filter, select, order, start, etc.)',
		placeholder: 'Add parameter',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		options: [
			{
				displayName: 'Parameter',
				name: 'parameter',
				values: [
					{
						displayName: 'Field Name',
						name: 'name',
						type: 'string',
						default: '',
						required: true,
						description: 'Example: filter[STAGE_ID]',
					},
					{
						displayName: 'Field Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Example: C1:NEW',
					},
				],
			},
		],
	},
	{
		displayName: 'JSON Data',
		name: 'jsonData',
		type: 'json',
		default: '',
		description: 'Provide complete data in JSON format',
		displayOptions: {
			show: {
				resource: ['custom'],
				inputType: ['json'],
			},
		},
	},
];
