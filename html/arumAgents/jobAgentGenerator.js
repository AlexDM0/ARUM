'use strict';

function JobAgentGenerator(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  this.connect(eve.system.transports.getAll());
}

// extend the eve.Agent prototype
JobAgentGenerator.prototype = Object.create(eve.Agent.prototype);
JobAgentGenerator.prototype.constructor = AgentGenerator;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
JobAgentGenerator.prototype.rpcFunctions = {};


JobAgentGenerator.prototype.rpcFunctions.createJob = function(params) {
  var jobAgentName = 'job_' + params.type;
  if (jobList[jobAgentName] === undefined) {
    jobList[jobAgentName] = new JobAgent(jobAgentName);
  }
}

JobAgentGenerator.prototype.rpcFunctions.returnJobAddress = function(params) {
  var instanceId = params.instanceId;
  var hasJob = false;
  for (var jobAgentName in jobList) {
    if (jobList.hasOwnProperty(jobAgentName)) {
      hasJob = jobList[jobAgentName].hasJob(instanceId);
      if (hasJob == true) {
        return jobAgentName;
        break;
      }
    }
  }
  return "doesNotExist";
}

JobAgentGenerator.prototype.getAllJobNames = function() {
  var list = [];
  for (var jobAgentName in jobList) {
    if (jobList.hasOwnProperty(jobAgentName)) {
      list.push(jobAgentName);
    }
  }
  return list;
}
