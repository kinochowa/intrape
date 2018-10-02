'use strict';

module.exports = (sequelize, DataTypes) => {
	var House = sequelize.define('House', {
		name: DataTypes.STRING
	});

	return House;
};