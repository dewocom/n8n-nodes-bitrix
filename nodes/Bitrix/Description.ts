import {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeProperties,
	jsonParse,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { bitrixApiRequest } from './GenericFunctions';

interface IFilterCondition {
	field: string;
	operation: string;
	value: string;
}

interface IOrderCondition {
	field: string;
	direction: string;
}

interface IListParameters {
	select?: string[];
	filter?: {
		property?: IFilterCondition[];
	};
	order?: {
		property?: IOrderCondition[];
	};
	start?: number;
}

export const operations: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                    item                                    */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Entity Type Name or ID',
		name: 'entityTypeId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getEntityTypes',
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['crm.item'],
			},
		},
		description: 'Identifier of the system or user-defined type. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		placeholder: 'e.g. 2',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['crm.company', 'crm.contact', 'crm.deal', 'crm.item', 'crm.lead'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'add',
				description: 'Create a new entity record',
				action: 'Create a record',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an entity record by ID',
				action: 'Delete a record',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a specific record by ID',
				action: 'Get a record',
			},
			{
				name: 'Get Fields Description',
				value: 'fields',
				description: 'Retrieve metadata about all available fields',
				action: 'Get field metadata',
			},
			{
				name: 'List',
				value: 'list',
				description: 'Retrieve filtered list of records',
				action: 'List records',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Modify an existing record by ID',
				action: 'Update a record',
			},
		],
		default: 'add',
	},
];

