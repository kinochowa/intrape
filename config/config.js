module.exports = {
	development: {
		host: 'localhost',
    	database: 'intrape',
    	username: 'root',
    	password: '',
    	dialect: "mysql",
    	operatorsAliases: false
	},
    test: {
        host: 'localhost',
        database: 'intrape',
        username: 'root',
        password: '',
        dialect: "mysql",
        operatorsAliases: false
    },
  	production: {
    	host: 'localhost',
    	database: 'prod_api',
    	username: 'prod_api',
    	password: 'Alain$01',
    	dialect: "mysql",
    	operatorsAliases: false
  	},
    autologin: 'https://intra.epitech.eu/auth-d56c4e3e406704652a370bdacb516d306be39e70'
};