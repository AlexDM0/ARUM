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
  this.agent.rpc.request(type, {method:'add', params:{
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
          subgroup: me.agent.usedSubgroups[type],
          className: 'prediction'
        });
      }

      me.jobs.id[id].prediction = prediction;
      //graph2dDataset.push({x: time, y: prediction.duration.mean/3600000 ,group: type + '_pred_duration', type: type});
      //graph2dDataset.push({x: time, y: prediction.durationWithPause.mean/3600000 ,group: type + '_pred_durationWithPause', type: type});
      //graph2dDataset.push({x: time, y: prediction.durationWithStartup.mean/3600000 ,group: type + '_pred_durationWithStartup', type: type});
      //graph2dDataset.push({x: time, y: prediction.durationWithBoth.mean/3600000 ,group: type + '_pred_durationWithBoth', type: type});
  });

  this.jobs.id[id] = {
    type: type,
    startTime: time,
    prediction: null,
    predictionCounter: 0,
    elapsedTime: 0,
    elapsedTimeWithPause: 0,
    pauseCount: 0,
    delay: 0,
    endOfDay: false,
    paused: false
  };
  if (this.jobs.type.open[type] === undefined) {this.jobs.type.open[type] = {}}
  this.jobs.type.open[type][id] = time;
  this.openJobs[id] = this.jobs.id[id];


  var addQuery = [{id:id, start:time, content:"started: "+ type, group:this.agent.id, subgroup: this.agent.usedSubgroups[type]}];
  this.agent.timelineDataset.add(addQuery);
  this.agent.rpc.request("agentGenerator", {method: 'updateOpenJobs', params:{jobId: id, time: time}})
};

