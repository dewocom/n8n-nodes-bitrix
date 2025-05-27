import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	jsonParse,
	NodeOperationError,
} from 'n8n-workflow';
import { bitrixApiRequest, processParameters } from './GenericFunctions';

export const customMethodOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['custom'],
			},
		},
		options: [
			{
				name: 'Custom API Method',
				value: 'custom',
				description: 'Make a custom API call to any Bitrix24 method',
				action: 'Call custom API method'
			},
		],
		default: 'custom',
	},
	{
		displayName: 'API Method',
		name: 'apiMethod',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['custom'],
			},
		},
		default: '',
		placeholder: 'e.g. crm.contact.add',
		description:
			'Enter the Bitrix24 REST API method. Refer to the Bitrix24 API documentation for available methods.',
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
		displayName: 'Parameters',
		name: 'fields',
		displayOptions: {
			show: {
				resource: ['custom'],
				inputType: ['fields'],
			},
		},
		description:
			'Key-value pairs to send as request parameters. For nested fields use dot notation: <code>filter.STAGE_ID</code>',
		placeholder: 'Add parameter',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		default: {},
		options: [
			{
				displayName: 'Field',
				name: 'values',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'e.g. filter.STAGE_ID or FIELDS[EMAIL]',
						description: 'Parameter name (supports dot notation for nesting)',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Parameter value',
					},
				],
			},
		],
	},
	{
		displayName: 'JSON Data',
		name: 'jsonBody',
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

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const apiMethod = this.getNodeParameter('apiMethod', index, '') as string;

	let body: IDataObject = {};
	const inputType = this.getNodeParameter('inputType', index) as string;

	if (inputType === 'json') {
		const jsonBody = this.getNodeParameter('jsonBody', index, '{}') as string;
		try {
			const parsedJson = jsonParse(jsonBody);
			if (typeof parsedJson !== 'object' || parsedJson === null) {
				throw new Error('JSON must be an object');
			}
			Object.assign(body, parsedJson);
		} catch (error) {
			throw new NodeOperationError(this.getNode(), 'Invalid JSON format', {
				itemIndex: index,
				description: 'Please provide valid JSON object. Error: ' + error.message,
			});
		}
	} else {
		const fields = this.getNodeParameter('fields.values', index, []) as Array<{
			name: string;
			value: string;
		}>;
		Object.assign(body, processParameters(fields));
	}

	const responseData = await bitrixApiRequest.call(this, 'POST', apiMethod, body);
	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}
