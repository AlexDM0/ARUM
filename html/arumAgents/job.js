'use strict';

/**
 * This is a local assignment, this keeps track on how long an assignment takes THIS worker.
 *
 * @param id
 * @param type
 * @param timeStart
 * @constructor
 */
function Job(id, type, timeStart) {
  this.id = id;
  this.name = name;
  this.timeStart = timeStart;
  this.timeResumed = timeStart;
  this.elapsedTime = 0;
  this.duration = null;
  this.totalDuration = null;
  this.paused = false;
  this.prediction = {mean:0, std:0};
}

Job.prototype.finish = function(time) {
  this.elapsedTime += time - this.timeResumed;
  this.duration = this.elapsedTime;
  this.totalDuration = time - this.timeStart;
}

Job.prototype.pause = function(time) {
  this.elapsedTime += time - this.timeResumed;
  this.paused = true;
}

Job.prototype.continue = function(time) {
  this.timeResumed = time;
  this.paused = false;
}


