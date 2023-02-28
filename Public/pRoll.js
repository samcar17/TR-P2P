var socket; 
var rows = 24;
var padDivision = 16;
var bpm = 120;
var stateArray = [];
var stateArrayPreviousStep = [];
var mouseQuantX;
var mouseQuantY;
var padDivisionHighScore = 16;
var newPadDivision = 16;
var seqStartPoint = 0;
var lastClockTick = false;
var currentStep = 0;
var convertedMidiNum = 0;
var master = false; //if this is true, this client is the master
var playState = true;
var currentSubdivision = 4;
initializeStateArray();

function setup() {
  createCanvas(windowWidth-3, windowHeight-3);
  background(220);
  drawPad(padDivision);
  socket = io.connect('http://localhost:3000');
  socket.on('clkSend', perStep); //if we recieve a msg called 'clkSend', run function perStep
  socket.on('master', amITheMaster); //if we recieve a 'master' msg, ran the amITheMaster function 
  socket.on('pkg', pkgUpdate); //if we recieve a 'pkg' msg, run the function pkgUpdate
  socket.on('updateRequest', fwdUpdateRequest); //if we recieve a 'updateRequest' msg, run send a pkg marked 'FULLUPDATE'
  ph = new Playhead();
}

function draw() {}

function windowResized() {
  resizeCanvas(windowWidth-3, windowHeight-3);
  ph.update(currentStep, padDivision);
  background(200);
  drawPad(padDivision);
  drawSeqFromPoint(seqStartPoint);
  ph.display(padDivision);
}

function displayData(data){
	console.log('data.clockTick: ', data.clockTick);
	console.log('data.stepCounter: ', data.stepCounter);
}

function drawPad(divider) {
  stroke(1);
  fill(255);
  for (var i = 0; i < divider; i++) {
    for (var j = 0; j < 24; j++) {
      rect((width / divider) * i, (height / rows) * j, width / divider - 2, height / rows - 2); //draw box for each step
    }
  }
}

function drawBox() {
  //reference a 2d array of each note and then fit that 2d array on to the grid
  stateArray[mouseQuantY][(mouseQuantX + seqStartPoint)] = !stateArray[mouseQuantY][(mouseQuantX + seqStartPoint)]; //stateArray is actually Y, then X
  console.log('x:', mouseQuantX + seqStartPoint, 'y:', mouseQuantY)
  console.log(stateArray[mouseQuantY][mouseQuantX + seqStartPoint]);
  noStroke();
  if (stateArray[mouseQuantY][mouseQuantX + seqStartPoint] == true) {
    fill(255, 0, 0);
    rect(((width / padDivision) * mouseQuantX) + 1, ((height / rows) * mouseQuantY) + 1, (width / padDivision) - 3, (height / rows) - 3)
  } else if (stateArray[mouseQuantY][mouseQuantX] == false) {
    fill(255, 255, 255);
    rect(((width / padDivision) * mouseQuantX) + 1, ((height / rows) * mouseQuantY) + 1, (width / padDivision) - 3, (height / rows) - 3)
  }
}

function quantizeClick(currentDivision) {
  for (var i = 0; i < currentDivision; i++) { //for loop counting width
    if (mouseX > i * (width / currentDivision) && mouseX < (i * (width / currentDivision)) + (width / currentDivision)) { //if click is between the height/width points, quantize it to the box's origin
      mouseQuantX = i;
      console.log("newX", mouseQuantX);
    }
  }

  for (var j = 0; j < rows; j++) {
    if (mouseY > j * (height / rows) && mouseY < j * (height / rows) + (height / rows)) {
      mouseQuantY = j;
      console.log("newY", mouseQuantY);
    }
  }
}

function initializeStateArray() {
  for (var i = 0; i < rows; i++) {
    stateArray[i] = [];
    for (var j = 0; j < padDivision; j++) {
      stateArray[i][j] = false;
    }
  }
}

