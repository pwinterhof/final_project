var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var md5 = require('md5');
var cookieParser = require('cookie-parser');
var port = process.env.PORT || 3000;
var express = require('express');
var app = express();
var $ = require('jquery');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var moment = require('moment');

// var request = require("request")


// Middleware///////////////////
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cookieParser());

// Database//////////////////////////////////
mongoose.connect('mongodb://localhost/stock_simulator');

// Listener//////////////////////////////////
app.listen(port);

// Models//////////////////////////////////
var User = require('./models/user.js');
var Quote = require('./models/quote.js')
var Position = require('./models/position.js')

// EXTERNAL API FUNCTION////////////////////
var getStock = function(opts, type, complete) {
	console.log("yahoo api")
  var defs = {
    desc: false,
    baseURL: 'http://query.yahooapis.com/v1/public/yql?q=',
    query: {
      quotes: 'select * from yahoo.finance.quotes where symbol in {stock} | sort(field="{sortBy}", descending="{desc}")',
      // historicaldata: 'select * from yahoo.finance.historicaldata where symbol = "{stock}" and startDate = "{startDate}" and endDate = "{endDate}"'
      },
    suffixURL: {
      quotes: '&env=store://datatables.org/alltableswithkeys&format=json',
      // &callback=? fucked it all up!!  Why does it work with jquery and not with my request.*****
      // historicaldata: '&env=store://datatables.org/alltableswithkeys&format=json&callback=?'
    }
  };

  opts = opts || {};
  if (!opts.stock) {
    complete('No stock defined');
    return;
  }

  var query = defs.query[type]
  .replace('{stock}', opts.stock)
  .replace('{sortBy}', defs.sortBy)
  .replace('{desc}', defs.desc)
  .replace('{startDate}', opts.startDate)
  .replace('{endDate}', opts.endDate)

  var url = defs.baseURL + query + (defs.suffixURL[type] || '');
  // $.ajax({
  // 	type: "GET",
  // 	url: url,
  // }).done(function(data){
  	// var err = null;
   //  if (!data || !data.query) {
   //    err = true;
   //  }
   //  complete(err, !err && data.query.results);  
  // })

	// request({
	// 	url: url,
	// 	method: "GET"
	// }, function(err, response, body){
	// })

  // 	getJSON(url, function(data) {
  //   var err = null;
  //   if (!data || !data.query) {
  //     err = true;
  //   }
  //   complete(err, !err && data.query.results);    
  // });
	// console.log(url)
  var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.onload = function() {
	  if (request.status >= 200 && request.status < 400) {
	    var data = request.responseText;
	    var data_parse = JSON.parse(data)
    	complete(data_parse);
	  } else {
	    // We reached our target server, but it returned an error
	  }
	};
	request.onerror = function() {
	  // There was a connection error of some sort
	};
	request.send();
}


// ROUTES///////////////////////////////

// User Routes/////////////////////////
// ====================================
app.post('/users', function(req, res) {
	password_md5 = md5(req.body.password)
	var user = new User({
		username: req.body.user,
		password_hash: password_md5,
		});
	user.save(function(err) {
		if(err) {
			console.log(err);
		} else {
			console.log(user + 'created')

			res.cookie("loggedinId", user.id)

			res.send({
				id: user.id,
				username: user.username,
				created_at: user.created_at
			})
		}
	});
});

app.post('/login', function(req,res){
	user_input = req.body.user
	password_input = req.body.password
	password_input_hash = md5(password_input)
	User.findOne({'username':user_input}).exec(function(err, user){
		if(user.password_hash==password_input_hash){
			res.cookie("loggedinId", user.id);
			res.send('Logged in')
		}else{
			res.statusCode = 403
			res.send('Wrong email or password. Try again')
		}
	})
})

// quote routes////////////////////////////
// =========================================
app.get('/quotes', function(req,res){
	Quote.find().sort('-created_at').exec(function(err, quotes) {
    var now = moment()
    var now_s = moment().unix()
    var recent_created_fifteen = moment(quotes[0].created_at).add(15, "minutes").unix()
    var difference = recent_created_fifteen-now_s
    console.log(recent_created_fifteen)
    console.log(now_s)
    console.log(difference)
    if(difference>0){
    	res.send(quotes[0])
    }else{
    	getStock({ stock: '("YHOO","AAPL","GOOG","MSFT","CRM","CSCO","ORCL", "PCLN", "FEYE", "PANW", "BIDU", "BABA", "AAL", "DAL", "UAL", "SAVE")'}, 'quotes', function(data) {
    		console.log("getting quotes")

    		data_array = []

    		for (var i = 0; i < data.query.results.quote.length; i++) {
    			data_array.push({
    				ticker: data.query.results.quote[i].Symbol,
    				bid: data.query.results.quote[i].Bid,
    				ask: data.query.results.quote[i].Ask, 
    			})
    		}
    		var quote = new Quote({
    			quotes:data_array
    		})

    		quote.save(function(err,quote){
    			res.send(quote)
    		})
    	});
    }
  });
});

// portfolio routes/////////////////////
// =====================================

app.post('/position', function(req, res){
	Position.findOne({
		ticker: req.body.ticker,
		user: req.cookies.loggedinId
	}, function(err, position){
		if(!position){
			var trade = new Position({
				ticker:req.body.ticker,
				share_count: req.body.shares,
				total_cost: req.body.cost,
				user: req.cookies.loggedinId
			})

			trade.save(function(err,trade){
				res.send(true)
			})
		}else{
			position.update({$inc:{share_count:req.body.shares, total_cost:req.body.cost}}, function(data){
				res.send(true)
			})
		}
	})
})

app.get('/positions', function(req, res){
	Position.find({user:req.cookies.loggedinId}).exec(function (err, positions){
		var data_array =[]
		
			Quote.find().sort('-created_at').exec(function(err, quotes_found) {
				for (var i = 0; i < positions.length; i++) {
					data_object = {
					ticker: positions[i].ticker,
					shares: positions[i].share_count,
					cost: positions[i].total_cost,
					value:((positions[i].share_count)*(quotes_found[0].quotes[getIndex(positions[i].ticker)].bid)),
					bid: (quotes_found[0].quotes[getIndex(positions[i].ticker)].bid),
					ask: (quotes_found[0].quotes[getIndex(positions[i].ticker)].ask)
					}					
					data_array.push(data_object)
					console.log(data_array)
				};
			console.log(data_array)
			res.send(data_array)
			function getIndex(input){
				for (var i = 0; i < quotes_found[0].quotes.length; i++) {
					if(quotes_found[0].quotes[i].ticker==input){
						return i
					}
				}
			}
		})
	})

	
})