export const fields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                    base                                    */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'ID',
		name: 'id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'The ID of the record to operate on',
		placeholder: 'e.g. 12345',
	},
	/* -------------------------------------------------------------------------- */
	/*                                 add/update                                 */
	/* -------------------------------------------------------------------------- */
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
				operation: ['add', 'update', 'list'],
			},
		},
		description: 'Choose how to provide input data',
	},
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
			loadOptionsMethod: 'getEntityFields',
			loadOptionsDependsOn: ['resource'],
		},
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				operation: ['add', 'update'],
				inputType: ['fields'],
			},
		},
		description: 'Field values to set',
		options: [
			{
				displayName: 'Values',
				name: 'values',
				values: [
					{
						displayName: 'Name or ID',
						name: 'name',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getEntityFields',
							loadOptionsDependsOn: ['resource'],
						},
						default: '',
						description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Field value',
					},
				],
			},
		],
	},
	{
		displayName: 'JSON Body',
		name: 'jsonBody',
		type: 'json',
		default: '',
		description: 'Provide complete data in JSON format',
		displayOptions: {
			show: {
				operation: ['add', 'update', 'list'],
				inputType: ['json'],
			},
		},
	},


	/* -------------------------------------------------------------------------- */
	/*                                    list                                    */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Parameters',
		name: 'parameters',
		type: 'collection',
		placeholder: 'Add Parameter',
		default: {},
		displayOptions: {
			show: {
				operation: ['list'],
				inputType: ['fields'],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-param-collection-type-unsorted-items
		options: [
			{
				displayName: 'Select Names or IDs',
				name: 'select',
				type: 'multiOptions',
				default: [],
				description: 'Fields to include in the response. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				typeOptions: {
					loadOptionsMethod: 'getEntityFields',
					loadOptionsDependsOn: ['resource'],
				},
			},
			{
				displayName: 'Filter Conditions',
				name: 'filter',
				type: 'fixedCollection',
				placeholder: 'Add Filter',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				options: [
					{
						displayName: 'Field',
						name: 'property',
						values: [
							{
								displayName: 'Name or ID',
								name: 'field',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getEntityFields',
									loadOptionsDependsOn: ['resource'],
								},
								default: '',
								description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
							},
							{
								displayName: 'Operation',
								name: 'operation',
								type: 'options',
								noDataExpression: true,
								options: [
									{ name: 'Contains', value: '%' },
									{ name: 'Ends With', value: '%=' },
									{ name: 'Equals', value: '=' },
									{ name: 'Greater Than', value: '>' },
									{ name: 'Greater Than Or Equal', value: '>=' },
									{ name: 'In List', value: '@' },
									{ name: 'Less Than', value: '<' },
									{ name: 'Less Than Or Equal', value: '<=' },
									{ name: 'Not Contains', value: '!%' },
									{ name: 'Not Equals', value: '!=' },
									{ name: 'Not In List', value: '!@' },
									{ name: 'Starts With', value: '=%' },
								],
								default: '=',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value to compare with',
							},
						],
					},
				],
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'fixedCollection',
				placeholder: 'Add Order',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						displayName: 'Property',
						name: 'property',
						values: [
							{
								displayName: 'Field Name or ID',
								name: 'field',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getEntityFields',
									loadOptionsDependsOn: ['resource'],
								},
								default: '',
								description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
							},
							{
								displayName: 'Direction',
								name: 'direction',
								type: 'options',
								options: [
									{
										name: 'ASC',
										value: 'ASC',
									},
									{
										name: 'DESC',
										value: 'DESC',
									},
								],
								default: 'ASC',
								description: 'Sort direction',
							},
						],
					},
				],
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				default: 0,
			},
		]
	},
	{
		displayName: 'Use Original UF Names',
		name: 'useOriginalUfNames',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['crm.item'],
			},
			hide: {
				operation: ['delete'],
			},
		},
		description: 'Whether to use original UF_CRM prefix for custom field names',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index);
	const resource = this.getNodeParameter('resource', index) as string;

	let requestMethod: IHttpRequestMethods = 'POST';
	let endpoint: string;
	let body: IDataObject = {};
	let qs: IDataObject = {};
	let inputType: string;

	endpoint = `${resource}.${operation}`;
	if (resource === 'crm.item') {
		const entityTypeId = this.getNodeParameter('entityTypeId', index) as number;
		if (!entityTypeId) throw new NodeOperationError(this.getNode(), 'Missing Entity Type ID parameter');
		qs.entityTypeId = entityTypeId;

		if (operation !== 'delete') {
			qs.useOriginalUfNames = this.getNodeParameter('useOriginalUfNames', index, false) as boolean ? 'Y' : 'N';
		}
	}

	switch (operation) {
		case 'get':
		case 'delete': {
			requestMethod = 'GET';
			const id = this.getNodeParameter('id', index) as number;
			if (!id) throw new NodeOperationError(this.getNode(), 'Missing ID parameter');
			qs.id = id;
			break;
		}

		case 'list': {
			inputType = this.getNodeParameter('inputType', index) as string;

			if (inputType === 'json') {
				const jsonBody = this.getNodeParameter('jsonBody', index, '{}') as string;
				try {
					Object.assign(body, jsonParse(jsonBody));
				} catch (err) {
					throw new NodeOperationError(this.getNode(), 'Invalid JSON query format', {
						itemIndex: index,
						description: 'Please provide valid JSON. Error:' + err.message,
					});
				}
			} else {
				requestMethod = 'GET';

				const parameters = this.getNodeParameter('parameters', index, {}) as IListParameters;

				if (parameters.select) {
					qs.select = parameters.select;
				}

				if (parameters.filter?.property) {
					qs.filter = {} as Record<string, any>;

					parameters.filter.property.forEach(condition => {
						const filterKey = `${condition.operation}${condition.field}`;

						if (condition.operation === '@' || condition.operation === '!@') {
							(qs.filter as Record<string, any>)[filterKey] =
								condition.value.split(',').map(v => v.trim());
						} else {
							(qs.filter as Record<string, any>)[filterKey] = condition.value;
						}
					});
				}

				if (parameters.order?.property) {
					qs.order = {} as Record<string, string>;
					parameters.order.property.forEach(condition => {
						(qs.order as Record<string, string>)[condition.field] = condition.direction;
					});
				}

				if (parameters.start !== undefined) {
					qs.start = parameters.start;
				}
			}
			break;
		}
		case 'add':
		case 'update': {
			inputType = this.getNodeParameter('inputType', index) as string;
			let fields: IDataObject = {};
			if (inputType === 'json') {
				const jsonBody = this.getNodeParameter('jsonBody', index, '{}') as string;
				try {
					fields = jsonParse(jsonBody);
				} catch (err) {
					throw new NodeOperationError(this.getNode(), 'Invalid JSON data', {
						itemIndex: index,
						description: 'Please provide valid JSON.',
					});
				}
			} else {
				const fieldsData = this.getNodeParameter('fields', index, {}) as {
					values?: Array<{
						name: string;
						value: string;
					}>;
				};

				fields = {};
				if (fieldsData.values) {
					fieldsData.values.forEach(({name, value}) => {
						if (name) fields[name] = value;
					});
				}
			}

			if (!fields || Object.keys(fields).length === 0) {
				throw new NodeOperationError(this.getNode(), 'Fields cannot be empty');
			}

			body.fields = fields;

			if (operation === 'update') {
				const id = this.getNodeParameter('id', index) as number;
				if (!id) throw new NodeOperationError(this.getNode(), 'ID parameter is required for update', { itemIndex: index });
				qs.id = id;
			}
			break;
		}

		case 'fields': {
			body = {};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`);
	}

	const responseData = await bitrixApiRequest.call(this, requestMethod, endpoint, body, qs);
	return this.helpers.returnJsonArray(responseData as IDataObject[]);
}
