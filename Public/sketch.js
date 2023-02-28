//BIG Q: how do we tell which instance of this code connects first? 

var c = new Object(); //colours variable
var interval;
var play = true;
var timer;
var counter = 1; 
var beats = 120;
var stepArray = [16];
var socket;
var data;
var portData;
var master = true; 

function setup() {
  createCanvas(400, 400);
  background(220);
  socket = io.connect('http://localhost:3001');
  socket.on('seq', newSeq); //if we recieve a msg called 'seq', run function newSeq
  //socket.on('clk', newClk); //if we recieve a msg called 'seq', run function newSeq	
  box = new Box();
  clk = new MasterClock();
  ph = new Playhead();
  clk.changeBpm(beats);
  //if(master){run setInterval}
  //if(recieving){call perStep every time there's a clk msg}
  interval = setInterval(perStep, clk.msecs);
  //assign colour values
  c.r = 255;
  c.g = 255;
  c.b = 255;
  //build grid
  noStroke();
  //strokeWeight(0);
	for(var i = 0; i < 16; i++){
		rect(25*i, 175, 24, 24); //draw box for each step
    stepArray[i] = false; //set every step to false
	}
}

function perStep(){ //perStep(recievedClk)
 //if(master){send counter out to be broadcast on 'clock'
	//data = {
	//	clk: counter
	//}
	//socket.emit('clk', data);
	//run rest of function in here
//}
 //else if(recieving){run function normally but replace counter with recievedClk}
 fill(220);
 noStroke();
 rect(40, 40, 50, 50);
 rect(190, 40, 50, 50); 
 fill(0);
 text(counter, 50, 50);
 text(beats, 200, 50); 
 ph.update(counter);
 if(counter == 16){counter = 0;}
  counter++;
}

function draw() {
  noStroke();
  for(var i = 0; i < 16; i++){
    if(stepArray[i] == true){
    	fill(255, 0, 0);
    }
    if(stepArray[i] == false){fill(255);}
		rect(25*i, 175, 24, 24); //draw box for each step
	}
  
  ph.display();
}

function mousePressed(){
  if(c.g == 0){
    c.r = 255;
    c.g = 255; 
    c.b = 255;
  }
  else {
    c.r = 255;
    c.g = 0; 
    c.b = 0;
  }
  box.quantizeClick();
  box.display(c.r, c.g, c.b); 
  box.updateArray(stepArray);
	
  data = {
		stepPkg: stepArray,
		clear: 0
	}
	
	socket.emit('seq', data);
}

function keyPressed(){
  if(keyCode == UP_ARROW){
  	beats = beats + 1;
    clk.changeBpm(beats);
    clearInterval(interval);
    interval = setInterval(perStep, clk.msecs);
  }
  
  if(keyCode == DOWN_ARROW){
  	beats = beats - 1;
    clk.changeBpm(beats);
    clearInterval(interval);
    interval = setInterval(perStep, clk.msecs);
    console.log(stepArray);
  }
	  
  else if(key == '1' || key == '2' || key == '3' || key == '0'){
	console.log(key);
	portData = { newPort: Number(key) }
	socket.emit('portChange', portData);  
  }
}

function newSeq(data){
	console.log('recieving:' + data.stepPkg); //stepPkg will be the stepArray sent over socket
	//console.log('recievingMIDI:' + data.midiX + ',' + data.midiY);
	//if(data.clear === true){fill(0, 255, 100);}
	//if(data.clear === false){fill(200);}
	//ellipse(data.x, data.y, 20, 20);	
	for(var i = 0; i < 16; i++){
	  stepArray[i] = data.stepPkg[i];	
	}
	
	
}

function newClk(data){
	//perStep(data.clk);
	
}
