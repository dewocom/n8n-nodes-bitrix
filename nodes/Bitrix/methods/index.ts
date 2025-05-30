import { IDataObject, ILoadOptionsFunctions, INodePropertyOptions, NodeOperationError } from 'n8n-workflow';
import { bitrixApiRequest } from '../GenericFunctions';

interface BXField {
	type?: string;
	isRequired?: boolean;
	isReadOnly?: boolean;
	isImmutable?: boolean;
	isMultiple?: boolean;
	isDynamic?: boolean;
	title?: string;
}

export async function getEntityFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const resource = this.getNodeParameter('resource', 0) as string;
	const endpoint = `${resource}.fields`;
	let body: IDataObject = {};

	try {
		if (resource === 'crm.item') {
			const entityTypeId = this.getNodeParameter('entityTypeId', 0) as string;

			if (!entityTypeId) {
				throw new NodeOperationError(
					this.getNode(),
					'Entity Type ID is required for crm.item',
					{ description: 'Please select entity type first' }
				);
			}

			body.entityTypeId = entityTypeId;
			body.useOriginalUfNames = this.getNodeParameter('useOriginalUfNames', false) as boolean ? 'Y' : 'N';
		}

		const responseData = await bitrixApiRequest.call(this, 'POST', endpoint, body);
		if (!responseData?.result || typeof responseData.result !== 'object') {
			throw new NodeOperationError(this.getNode(), 'No valid fields data returned');
		}

		const fieldsData = resource === 'crm.item'
			? responseData.result?.fields || {}
			: responseData.result;

		if (!Object.keys(fieldsData).length) {
			throw new NodeOperationError(this.getNode(), 'No fields available for selected entity');
		}

		return Object.entries(fieldsData as Record<string, BXField>).map(([fieldName, field]) => {
			const fieldType = field.type || 'string';

			const displayName = field?.title && field.title !== fieldName
				? `${field.title} (${fieldName})`
				: fieldName;

			const descriptionParts = [
				`Type: ${fieldType}`,
				...(field.isRequired ? ['Required'] : []),
				...(field.isReadOnly ? ['Read-only'] : []),
				...(field.isDynamic ? ['Dynamic'] : []),
				...(field.isMultiple ? ['Multiple'] : [])
			];

			return {
				name: displayName,
				value: fieldName,
				description: descriptionParts.join(' | '),
				action: field.type
			};
		});

	} catch (error) {
		throw new Error(`Bitrix24 Error: ${error.message}`);
	}
};

export async function getEntityTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	return [
		// System type
		{ name: 'Lead', value: '1' },
		{ name: 'Deal', value: '2' },
		{ name: 'Contact', value: '3' },
		{ name: 'Company', value: '4' },
		{ name: 'Invoice', value: '31' },
		{ name: 'Quote', value: '32' },

		// User-defined type
		...(await getCustomEntityTypes.call(this))
	];
};

async function getCustomEntityTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
		const types = await bitrixApiRequest.call(
			this,
			'GET',
			'crm.type.list'
		);
		return types.result.map((type: any) => ({
			name: type.NAME,
			value: type.ENTITY_TYPE_ID
		}));
	} catch (error) {
		return [];
	}
};
