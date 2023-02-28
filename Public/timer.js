//this is our master clock object.
//basically just a bpm to millisecs converter
//I thouht it would be a good idea 
//to have a clear timing object, just incase we want to
//run multiple clocks

function MasterClock(){
	this.bpm = 120; 
  this.msecs = 500;
  
  this.changeBpm = function(newBpm){
   	this.msecs = 60000/newBpm;
  }
}