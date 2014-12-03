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
  this.eventCounter = 0;
  this.events = [
  {
    "jobId": "0",
    "time": "2014-09-16T08:00:00.000+02:00",
    "performedBy": "Emily",
    "type": "nurse",
    "assignment": "Go to briefing",
    "operation": "start"
  }
  ]





}

// extend the eve.Agent prototype
EventGenerator.prototype = Object.create(eve.Agent.prototype);
EventGenerator.prototype.constructor = EventGenerator;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
EventGenerator.prototype.rpcFunctions = {};

EventGenerator.prototype.rpcFunctions.loadEvents = function() {
  return this.events.length - 1;
}

EventGenerator.prototype.rpcFunctions.nextEvent = function() {
  this.rpc.request("agentGenerator",{method:'receiveEvent', params:this.events[this.eventCounter]}).done();
  this.eventCounter += 1;
}

if (typeof window === 'undefined') {
  module.exports = EventGenerator;
}