function extendStateArray(newDivision) {
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < newDivision; j++) {
      stateArray[i].push(false);
    }
  }
}

function shortenStateArray() {
  padDivisionHighScore = padDivisionHighScore - 1;
  for (var i = 0; i < rows; i++) {
    stateArray[i].pop();
  }
}

function deleteStateArray(seqLength) {
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < seqLength; j++) {
      stateArray[i].pop();
    }
  }
}

function updateStateArray(data){	//if a pkg msg comes in, run this to make sure we're all working with the same stateArray
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < data.padDivisionHighScore; j++) {
		stateArray[i][j] = data.stateArray[i][j];
		//console.log('hi');
		//console.log(stateArray[i][j]);
		//if(data.stateArray[i][j] == true && stateArray[i][j] == true){console.log('match!')}
	}
  }
  seqStartPoint = data.seqStartPoint;
  //console.log('ssp: ', data.seqStartPoint);
  drawSeqFromPoint(seqStartPoint);
}

function drawSeqFromStart() {
  for (var i = 0; i < rows; i++) { //work through each box and check against array. if TRUE, fill box
    for (var j = 0; j < padDivision; j++) {
      if (stateArray[i][j] == true) {
        noStroke();
        fill(255, 0, 0);
        rect(((width / padDivision) * j) + 1, ((height / rows) * i) + 1, (width / padDivision) - 3, (height / rows) - 3);
      } else if (stateArray[i][j] == false) {
        noStroke();
        fill(255);
        rect(((width / padDivision) * j) + 1, ((height / rows) * i) + 1, (width / padDivision) - 3, (height / rows) - 3);
      }

    }
  }2
}

function drawSeqFromPoint(seqStartPoint) {
  //console.log('getting thru');
  for (var i = 0; i < rows; i++) { //work through each box and check against array. if TRUE, fill box
    for (var j = 0; j < padDivision; j++) {
      //print('hello');
      //print("j minus: ", j-_seqStartPoint);
      if (stateArray[i][j + seqStartPoint] == true) {
        noStroke();
        fill(255, 0, 0);
        rect(((width / padDivision) * j) + 1, ((height / rows) * i) + 1, (width / padDivision) - 3, (height / rows) - 3);
        //print('rect data: ',((width / padDivision) * (j-_seqStartPoint)) + 1, ((height / rows) * i) + 1, (width / padDivision) - 3, (height / rows) - 3);
      } else if (stateArray[i][j + seqStartPoint] == false) {
        noStroke();
        fill(255);
        rect(((width / padDivision) * j) + 1, ((height / rows) * i) + 1, (width / padDivision) - 3, (height / rows) - 3);
        //print('rect data: ',((width / padDivision) * (j-_seqStartPoint)) + 1, ((height / rows) * i) + 1, (width / padDivision) - 3, (height / rows) - 3);
      }

    }
  }
}

function mousePressed() {
  //flip vals in the 2d array and then drawSeq
  quantizeClick(padDivision);
  drawBox(); //draws red boxes and flips booleans
  sendPkg('CLICK');//send pkg updating all other clients
}

