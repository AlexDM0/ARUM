'use strict';

function JobAgent(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  this.connect(eve.system.transports.getAll());

  this.id = id;
  this.globalStats = {mean: 0, std: 0};
  this.agentStats = {};
  this.openJobs = {};
  this.closedJobs = {};
  this.closedJobsArray = [];

  this.watchers  = {};
  this.watchList = {};
}

// extend the eve.Agent prototype
JobAgent.prototype = Object.create(eve.Agent.prototype);
JobAgent.prototype.constructor = JobAgent;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
JobAgent.prototype.rpcFunctions = {};


/**
 * Create new Job for agent
 * @param params
 */
JobAgent.prototype.rpcFunctions.newJob = function(params) {
  var agentId = params.agentId;
  var instanceId = params.instanceId;
  // create stats if not yet exits
  if (this.agentStats[agentId] === undefined) {
    this.agentStats[agentId] = {mean: null, std: null};
  }

  // create open job
  if (this.openJobs[agentId] === undefined) {
    this.openJobs[agentId] = {};
  }
  if (this.openJobs[agentId][instanceId] !== undefined) {
    console.log("cannot start new job, instanceId:", instanceId, " already exists!");
    throw new Error("cannot start new job, instanceId:" + instanceId + " already exists!");
  }
  this.openJobs[agentId][params.instanceId] = new Job(instanceId, this.id, params.time);

  // return prediction
  if (this.agentStats[agentId].mean == null) {
    return this.globalStats;
  }
  else {
    return this.agentStats[agentId];
  }
};

JobAgent.prototype.rpcFunctions.finish = function(params) {
  var agentId = params.agentId;
  var instanceId = params.instanceId;
  // finish job
  this.openJobs[agentId][instanceId].finish(params.time);
  // move from open to closed jobs.
  if (this.closedJobs[agentId] === undefined) {
    this.closedJobs[agentId] = {};
  }
  if (this.closedJobs[agentId][instanceId] !== undefined) {
    console.log("cannot close job, instanceId:", instanceId, " already exists!");
    throw new Error("cannot close job, instanceId:" + instanceId + " already exists!");
  }
  this.closedJobs[agentId][instanceId] = this.openJobs[agentId][instanceId];

  // the array can be used to implement a running average.
  this.closedJobsArray.push(this.openJobs[agentId][instanceId]);
  delete this.openJobs[agentId][instanceId];

  this.updateStats();
};



JobAgent.prototype.rpcFunctions.getAgentStats = function(params) {
  return this.agentStats[params.agentId];
}

JobAgent.prototype.rpcFunctions.getGlobalStats = function(params) {
  return this.globalStats;
}

JobAgent.prototype.rpcFunctions.addWatcher = function(params) {
  this.watchers
}

JobAgent.prototype.rpcFunctions.addWatch = function(params) {
  this.watchList
}

JobAgent.prototype.updateStats = function() {
  var mean = 0;
  var std = 0;
  var count = 0;
  for (var agentId in this.closedJobs) {
    if (this.closedJobs.hasOwnProperty(agentId)) {
      var collection = this.closedJobs[agentId];
      // could be optimised with rolling average for efficient memory management
      this.agentStats[agentId] = this.updateStatsIn(collection);
      mean += this.agentStats[agentId].mean;
      std += Math.pow(this.agentStats[agentId].std,2);
      count += 1;
    }
  }
  this.globalStats.mean = mean / count;
  this.globalStats.std = Math.sqrt(std / count);
};

JobAgent.prototype.updateStatsIn = function(collection) {
  var totalDuration = 0;
  var mean = 0;
  var std = 0;
  var count = 0;

  for (var assignmentId in collection) {
    if (collection.hasOwnProperty(assignmentId)) {
      totalDuration += collection[assignmentId].duration;
      count += 1;
    }
  }
  if (count > 0) {
    mean = totalDuration / count;
    for (var assignmentId in collection) {
      if (collection.hasOwnProperty(assignmentId)) {
        std += Math.pow(collection[assignmentId].duration - mean,2);
      }
    }

    std = Math.sqrt(std/count);
    return {mean: mean, std: std};
  }
  else {
    return {mean: 0, std: 0};
  }
}
