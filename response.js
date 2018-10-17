const apiResponse = res => obj => {
	if (obj.status)
		res.status(obj.status).json(obj);
	else
		res.status(500).json({status: 500, error: 'ServerError'});
}

module.exports = apiResponse;