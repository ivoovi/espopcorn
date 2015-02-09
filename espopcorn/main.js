const serial = chrome.serial;
var selected_com = "";
var selected_id = 0;
var isConnected = false;
var text = "";



// LUA styling
var editor_json = CodeMirror.fromTextArea(document.getElementById("edit"), {
    lineNumbers: true,
    mode: "lua",
    gutters: ["CodeMirror-lint-markers"],
    lint: false
  });


/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
var ab2str = function(buf) {
  var bufView = new Uint8Array(buf);
  var encodedString = String.fromCharCode.apply(null, bufView);
  return decodeURIComponent(escape(encodedString));
};

/* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
var str2ab = function(str) {
  var encodedString = unescape(encodeURIComponent(str));
  var bytes = new Uint8Array(encodedString.length);
  for (var i = 0; i < encodedString.length; ++i) {
    bytes[i] = encodedString.charCodeAt(i);
  }
  return bytes.buffer;
};

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////

var SerialConnection = function() {
  this.connectionId = -1;
  this.lineBuffer = "";
  this.boundOnReceive = this.onReceive.bind(this);
  this.boundOnReceiveError = this.onReceiveError.bind(this);
  this.onConnect = new chrome.Event();
  this.onReadLine = new chrome.Event();
  this.onError = new chrome.Event();
};

SerialConnection.prototype.onConnectComplete = function(connectionInfo) {
  if (!connectionInfo) {
    console.log("Connection failed.");
    return;
  }
  this.connectionId = connectionInfo.connectionId;
  selected_id = this.connectionId;

  serial.onReceive.addListener(this.boundOnReceive);
  serial.onReceiveError.addListener(this.boundOnReceiveError);
  this.onConnect.dispatch();
};

SerialConnection.prototype.onReceive = function(receiveInfo) {
  console.log("receive id " + this.connectionId);
  console.log("selected_id " + selected_id);
  console.log(receiveInfo.data);
  if (selected_id !== this.connectionId) {
    return;
  }
  this.lineBuffer += ab2str(receiveInfo.data);

  var index;
  while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
    var line = this.lineBuffer.substr(0, index + 1);
    this.onReadLine.dispatch(line);
    this.lineBuffer = this.lineBuffer.substr(index + 1);
  }


};

SerialConnection.prototype.onReceiveError = function(errorInfo) {
  if (errorInfo.connectionId === this.connectionId) {
    this.onError.dispatch(errorInfo.error);
  }
};

SerialConnection.prototype.getDevices = function(callback) {
  serial.getDevices(callback)
};

SerialConnection.prototype.connect = function(path) {
  serial.connect(path, this.onConnectComplete.bind(this))
};

SerialConnection.prototype.send = function(msg) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.send(this.connectionId, str2ab(msg), function() {});
};

SerialConnection.prototype.disconnect = function() {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  };
SerialConnection.prototype.flush = function(callback) {
  serial.flush(path, console.log("test"))
};

};

////////////////////////////////////////////////////////
////////////////////////////////////////////////////////


function log(msg) {
  var buffer = document.querySelector('#buffer');
  buffer.innerHTML += msg + '<br/>';
}


var connection = new SerialConnection();

connection.onConnect.addListener(function() {
  console.log('I am connected...');
  $('#console').html('connected to ' + selected_com);
  // remove the connection drop-down
  //document.querySelector('#connect_box').style.display = 'none';
  //document.querySelector('#control_box').style.display = 'block';
  // Simply send text to Espruino
  isConnected = true;

  // make all comports gray
  $(".connect_button").css("color","grey");

  // make the connected port green
  $("#" + selected_com).css("color","blue");

  console.log("yellow " + selected_com);

  //connection.send("test\r\n");

  console.log("sending");
});

connection.onReadLine.addListener(function(inLine) {
  console.log('read line: ' + inLine);
  $('#console').prepend(inLine + '<br>');
  /*connection.flush(selected_id, function(result) {
    console.log("flush done ? " + result );
  });*/
  //connection.flush();
  // if the line 'TEMPERATURE=' foo is returned, set the
  // set the button's text
  //if (line.indexOf("TEMPERATURE=")==0)
  //  document.querySelector('#get_temperature').innerHTML = "Temp = "+line.substr(12);
});


// Populate the list of available devices
connection.getDevices(function(ports) {
  // get drop-down port selector
  var dropDown = document.querySelector('#port_list');
  // clear existing options
  dropDown.innerHTML = "";
  // add new options

  var htmlout = "";
  ports.forEach(function (port) {
    var displayName = port.path;

    htmlout += '<td style="padding: 8px"><button id="'+ displayName + '" class="connect_button">' + displayName + '</button></td>';


    console.log("vreemd" + $('#comport').html());
    if (!displayName) displayName = port.path;

    var newOption = document.createElement("option");
    newOption.text = displayName;
    newOption.value = port.path;
    dropDown.appendChild(newOption);
  });
  $('#test').html(htmlout);

  $('#test').trigger('create');
  $(".connect_button").on("click", function() {
    console.log("openCOM(comport) " + this.id);
    openCOM(this.id);
  });
  $(".connect_button").css("color","grey"); // standard color
});


function openCOM(comp) {
    // get the device to connect to
  //var dropDown = document.querySelector('#port_list');
  //var devicePath = dropDown.options[dropDown.selectedIndex].value;
  // connect
  // close the current connection
  if(isConnected) {
    console.log("jojdo");
    console.log("conn " + serial.connectionId);

    serial.disconnect(selected_id, function() {
      console.log("test  disconnect");
    });

    //serial.disconnect(1, function() {
    //  console.log("test  disconnect");
    //});
  }
  selected_com = comp;
  console.log("Connecting to " + comp);
  connection.connect(comp);

}



$("#clear_console").on("click", function() {
  $("#console").html("");
});

$("#upload").on("click", function() {
    //text = ;
    console.log("uploaden... :D");
    //console.log(editor_json.getValue());
    myval = editor_json.getValue().split("\n");
    console.log("lengte )))))  " + myval.length);
    
    
    connection.send(' ');
    setTimeout(function() {
      connection.send('file.open("init.lua","w")\n');
      console.log('** file.open("init.lua","w")');
    }, 400);
    
    $.each(myval, function(n, elem) {
        console.log("N = "+ n);
        //console.log(elem);
        setTimeout(function() {
          connection.send("file.writeline([[" + elem + "]])\n")
          console.log("** " + elem);
        }, 400 * (n+2));
        //n++;
        if (n ==  myval.length - 1) {
            setTimeout(function() {
              connection.send("file.close()\n")
              console.log("** file.close()");
            }, 400 * (n+3));
            setTimeout(function() {
              connection.send("node.restart()\n")
              console.log("** node.restart()");
            }, 400 * (n+4));
        }
    });
    
    
    
    
});
