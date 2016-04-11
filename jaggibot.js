// Requires things
require('dotenv').config({silent:true});

var Botkit = require('botkit');
var pg = require('pg');
var http = require('http');

// Create controller spawn process
var controller = Botkit.slackbot();
var bot = controller.spawn({
  token: process.env.SLACK_BOT_KEY
});

bot.startRTM(function(err) {
  if (err) {
    throw new Error("Could not connect to Slack", err)
  }
});

// Define unconnected redshift client
var client = new pg.Client({
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_USER,
	host: process.env.DB_URL,
	port: process.env.DB_PORT
});

// Queries
rec_users = "select name, email, is_api, count(id) from success.api_ri_recommendations where DATE(received_at) = DATE 'yesterday' and email !~ '@cloudability.com' group by 1,2,3 order by 1;";
rec_api_users = "select name, email, is_api, count(id) from success.api_ri_recommendations where DATE(received_at) = DATE 'yesterday' and email !~ '@cloudability.com' group by 1,2,3 order by 1;";


// Sample Slack Response
// controller.hears(["keyword","^pattern$"],["direct_message","direct_mention","mention","ambient"],function(bot, message) {
//   bot.reply(message,'You used a keyword');
// });

controller.hears(["yesterday","^pattern$"],["direct_message","direct_mention","mention","ambient"],function(bot, message) {
	client.connect();
	client.on('drain', client.end.bind(client)); //disconnect client when all queries are finished
	client.on('error', function(err) {
      console.log('No postgres for you!', err);
    });
	var query = client.query(rec_users, function(err, result) {
		bot.reply(message, result.rows.length + ' unique users of the RI planner yesterday');
	});
});

//If Heroku doesn't bind to a port then it dies
http.createServer(function(req, res) { 
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write("hi");
	res.end();
}).listen(process.env.PORT || 5000);