const MAX_AGE = '86400';

const getOriginHeader = (request: Request) => {
	const origin = request.headers.get('Origin');
	if (origin) {
		const url = new URL(origin);
		if (url.hostname.endsWith('.twinery.org')) {
			return url.origin;
		}
	}
	return 'https://twinery.org';
}

// Respond to OPTIONS method
export const onRequestOptions: PagesFunction = async ({ request }) => {

	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': getOriginHeader(request),
			'Access-Control-Allow-Headers': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Max-Age': MAX_AGE,
			'Vary': 'Origin',
		},
	});
};

// Set CORS to all /api responses
export const onRequest: PagesFunction = async ({ request, next }) => {
	const response = await next();
	response.headers.set('Access-Control-Allow-Origin', getOriginHeader(request));
	response.headers.set('Access-Control-Max-Age', MAX_AGE);
	response.headers.set('Vary', 'Origin');
	return response;
};
