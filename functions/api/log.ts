import * as res from '../utils/response';
import flatry from 'flatry';

interface RequestBody {
	host: string;
	path: string;
	content: string;
}

interface Env {
  LOGGER_KV: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env: { LOGGER_KV } }) => {
	const [err1, { host, path, content }] = await flatry(request.json<RequestBody>());
	if (err1) return res.json({ error: 'Invalid request', errorDetail: (err1 as Error).stack }, { status: 400 });

	const prefix = `${host}/${path}`;
	const ts = Date.now();
	const key = `${prefix}#${ts}`;
	const [err2] = await flatry(LOGGER_KV.put(key, content));

	return res.json({ status: 'saved', ts });
};
