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
          id: id + "_predMean0",
          start: time,
          end: new Date(time).getTime() + prediction.duration.mean,
          group: me.agent.id,
          type: 'background'
        });
      }

      me.jobs.id[id].prediction = prediction;
  })

  //var assignment = new Job(id, type, timeStart);
  this.jobs.id[id] = {type: type, startTime: time, prediction: null, predictionCounter: 0, elapsedTime: 0, pauseCount: 0};
  if (this.jobs.type.open[type] === undefined) {this.jobs.type.open[type] = {}}
  this.jobs.type.open[type][id] = time;
  this.openJobs[id] = {type: type};


  var addQuery = [{id:id, start:time, group:this.agent.id, content:"started: "+ type}];
  this.agent.timelineDataset.add(addQuery);
  this.agent.graph2dDataset.add({x:time, y:this.agent.delay, group: this.agent.id});
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
  var me = this;
  if (operation == 'endOfDay' || operation == 'startOfDay') {
    for (var jobId in this.openJobs) {
      if (this.openJobs.hasOwnProperty(jobId)) {
        this.agent.rpc.request('job_' +  this.openJobs[jobId].type, {method:'update', params:{
          agentId: this.agent.id,
          time: time,
          jobId: jobId,
          operation: operation
        }})
          .then(function (elapsedTime) {
            me.jobs.id[jobId].elapsedTime = elapsedTime;
            me.updateDataSetsOperation(jobId, type, time, operation);
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
      .then(function (elapsedTime) {
      me.jobs.id[id].elapsedTime = elapsedTime;
      me.updateDataSetsOperation(id, type, time, operation);
    });
  }
}


JobManager.prototype.updateDataSetsOperation = function(id, type, time, operation) {
  switch (operation) {
    case 'pause':
      this.updateDataSetsPause(id, type, time, operation, this.jobs.id[id].prediction)
      break;
    case 'endOfDay':
      this.updateDataSetsPause(id, type, time, operation, this.jobs.id[id].prediction)
      break;
    case 'startOfDay':
      this.updateDataSetsResume(id, type, time, operation, this.jobs.id[id].prediction)
      break;
    case 'resume':
      this.updateDataSetsResume(id, type, time, operation, this.jobs.id[id].prediction)
      break;
  }
}

JobManager.prototype.updateDataSets = function(id, type, time, prediction) {
  var updateQuery = [{id: id, end: time, content: type, type: 'range'}];
  var field = 'duration';

  if (this.jobs.id[id].pauseCount > 0) {
    field = 'durationWithPause';
  }

  if (prediction[field].mean != 0) {
    var offsetItem = this.getOffsetItem(id,time,prediction[field]);
    updateQuery.push(offsetItem);
  }
  this.agent.timelineDataset.update(updateQuery);
  this.agent.graph2dDataset.add({x: time, y: this.agent.delay, group: this.agent.id});
}

JobManager.prototype.updateDataSetsPause = function(id, type, time, operation, prediction) {
  var updateQuery = [];
  this.jobs.id[id].pauseCount += 1;

  updateQuery.push({id: id, end: time, content: type, type: 'range'});
  updateQuery.push({id: id + "_pauseNotifier" + uuid(), start: time, content: '<img src="./images/control_pause.png" class="icon"/>', group: this.agent.id, className: 'pause'})
  if (prediction.durationWithPause.mean != 0 && prediction.duration.mean != 0) {
    updateQuery.push({id: id + "_predMean" + this.jobs.id[id].predictionCounter, end: time, group: this.agent.id})
  }
  if (prediction.durationWithPause.mean != 0) {
    var predictedEnd = prediction.durationWithPause.mean + new Date(this.jobs.id[id].startTime).getTime();
    if (predictedEnd - time < 0) {
      var offsetItem = this.getOffsetItem(id,time,prediction.durationWithPause);
      updateQuery.push(offsetItem);
    }
  }
  this.agent.timelineDataset.update(updateQuery);
}

JobManager.prototype.updateDataSetsResume = function(id, type, time, operation, prediction) {
  var updateQuery = [];
  updateQuery.push({id: id + "_resumeNotifier_" + uuid(), start: time, content: '<img src="./images/control_play.png"  class="icon"/>', group: this.agent.id, className: 'pause'})
  var predictedEndTime = prediction.durationWithPause.mean + new Date(this.jobs.id[id].startTime).getTime();
  if (predictedEndTime > time) {
    this.jobs.id[id].predictionCounter += 1;
    updateQuery.push({
      id: id + "_predMean" + this.jobs.id[id].predictionCounter,
      start: time,
      end: predictedEndTime,
      group: this.agent.id,
      type: 'background'
    });
  }

  this.agent.timelineDataset.update(updateQuery);
}

JobManager.prototype.getOffsetItem = function(id,time,prediction) {
  if (prediction.mean != 0) {

    var predictedDuration = prediction.mean + new Date(this.jobs.id[id].startTime).getTime();
    var offsetItem = {id: id + '_prediction_' + this.jobs.id[id].pauseCount, start: null, end: null, type: 'background', group: this.agent.id};
    if (predictedDuration < time) {
      offsetItem.start = predictedDuration;
      offsetItem.end = time;
      offsetItem.className = 'negative';
    }
    else {
      offsetItem.start = time;
      offsetItem.end = predictedDuration;
      offsetItem.className = 'positive';
    }
    var delay = (predictedDuration - time) / 1000;
    this.agent.delay += delay;
    return offsetItem;
  }
}