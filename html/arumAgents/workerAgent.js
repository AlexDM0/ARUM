var eve = require('evejs');

function WorkerAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  this.connect(eve.system.transports.getAll());

  this.state = "Idle.";
}

// extend the eve.Agent prototype
WorkerAgent.prototype = Object.create(eve.Agent.prototype);
WorkerAgent.prototype.constructor = WorkerAgent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
WorkerAgent.prototype.rpcFunctions = {};

WorkerAgent.prototype.rpcFunctions.jobNotification = function(params) {
  switch (params.status) {
    case "start": // remco
      this.handleJob(params);
      break;
    case "finished":
      this.gatherStatistics(params);
      this.callRAO(params);
      break;
  }
  return "OK."; // not used, here for completeness
};


WorkerAgent.prototype.rpcFunctions.gatherStatistics = function(params) {

};

WorkerAgent.prototype.rpcFunctions.RAOnotification = function(params) {
  switch (params.RAOsays) {
    case "Good job.":
      this.state = "Idle.";
      break;
    case "Calling PM.":
      this.state = "Waiting on judgement from PM.";
      break;
  }
};

WorkerAgent.prototype.handleJob = function() { // remco
  this.state = "Doing job.";
};

WorkerAgent.prototype.callRAO = function(params) {
  var NCdetected = Math.random() < 0.3 || params.NCdetected;
  if (NCdetected == true) {this.state = "Waiting on RAO what to do with NC.";}
  else                    {this.state = "Job is complete, waiting on RAO.";}

  this.rpc.request("RAO",{method:"workerNotification", params:{NC:NCdetected}}).done();
};



module.exports = WorkerAgent;