JobManager.prototype.finish = function(id, type, time) {
  var me = this;
  // finish the job.
  this.agent.rpc.request(type, {method:'finish', params:{
    agentId: this.agent.id,
    time: time,
    jobId: id
  }})
    .then(function (reply) {
      var prediction = reply.prediction;
      me.jobs.id[id].elapsedTime = reply.elapsedTime;
      me.jobs.id[id].elapsedTimeWithPause = reply.elapsedTimeWithPause;
      me.updateDataSetsFinish(id, type, time,  me.jobs.id[id].prediction);

      graph2dDataset.push({x: time, y: reply.duration.duration/3600000 ,group: type + '_duration', type: type});
      graph2dDataset.push({x: time, y: reply.duration.durationWithPause/3600000 ,group: type + '_durationWithPause', type: type});
      graph2dDataset.push({x: time, y: reply.duration.durationWithStartup/3600000 ,group: type + '_durationWithStartup', type: type});
      graph2dDataset.push({x: time, y: reply.duration.durationWithBoth/3600000 ,group: type + '_durationWithBoth', type: type});
      graph2dDataset.push({x: time, y: prediction.duration.mean/3600000 ,group: type + '_pred_duration', type: type});
      graph2dDataset.push({x: time, y: prediction.durationWithPause.mean/3600000 ,group: type + '_pred_durationWithPause', type: type});
      graph2dDataset.push({x: time, y: prediction.durationWithStartup.mean/3600000 ,group: type + '_pred_durationWithStartup', type: type});
      graph2dDataset.push({x: time, y: prediction.durationWithBoth.mean/3600000 ,group: type + '_pred_durationWithBoth', type: type});
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
        this.agent.rpc.request(type, {method:'update', params:{
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
    this.agent.rpc.request(type, {method:'update', params:{
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


JobManager.prototype.updateDataSetsOperation = function(id, type, time, operation, eventId) {
  switch (operation) {
    case 'pause':
      this.updateDataSetsPause(id, type, time, operation, this.jobs.id[id].prediction, eventId);
      break;
    case 'endOfDay':
      this.updateDataSetsPause(id, type, time, operation, this.jobs.id[id].prediction, eventId);
      break;
    case 'startOfDay':
      this.updateDataSetsResume(id, type, time, operation, this.jobs.id[id].prediction, eventId);
      break;
    case 'resume':
      this.updateDataSetsResume(id, type, time, operation, this.jobs.id[id].prediction, eventId);
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
    if (offsetItem !== null) {
      updateQuery.push(offsetItem);
    }
  }
  updateQuery.push({id: id, end: time, content: type, type: 'range', className: 'finished'});
  this.agent.freeSubgroup(type);
  this.agent.timelineDataset.update(updateQuery);
  this.agent.rpc.request("agentGenerator", {method: 'updateOpenJobs', params:{jobId: id, time: time}})
};

JobManager.prototype.updateDataSetsPause = function(id, type, time, operation, prediction, eventId) {
  var updateQuery = [];
  var image = '<img src="./images/control_pause.png" class="icon"/>';
  var flagId = id + "_pauseNotifier" + eventId;

  // this causes there to be only one flag for the end of day as well as a moon icon
  if (operation == 'endOfDay') {
    // don't end-of-day jobs twice
    if (this.jobs.id[id].endOfDay == true) {
      return;
    }
    this.jobs.id[id].endOfDay = true;
    image = '<img src="./images/moon.png" class="icon"/>';
    flagId = id + "endOfDayNotifier" + eventId;
  }
  else {
    this.jobs.id[id].pauseCount += 1;

  }

  var field = 'duration';
  var elapsedTime = this.jobs.id[id].elapsedTime;
  if (this.jobs.id[id].pauseCount > 0) {
    field = 'durationWithPause';
    elapsedTime = this.jobs.id[id].elapsedTimeWithPause;
  }

  updateQuery.push({id: id, end: time, content: type, type: 'range'});
  updateQuery.push({
    id: flagId,
    start: time,
    end: time,
    content: image,
    group: this.agent.id,
    subgroup: this.agent.usedSubgroups[type],
    className: 'pause'
  });

  var predictedTimeLeft = prediction[field].mean - elapsedTime;
  var predictionExists = prediction[field].mean != 0;

  // update the predicted line if the job is not ALREADY pauseds
  if (predictedTimeLeft > 0 && predictionExists == true  && this.jobs.id[id].paused != true) {
    updateQuery.push({
      id: id + "_predMean" + this.jobs.id[id].predictionCounter,
      end: time,
      group: this.agent.id,
      className: 'prediction'
    })
  }

  // update the deficiency line if the job is not ALREADY paused
  //if (predictedTimeLeft < 0 && predictionExists == true && this.jobs.id[id].paused != true) {
  //  var offsetItem = this.getOffsetItem(id, type, time, prediction[field], elapsedTime);
  //  if (offsetItem !== null) {
  //    updateQuery.push(offsetItem);
  //  }
  //}


  // set the status to paused if needed
  if (operation != 'endOfDay') {
    this.jobs.id[id].paused = true;
  }
  this.agent.timelineDataset.update(updateQuery);
  this.agent.rpc.request("agentGenerator", {method: 'updateOpenJobs', params:{jobId: id, time: time}})
};

JobManager.prototype.updateDataSetsResume = function(id, type, time, operation, prediction, eventId) {
  var updateQuery = [];
  var image = '<img src="./images/control_play.png" class="icon"/>';
  var flagId = id + "_resumeNotifier" + eventId;

  // this causes there to be only one flag for the start of day as well as a sun icon
  if (operation == 'startOfDay') {
    // don't start-of-day jobs twice
    if (this.jobs.id[id].endOfDay == false) {
      return;
    }
    this.jobs.id[id].endOfDay = false;
    image = '<img src="./images/sun.png"  class="icon"/>';
    flagId = id + "startOfDayNotifier_" + eventId;
  }
  else {
    this.jobs.id[id].pauseCount += 1;
  }

  var field = 'duration';
  var elapsedTime = this.jobs.id[id].elapsedTime;
  if (this.jobs.id[id].pauseCount > 0) {
    field = 'durationWithPause';
    elapsedTime = this.jobs.id[id].elapsedTimeWithPause;
  }

  updateQuery.push({id: id, end: time, content: type, type: 'range'});
  updateQuery.push({
    id: flagId,
    start: time,
    end: time,
    content: image,
    group: this.agent.id,
    subgroup: this.agent.usedSubgroups[type],
    className: 'pause'
  });

  var predictedTimeLeft = prediction[field].mean - elapsedTime;
  // no not increase the prediction line at the start of the day if the job is PAUSED
  if (predictedTimeLeft > 0 && !(operation == 'startOfDay' && this.jobs.id[id].paused == true)) {
    this.jobs.id[id].predictionCounter += 1;
    updateQuery.push({
      id: id + "_predMean" + this.jobs.id[id].predictionCounter,
      start: time,
      end: new Date(time).getTime() + predictedTimeLeft,
      group: this.agent.id,
      subgroup: this.agent.usedSubgroups[type],
      type: 'background',
      className: 'prediction'
    });
  }

  // resume if needed
  if (operation != 'startOfDay'){
    this.jobs.id[id].paused = false;
  }
  this.agent.timelineDataset.update(updateQuery);
  this.agent.rpc.request("agentGenerator", {method: 'updateOpenJobs', params:{jobId: id, time: time}})
};

JobManager.prototype.getOffsetItem = function(id,type,time,prediction,elapsedTime) {
  if (prediction.mean != 0) {
    var predictedTimeLeft = prediction.mean - elapsedTime;
    var offsetItem;
    if (predictedTimeLeft < 0) {
      offsetItem = {
        id: id + '_prediction_' + this.jobs.id[id].pauseCount,
        start: new Date(time).getTime() + predictedTimeLeft,
        end: new Date(time).getTime(),
        group: this.agent.id,
        subgroup: this.agent.usedSubgroups[type],
        type: 'background',
        className: 'negative'
      };
      this.jobs.id[id].pauseCount += 1;
      offsetItem = null;
    }
    else {
      offsetItem = {
        id: id + "_predMean" + this.jobs.id[id].predictionCounter,
          end: time,
          type: 'background',
          group: this.agent.id,
          subgroup: this.agent.usedSubgroups[type],
          className: 'prediction'
      }
      //offsetItem.start = time;
      //offsetItem.end = new Date(time).getTime() + predictedTimeLeft;
      //offsetItem.className = 'positive';
    }
    this.jobs.id[id].delay += predictedTimeLeft;
    this.agent.delay += predictedTimeLeft;
    return offsetItem;
  }
};

JobManager.prototype.updateJobs = function(time, skipId) {
  var updateQuery = [];
  for (var jobId in this.openJobs) {
    if (this.openJobs.hasOwnProperty(jobId) && jobId != skipId) {
      var type = this.openJobs[jobId].type;
      var prediction  = this.openJobs[jobId].prediction;
      var predictedTimeLeft;
      var predictionExists = false;
      // never been paused before
      if (this.jobs.id[jobId].pauseCount == 0) {
        predictedTimeLeft = prediction.duration.mean - this.jobs.id[jobId].elapsedTime;
        predictionExists = prediction.duration.mean != 0;
      }
      else {
        predictedTimeLeft = prediction.durationWithPause.mean - this.jobs.id[jobId].elapsedTimeWithPause;
        predictionExists = prediction.durationWithPause.mean != 0;
      }


      //if (predictedTimeLeft > 0 && predictionExists == true) {
      //  updateQuery.push({id: jobId + "_predMean" + this.jobs.id[jobId].predictionCounter, end: time, group: this.agent.id, className: 'prediction'})
      //}
      //this.jobs.id[jobId].predictionCounter += 1;
      //if (predictedTimeLeft < 0 && predictionExists == true) {
      //  var offsetItem = this.getOffsetItem(jobId, type, time, prediction.durationWithPause, this.jobs.id[jobId].elapsedTimeWithPause);
      //  if (offsetItem !== null) {
      //    updateQuery.push(offsetItem);
      //  }
      //}
      updateQuery.push({id: jobId, end: time, content: type, type: 'range'});
    }
  }

  this.agent.timelineDataset.update(updateQuery);
}