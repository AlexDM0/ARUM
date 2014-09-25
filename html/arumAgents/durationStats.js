/**
 * Created by Alex on 9/25/2014.
 */

function DurationStats() {
  this.fields = ['duration','durationWithPause','durationWithStartup','durationWithBoth'];
  for (var i = 0; i < this.fields.length; i++) {
    this[this.fields[i]] = {mean: 0, std: 0};
  }
}

DurationStats.prototype.clearStats = function() {
  for (var i = 0; i < this.fields.length; i++) {
    var field = this.fields[i];
    this[field].mean = 0;
    this[field].std  = 0;
  }
}

DurationStats.prototype.sumStats = function(otherData) {
  for (var i = 0; i < this.fields.length; i++) {
    var field = this.fields[i];
    this[field].mean += otherData[field].mean;
    this[field].std  += Math.pow(otherData[field].std,2);
  }
}
DurationStats.prototype.averageStats = function(datapoints) {
  for (var i = 0; i < this.fields.length; i++) {
    var field = this.fields[i];
    this[field].mean /= datapoints;
    this[field].std = Math.sqrt(this[field].std / datapoints);
  }
}

DurationStats.prototype.getMeanData = function() {
  var dataObj = {};
  for (var i = 0; i < this.fields.length; i++) {
    dataObj[this.fields[i]] = this[this.fields[i]].mean;
  }
  return dataObj;
}

DurationStats.prototype.getData = function() {
  var dataObj = {};
  for (var i = 0; i < this.fields.length; i++) {
    dataObj[this.fields[i]] = {};
    dataObj[this.fields[i]].mean = this[this.fields[i]].mean;
    dataObj[this.fields[i]].std = this[this.fields[i]].std;
  }

  return dataObj;
}

DurationStats.prototype.setData = function(otherData) {
  for (var i = 0; i < this.fields.length; i++) {
    var field = this.fields[i];
    this[field].mean = otherData[field].mean;
    this[field].std  = otherData[field].std;
  }
}


DurationStats.prototype.useHighest = function(otherData) {
  for (var i = 0; i < this.fields.length; i++) {
    var field = this.fields[i];
    if (this[field].mean < otherData[field].mean) {
      this[field].mean = otherData[field].mean;
      this[field].std = otherData[field].std;
    }
  }
}