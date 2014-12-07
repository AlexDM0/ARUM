'use strict';

if (typeof window === 'undefined') {
  var eve = require('evejs');
  var GenericAgent = require('./GenericAgent')
}

function EventGenerator(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  this.connect(eve.system.transports.getAll());
  this.eventCounter = 0;
  this.events = [
    {
      "jobId": "0",
      "time": "2014-09-16T06:45:00.000+02:00",
      "performedBy": "Operation Theatre",
      "type": "theatre",
      "assignment": "Operation Type X",
      "operation": "start"
    },
    {
      "jobId": "1",
      "time": "2014-09-16T09:45:00.000+02:00",
      "performedBy": "Wrap up timer",
      "type": "timer",
      "assignment": "1st swab count at wound closure",
      "operation": "start"
    },
    //{
    //  "jobId": "2",
    //  "time": "2014-09-16T09:46:00.000+02:00",
    //  "performedBy": "Theatre Nurse 1",
    //  "type": "nurse",
    //  "assignment": "Forward next patient",
    //  "operation": "start"
    //},
    {
      "jobId": "3",
      "time": "2014-09-16T09:46:00.000+02:00",
      "performedBy": "Ward Nurse 5",
      "type": "nurse",
      "assignment": "Prepare patient for move to theatre",
      "operation": "start"
    },
    {
      "jobId": "4",
      "time": "2014-09-16T09:46:00.000+02:00",
      "performedBy": "Ward Nurse 9",
      "type": "nurse",
      "assignment": "Prepare patient for move to theatre",
      "operation": "start"
    },
    {
      "jobId": "3",
      "time": "2014-09-16T09:56:00.000+02:00",
      "performedBy": "Ward Nurse 5",
      "type": "nurse",
      "assignment": "Prepare patient for move to theatre",
      "operation": "finish"
    },
    {
      "jobId": "4",
      "time": "2014-09-16T09:56:00.000+02:00",
      "performedBy": "Ward Nurse 9",
      "type": "nurse",
      "assignment": "Prepare patient for move to theatre",
      "operation": "finish"
    },
    {
      "jobId": "5",
      "time": "2014-09-16T09:56:00.000+02:00",
      "performedBy": "Porter 1",
      "type": "porter",
      "assignment": "Transport patient from ward 6 to theatre 4",
      "operation": "start"
    },
    {
      "jobId": "6",
      "time": "2014-09-16T09:56:00.000+02:00",
      "performedBy": "Ward Nurse 9",
      "type": "nurse",
      "assignment": "Take patient to theatre 4 and return to ward 6",
      "operation": "start"
    },
    {
      "jobId": "0",
      "time": "2014-09-16T10:00:00.000+02:00",
      "performedBy": "Operation Theatre",
      "type": "theatre",
      "assignment": "Operation Type X",
      "operation": "finish"
    },
    {
      "jobId": "1",
      "time": "2014-09-16T10:00:00.000+02:00",
      "performedBy": "Wrap up timer",
      "type": "timer",
      "assignment": "1st swab count at wound closure",
      "operation": "finish"
    },
    {
      "jobId": "2",
      "time": "2014-09-16T10:00:00.000+02:00",
      "performedBy": "Theatre turnaround timer",
      "type": "timer",
      "assignment": "Threatre turnaround timer",
      "operation": "start"
    },
    {
      "jobId": "7",
      "time": "2014-09-16T10:00:00.000+02:00",
      "performedBy": "Anaesthetist 4",
      "type": "anaesthetist",
      "assignment": "Take patient to recovery and return to theatre 4",
      "operation": "start"
    },
    {
      "jobId": "8",
      "time": "2014-09-16T10:00:00.000+02:00",
      "performedBy": "Theatre nurse 5",
      "type": "nurse",
      "assignment": "Take patient to recovery and return to theatre 4",
      "operation": "start"
    },
    {
      "jobId": "19",
      "time": "2014-09-16T10:01:00.000+02:00",
      "performedBy": "ODP",
      "type": "ODP",
      "assignment": "Prepare anaesthetic room for next patient",
      "operation": "start"
    },
    {
      "jobId": "7",
      "time": "2014-09-16T10:05:00.000+02:00",
      "performedBy": "Anaesthetist 4",
      "type": "anaesthetist",
      "assignment": "Take patient to recovery and return to theatre 4",
      "operation": "finish"
    },
    {
      "jobId": "8",
      "time": "2014-09-16T10:05:00.000+02:00",
      "performedBy": "Theatre nurse 5",
      "type": "nurse",
      "assignment": "Take patient to recovery and return to theatre 4",
      "operation": "finish"
    },
    {
      "jobId": "19",
      "time": "2014-09-16T10:06:00.000+02:00",
      "performedBy": "ODP",
      "type": "ODP",
      "assignment": "Prepare anaesthetic room for next patient",
      "operation": "finish"
    },
    {
      "jobId": "5",
      "time": "2014-09-16T10:16:00.000+02:00",
      "performedBy": "Porter 1",
      "type": "porter",
      "assignment": "Transport patient from ward 6 to theatre 4",
      "operation": "finish"
    },
    {
      "jobId": "6",
      "time": "2014-09-16T10:16:00.000+02:00",
      "performedBy": "Ward Nurse 9",
      "type": "nurse",
      "assignment": "Take patient to theatre 4 and return to ward 6",
      "operation": "finish"
    },
    {
      "jobId": "9",
      "time": "2014-09-16T10:10:00.000+02:00",
      "performedBy": "Anaesthetist 4",
      "type": "anaesthetist",
      "assignment": "Aneasthetic",
      "operation": "start"
    },
    {
      "jobId": "10",
      "time": "2014-09-16T10:10:00.000+02:00",
      "performedBy": "Operation Theatre",
      "type": "theatre",
      "assignment": "Operation Type X",
      "operation": "start"
    },
    {
      "jobId": "2",
      "time": "2014-09-16T10:10:00.000+02:00",
      "performedBy": "Theatre turnaround timer",
      "type": "timer",
      "assignment": "Threatre turnaround timer",
      "operation": "finish"
    },
    {
      "jobId": "9",
      "time": "2014-09-16T13:40:00.000+02:00",
      "performedBy": "Anaesthetist 4",
      "type": "anaesthetist",
      "assignment": "Aneasthetic",
      "operation": "finish"
    },
    {
      "jobId": "10",
      "time": "2014-09-16T13:40:00.000+02:00",
      "performedBy": "Operation Theatre",
      "type": "theatre",
      "assignment": "Operation Type X",
      "operation": "finish"
    }

  ]

  // make time objects
  for (var i = 0; i < this.events.length; i++) {
    this.events[i].time = new Date(this.events[i].time).valueOf();
  }
  this.monteCarloEvents();
  this.events.sort(function(a,b) {return a.time - b.time;});
}

