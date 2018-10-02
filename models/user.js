'use strict';

module.exports = (sequelize, DataTypes) => {
	var User = sequelize.define('User', {
		login: DataTypes.STRING
	});

	return User;
};