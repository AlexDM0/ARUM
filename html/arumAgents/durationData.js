/**
 * Created by Alex on 9/25/2014.
 */

function DurationData() {
  this.fields = ['duration','durationWithPause','durationWithStartup','durationWithBoth'];
  for (var i = 0; i < this.fields.length; i++) {
    this[this.fields[i]] = 0;
  }
}

DurationData.prototype.setData = function(otherData) {
  for (var i = 0; i < this.fields.length; i++) {
    this[this.fields[i]] = otherData[this.fields[i]];
  }
}

DurationData.prototype.getData = function() {
  var dataObj = {};
  for (var i = 0; i < this.fields.length; i++) {
    dataObj[this.fields[i]] = this[this.fields[i]];
  }
  return dataObj;
}

DurationData.prototype.useHighest = function(otherData) {
  for (var i = 0; i < this.fields.length; i++) {
    var field = this.fields[i];
    if (this[field] < otherData[field]) {
      this[field] = otherData[field];
    }
  }
}

DurationData.prototype.subtract = function(subtractionTime) {
  for (var i = 0; i < this.fields.length; i++) {
    this[this.fields[i]] -= subtractionTime;
  }
}

DurationData.prototype.calculateDuration = function(time, timeStart, elapsedTime, startupTime, subtractionTime) {
  this.duration            = elapsedTime;
  this.durationWithPause   = new Date(time).getTime() - new Date(timeStart).getTime();
  this.durationWithStartup = this.duration + startupTime.durationWithStartup;
  this.durationWithBoth    = this.durationWithPause + startupTime.durationWithBoth;
  this.subtract(subtractionTime)
}