function keyPressed() {
  //when adding or subtracting measures, add/subtract from the 2d array
  if (keyCode == DOWN_ARROW) {
		//seqStartPoint = 0;
		background(200);
		if (padDivision >= 16) {
		  padDivision = padDivision + 16;
		} 
		else if (padDivision < 16) {
		  padDivision = padDivision * 2;
		}
		if (seqStartPoint > 0 && padDivision == padDivisionHighScore) {
		  seqStartPoint = 0;	
		}
		drawPad(padDivision);
		drawSeqFromPoint(seqStartPoint);
  } 
	else if (keyCode == UP_ARROW) {
		//seqStartPoint = 0;
		background(200);
		if (padDivision > 16) {
		  padDivision = padDivision - 16;
		} 
		else if (padDivision <= 16) {
		  padDivision = padDivision / 2;
		}
		drawPad(padDivision);
		drawSeqFromPoint(seqStartPoint);
  } 
	else if (keyCode == RIGHT_ARROW) {
		drawPad(padDivision);
		if (seqStartPoint < (padDivisionHighScore - padDivision)) {
			seqStartPoint = seqStartPoint + 1;
		} 
		drawSeqFromPoint(seqStartPoint);
  } 
	else if (keyCode == LEFT_ARROW) {
		drawPad(padDivision);
		if (seqStartPoint > 0) {
		  seqStartPoint = seqStartPoint - 1;
		} 
		drawSeqFromPoint(seqStartPoint);
  } 
	else if (keyCode == CONTROL) {
		seqStartPoint = 0;
		drawSeqFromStart();
  } 
	else if (keyCode == SHIFT) {
		seqStartPoint = 0;
		padDivision = padDivisionHighScore;
		background(200);
		drawPad(padDivision);
		drawSeqFromStart();
  } 
	else if (keyCode == BACKSPACE) {
		//opposite of extending 
		shortenStateArray();
		padDivision = padDivisionHighScore;
		background(200);
		drawPad(padDivision);
		drawSeqFromPoint(seqStartPoint);
		sendPkg('BACKSPACE');
  } 
	else if (keyCode == DELETE) {
		//Set all variables back to their default
		//padDivision, Hi Score, SeqStartPoint, newPadDivision
		newPadDivision = 16;
		seqStartPoint = 0;
		padDivision = 16;
		deleteStateArray(padDivisionHighScore);
		padDivisionHighScore = 16;		
		background(200);
		drawPad(padDivision);
		initializeStateArray();
		sendPkg('DELETE');
  }
	
  else if (key == ' '){
	  console.log('spacebar Pressed');
	  sendPkg('PLAY');
  }
	
//Number keys can change clock to shift subdivisions.
//1 = 1 box per beat. 2 = 2 boxes per beat. 3 = 3 boxes per beat. 4 = 4 boxes per beat. etc...
//DEFINITELY A MORE ELEGANT WAY OF DOING THIS. PLS REFACTOR. IF(KEY == NUMBER){SWITCH CASE}?
	else if (key == '1'){ 
		clkChange(bpm, 1);
	}
	
	else if (key == '2'){ 
		clkChange(bpm, 2);
	}
	
	else if (key == '3'){ 
		clkChange(bpm, 3);
	}
	
	else if (key == '4'){ 
		clkChange(bpm, 4);
	}
	
	else if (key == '5'){ 
		clkChange(bpm, 5);
	}
	
	else if (key == '6'){ 
		clkChange(bpm, 6);
	}
	
	else if (key == '7'){ 
		clkChange(bpm, 7);
	}
	
	else if (key == '8'){ 
		clkChange(bpm, 8);
	}
	
	else if (key == '9'){ 
		clkChange(bpm, 9);
	}
	
	else if (key == '0'){ 
		clkChange(bpm, 10);
	}

  if (padDivision > padDivisionHighScore) {
		newPadDivision = padDivision - padDivisionHighScore;
		extendStateArray(newPadDivision);
		padDivisionHighScore = padDivision;
	    sendPkg('EXTEND');
  }

  /*//drawSeqFromStart();
  for (var i = 0; i < stateArray.length; i++) {
    for (var j = 0; j < stateArray[i].length; j++) {
      //print('posX: ', j, 'posY: ', i, 'val: ', stateArray[i][j]);
      //print('posX: ', j);
    }
  }*/
  print('pad div', padDivision);
  print('hi score', padDivisionHighScore);
  print('new pad div', newPadDivision);
}

