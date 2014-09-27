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

JobManager.prototype.add = function(id, type, time, prerequisites) {
  var me = this;

  // create job agent. This agent will keep track of the global job stats. Jobs per type.
  this.agent.rpc.request('jobAgentGenerator',{method:'createJob', params:{type:type}});

  // assign agent to job.
  this.agent.rpc.request('job_' +  type, {method:'add', params:{
    agentId: this.agent.id,
    time:time,
    jobId: id,
    prerequisites: prerequisites
  }})
    .then(function (prediction) {
      if (prediction.duration.mean != 0) {
        me.agent.timelineDataset.update({
          id: id + "_predMean0",
          start: time,
          end: new Date(time).getTime() + prediction.duration.mean,
          group: me.agent.id,
          type: 'background',
          subgroup: me.agent.usedSubgroups[type]
        });
      }

      me.jobs.id[id].prediction = prediction;
  });

  this.jobs.id[id] = {
    type: type,
    startTime: time,
    prediction: null,
    predictionCounter: 0,
    elapsedTime: 0,
    elapsedTimeWithPause: 0,
    pauseCount: 0,
    delay: 0
  };
  if (this.jobs.type.open[type] === undefined) {this.jobs.type.open[type] = {}}
  this.jobs.type.open[type][id] = time;
  this.openJobs[id] = {type: type};


  var addQuery = [{id:id, start:time, content:"started: "+ type, group:this.agent.id, subgroup: this.agent.usedSubgroups[type]}];
  this.agent.timelineDataset.add(addQuery);
};

JobManager.prototype.finish = function(id, type, time) {
  var me = this;
  // finish the job.
  this.agent.rpc.request('job_' +  type, {method:'finish', params:{
    agentId: this.agent.id,
    time: time,
    jobId: id
  }})
    .then(function (reply) {
      me.jobs.id[id].elapsedTime = reply.elapsedTime;
      me.jobs.id[id].elapsedTimeWithPause = reply.elapsedTimeWithPause;
      me.updateDataSetsFinish(id, type, time, me.jobs.id[id].prediction);
    });

  delete this.jobs.type.open[type][id];
  delete this.openJobs[id];
  if (this.jobs.type.closed[type] === undefined) {this.jobs.type.closed[type] = {}}
  this.jobs.type.closed[type][id] = time;
};

JobManager.prototype.update = function(id, type, time, operation) {
  var me = this;
  var eventId = uuid();
  if (operation == 'endOfDay' || operation == 'startOfDay') {
    for (var jobId in this.openJobs) {
      if (this.openJobs.hasOwnProperty(jobId)) {
        var type = this.openJobs[jobId].type;
        this.agent.rpc.request('job_' +  type, {method:'update', params:{
          agentId: this.agent.id,
          time: time,
          jobId: jobId,
          operation: operation
        }})
          .then(function (reply) {
            me.jobs.id[reply.jobId].elapsedTime = reply.elapsedTime;
            me.jobs.id[reply.jobId].elapsedTimeWithPause = reply.elapsedTimeWithPause;
            me.updateDataSetsOperation(reply.jobId, reply.type, time, operation, eventId);
          });

      }
    }
  }
  else {
    this.agent.rpc.request('job_' +  type, {method:'update', params:{
      agentId: this.agent.id,
      time: time,
      jobId: id,
      operation: operation
    }})
      .then(function (reply) {
        me.jobs.id[id].elapsedTime = reply.elapsedTime;
        me.jobs.id[id].elapsedTimeWithPause = reply.elapsedTimeWithPause;
        me.updateDataSetsOperation(id, type, time, operation, eventId);
    });
  }
};


JobManager.prototype.updateDataSetsOperation = function(id, type, time, operation, showFlag) {
  switch (operation) {
    case 'pause':
      this.updateDataSetsPause(id, type, time, operation, this.jobs.id[id].prediction, showFlag);
      break;
    case 'endOfDay':
      this.updateDataSetsPause(id, type, time, operation, this.jobs.id[id].prediction, showFlag);
      break;
    case 'startOfDay':
      this.updateDataSetsResume(id, type, time, operation, this.jobs.id[id].prediction, showFlag);
      break;
    case 'resume':
      this.updateDataSetsResume(id, type, time, operation, this.jobs.id[id].prediction, showFlag);
      break;
  }
};

