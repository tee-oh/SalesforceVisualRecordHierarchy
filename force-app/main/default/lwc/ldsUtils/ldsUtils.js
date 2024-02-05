/**
 * Reduces one or more LDS errors into a string[] of error messages.
 * @param {FetchResponse|FetchResponse[]} errors
 * @return {String[]} Error messages
 * Error Handling Best Practices for LWC: https://developer.salesforce.com/blogs/2020/08/error-handling-best-practices-for-lightning-web-components
 * LWC Recipes Github: https://github.com/rahulmalhotra/lwc-recipes/blob/cb42cb1301c58906abe06c7f2b6fb9793e3ba3fe/force-app/main/default/lwc/ldsUtils/ldsUtils.js
 */
export function reduceErrors(errors) {
	if (!Array.isArray(errors)) {
		errors = [errors];
	}

	return (
		errors
			// Remove null/undefined items
			.filter((error) => !!error)
			// Extract an error message
			.map((error) => {
				// UI API read operation error returns an array of objects.
				if (Array.isArray(error.body)) {
					return error.body.map((e) => e.message);
				}
				// UI API write operations, Apex read and write operations, and network errors return a single object.
				else if (error.body && Array.isArray(error.body.message)) {
					return error.body.message.map((e) => {
						if (e.message) {
							return e.message;
						} else if (
							e.pageErrors &&
							Array.isArray(e.pageErrors)
						) {
							return e.pageErrors
								.map((pageError) => pageError.message)
								.join(' ');
						}
						return '';
					});
				} else if (
					error.body &&
					typeof error.body.message === 'string'
				) {
					return error.body.message;
				}
				// JS errors
				else if (typeof error.message === 'string') {
					return error.message;
				}
				// Unknown error shape so try HTTP status text
				return error.statusText;
			})
			// Flatten
			.reduce((prev, curr) => prev.concat(curr), [])
			// Remove empty strings
			.filter((message) => !!message)
	);
}