function perStep(data) {
  //console.log('data.currentStep: ', data.stepCounter);
  currentStep = data.stepCounter;
  //console.log('currentStep: ', currentStep);	
  if (data.clockTick != lastClockTick) {
    //Advance one row (iterate counter)
    for (var i = 0; i < rows; i++) {
      if (stateArray[i][currentStep] == true) {
        midiConvert(i);
        sendMidiOn(1, convertedMidiNum, 127);
        stateArrayPreviousStep[i] = true; //true was formally "stateArray[i][currentStep]"
      } 
      
      else if (stateArray[i][currentStep] == false) {
        if (stateArrayPreviousStep[i] == true) {
          midiConvert(i);
          sendMidiOff(1, convertedMidiNum, 127);
          stateArrayPreviousStep[i] = false; //false was formally "stateArray[i][currentStep]" 
        } 
        else {/*nothing*/ }
      }
    }
  } 
  else if (data.clockTick == lastClockTick) {/*do nothing*/ }
  lastClockTick = data.clockTick;
  //currentStep++;
  //if(currentStep >= padDivisionHighScore){
  	//currentStep = 0;
  //}
  //else if(currentStep < padDivisionHighScore){} //do nothing
  ph.update(currentStep, padDivision);
  background(200);
  drawPad(padDivision);
  drawSeqFromPoint(seqStartPoint);
  ph.display(padDivision);
  sendPkg('SEQLENGTH'); //send a SEQLENGTH pkg message to server to update the length of the sequence if there's any changes
}

function midiConvert(numToConvert) {
  if (numToConvert <= 23 && numToConvert >= 0) {
    //0-23 -> corresponding midi numbers. Check octave Driver code
    //convertedMidiNum = relevant MIDI number
    convertedMidiNum = (23-numToConvert)+60;
  } 
  else {/*nothing*/ }
}

function sendMidiOn(channel, number, velocity) {
  data = {
    type: 'ON',
    byte1: channel,
    byte2: number,
    byte3: velocity
  }
  if(master == true){socket.emit('midiNote', data);}
  else if(master == false){/*nothing*/}	
  else{/*nothing*/}
  //console.log('midiON sent to server: ', data);
}

function sendMidiOff(channel, number, velocity) {
  data = {
    type: 'OFF',
    byte1: channel,
    byte2: number,
    byte3: velocity
  }
  if(master == true){socket.emit('midiNote', data);}
  else if(master == false){/*nothing*/}	
  else{/*nothing*/}	
  //console.log('midiON sent to server: ', data);
}

function clkChange(tempo, subdivision){
	data = {
		bpm: tempo,
		subdivision: subdivision
	}
	currentSubdivision = data.subdivision;
	socket.emit('clkChange', data);
}

function amITheMaster(data){
	if(data.master == true){master = true; console.log('master?:', master);}
	else if(data.master == false){master = false; console.log('master?:', master);}
}

function sendPkg(type){
	if(type == 'CLICK'){
		data = {
			type: type,
			stateArray: stateArray,
			stateArrayPreviousStep: stateArrayPreviousStep,
			padDivision: padDivision,
			padDivisionHighScore: padDivisionHighScore,
			seqStartPoint: seqStartPoint
		}
	}
	
	else if(type == 'DELETE'){
		data = {
			type: type
		}
	}
	
	else if(type == 'BACKSPACE'){
		data = {
			type: type,
			stateArray: stateArray,
			padDivision: padDivision,
			padDivisionHighScore: padDivisionHighScore,
			seqStartPoint: seqStartPoint
		}
	}
	
	else if(type == 'EXTEND'){
		data = {
			type: type,
			stateArray: stateArray,
			padDivision: padDivision,
			padDivisionHighScore: padDivisionHighScore,
			seqStartPoint: seqStartPoint,
			newPadDivision: newPadDivision 
		}
	}
	
	else if(type == 'SEQLENGTH'){
		data = {
			type: type,
			padDivisionHighScore: padDivisionHighScore
		}
	 	if(master == true){socket.emit('pkg', data);} //if this client is the master, send a SEQLENGTH pkg to server
		else if(master == false){/*nothing*/}
		else{/*nothing*/}
	}
	
	else if(type == 'FULLUPDATE'){
		data = {
			type: type,
			stateArray: stateArray,
			padDivision: padDivision,
			padDivisionHighScore: padDivisionHighScore,
			seqStartPoint: seqStartPoint,
			newPadDivision: newPadDivision 
		}
	}
	
	else if(type == 'PLAY'){
		playState = !playState;
		console.log('playstate: ', playState);
		data = {
			type: 'PLAY',
			playState: playState,
			bpm: bpm, 
			subdivision: currentSubdivision
		}
	}
	
	if(type != 'SEQLENGTH'){socket.emit('pkg', data);} //if this is not a SEQLENGTH msg, send pkg to server
	else if (type == 'SEQLENGTH'){/*nothing*/}
	
}

