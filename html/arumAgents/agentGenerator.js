'use strict';

function AgentGenerator(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  var me = this;
  this.amountOfEvents = 0;
  this.eventNumber = 0;
  this.eventsToFire = 0;
  this.lastEndOfDayTime = null;

  conn = this.connect(eve.system.transports.getAll());
  conn[0].connect(JAVA_EVENTS_URL)
    .then(function () {
      console.log('Connected to the JAVA_EVENTS');
      me.rpc.request(JAVA_EVENTS_URL,{method:"loadEvents", params:{filename:"events.csv", actuallySend: true}}).then(function (reply) {
        me.amountOfEvents = reply;
        me.getEvents(AMOUNT_OF_INITIAL_EVENTS);
      });
    })
    .catch(function (err) {
      console.log('Error: Failed to connect to the conductor agent');
      console.log(err);

      // keep trying until the conductor agent is online
      setTimeout(connect, RECONNECT_DELAY);
    });
}

// extend the eve.Agent prototype
AgentGenerator.prototype = Object.create(eve.Agent.prototype);
AgentGenerator.prototype.constructor = AgentGenerator;

// define RPC functions, preferably in a separated object to clearly distinct
// exposed functions from local functions.
AgentGenerator.prototype.rpcFunctions = {};

AgentGenerator.prototype.rpcFunctions.receiveEvent = function(params) {
  console.log("event:",this.eventNumber, this.amountOfEvents, params);

  // setup timeline
  timeline.setCustomTime(params.time);
  var range = timeline.getWindow();
  var duration = range.end - range.start;
  var cushion = 0.15 * duration;
  var convertedTime = new Date(params.time).getTime();
  timeline.setWindow(convertedTime - duration + cushion, convertedTime + cushion, {animate:false});

  if (params.performedBy == "global") {
    this.imposeWorkingHours(params);
  }
  else {
    if (agentList[params.performedBy] === undefined) {
      agentList[params.performedBy] = new GenericAgent(params.performedBy, params.type);
    }
    this.rpc.request(params.performedBy, {method: "newEvent", params: params});
  }

  // check if we need to get another event, its done here to avoid raceconditions
  if (this.eventsToFire != 0) {
    this.eventNumber += 1;
    eventCounter.innerHTML = this.eventNumber +""; // make string so it works
    this.rpc.request(JAVA_EVENTS_URL, {method:'nextEvent', params:{}});
    this.eventsToFire -= 1;
  }
}

AgentGenerator.prototype.getEvents = function (count, delay) {
  if (this.eventNumber + count > this.amountOfEvents) {
    count = this.amountOfEvents - this.eventNumber;
  }
  if (count != 0) {
    this.eventsToFire = count;
    this.rpc.request(JAVA_EVENTS_URL, {method: 'nextEvent', params: {}});
    this.eventNumber += 1;
    eventCounter.innerHTML = this.eventNumber + ""; // make string so it works
    this.eventsToFire -= 1;
  }
}

AgentGenerator.prototype.rpcFunctions.updateOpenJobs = function(params) {
  var skipJob = params.jobId;
  var time = params.time;

  for (var agentId in agentList) {
    if (agentList.hasOwnProperty(agentId)) {
      agentList[agentId].jobs.updateJobs(time, skipJob);
    }
  }
}

AgentGenerator.prototype.imposeWorkingHours = function(params) {
  var time = params.time;
  var operation = params.operation;

  for (var agentId in agentList) {
    if (agentList.hasOwnProperty(agentId)) {
      var agent = agentList[agentId];
      for (var jobId in agent.jobs.openJobs) {
        if (agent.jobs.openJobs.hasOwnProperty(jobId)) {
          var job = agent.jobs.openJobs[jobId];
          agent.updateAssignment(jobId, job.type, time, operation);
        }
      }
    }
  }

  if (operation == 'endOfDay') {
    this.lastEndOfDayTime = time;
  }
  else {
    if (this.lastEndOfDayTime !== null) {
      timelineItems.update({
        id: 'night' + uuid(),
        start: this.lastEndOfDayTime,
        end: time,
        type: 'background',
        group: 'Biagio',
        className: 'night'
      });
      this.lastEndOfDayTime = null;
    }
  }


}