import type { INodeProperties } from 'n8n-workflow';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['crm.company', 'crm.contact', 'crm.deal', 'crm.lead'],
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
		description: 'ID of the record to operate on',
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
				operation: ['add', 'update'],
			},
		},
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
		options: [
			{
				displayName: 'Field',
				name: 'field',
				values: [
					{
						displayName: 'Field Name or ID',
						name: 'name',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getEntityFields',
							loadOptionsDependsOn: ['resource'],
						},
						default: '',
						description: 'Select field from entity. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
					{
						displayName: 'Field Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Enter field value',
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
				operation: ['add', 'update'],
				inputType: ['json'],
			},
		},
	},

	/* -------------------------------------------------------------------------- */
	/*                                    list                                    */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Input Type',
		name: 'inputType',
		type: 'options',
		options: [
			{
				name: 'Using Filters',
				value: 'filters',
				description: 'Build filters step by step',
			},
			{
				name: 'Using JSON Query',
				value: 'json',
				description: 'Provide complete filter in JSON',
			},
		],
		default: 'filters',
		displayOptions: {
			show: {
				operation: ['list'],
			},
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				operation: ['list'],
				inputType: ['filters'],
			},
		},
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
				displayName: 'Filter',
				name: 'filter',
				type: 'fixedCollection',
				placeholder: 'Add Filter Condition',
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
		]
	},
	{
		displayName: 'JSON Query',
		name: 'jsonQuery',
		type: 'json',
		default: '',
		description: 'Provide complete filter in JSON format (e.g., {"select": ["ID", "TITLE"], "filter": {"STAGE_ID": "NEW"}})',
		displayOptions: {
			show: {
				operation: ['list'],
				inputType: ['json'],
			},
		},
	},
];
