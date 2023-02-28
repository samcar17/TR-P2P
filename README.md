# TR-P2P

Archival repo. Node.js server and p5.js client for a networked MIDI sequencer. Made for a VUW Summer Scholarship in 2018/2019. 

This was my first web project, and it worked remarkably well, with few timing issues. The concept was to make a piano roll-style sequencer (like the Synthstrom Deluge) that could be edited/played communally, similar to a Google doc. It was demonstrated at Te Wā Heke Festival in 2019, where it was used to control a combination of synths and acoustic drums played by robots. It was also stress tested by many, many kids that day and didn't break or go out of time(!). Despite this, it was a project with a time limit, so I'm sure there are some bugs in there somewhere. It's probably best to use the code for reference only. 

Some images from the festival:

![IMG_20190524_131506](https://user-images.githubusercontent.com/115618191/221753440-d7c70b06-4b26-4efe-8639-d965bbd9f8e3.jpg)
![IMG_20190524_130835](https://user-images.githubusercontent.com/115618191/221753453-3ff05b40-ffef-44c4-bca3-6dbfd6da8236.jpg)


I can't remember too much about the technical details of this project, but will paste the documentation for the server below, in case it helps anyone (incl. future me) decode it. 

---------------

## Quick Reference
A list of all the messages you can send and receive from the server. 

### pkg
If one client sends a ‘pkg’ message to the server, it will send this message to all clients (excluding itself). There is no set form or protocol for this message, so use it for any inter-client communication you like.

If you have a variable within your ‘pkg’ message called data.type there are three actions that can be used by setting data.type to a certain string. 

Sending a ‘pkg’ message with ‘SEQLENGTH’ allocated to data.type will allow you to change the length of the server’s internal stepCounter through sending a second variable in the ‘pkg’ message called data.padDivisionHighScore (this name will be changed in future). For this to work, data.padDivisionHighScore should be set to the number of steps you want the counter to iterate through before resetting to 0. 

Sending a ‘pkg’ message with ‘FULLUPDATE’ allocated to data.type will send the ‘pkg’ message directly to the most recently connected client and no other clients. See also: updateRequest.

Sending a ‘pkg’ message with ‘PLAY’ allocated to data.type will alternately stop/restart the server’s internal clock, as well as its stepCounter.

Examples of these can be found in the demo client example on Github. 

### pkgMe
If one client sends a ‘pkgMe’ message to the server, it will send this message to all clients (including itself). There is no set form or protocol for this message, so use it for any inter-client communication you like.

### midiNote
Use a ‘midiNote’ message to send the server MIDI note data that you want it to output. Note that the format for these messages is abstracted slightly from conventional MIDI and includes an extra byte to specify the type of message.
data.type: On/Off/CC assignment, string		|	String. Either ‘ON’, ‘OFF’, or ‘CC’
data.byte1: channel					|	Int. 1 - 16
data.byte2: note/cc number			|	Int. 1 - 127
data.byte3: velocity/cc val				|	Int. 1 - 127

### midiCC
Use a ‘midiCC’ message to send the server MIDI CC data that you want it to output. Note that the format for these messages is abstracted slightly from conventional MIDI and includes an extra byte to specify the type of message.
data.type: On/Off/CC assignment, string		|	String. Either ‘ON’, ‘OFF’, or ‘CC’
data.byte1: channel					|	Int. 1 - 16
data.byte2: note/cc number			|	Int. 1 - 127
data.byte3: velocity/cc val				|	Int. 1 - 127

### clkSend
The server’s clock outputs an alternating boolean value broadcast to all clients that can be accessed as data.clockTick. This value comes packaged in a ‘clkSend’ message. If you wanted to call a function on every clock message, you would use a line such as: 

`
//if we recieve a msg called 'clkSend', run the function perStep
socket.on('clkSend', perStep); 
`

Likewise, to access the clockTick value within the function, we could call data.clockTick: 

`
var lastClockTick;
function perStep(data) {
  if (data.clockTick != lastClockTick) {
         console.log(‘take another step’);
         lastClockTick = data.clockTick;
  }
}
`

### clkStart
Send a ‘clkStart’ message to the server to start its internal clock. This message has no variables so you just need to send: 

`socket.emit(‘clkStart’, data) //data is empty here - it’s just a placeholder`

### clkChange
Send a ‘clkChange’ message to the server to change the tempo or subdivision of the server’s clock. This message is formatted in two bytes, bpm and subdivision. bpm reads a bpm value (an int from 1 upwards), and subdivision reads an int from 1 - 10 that divides the global bpm value, allowing the sequencer to be clocked at subdivisions of a global tempo. Subdivision seems redundant in the current iteration of the server, but will be an interesting feature once the global tempo can be synced to a MIDI clock (though this could be a while). For now, treat it as an experimental feature and know that setting it to 4 will produce semiquavers of the global bpm. 

Regardless, a clkChange message is sent like this:

`
data = {
    bpm: 120,
    subdivision: 4
}
socket.emit(‘clkChange’, data);
`

This will stop the current clock (which sends to all clients), and start a new clock at the new tempo/subdivision. 

### clkStop
The ‘clkStop’ message is the same as the ‘clkStart’ message above, only it stops the current clock and does not start it again. Similarly, there are no variables assigned to this message, so data is just an empty placeholder. 

`socket.emit(‘clkStop’, data);`

### portChange
Sending the server a ‘portChange’ message will will change the output port it’s sending MIDI on. A list of the available ports will be displayed upon the server’s startup, along with corresponding numbers. Use these number to select the relevant output port. Input ports are currently not able to be changed like the output ports are, but this is on my radar. 

A portChange message is sent like this:

`
data = {
    newPort: relevantOutputPortNumber //e.g. 2
}
socket.emit(‘portChange’, data);
`

### master
The server always picks one ‘master’ client. This indication doesn’t have to mean anything but it can be a useful way of reducing the amount of MIDI messages sending to the server (keeping it from potentially getting confused). Initially, the first connection to the server will be considered the master, and the server will send it a master message. To receive this message, use a line similar to this in the client: 

`
socket.on('master', amITheMaster);   	//if we recieve a 'master' msg, run the function amITheMaster
`

Then, within the relevant function, assign the variable data.master. This variable being true means the client has been assigned as the master. If it’s false, the client is not the master. 

`
var master;
function amITheMaster(data){
	if(data.master == true){master = true; console.log('master?: ', master);}
	else if(data.master == false){master = false; console.log('master?: ', master);}
}
`

Upon a master client exiting their window/terminating the connection, the server picks randomly from all the connected clients and chooses one of them to be the new master client. The code above should allow for the re-assigning of the client’s status.

### updateRequest
Upon the connection of any extra client after the initial one (i.e. if the number of connections is more than 1), the server will send the client an updateRequest message to the master client. This is a prompt to ask the masterClient if there has been any changes in its state between now and its initial state. This message can be ignored if not needed, but otherwise can be received through a line in the client like this: 

`
socket.on('updateRequest', sendUpdate);	//if we recieve a 'master' msg, run the sendUpdate function
`

One use for this is triggering a ‘FULLUPDATE’ pkg to update the most recent client. This could be done in the sendUpdate function mentioned above. 

`
function sendUpdate(){
	sendPkg(‘FULLUPDATE’);
}	

function sendPkg(type){
	if(type == ‘FULLUPDATE’){
		type: type,
		//enter more data here to update the client here
}
}		
`
 .






