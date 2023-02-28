var lastClockTick = false;

function setup() {
  createCanvas(400, 400);
  background(220);
  socket = io.connect('http://localhost:3000');
  socket.on('clkSend', perStep); //if we recieve a msg called 'clkSend', run function perStep
}

function draw() {
  background(220);
}

function sendMidiOn(channel, number, velocity){
	data = {
		type: 'ON', 
		byte1: channel,
		byte2: number,
		byte3: velocity
	}
	socket.emit('midiNote', data);
	//console.log('midiON sent to server: ', data);
}

function sendMidiOff(channel, number, velocity){
	data = {
		type: 'OFF', 
		byte1: channel,
		byte2: number,
		byte3: velocity
	}
	socket.emit('midiNote', data);	
	//console.log('midiOFF sent to server: ', data);
}

function sendMidiCC(channel, cc, value){
	data = {
		type: 'CC', 
		byte1: channel,
		byte2: cc,
		byte3: value
	}
	socket.emit('midiCC', data);
	console.log('CC to server: ', value);
}

function perStep(data){
	console.log('incoming clk: ', data.clockTick);
	/*if(data.clockTick != lastClockTick){
		sendMidiOff(2, 60, 127);
		sendMidiOn(2, 60, 127);
		//sendCC();
	}*/
	if(data.clockTick == true){sendMidiOn(2, 60, 127); sendMidiCC(2, 27, Math.floor((Math.random()*127)+1));}
	else if(data.clockTick == false){sendMidiOff(2, 60, 127); sendMidiCC(2, 27, Math.floor((Math.random()*127)+1));}
	else{/*nothing*/}
	lastClockTick = data.clockTick;
}