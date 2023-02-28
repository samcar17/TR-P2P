//NOTE:: What happens if our MASTER disconnects?  //Should be done. Need Client update to test. 

var midi = require('midi');
var express = require('express');
var input = new midi.input(); //Setup midi input object
var output = new midi.output(); //Setup midi output object
var app = express();
var server = app.listen(3000, function(){console.log('server listening on p3000!')});
var connectionCounter = 0;
var master = true;
var clockID;
var clockTick = false;
var channelChange;
var currentPort;
var subdiv;
var midiClkCounter = 0;
var midiClkSubdivision = 4;
var midiClkPpqn = 23; //Seems to work but might need to be changed later on
var socketIDArray = []; //might need a '0' in there to start? 
var masterClientID; //the socket ID of the master client is assigned to this
var stepCounter = 0;
var stepLength = 16;
var latestConnectionID;
var playState = true;

app.use(express.static('public'));

console.log("socket server is running");

var midiList = output.getPortCount(); //get number of ports and store in variable MIDILIST
console.log(output.getPortCount()); //print that number
console.log('input');
for(var i = 0; i < midiList; i++){
	console.log(input.getPortName(i)); //print the names of each input port
}

console.log('output');
for(var i = 0; i < midiList; i++){
	console.log(output.getPortName(i)); //print the names of each output port
}
input.openPort(0);
input.ignoreTypes(true, false, true); //used to specify that we don't want to ignore clock messages
output.openPort(2); //open port 1 and print it. WHY DOES PORT 2 NOT WORK? 
currentPort = 1;
console.log('opening midi input port 0');
console.log('opening midi output port 2');


var socket = require('socket.io');
var io = socket(server);
//io is wider object. socket is now a local object to io. On is method inside socket.
//QUESTION: Idk why but it has to be called 'sockets' - not 'socket'
//A: 'sockets' is a function inside io, which is different from 'socket'??
io.sockets.on('connection', newConnection);

/* UNCOMMENT FOR MIDI CLOCK
input.on('message', function(deltaTime, message) {
  //console.log('m:' + message + ' d:' + deltaTime);
	if(message == 248){midiClkCounter++; 
		if(midiClkCounter >=  24){midiClkCounter = 0;} //0-23 = 24ppqn??
		if(midiClkCounter%midiClkPpqn == 0){midiClkSend();}
    }
});
*/


