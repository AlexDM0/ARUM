'use strict';

if (typeof window === 'undefined') {
  var eve = require('evejs');
}

function GenericAgent(id, type) {
  // execute super constructor
  eve.Agent.call(this, id);

  this.id = id;
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  this.connect(eve.system.transports.getAll());
  this.type = type;
  this.jobs = new JobManager(this);
  this.timelineDataset = timelineItems;
  this.graph2dDataset = graph2dDataset;

  timelineGroups.add({id:id, content:id, className: 'timelineGroup'});
  graph2dGroups.add({id:id, content:id});
  this.delay = 0;
}

// extend the eve.Agent prototype
GenericAgent.prototype = Object.create(eve.Agent.prototype);
GenericAgent.prototype.constructor = GenericAgent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
GenericAgent.prototype.rpcFunctions = {};

GenericAgent.prototype.newAssignment = function(id, type, time) {
  this.jobs.add(id, type, time, this.timelineDataset);
  var addQuery = [{id:id, start:time, group:this.id, content:"started: "+ type}];

  this.timelineDataset.add(addQuery);
  this.graph2dDataset.add({x:time, y:this.delay, group: this.id});
}

/**
 * TODO: add support for pause.
 * @param id
 * @param time
 * @param type
 * @param finished
 */
GenericAgent.prototype.finishAssignment = function(id, type, time) {
  this.jobs.finish(id, type, time);
}

GenericAgent.prototype.rpcFunctions.newEvent = function(params) {
  // handle events
  if (params.operation == 'start') {
    this.newAssignment(params.id, params.assignment, params.time)
  }
  else if (params.operation == 'finish') {
    this.finishAssignment(params.id, params.assignment, params.time);
  }
  else {
    //this.updateAssignment(params.id,params.time,params.assignment);
  }
}

if (typeof window === 'undefined') {
  module.exports = GenericAgent;
}