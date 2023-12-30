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

const invertTs = (ts: number) => 10000000000 - ts;

export const onRequestPost: PagesFunction<Env> = async ({ request, env: { LOGGER_KV } }) => {
	const [err1, { host, path, content }] = await flatry(request.json<RequestBody>());
	if (err1) return res.json({ error: 'Invalid request', errorDetail: (err1 as Error).stack }, { status: 400 });

	const prefix = `${host}/${path}`;
	const [err2, existing] = await flatry(LOGGER_KV.list({ prefix, limit: 1 }));
	if (err2) return res.json({ error: 'KV request failed', errorDetail: (err2 as Error).stack }, { status: 500 });
	if (existing.keys.length > 0) {
		const previousKey = existing.keys[0].name;
		const [err3, previousContent] = await flatry(LOGGER_KV.get(previousKey));
		if (err3) return res.json({ error: 'KV request failed', errorDetail: (err3 as Error).stack }, { status: 500 });
		if (previousContent === content) {
			const ts = invertTs(Number(previousKey.split('#').pop()));
			return res.json({ status: 'exists', ts });
		}
	}

	const ts = Math.floor(Date.now() / 1000);
	const key = `${prefix}#${invertTs(ts)}`;
	const [err3] = await flatry(LOGGER_KV.put(key, content));
	if (err3) return res.json({ error: 'KV request failed', errorDetail: (err3 as Error).stack }, { status: 500 });

	return res.json({ status: 'saved', ts });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env: { LOGGER_KV } }) => {
	const requestUrl = new URL(request.url);
	const host = requestUrl.searchParams.get('host');
	const path = requestUrl.searchParams.get('path');

	let prefix = host ? `${host}/` : '';
	if (host && path) prefix += path;

	let cursor: string | undefined;
	const keys = [] as string[];
	while (true) {
		const [err1, result] = await flatry(LOGGER_KV.list({ prefix, cursor }));
		if (err1) return res.json({ error: 'KV request failed', errorDetail: (err1 as Error).stack }, { status: 500 });
		
		result.keys.forEach(({ name }) => keys.push(name));

		if (result.list_complete) break;
		cursor = result.cursor;
	}

	return res.json({ keys });
};