function newConnection(socket){
	console.log('new connection: ', socket.id);
	socketIDArray.push(socket.id);
	connectionCounter++;
	console.log('number connected: ', connectionCounter);
	console.log('id array: ', socketIDArray);
	
	//Check if there are any other connections!
	//if(no others){send a message to the sketch instance to say "U A MASTER"}
	//if(others){send a message to the sketch instance to say "U A RECIEVER"}
	
	if(connectionCounter == 1){
		master = true; //this connection is the master
		data = {master: master}
		io.to(socket.id).emit('master', data);
		console.log('master msg sent');
		clkStart();
		masterClientID = socket.id;
	}
	else if(connectionCounter > 1){
		master = false;  //indicates that this connection is a reciever
		data = {master: master}
		io.to(socket.id).emit('master', data);
		data = {} //clear 'data'
		io.to(masterClientID).emit('updateRequest', data);
		latestConnectionID = socket.id;
	}
	
	socket.on('pkg', pkgMsg);
	socket.on('pkgMe', pkgMe);
	socket.on('midiNote', midiNoteOut);
	socket.on('midiCC', midiCCOut);
	socket.on('clkChange', clkChange);
	socket.on('clkStop', clkStop);
	socket.on('clkStart', clkStart);
	socket.on('portChange', portChange);
	
	function pkgMsg(data){
		if(data.type == 'SEQLENGTH'){stepLength = data.padDivisionHighScore;}
		else if(data.type == 'FULLUPDATE') {console.log('full update msg coming thru');
											io.to(latestConnectionID).emit('pkg', data);
										    console.log('latestConnectionID: ', latestConnectionID);}
		else if(data.type == 'PLAY'){playState = data.playState;
						             console.log('server playstate: ', playState);
									 if(playState == false){clkStop();}
									 else if (playState == true){clkChange(data);}}
		else{socket.broadcast.emit('pkg', data);}
		//Sends message to all clients EXCLUDING client that sent the original message
	}
	
	function pkgMe(data){
		socket.sockets.emit('pkgMe', data);
		//Sends message to all clients INCLUDING client that sent the original message	
	}
	
	
	//sends midi out to ODB
	function midiNoteOut(data){
		//console.log(data);
		
		//Unpack Data
		//Is this noteOn or noteOff?
		if(data.type == 'ON'){ 	//Which channel? Switch Statement. 
								 	switch(data.byte1){
										case 1: 
										channelChange = 144;
										break;
										case 2: 
										channelChange = 145;
										break;
										case 3: 
										channelChange = 146;
										break;
										case 4: 
										channelChange = 147;
										break;
										case 5: 
										channelChange = 148;
										break;
										case 6: 
										channelChange = 149;
										break;
										case 7: 
										channelChange = 150;
										break;
										case 8: 
										channelChange = 151;
										break;
										case 9: 
										channelChange = 152;
										break;
										case 10: 
										channelChange = 153;
										break;
										case 11: 
										channelChange = 154;
										break;
										case 12: 
										channelChange = 155;
										break;
										case 13: 
										channelChange = 156;
										break;
										case 14: 
										channelChange = 157;
										break;
										case 15: 
										channelChange = 158;
										break;
										case 16: 
										channelChange = 159;
										break;		
									}
									output.sendMessage([channelChange, data.byte2, data.byte3]);
								} //144 = Chan1 Note On
		
		else if(data.type == 'OFF'){  
		//				Which channel? Switch Statement. 
						switch(data.byte1){
										case 1: 
										channelChange = 128;
										break;
										case 2: 
										channelChange = 129;
										break;
										case 3: 
										channelChange = 130;
										break;
										case 4: 
										channelChange = 131;
										break;
										case 5: 
										channelChange = 132;
										break;
										case 6: 
										channelChange = 133;
										break;
										case 7: 
										channelChange = 134;
										break;
										case 8: 
										channelChange = 135;
										break;
										case 9: 
										channelChange = 136;
										break;
										case 10: 
										channelChange = 137;
										break;
										case 11: 
										channelChange = 138;
										break;
										case 12: 
										channelChange = 139;
										break;
										case 13: 
										channelChange = 140;
										break;
										case 14: 
										channelChange = 141;
										break;
										case 15: 
										channelChange = 142;
										break;
										case 16: 
										channelChange = 143;
										break;				
									}
						output.sendMessage([channelChange, data.byte2, data.byte3]);
						//console.log('MIDI OUT: ', channelChange, data.byte2, data.byte3);
						} //128 = chan1 note off	
		else if(data.type != 'ON' && data.type != 'OFF'){}
	}
	
	function midiCCOut(data){
		//console.log(data);
		//Is this message a CC? 
		if(data.type == 'CC'){	
		//			Which channel? Switch Statement. 
					switch(data.byte1){
										case 1: 
										channelChange = 176;
										break;
										case 2: 
										channelChange = 177;
										break;
										case 3: 
										channelChange = 178;
										break;
										case 4: 
										channelChange = 179;
										break;
										case 5: 
										channelChange = 180;
										break;
										case 6: 
										channelChange = 181;
										break;
										case 7: 
										channelChange = 182;
										break;
										case 8: 
										channelChange = 183;
										break;
										case 9: 
										channelChange = 184;
										break;
										case 10: 
										channelChange = 185;
										break;
										case 11: 
										channelChange = 186;
										break;
										case 12: 
										channelChange = 187;
										break;
										case 13: 
										channelChange = 188;
										break;
										case 14: 
										channelChange = 189;
										break;
										case 15: 
										channelChange = 190;
										break;
										case 16: 
										channelChange = 191;
										break;				
					}	
					output.sendMessage([channelChange, data.byte2, data.byte3]); 
					} //176 = Chan1 CC Msg
		
		else if(data.type != 'CC'){} //do nothing
	}
	
	function portChange(data){
		output.closePort(currentPort);
		output.openPort(data.newPort); 
		currentPort = data.newPort;
		console.log('opening midi port: ', currentPort);
	}
	
	//CHECK WITH JIM!!
	socket.onclose = function(evt){ //If first client refreshes, this can throw the clock of and cause it to swing? ASK JIM
		onClose(evt);
	}
	
	function onClose(evt){
		connectionCounter--;
		console.log('start close number connected: ', connectionCounter);
		//  delete the connection's log in the socketIDArray	
		var pos = socketIDArray.indexOf(socket.id);
		//var idid = socket.id;
		//console.log('socketID: ', idid);
		//console.log('pos: ', pos);
		socketIDArray.splice(pos, 1);
		console.log('on closing array: ', socketIDArray);
		console.log('socket.id: ', socket.id);
		console.log('masterClientID: ', masterClientID);
		if(socket.id == masterClientID){ 
		//		choose a new connection and send a master message to it 
				master = true; 
				data = {master: master}
				var newMaster = Math.floor(Math.random() * (socketIDArray.length));
				var newMasterID = socketIDArray[newMaster];
				io.to(newMasterID).emit('master', data); 
				masterClientID = newMasterID;
				console.log('new master chosen: ', masterClientID); //this connection is now the new master 
		}
		else{/*nothing*/}
		
		//if the last client is closed, stop the clock!
		if(socketIDArray.length <= 0){clkStop();}
		else if(socketIDArray.length > 0){} //don't stop the clock! 
	}

	
	function clkStart(){
		clockID = setInterval(clkSend, 125); //500 = 120bpm/Crochets
	}
	
	function clkSend(){
		clockTick = !clockTick;
		data = {clockTick: clockTick, stepCounter: stepCounter}
		io.sockets.emit('clkSend', data);
		stepCounter++;
		if(stepCounter == stepLength){stepCounter = 0;}
		else{/*nothing*/}
		//console.log('stepCounter', stepCounter);
		//console.log('clockTick', clockTick);
	}
	
	//changes rate of clock
	function clkChange(data){
		var newMs = 60000/data.bpm;
		var subdiv = newMs/data.subdivision;
		//console.log(subdiv);
		//if(not currently recieving MIDI CLK)then...
		//stop interval
		clearInterval(clockID);
		//restart interval with subdiv
		clockID = setInterval(clkSend, subdiv);
		//if(currently recieving MIDI CLK) then...
		//s
	}
	
	function clkStop(){ //spacebar stop not working properly sometimes? -Seems to be fixed but leaving this here just in case
		clearInterval(clockID);
		stepCounter = 0;
	}
}

function midiClkSend(){
		clockTick = !clockTick;
		data = {
			clockTick: clockTick,
			stepCounter: stepCounter   
		}
		io.sockets.emit('clkSend', data);
		stepCounter++;
		if(stepCounter >= stepLength){stepCounter = 0;}
		else{/*nothing*/}
		//console.log('stepCounter', stepCounter);
}

/*function clk(){
	this.start = function(){ //CHECK WITH JIM IF THIS. IS APPROPRIATE
		clockID = setInterval(clk.send, 500);
	}

	this.send = function(){
		clockTick = !clockTick;
		data = {clockTick: clockTick}
		io.sockets.emit('clk.send', data);
		console.log('clockTick', clockTick);
	}

	this.change = function(newMS){
		//stop interval
		clearInterval(clockID);
		//restart interval with newMS
		clockID = setInterval(clk.send, newMS);
	}
}*/