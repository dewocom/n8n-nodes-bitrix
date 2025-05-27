import {
	IExecuteFunctions, INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import * as loadOptions from './methods';
import { operations, fields } from './Description';
import { customMethodOperations } from './CustomMethodDescription';
import { router } from './actions/router';

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
		return router.call(this)
	}
}