function pkgUpdate(data){
	//console.log('one from stateArray: ', data.stateArray[4][9]);
	//updateStateArray(data);
	switch(data.type){
			case 'CLICK':
			//run onExternalClick function
				onExternalClick(data);
			break; 
			case 'DELETE':
			//run onExternalDelete function
				onExternalDelete(data);
			break;
			case 'BACKSPACE':
			//run onExternalBackspace function
				onExternalBackspace(data);
			break; 
			case 'EXTEND':
			//run onExternalExtend function
				onExternalExtend(data);
			break;
			case 'SEQLENGTH':
			//run onExternalClk function
				//onExternalClk(data);
			break;
			case 'FULLUPDATE':
				onFullUpdate(data);
			break;
	}
}

function onExternalClick(data){
	stateArrayPreviousStep = data.stateArrayPreviousStep;
	updateStateArray(data);
}

function onExternalDelete(data){
	newPadDivision = 16;
	seqStartPoint = 0;
	padDivision = 16;
	deleteStateArray(padDivisionHighScore);
	padDivisionHighScore = 16;
	background(200);
	drawPad(padDivision);
	initializeStateArray();
	for(var i = 0; i < rows; i++){
		sendMidiOff(1, i, 127);
	}
}

function onExternalBackspace(data){
	shortenStateArray();
	padDivision = padDivisionHighScore;
	background(200);
	drawPad(padDivision);
	drawSeqFromPoint(seqStartPoint);
}

function onExternalExtend(data){
	padDivision = data.padDivision;
	padDivisionHighScore = data.padDivisionHighScore;
	seqStartPoint = data.seqStartPoint;
	newPadDivision = data.newPadDivision
	extendStateArray(newPadDivision);
	drawPad(padDivision);
	drawSeqFromPoint(seqStartPoint);
}

function onFullUpdate(data){
	console.log('latestConnectionID System Works')
	updateStateArray(data);
	if(data.padDivisionHighScore > padDivisionHighScore){
		padDivisionHighScore = data.padDivisionHighScore;
		padDivision = padDivisionHighScore;
		seqStartPoint = data.seqStartPoint;
		newPadDivision = data.newPadDivision
		extendStateArray(newPadDivision);
		drawPad(padDivision);
		drawSeqFromPoint(seqStartPoint);
	}
	
	else if(data.padDivisionHighScore == padDivisionHighScore){
		//padDivision = data.padDivision;
		padDivisionHighScore = data.padDivisionHighScore;
		seqStartPoint = 0;
		//newPadDivision = data.newPadDivision
		drawPad(padDivision);
		drawSeqFromPoint(seqStartPoint);
	}
	
	else if(data.padDivisionHighScore < padDivisionHighScore){
		var distanceToShorten = padDivisionHighScore - data.padDivisionHighScore;
		for(var i = 0; i < distanceToShorten; i++){shortenStateArray();}
		padDivisionHighScore = data.padDivisionHighScore;
		padDivision = padDivisionHighScore;
		background(200);
		drawPad(padDivision);
		drawSeqFromPoint(seqStartPoint);
	}
}

function fwdUpdateRequest(data){
	sendPkg('FULLUPDATE');
}