JobManager.prototype.updateDataSetsFinish = function(id, type, time, prediction) {
  var updateQuery = [];
  var field = 'duration';
  var elapsedTime = this.jobs.id[id].elapsedTime;

  // gather statistic indicator data
  if (this.jobs.id[id].pauseCount > 0) {
    field = 'durationWithPause';
    elapsedTime = this.jobs.id[id].elapsedTimeWithPause;
  }
  // generate indicator
  if (prediction[field].mean != 0) {
    var offsetItem = this.getOffsetItem(id, type, time, prediction[field], elapsedTime);
    updateQuery.push(offsetItem);
  }
  updateQuery.push({id: id, end: time, content: type, type: 'range', className: 'finished'});
  this.agent.freeSubgroup(type);
  this.agent.timelineDataset.update(updateQuery);
};

JobManager.prototype.updateDataSetsPause = function(id, type, time, operation, prediction, eventId) {
  var updateQuery = [];
  var predictedTimeLeft;
  var predictionExists = false;

  var image = '<img src="./images/control_pause.png" class="icon"/>';
  var flagId = id + "_pauseNotifier" + eventId;

  // this causes there to be only one flag for the end of day as well as a moon icon
  if (operation == 'endOfDay') {
    image = '<img src="./images/moon.png" class="icon"/>';
    flagId = id + "endOfDayNotifier" + eventId;
  }

  updateQuery.push({id: id, end: time, content: type, type: 'range'});
  updateQuery.push({
    id: flagId,
    start: time,
    content: image,
    group: this.agent.id,
    subgroup: this.agent.usedSubgroups[type],
    className: 'pause'
  });

  // never been paused before
  if (this.jobs.id[id].pauseCount == 0) {
    predictedTimeLeft = prediction.duration.mean - this.jobs.id[id].elapsedTime;
    predictionExists = prediction.duration.mean != 0;
  }
  else {
    predictedTimeLeft = prediction.durationWithPause.mean - this.jobs.id[id].elapsedTimeWithPause;
    predictionExists = prediction.durationWithPause.mean != 0;
  }
  this.jobs.id[id].pauseCount += 1;


  if (predictedTimeLeft > 0 && predictionExists == true) {
    updateQuery.push({id: id + "_predMean" + this.jobs.id[id].predictionCounter, end: time, group: this.agent.id})
  }
  if (predictedTimeLeft < 0 && predictionExists == true) {
    var offsetItem = this.getOffsetItem(id, type, time, prediction.durationWithPause, this.jobs.id[id].elapsedTimeWithPause);
    updateQuery.push(offsetItem);
  }
  this.agent.timelineDataset.update(updateQuery);
};

JobManager.prototype.updateDataSetsResume = function(id, type, time, operation, prediction, eventId) {
  var updateQuery = [];
  var image = '<img src="./images/control_play.png" class="icon"/>';
  var flagId = id + "_resumeNotifier" + eventId;

  // this causes there to be only one flag for the start of day as well as a sun icon
  if (operation == 'startOfDay') {
    image = '<img src="./images/sun.png"  class="icon"/>';
    flagId = id + "startOfDayNotifier_" + eventId;
  }

  updateQuery.push({id: id, end: time, content: type, type: 'range'});
  updateQuery.push({
    id: flagId,
    start: time,
    content: image,
    group: this.agent.id,
    subgroup: this.agent.usedSubgroups[type],
    className: 'pause'
  });

  var predictedTimeLeft = prediction.durationWithPause.mean - this.jobs.id[id].elapsedTimeWithPause;
  if (predictedTimeLeft > 0) {
    this.jobs.id[id].predictionCounter += 1;
    updateQuery.push({
      id: id + "_predMean" + this.jobs.id[id].predictionCounter,
      start: time,
      end: new Date(time).getTime() + predictedTimeLeft,
      group: this.agent.id,
      subgroup: this.agent.usedSubgroups[type],
      type: 'background'
    });
  }
  this.jobs.id[id].pauseCount += 1;
  this.agent.timelineDataset.update(updateQuery);
};

JobManager.prototype.getOffsetItem = function(id,type,time,prediction,elapsedTime) {
  if (prediction.mean != 0) {
    var predictedTimeLeft = prediction.mean - elapsedTime - this.jobs.id[id].delay;
    var offsetItem = {
      id: id + '_prediction_' + this.jobs.id[id].pauseCount,
      start: null,
      end: null,
      type: 'background',
      group: this.agent.id,
      subgroup: this.agent.usedSubgroups[type]
    };
    if (predictedTimeLeft < 0) {
      offsetItem.start = new Date(time).getTime() + predictedTimeLeft;
      offsetItem.end = time;
      offsetItem.className = 'negative';
    }
    else {
      offsetItem.start = time;
      offsetItem.end = new Date(time).getTime() + predictedTimeLeft;
      offsetItem.className = 'positive';
    }
    var delay = predictedTimeLeft;
    this.jobs.id[id].delay += delay;
    this.agent.delay += delay;
    return offsetItem;
  }
};