//passo 1 criando canvas

function initGLCanvas(canvasID) {
  var gl;
  var canvas = document.getElementById(canvasID);
  try {
    gl = canvas.getContext("webgl");
	//material de consulta https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
	canvas.width = 256;
	canvas.height = 256;
	gl.viewport(0, 0, canvas.width, canvas.height);
         canvas.addEventListener("mousedown", mouseDown, false);
         canvas.addEventListener("mouseup", mouseUp, false);
         canvas.addEventListener("mouseout", mouseUp, false);
         canvas.addEventListener("mousemove", mouseMove, false);
		 canvas.addEventListener("mouseWheel", mouseWheel, false);			 
  } catch(e){
  }
  if (!gl)
    alert("Não foi possível iniciar o contexto WebGL!");
  return gl;
}




function prepareShader(gl, code, type) {
  var shader;
  if (type == "x-shader/x-fragment") {
	  //passo 4.1 criando shader
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
  gl.shaderSource(shader, code);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}
//4.2 Iniciando shader
function initGPUProgram(gl, vcode, fcode) {
  var fShader = prepareShader(gl, vcode.innerHTML, vcode.type);
  var vShader = prepareShader(gl, fcode.innerHTML, fcode.type);
  var sProgram = gl.createProgram();
  if (vShader);
    gl.attachShader(sProgram, vShader);
  if (fShader);
    gl.attachShader(sProgram, fShader);
  gl.linkProgram(sProgram);
  if (!gl.getProgramParameter(sProgram, gl.LINK_STATUS)) {
    alert("Erro: Shaders não puderam ser carregados corretamente!");
    return null;
  }
  gl.useProgram(sProgram);
  return sProgram;
}

function copyData(gl, data, dataTypeFunc, bufferType) {
  var buffer = gl.createBuffer();
  gl.bindBuffer( bufferType, buffer );
  gl.bufferData( bufferType, new dataTypeFunc(data), gl.STATIC_DRAW );
  gl.bindBuffer( bufferType, null );
  return buffer;
}


function useArray(gl, buffer, dimension, type, program, attribute) {
  gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
  var attLoc = gl.getAttribLocation(program, attribute);
  gl.vertexAttribPointer(attLoc, dimension, type, false, 0, 0);
  gl.enableVertexAttribArray(attLoc);
}

function initData(gl, data, dimension, type, program, attribute) {
  var dataTypeFunc;
  if (type == gl.FLOAT) {
    dataTypeFunc = Float32Array;
  } else if (type == gl.UNSIGNED_INT) {
    dataTypeFunc = Uint32Array;
  } else if (type == gl.INT) {
    dataTypeFunc = Int32Array;
  } else if (type == gl.UNSIGNED_SHORT) {
    dataTypeFunc = Uint16Array;
  } else if (type == gl.SHORT) {
    dataTypeFunc = Int16Array;
  } else if (type == gl.UNSIGNED_BYTE) {
    dataTypeFunc = Uint8Array;
  } else if (type == gl.BYTE) {
    dataTypeFunc = Int8Array;
  }
  var buffer = copyData(gl, data, dataTypeFunc, gl.ARRAY_BUFFER);
  useArray(gl, buffer, dimension, type, program, attribute);
  return buffer;
}




var m4 = { // O objeto m4 é um dicionário de funções úteis relacionadas à transformações geométricas
    ortho: function(width, height, depth) {
        return [
                2 / width, 0, 0, 0,
                0, 2 / height, 0, 0,
                0, 0, -2 / depth, 0,
                -1, -1, 1, 1,
                ];
    },
	    scaling: function(sx, sy, sz) {
        return [
                sx, 0,  0,  0,
                0, sy,  0,  0,
                0,  0, sz,  0,
                0,  0,  0,  1,
                ];
    },
	    multiply: function(a, b) {
        return [
                a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12],
                a[0] * b[1] + a[1] * b[5] + a[2] * b[9] + a[3] * b[13],
                a[0] * b[2] + a[1] * b[6] + a[2] * b[10] + a[3] * b[14],
                a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3] * b[15],
                a[4] * b[0] + a[5] * b[4] + a[6] * b[8] + a[7] * b[12],
                a[4] * b[1] + a[5] * b[5] + a[6] * b[9] + a[7] * b[13],
                a[4] * b[2] + a[5] * b[6] + a[6] * b[10] + a[7] * b[14],
                a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7] * b[15],
                a[8] * b[0] + a[9] * b[4] + a[10] * b[8] + a[11] * b[12],
                a[8] * b[1] + a[9] * b[5] + a[10] * b[9] + a[11] * b[13],
                a[8] * b[2] + a[9] * b[6] + a[10] * b[10] + a[11] * b[14],
                a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11] * b[15],
                a[12] * b[0] + a[13] * b[4] + a[14] * b[8] + a[15] * b[12],
                a[12] * b[1] + a[13] * b[5] + a[14] * b[9] + a[15] * b[13],
                a[12] * b[2] + a[13] * b[6] + a[14] * b[10] + a[15] * b[14],
                a[12] * b[3] + a[13] * b[7] + a[14] * b[11] + a[15] * b[15],
                ];
    },
	    xRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
                1, 0, 0, 0,
                0, c,-s, 0,
                0, s, c, 0,
                0, 0, 0, 1,
                ];
    },
    yRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
                c, 0, s, 0,
                0, 1, 0, 0,
                -s, 0, c, 0,
                0, 0, 0, 1,
                ];
    },
    zRotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
                c,-s, 0, 0,
                s, c, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
                ];
    },
    translation: function(tx, ty, tz) {
        return [
                1,  0,  0, 0,
                0,  1,  0, 0,
                0,  0,  1, 0,
                tx, ty, tz, 1,
                ];
       
    },
    translate: function(m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    },
    xRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
    },
    yRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
    },
    zRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
    },
    scale: function(m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
    },
    identity: function() {
        return [
                1,  0,  0,  0,
                0,  1,  0,  0,
                0,  0,  1,  0,
                0,  0,  0,  1,
                ];
    },
	    perspective: function(fieldOfViewInRadians, aspect, near, far) {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        var rangeInv = 1.0 / (near - far);
        return [
                f / aspect, 0, 0, 0,
                0, f, 0, 0,
                0, 0, (near + far) * rangeInv, -1,
                0, 0, near * far * rangeInv * 2, 0
                ];
    },/* As funções aqui devem ser separadas por vírgulas e adota-se o padrão <nomeDeAcesso> : <definiçãoDaFunção> */
};
function radians(degrees) {
    return degrees * Math.PI / 180;
}
//Eventos de Teclado
var currentlyPressedKeys = {};
var handleKeyDown = function (event) {
    currentlyPressedKeys[event.keyCode] = true;
};
var handleKeyUp = function (event) {
    currentlyPressedKeys[event.keyCode] = false;
};
var handleKeys = function () {
    if (currentlyPressedKeys[81]) // q Key
        zSpeed -= 5;
    if (currentlyPressedKeys[69]) // e Down
        zSpeed += 5;
    if (currentlyPressedKeys[65]) // a key
        ySpeed -= 5;
    if (currentlyPressedKeys[68]) // d key
        ySpeed += 5;
    if (currentlyPressedKeys[87]) // w key
        xSpeed -= 5;
    if (currentlyPressedKeys[83]) // s key
        xSpeed += 5;
    if (currentlyPressedKeys[82]) // r key
        z -= 0.05;
    if (currentlyPressedKeys[70]) // f key
        z += 0.05;
}
var xRot, yRot, zRot, xSpeed, ySpeed, zSpeed;
var amortization = 0.93;
var z = -10.0;
xRot = yRot = zRot = xSpeed = ySpeed = zSpeed = 0.0;
document.onkeydown = handleKeyDown;
document.onkeyup = handleKeyUp;


//Eventos de Mouse
         var drag = false;		
         var mouseDown = function(e) {
            drag = true;
			//guarda a posição do x,y do mouse
			old_x = event.pageX, old_y = event.pageY;
            event.preventDefault();
            return false;
         };
         
         var mouseUp = function(e){
            drag = false;
         };
         
         var mouseMove = function(e) {
            if (!drag) return false;
            dX = (event.pageX-old_x),
            dY = (event.pageY-old_y);
            dZ = (event.pageZ)			
            if(dX>0)
				ySpeed-=0.6;
			if(dX<0)
				ySpeed+=0.6;
		    if(dY>0)
				xSpeed-=0.6;
			if(dY<0)
				xSpeed+=0.6;
            old_x = event.pageX, old_y = event.pageY;			
            event.preventDefault();
         };

		 var mouseWheel = function(e) {
		 
		    if (event.wheelDelta = 0) ;
			var delta =  event.wheelDelta;
			if  (delta > 0)
				z -= 0.05;;
			if (delta < 0)
				z += 0.05;
            return false;
		 }
//Função de Indices
function initIndices(gl, indices) {
    var index_buffer = gl.createBuffer ();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return index_buffer;
}

