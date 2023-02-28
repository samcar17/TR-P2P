function Playhead(){
  var playPos = 0; //the playhead x position
  var oldPos = 0;
  this.update = function(stepNum, padDivision){
    playPos = (width/padDivision)*stepNum;
    oldPos = playPos;
  }
  
  this.display = function(padDivision){
    noStroke();
    fill(150, 0, 130, 120); // colour any new shapes
  	rect(playPos, 0, (width/padDivision)-2, height);
  }
}