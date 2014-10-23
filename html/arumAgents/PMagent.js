var eve = require('evejs');

function PMagent(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  this.connect(eve.system.transports.getAll());

  this.state = "Idle.";
}

// extend the eve.Agent prototype
PMagent.prototype = Object.create(eve.Agent.prototype);
PMagent.prototype.constructor = PMagent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
PMagent.prototype.rpcFunctions = {};

PMagent.prototype.rpcFunctions.RAOnotification = function(params, sender) {
  var isMajorNC = Math.random() < 0.2;
  var responseDelay = Math.random() * 4000 + 500;

  // set timeout to simulate delay in response.
  setTimeout(function() {
    if (isMajorNC) {
      this.rpc.request(sender, {method:"PMnotification", params:{PMsays:"Minor NC, rework internally."}}).done();
    }
    else {
      this.rpc.request(sender, {method:"PMnotification", params:{PMsays:"Major NC, meeting is needed."}}).done();
      this.planMeeting();
    }
  }.bind(this), responseDelay);

  return "OK."; // not used, here for completeness
};

PMagent.prototype.planMeeting = function() {

};


module.exports = PMagent;
