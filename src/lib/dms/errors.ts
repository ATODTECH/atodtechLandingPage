/** An error whose message is safe to show to the user. */
export class DmsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DmsError";
	}
}

export class ForbiddenError extends DmsError {
	constructor(message = "You don't have permission to do that.") {
		super(message);
		this.name = "ForbiddenError";
	}
}
