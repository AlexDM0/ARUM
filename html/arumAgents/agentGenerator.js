'use strict';

if (typeof window === 'undefined') {
  var eve = require('evejs');
  var GenericAgent = require('./GenericAgent')
}

function AgentGenerator(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  this.connect(eve.system.transports.getAll());

  this.agentList = {};
  this.jobList = {};
}

// extend the eve.Agent prototype
AgentGenerator.prototype = Object.create(eve.Agent.prototype);
AgentGenerator.prototype.constructor = AgentGenerator;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
AgentGenerator.prototype.rpcFunctions = {};

AgentGenerator.prototype.rpcFunctions.receiveEvent = function(params) {
  if (this.agentList[params.performedBy] === undefined) {
    this.agentList[params.performedBy] = new GenericAgent(params.performedBy, params.type);
  }
  this.rpc.request(params.performedBy, {method:"newEvent", params:params});
}

AgentGenerator.prototype.rpcFunctions.createJob = function(params) {
  var agentName = 'job_' + params.type;
  if (this.jobList[agentName] === undefined) {
    this.jobList[agentName] = new JobAgent(agentName);
  }
}


if (typeof window === 'undefined') {
  module.exports = AgentGenerator;
}