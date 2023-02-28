function Clk(){
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
	
	this.stop = function(){
		//nothing here yet
	}
}