const apiError = (status, errorType, res) => {
	console.error(errorType);
	res.status(status).json({error: errorType, status: status});
}

module.exports = apiError;