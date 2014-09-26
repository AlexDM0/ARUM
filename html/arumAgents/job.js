'use strict';

function uuid() {
  return (Math.random()*1e15).toString(32) + "-" + (Math.random()*1e15).toString(32);
}

/**
 * This is a local assignment, this keeps track on how long an assignment takes THIS worker.
 *
 * @param id
 * @param type
 * @param timeStart
 * @constructor
 */
function Job(id, type, timeStart, agentId, prerequisites) {
  this.id = id;
  this.type = type;
  this.agentId = agentId;

  this.timeStart = timeStart;
  this.timeResumed = timeStart;
  this.elapsedTime = 0;
  this.subtractionTime = 0;
  this.endOfDayTime = 0;
  this.endOfDayPause = false;

  this.paused = false;
  this.finished = false;

  this.duration = new DurationData();
  this.prediction = new DurationStats();
  this.startupTime = new DurationData();
  this.predictedStartupTime = new DurationStats();

  this.prerequisites = prerequisites;
}

Job.prototype.prerequisiteFinished = function(params) {
  var uuid = params.uuid;
  for (var i = 0; i < this.prerequisites.length; i++) {
    var prereq = this.prerequisites[i];
    if (prereq.uuid == uuid) {
      prereq.times.setData(params);
      break;
    }
  }
}

Job.prototype.watchingPrerequisite = function(preliminaryStats, uuid) {
  for (var i = 0; i < this.prerequisites.length; i++) {
    var prereq = this.prerequisites[i];
    if (prereq.uuid == uuid) {
      prereq.stats.setData(preliminaryStats);
      this.predictedStartupTime.useHighest(preliminaryStats)
      break;
    }
  }
}

Job.prototype.finalizePrerequisites = function() {
  for (var i = 0; i < this.prerequisites.length; i++) {
    this.startupTime.useHighest(this.prerequisites[i].times);
  }
}

Job.prototype.finish = function(time) {
  this.finished = true;
  this.elapsedTime += time - this.timeResumed;
  this.finalizePrerequisites();

  this.duration.calculateDuration(time, this.timeStart, this.elapsedTime, this.startupTime, this.subtractionTime);
}

Job.prototype.pause = function(time, endOfDay) {
  if (endOfDay == true) {
    this.endOfDayTime = time;
    this.endOfDayPause = true;
  }

  this.elapsedTime += time - this.timeResumed;
  this.paused = true;
}

Job.prototype.resume = function(time, startOfDay) {
  if (this.endOfDayPause == true && startOfDay == true) {
    if (this.endOfDayTime != 0) {
      this.subtractionTime += time - this.endOfDayTime;
    }
    this.endOfDayTime = 0;
    this.endOfDayPause = false;
  }
  else {
    this.timeResumed = time;
    this.paused = false;
  }
}


