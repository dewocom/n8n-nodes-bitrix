import {
	ICredentialType,
	INodeProperties,
	Icon
} from 'n8n-workflow';
export class BitrixOAuth2Api implements ICredentialType {
	name = "bitrixOAuth2Api";
	displayName = 'Bitrix OAuth2 API';
	icon: Icon = 'file:b24_cloud.svg';
	extends = ['oAuth2Api'];
	documentationUrl = 'https://apidocs.bitrix24.com/api-reference/oauth/';
	properties: INodeProperties[] = [
		{
			displayName: 'Portal Domain',
			name: 'domain',
			type: 'string',
			default: '',
			placeholder: 'your-domain.bitrix24.ru',
			description: 'Full domain of your Bitrix24 portal. For example: b24-portal.bitrix24.ru, .kz, .by, .com, etc.',
			required: true,
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: '=https://{{$self["domain"]}}/oauth/authorize/',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://oauth.bitrix.info/oauth/token/',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			placeholder: 'local.**************.********',
			description: 'ID integration from your Bitrix account.',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '**************************************************',
			description: 'Secret key from your integration in your bitrix account',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: 'grant_type=authorization_code',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		}
	];
}
