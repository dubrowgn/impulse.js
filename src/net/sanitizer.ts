export class Sanitizer {
	// use to sanitize user content before attaching
	// to the HTML DOM to prevent XSS attacks
	static sanitizeForDom(str: string): string {
		return str.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#x27;")
			.replace(/\//g, "&#x2F;");
	}
};
