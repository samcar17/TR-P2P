//Setting up the REDBOX object
function Box(){
  
  this.quantizedX = width / 2;
  this.quantizedY = height / 2; 
  stepQuantizer = 0;
  
  this.quantizeClick = function() {
    for (var i = 0; i < 16; i++) {
      if (mouseX > i * (width / 16) && mouseX < (i * (width / 16)) + (width / 16)) {
        Box.quantizedX = i * (width / 16);
        stepQuantizer = i;
      }
      if (true) {
        Box.quantizedY = 7 * (width / 16);
      }
    }
  };

  this.display = function(r, g, b) {
    //strokeWeight(1); //outline in number of pixels
    //stroke(0); //outline colour
    noStroke();
    fill(r, g, b); // colour any new shapes
    rect(Box.quantizedX, Box.quantizedY, 24, 24); //x, y, width, height
    //calling the vector values for location with location.x etc.. 
  }
  
  this.updateArray = function(inputArray){
  	if(inputArray[stepQuantizer] == false){
      inputArray[stepQuantizer] = true;
    }
    else if(inputArray[stepQuantizer] == true){
      inputArray[stepQuantizer] = false;
    }
  }
}