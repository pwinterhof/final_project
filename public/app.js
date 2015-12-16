// VIEW DASHBOARD///////////////////////
// =====================================
var viewDashboard = function(){
  $('#display-container').empty()
  $('#log-in-btn').hide()
  $('#sign-up-btn').hide()
  $('#make-trade').show()
  $('#view-portfolio').hide()
  $('#log-out-btn').show()
  $('#view-leaders').show()
  getQuotes()
}

// GET QUOTES//////////////////////////////
// ========================================
// getQuotes- sends get request
var getQuotes = function(){
  $.get('/quotes').done(function(data){
    console.log(data)
    renderQuotes(data)
  });
}

// Renders server response to page
var renderQuotes= function(input){
  $('#quotes-container').empty()
  $('#quotes-container-two').empty()
  var source =$('#quotes-template').html()
  var template = Handlebars.compile(source);
  for (var i = 0; i < 25; i++) {
    $('#quotes-container').append(template(input.quotes[i]))
  };
  for (var i = 25; i < 50; i++) {
    $('#quotes-container-two').append(template(input.quotes[i]))
  };
  initializeClock()
// Constantly returns the minutes and seconds left until 15 minutes after the most recently created quote entry.
function convertTimeRemaining(){
  var now = moment().unix()
  var created_plus_five = moment(input.created_at).add(5, "minutes").unix()
  var t = created_plus_five-now
  var seconds = Math.floor(t % 60 );
  var minutes = Math.floor( (t/60) % 60 );
  var hours = Math.floor( (t/(60*60)) % 24 );
  var days = Math.floor( t/(60*60*24) );
  return {
    'total': t,
    'minutes': ("0" + minutes).slice(-2),
    'seconds': ("0" + seconds).slice(-2)
  };
}
// Displays time left, alerts user, and then initiates get request to server when -1 seconds left (1 second after 15 minutes after most recent created)
function initializeClock(){
  var clock = $('#clock');
  var timeinterval = setInterval(function(){
    var t = convertTimeRemaining();
    clock.html(t.minutes + ':' + t.seconds)
    if(t.total<=(0)){
      alert("Quotes need to be refreshed")
      viewDashboard()
      clearInterval(timeinterval);
    }
  },1000);
}

getPortfolio()
getUser()
}
// GET PORTFOLIO/////////////////////////////
// ==========================================

var getPortfolio = function(){
  $.get('/positions').done(function(data){
    console.log(data)
    renderPortfolio(data)
  })
}

var renderPortfolio = function(data){
  $('#display-container').empty()
  $('#view-leaders').show()
  $('#view-portfolio').hide()
  $('#make-trade').show()
  var container_source = $('#portfolio-template').html()
  var container_template =Handlebars.compile(container_source)
  $('#display-container').append(container_template)
  var source = $('#portfolio-positions-template').html()
  var template = Handlebars.compile(source);
  for (var i = 0; i <data.length; i++) {
    $('#portfolio-display-container').append(template(data[i]))
  };
}

// LOGIN RENDER AND CREATE FUNCTIONS/////////
// ==========================================
var renderLoginForm = function(){
  $('#log-in-btn').hide()
  $('#sign-up-btn').show()
  $('#create-recipe').hide()
  $('#view-recipes').hide()
  $('#display-container').empty()
  $('#portfolio-container').hide()
  $('#view-portfolio').hide()
  $('#portfolio-container').hide()
  console.log("rendering")
  var source = $('#login-template').html();
  var template = Handlebars.compile( source );
  var loginHtml = template()
  $('#display-container').append(loginHtml)

}

var createLogin = function(){
  var userInput = $("input[name='username']").val()
  var passwordInput = $("input[name='password']").val()
  var user = {
    user: userInput,
    password: passwordInput,
  }
  $.post('/login', user).done(function(data){
    console.log("server response", data)
    alert(data)
    viewDashboard()
  })
}

var logoutUser = function() {
  $.get('/logout').done(function(data){
    if(data){
      alert("Thank you for playing CAGR-Kings")
    }
  })
  window.location = '/';
};

// SIGN UP RENDER AND CREATE FUNCTIONS//////////
// =============================================
var renderSignupForm = function(){
  $('#sign-up-btn').hide()
  $('#log-in-btn').show()
  $('#create-recipe').hide()
  $('#view-recipes').hide()
  $('#back-to-dashboard').hide()
  $('#view-portfolio').hide()
  $('#display-container').empty()
  var source = $('#signup-template').html();
  var template = Handlebars.compile( source );
  var signupHtml = template()
  $('#display-container').append(signupHtml)
};

