var eve = require('evejs');

function RAOagent(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  this.connect(eve.system.transports.getAll());

  this.state = "Idle.";
}

// extend the eve.Agent prototype
RAOagent.prototype = Object.create(eve.Agent.prototype);
RAOagent.prototype.constructor = RAOagent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
RAOagent.prototype.rpcFunctions = {};

RAOagent.prototype.rpcFunctions.workerNotification = function(params, sender) {
  var responseDelay = Math.random() * 4000 + 500;

  // set timeout to simulate delay in response.
  setTimeout(function() {
    if (params.NCdetected) {
      this.callPM();
      this.rpc.request(sender, {method:'RAOnotification', params:{RAOsays:'Calling PM.'}}).done();
    }
    else {
      this.rpc.request(sender, {method:'RAOnotification', params:{RAOsays:'Good job.'}}).done();
    }
  }.bind(this), responseDelay);

  return "OK."; // not used, here for completeness
};


RAOagent.prototype.rpcFunctions.PMnotification = function(params) {
  switch (params.PMsays){
    case "Minor NC, rework internally.":
      break;
    case "Major NC, meeting is needed.":
      break;
  }
};


RAOagent.prototype.callPM = function() {
  this.state = "Notifying PM of NC.";
  this.rpc.request("PM",{method:"NCnotification", params:{}});
};



module.exports = RAOagent;
