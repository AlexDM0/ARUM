'use strict';

if (typeof window === 'undefined') {
  var eve = require('evejs');
  var GenericAgent = require('./GenericAgent')
}

function EventGenerator(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  this.connect(eve.system.transports.getAll());

  this.workers = ['Bill','Hank','John','Mary','Feifei'];
}

// extend the eve.Agent prototype
EventGenerator.prototype = Object.create(eve.Agent.prototype);
EventGenerator.prototype.constructor = AgentGenerator;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
EventGenerator.prototype.rpcFunctions = {};

EventGenerator.prototype.rpcFunctions.receiveEvent = function(params) {
  if (this.agentList[params.agentId] === undefined) {
    this.agentList[params.agentId] = new GenericAgent(params.agentId, params.type);
  }
  this.rpc.request(params.agentId, {method:"newEvent", params:params});
}

EventGenerator.prototype.start = function() {
  this.makeMachineEvent();
}

EventGenerator.prototype.makeMachineEvent = function () {
  this.eventID = (Math.random()*1e15).toString(32);
  var event = {
    time: new Date(),
    performedBy: this.workers[0],
    type: 'worker',
    assignment: 'makeMachine',
    operation: 'start',
    jobId: this.eventID,
    producitId: 1
  };
  this.rpc.request("agentGenerator",{method:'receiveEvent',params:event})
  setTimeout(this.pauseMachineEvent.bind(this), Math.random() * 2000 + 500);
}

EventGenerator.prototype.pauseMachineEvent = function () {
  var event = {
    time: new Date(),
    performedBy: this.workers[0],
    type: 'worker',
    assignment: 'makeMachine',
    operation: 'pause',
    jobId: this.eventID,
    producitId: 1
  };

  this.rpc.request("agentGenerator",{method:'receiveEvent',params:event})
  setTimeout(this.resumeMachineEvent.bind(this), Math.random() * 1000 + 500);
}

EventGenerator.prototype.resumeMachineEvent = function () {
  var event = {
    time: new Date(),
    performedBy: this.workers[0],
    type: 'worker',
    assignment: 'makeMachine',
    operation: 'resume',
    jobId: this.eventID,
    producitId: 1
  };

  this.rpc.request("agentGenerator",{method:'receiveEvent',params:event})
  setTimeout(this.finishMachineEvent.bind(this), Math.random() * 1000 + 500);
}

EventGenerator.prototype.finishMachineEvent = function () {
  var event = {
    time: new Date(),
    performedBy: this.workers[0],
    type: 'worker',
    assignment: 'makeMachine',
    operation: 'finish',
    jobId: this.eventID,
    producitId: 1
  };

  this.rpc.request("agentGenerator",{method:'receiveEvent',params:event})
  setTimeout(this.start.bind(this), Math.random() * 1000 + 1000);
}


if (typeof window === 'undefined') {
  module.exports = AgentGenerator;
}