// extend the eve.Agent prototype
EventGenerator.prototype = Object.create(eve.Agent.prototype);
EventGenerator.prototype.constructor = EventGenerator;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
EventGenerator.prototype.rpcFunctions = {};

EventGenerator.prototype.rpcFunctions.loadEvents = function() {
  return this.events.length - 1;
}

EventGenerator.prototype.rpcFunctions.nextEvent = function() {
  this.rpc.request("agentGenerator",{method:'receiveEvent', params:this.events[this.eventCounter]}).done();
  this.eventCounter += 1;
}


EventGenerator.prototype.monteCarloEvents = function() {
  var newEvents = [];
  var amountOfCopies = 10;
  var timeInBetween = 24*3600*1000;
  var offset = 1000;

  for (var j = 0; j < amountOfCopies; j++) {
    for (var i = 0; i < this.events.length; i++) {
      var event = Object.create(this.events[i]);
      if (j > 0) {
        if (event.operation == "finish") {
          var variation = 0.5 * this.getDuration(event.jobId);
          event.time += (Math.random() - 0.5) * variation;
        }
      }
      event.time -= j * timeInBetween;
      event.jobId = Number(event.jobId) + offset*j;
      newEvents.push(event);
    }
  }

  this.events = newEvents;
}

EventGenerator.prototype.getDuration = function(jobId) {
  var startTime = 0;
  for (var i = 0; i < this.events.length; i++) {
    if (this.events[i].jobId == jobId) {
      if (this.events[i].operation == 'start') {
        startTime = this.events[i].time
      }
      else if (this.events[i].operation == 'finish') {
        return this.events[i].time - startTime;
      }
    }
  }
}


if (typeof window === 'undefined') {
  module.exports = EventGenerator;
}