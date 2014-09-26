'use strict';

function AgentGenerator(id) {
  // execute super constructor
  eve.Agent.call(this, id);
  this.rpc = this.loadModule('rpc', this.rpcFunctions);
  var me = this;
  this.amountOfEvents = 0;
  this.eventNumber = 0;
  this.eventsToFire = 0;

  conn = this.connect(eve.system.transports.getAll());
  conn[0].connect(JAVA_EVENTS_URL)
    .then(function () {
      console.log('Connected to the JAVA_EVENTS');
      me.rpc.request(JAVA_EVENTS_URL,{method:"loadEvents", params:{filename:"events.csv", actuallySend: true}}).then(function (reply) {
        me.amountOfEvents = reply;
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
  console.log("event:",params)
  if (agentList[params.performedBy] === undefined) {
    agentList[params.performedBy] = new GenericAgent(params.performedBy, params.type);
  }
  this.rpc.request(params.performedBy, {method:"newEvent", params:params});

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