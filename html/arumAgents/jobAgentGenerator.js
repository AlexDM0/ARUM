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
  var jobAgentName = params.type;
  if (jobList[jobAgentName] === undefined) {
    jobList[jobAgentName] = new JobAgent(jobAgentName);

    graph2dGroups.add([
      {
        id: jobAgentName+'_pred_duration',
        content: "prediction",
        className: 'prediction'
      },
      {
        id: jobAgentName+'_pred_durationWithPause',
        content: "predWithPause",
        className: 'prediction'
      },
      {
        id: jobAgentName+'_pred_durationWithStartup',
        content: "predWithStartup",
        className: 'prediction'
      },
      {
        id: jobAgentName+'_pred_durationWithBoth',
        content: "predWithBoth",
        className: 'prediction'
      },
      {
        id: jobAgentName+'_duration',
        content: "duration",
        className: 'duration'
      },
      {
        id: jobAgentName+'_durationWithPause',
        content: "durationWithPause",
        className: 'duration'
      },
      {
        id: jobAgentName+'_durationWithStartup',
        content: "durationWithStartup",
        className: 'duration'
      },
      {
        id: jobAgentName+'_durationWithBoth',
        content: "durationWithBoth",
        className: 'duration'
      }
    ]);
    var visibilityUpdate = {};
    //visibilityUpdate[jobAgentName+'_pred'] = false;
    //visibilityUpdate[jobAgentName+'_predWithPause'] = false;
    //visibilityUpdate[jobAgentName+'_predWithStartup'] = false;
    //visibilityUpdate[jobAgentName+'_predWithBoth'] = false;
    //visibilityUpdate[jobAgentName+'_duration'] = false;
    //visibilityUpdate[jobAgentName+'_durationWithPause'] = false;
    //visibilityUpdate[jobAgentName+'_durationWithStartup'] = false;
    //visibilityUpdate[jobAgentName+'_durationWithBoth'] = false;
    graph2d.setOptions({groups:{visible:visibilityUpdate}});
    refreshJobs();
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