var createUser = function(){
  var userInput = $("input[name='username']").val()
  var passwordInput = $("input[name='password']").val()
  var user = {
    user: userInput,
    password: passwordInput,
  }
  $.post('/users', user).done(function(data){
    console.log("server response", data)
    viewDashboard()    
  }) 
};

// TRADING//////////////////////////////////
// =========================================

var renderTradeTemplate = function(){
  $('#view-portfolio').show()
  $('#view-leaders').show()
  $('#make-trade').hide()
  $('#display-container').empty()
  $('#portfolio-container').hide()
  $.get('/quotes').done(function(data){
    console.log(data)
    var source = $('#quotes-trade-template').html()
    var template = Handlebars.compile(source)
    $('#display-container').append(template())
    for (var i = 0; i < data.quotes.length; i++) {
      $("#select-ticker").append("<option value='"+i+"'>"+data.quotes[i].ticker+"</option>")
    };

    $('#buy-btn').on('click', function(){
      var select_index = $('#select-ticker').val()
      renderBuyTemplate(data.quotes[select_index])
    })
    $('#sell-btn').on('click', function(){
      var select_index = $('#select-ticker').val()
      renderSellTemplate(data.quotes[select_index])
    })
  });
}

var renderBuyTemplate = function(input){
  $('#view-portfolio').show()
  $('#display-container').empty()
  $('#portfolio-container').hide()
  var source = $('#quotes-buy-template').html()
  var template = Handlebars.compile(source)
  $('#display-container').append(template(input))
  $('#submit-buy').on('click', function(){
    var buy_shares = $('#shares-buy').val()
    var price = input.ask
    createPosition(input, price, buy_shares)
  })
}

var renderSellTemplate = function(input){
  $('#view-portfolio').show()
  $('#display-container').empty()
  $('#portfolio-container').hide()
  var source = $('#quotes-sell-template').html()
  var template = Handlebars.compile(source)
  $('#display-container').append(template(input))
  $('#submit-sell').on('click', function(){
    var sell_shares = ($('#shares-sell').val())*(-1)
    var price = input.bid
    createPosition(input, price, sell_shares)
  })
}

var createPosition = function (quote, price, shares){
  var trade = {
    ticker: quote.ticker,
    shares: shares,
    cost: (shares)*(price)
  }
  $.ajax({
    url: '/position',
    method: 'POST',
    dataType: 'json',
    data: trade
  }).done(function(data){
    alert("TRADE CONFIRMED")
    viewDashboard()
  })
}

// USER METRICS////////////////////////
// ====================================
var getUser = function(){
  $('#user-container').empty()
  $.get('/user').done(function(data){
    var source = $('#user-performance-template').html()
    var template = Handlebars.compile(source)
    $('#user-container').append(template(data))
  })
}

// LEADERBOARD/////////////////////////
// ====================================

var getLeaders = function(){
  $.get('/leaders').done(function(data){
    console.log(data)
    renderLeaders(data)
  })
}

var renderLeaders = function(input){
  $('#view-leaders').hide()
  $('#view-portfolio').show()
  $('#make-trade').show()
  $('#display-container').empty()
  var container_source = $('#leaderboard-template').html()
  var container_template = Handlebars.compile(container_source)
  $('#display-container').append(container_template)
  var source = $('#leaderboard-positions-template').html()
  var template = Handlebars.compile(source)
  for (var i = 0; i <input.length; i++) {
    console.log("appending")
    $('#leaderboard-display-container').append(template(input[i]))
  };
}

// LISTENERS///////////////////////////
// ====================================
// sign up button
$('#sign-up-btn').on('click', renderSignupForm);
// log in button
$('#log-in-btn').on('click', renderLoginForm)

$('body').on('click', '#log-out-btn', logoutUser);

$('body').on('click', '#sign-up-submit', createUser);

$('body').on('click', '#log-in-submit', createLogin);

$('body').on('click', '#make-trade', renderTradeTemplate);

$('body').on('click', '#view-portfolio', getPortfolio);

$('body').on('click', '#view-leaders', getLeaders);

// CHECK LOGIN COOKIE/////////////////
// ===================================
if(document.cookie){
  viewDashboard()
}else{
  console.log("sign up")
  renderSignupForm()
}

