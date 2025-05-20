import {
	IDataObject,
	IExecuteFunctions, INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	NodeConnectionType, NodeOperationError,
} from 'n8n-workflow';

import { bitrixApiRequest } from './GenericFunctions';
import * as loadOptions from './methods';
import { operations, fields } from './Description';
import { customMethodOperations } from './CustomMethodDescription';

export class Bitrix implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Bitrix',
		name: 'bitrix',
		icon: { light: 'file:b24_cloud.svg', dark: 'file:b24_cloud.dark.svg' },
		group: ['output'],
		subtitle: '={{$parameter["resource"] + "." + $parameter["operation"]}}',
		version: 1,
		description: 'Consume Bitrix24 REST API',
		defaults: { name: 'Bitrix' },
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'bitrixOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['bitrixOAuth2Api'],
					},
				},
			},
			{
				name: 'bitrixWebhookApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['bitrixWebhookApi'],
					},
				},
			},
		],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'OAuth2',
						value: 'bitrixOAuth2Api',
					},
					{
						name: 'Webhook',
						value: 'bitrixWebhookApi',
					},
				],
				default: 'bitrixOAuth2Api',
			},
			{
				displayName: '',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Company', value: 'crm.company' },
					{ name: 'Contact', value: 'crm.contact' },
					{ name: 'Deal', value: 'crm.deal' },
					{ name: 'Lead', value: 'crm.lead' },
					{ name: 'User Custom Method', value: 'custom' },
				],
				default: 'crm.deal',
			},
			{
				displayName: '',
				name: 'resourceCategory',
				type: 'hidden',
				default: '={{ $parameter.resource.match(/^[^.]+/)[0] }}',
			},
			...operations,
			...fields,
			...customMethodOperations,
		],
	};

	methods = {
		loadOptions
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let requestMethod: IHttpRequestMethods = 'POST';
				let endpoint: string;
				let body: IDataObject = {};
				let qs: IDataObject = {};
				let inputType: string;

				if (resource === 'custom') {
					endpoint = operation;
					inputType = this.getNodeParameter('inputType', i) as string;
					if (inputType === 'json') {
						const jsonData = this.getNodeParameter('jsonData', i) as string;
						try {
							body = JSON.parse(jsonData);
						} catch (err) {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in input data', {
								description: 'Please provide valid JSON.',
							});
						}
					} else {
						const params = this.getNodeParameter('Additional Parameters.parameter', i, []) as {
							name: string;
							value: string;
						}[];

						for (const param of params) {
							if (param.name && param.value !== undefined) {
								const arrayMatch = param.name.match(/^(\w+)\[\]$/);
								if (arrayMatch) {
									const key = arrayMatch[1];
									if (!qs[key]) {
										qs[key] = [];
									}
									(qs[key] as string[]).push(param.value);
									continue;
								}

								const keyPath = param.name.split(/\[|\]/).filter(Boolean);
								let target = qs;
								for (let j = 0; j < keyPath.length - 1; j++) {
									const k = keyPath[j];
									if (!(k in target)) target[k] = {};
									target = target[k] as IDataObject;
								}
								target[keyPath[keyPath.length - 1]] = param.value;
							}
						}
					}
				}
				else {
					endpoint = `${resource}.${operation}`;
					switch (operation) {
						case 'get':
						case 'delete': {
							requestMethod = 'GET';
							const id = this.getNodeParameter('id', i) as number;
							if (!id) throw new NodeOperationError(this.getNode(), 'Missing ID parameter');
							qs.id = id;
							break;
						}

						case 'list':
							requestMethod = 'GET';
							inputType = this.getNodeParameter('inputType', i) as string;
							if (inputType === 'json') {
								const jsonQuery = this.getNodeParameter('jsonQuery', i) as string;
								try {
									Object.assign(qs, JSON.parse(jsonQuery));
								} catch (err) {
									throw new NodeOperationError(this.getNode(), 'Invalid JSON query', {
										description: 'Please provide valid JSON.',
									});
								}
							} else {
								const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
								if (filters.select) {
									qs.select = filters.select;
								}
								if (filters.filter) {
									qs.filter = filters.filter;
								}
								if (filters.order) {
									qs.order = filters.order;
								}
							}
							break;

						case 'add':
						case 'update': {
							inputType = this.getNodeParameter('inputType', i) as string;
							let fields;
							if (inputType === 'json') {
								const jsonData = this.getNodeParameter('jsonData', i) as string;
								try {
									fields = JSON.parse(jsonData);
								} catch (err) {
									throw new NodeOperationError(this.getNode(), 'Invalid JSON in fields', {
										description: 'Please provide valid JSON.',
									});
								}
							} else {
								fields = this.getNodeParameter('fields', i, {}) as IDataObject;
							}

							if (!fields || Object.keys(fields).length === 0) {
								throw new NodeOperationError(this.getNode(), 'Fields cannot be empty');
							}

							body.fields = fields;
							if (operation === 'update') {
								const id = this.getNodeParameter('id', i) as number;
								if (!id) throw new NodeOperationError(this.getNode(), 'Missing ID for update');
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
				}

				const result = await bitrixApiRequest.call(this, requestMethod, endpoint, body, qs);
				const response = Array.isArray(result?.result) ? result.result : [result?.result || {}];

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(response as IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
