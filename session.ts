import uniq from 'lodash.uniq';

export default class Session {
	_ctx: any;
	_store: any;
	_options: any;
	_id: any;
	_req: any;
	_reply: any;

	constructor(req: any, reply: any, store, options) {
		this._req = req;
		this._reply = reply;
		this._store = store;
		this._options = options;
	}

	private getSessionId() {
		const options = this._options;
		if (this._id) {
			return this._id;
		} else if (this._req.cookies[options.key] && options.signed) {
			this._id = this._reply.unsignCookie(this._req.cookies[options.key]);
		} else if (this._req.cookies[options.key]) {
			this._id = this._req.cookies[options.key];
		} else {
			this._id = this._store.createSessionId(options.byteLength);
		}
		return this._id;
	}

	setCostumCookie(name: string, value: string, unset?: boolean) {
		const options = this._options;
		this._reply.setCookie(name, unset ? '' : value, options);
	}

	private setCookie(unset?: boolean) {
		const options = this._options;
		const session_id = this.getSessionId();
		this._reply.setCookie(options.key, unset ? '' : session_id, options);
	}

	getKey() {
		return this._store.getSessionKey(this.getSessionId());
	}

	get(fields?) {
		this.setCookie();
		const session_id = this.getSessionId();
		return this._store.get(
			session_id,
			fields ? uniq(fields.concat('id')) : null
		);
	}

	set(values, maxAge?) {
		this.setCookie();
		const session_id = this.getSessionId();
		return this._store.set(session_id, values, maxAge);
	}

	unset(fields, maxAge) {
		const session_id = this.getSessionId();
		return this._store.unset(session_id, fields, maxAge);
	}

	touch(maxAge) {
		const session_id = this.getSessionId();
		return this._store.touch(session_id, maxAge);
	}

	delete() {
		this._id = null;
		this._reply.clearCookie(this._options.key);
		const session_id = this.getSessionId();
		return this._store.delete(session_id);
	}
}
