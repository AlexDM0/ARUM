'use strict';

function JobManager(agent) {
  this.agent = agent;
  this.jobs = {
    id:{},
    type:{
      open:{},
      closed:{}
    }
  };
  this.openJobs = {};
}

JobManager.prototype.add = function(id, type, time) {
  var me = this;

  // create job agent. This agent will keep track of the global job stats. Jobs per type.
  this.agent.rpc.request('jobAgentGenerator',{method:'createJob', params:{type:type}});

  // assign agent to job.
  this.agent.rpc.request('job_' +  type, {method:'add', params:{
    agentId: this.agent.id,
    time:time,
    jobId: id
  }})
    .then(function (prediction) {
      if (prediction.duration.mean != 0) {
        me.agent.timelineDataset.update({
          id: id + "_predMean",
          start: time,
          end: new Date(time).getTime() + prediction.duration.mean,
          group: me.agent.id,
          type: 'background'
        });
      }

      me.jobs.id[id].prediction = prediction;
  })

  //var assignment = new Job(id, type, timeStart);
  this.jobs.id[id] = {type: type, startTime: time, prediction: null};
  if (this.jobs.type.open[type] === undefined) {this.jobs.type.open[type] = {}}
  this.jobs.type.open[type][id] = time;
  this.openJobs[id] = {type: type};
}

JobManager.prototype.finish = function(id, type, time) {
  // finish the job.
  this.agent.rpc.request('job_' +  type, {method:'finish', params:{
    agentId: this.agent.id,
    time: time,
    jobId: id
  }});

  this.updateDataSets(id, type, time, this.jobs.id[id].prediction);
  delete this.jobs.type.open[type][id];
  delete this.openJobs[id];
  if (this.jobs.type.closed[type] === undefined) {this.jobs.type.closed[type] = {}}
  this.jobs.type.closed[type][id] = time;
}

JobManager.prototype.update = function(id, type, time, operation) {
  if (operation == 'endOfDay' || operation == 'startOfDay') {
    for (var jobId in this.openJobs) {
      if (this.openJobs.hasOwnProperty(jobId)) {
        this.agent.rpc.request('job_' +  this.openJobs[jobId].type, {method:'update', params:{
          agentId: this.agent.id,
          time: time,
          jobId: id,
          operation: operation
        }});
      }
    }
  }
  else {
    this.agent.rpc.request('job_' +  type, {method:'update', params:{
      agentId: this.agent.id,
      time: time,
      jobId: id,
      operation: operation
    }});
  }
}

JobManager.prototype.updateDataSets = function(id, type, time, prediction) {
  var updateQuery = [{id: id, end: time, content: type, type: 'range'}];
  if (prediction.duration.mean != 0) {
    var predictedEnd = prediction.duration.mean + new Date(this.jobs.id[id].startTime).getTime();
    var offsetItem = {id: id + '_result', start: null, end: null, type: 'background', group: this.agent.id};
    if (predictedEnd - time < 0) {
      offsetItem.start = predictedEnd;
      offsetItem.end = time;
      offsetItem.className = 'negative';
    }
    else {
      offsetItem.start = time;
      offsetItem.end = predictedEnd;
      offsetItem.className = 'positive';
    }
    var delay = (time - predictedEnd) / 1000;
    this.agent.delay += delay;
    updateQuery.push(offsetItem);
  }
  this.agent.timelineDataset.update(updateQuery);
  this.agent.graph2dDataset.add({x: time, y: this.agent.delay, group: this.agent.id});
}
