import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
	Icon
} from 'n8n-workflow';

export class BitrixWebhookApi implements ICredentialType {
	name = "bitrixWebhookApi";
	displayName = 'Bitrix Webhook API';
	icon: Icon = 'file:b24_cloud.svg';
	documentationUrl = 'https://apidocs.bitrix24.com/local-integrations/local-webhooks.html';
	properties: INodeProperties[] = [
		{
			displayName: 'Webhook URL',
			name: 'webhookUrl',
			type: 'string',
			default: '',
			placeholder: 'https://<YOUR-DOMAIN>.bitrix24.ru/rest/<USER_ID>/<WEBHOOK_CODE>/',
			required: true,
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.webhookUrl}}',
			url: 'profile.json',
		},
	};
}
