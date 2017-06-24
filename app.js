var gl = initGLCanvas("app_canvas"); // Inicializando o contexto WebGL no Canvas.

var resizeCanvas = function () { // Definição da função de redimensionamento.
    document.body.style.margin = 0;
    var menu = document.getElementById("menu");
    gl.canvas.width = window.innerWidth * menu.i_width.value / 100.0;
    gl.canvas.height = window.innerHeight * menu.i_height.value / 100.0;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    redraw();
};

var changeCtrls = function(){
    var menu = document.getElementById('menu');
    var ctrls = document.getElementById('hCtrl');
    if (menu.hColor.checked) {
        ctrls.style.display = "block";
    } else {
        ctrls.style.display = "none";
    }
}

var changeFileButtom = function (){
    var fileUpload = document.getElementById("fileUpload"),
    uploadLabel = document.querySelector("label[for='fileUpload']"),
    fileInsert = document.createElement("button");
    fileInsert.id = "fileSelector";
    fileInsert.innerHTML = uploadLabel.innerHTML;
    fileInsert.style.cursor = 'pointer';
    fileUpload.parentNode.insertBefore(fileInsert, fileUpload.nextSibling);
    fileUpload.style.display = "none";
    uploadLabel.style.display = "none";
    fileInsert.addEventListener('click', function(e){e.preventDefault(); fileUpload.click();}, false);
};
changeFileButtom();

var vcode = document.getElementById("vs-code");
var fcode = document.getElementById("fs-code");
var gpuProgram = initGPUProgram(gl, vcode, fcode); // Inicializando o programa em GPU
var colors;
var colorBuffer;
var randomColors = function (data) { // Atribui cores randômicas para cada vértice
    colors = [];
    for (i in data) {
        colors.push(Math.random());
    }
    colorBuffer = initData(gl, colors, 3, gl.FLOAT, gpuProgram, "color");
}

// função minimo e maximo

var min, max;

var getMax = function (data) {
    var i;
    if (data.length < 3)
        return 0.0;
    var max = [data[0], data[1], data[2]];
    for (i = 3; i < data.length; i += 3) {
        if (data[i] > max[0])
            max[0] = data[i];
        if (data[i+1] > max[1])
            max[1] = data[i+1];
        if (data[i+2] > max[2])
            max[2] = data[i+2];
    }
    return max;
};
var getMin = function (data) {
    var i;
    if (data.length < 3)
        return 0.0;
    var min = [data[0], data[1], data[2]];
    for (i = 3; i < data.length; i += 3) {
        if (data[i] < min[0])
            min[0] = data[i];
        if (data[i+1] < min[1])
            min[1] = data[i+1];
        if (data[i+2] < min[2])
            min[2] = data[i+2];
    }
    return min;
};


var nPoints, nFaces;
var data, indices;
var vertexBuffer, indexBuffer;
var loadData = function (textData,files) {
    var dim = 3;
    if (files && files.name.split(".").pop() == "ply") {
        var model = ply_reader(textData);
        data = model.vertices;
        indices = model.faces;
        indexBuffer = initIndices(gl, indices);
        nFaces = indices.length;
    } else {
        nFaces = 0;
        data = eval("[" + textData + "]");
    }
    vertexBuffer = initData(gl, data, dim, gl.FLOAT, gpuProgram, "coord");
    nPoints = Math.floor(data.length/dim);
    randomColors(data);
    min = getMin(data);
    max = getMax(data);
}
vertexBuffer = loadData(`
                        0.9, 0.9, 0.9,
                        0.9, -0.9, 0.9,
                        -0.9, -0.9, 0.9,
                        -0.9, 0.9, 0.9,
                        -0.9, -0.9, -0.9,
                        0.9, -0.9, -0.9,
                        0.9, 0.9, -0.9,
                        -0.9, 0.9, -0.9,
                        `);

											
    min = getMin(data);
    max = getMax(data);	

var loadFile = function (input) {
    var reader = new FileReader();
    reader.addEventListener("load", function (event) {
                            loadData(event.target.result, input.files[0]);
                            });
    reader.readAsText(input.files[0]);

};


//função de redesenho.
var pMatrix, vMatrix, mMatrix;
var u_proj  = gl.getUniformLocation(gpuProgram, "u_proj");
var u_model  = gl.getUniformLocation(gpuProgram, "u_model");
var u_limit = gl.getUniformLocation(gpuProgram, "u_limit");
var redraw = function () {
    handleKeys();
   
    if (document.getElementById('menu').hColor.checked) {
        var minColor = document.getElementById('menu').sColor.value;
        var maxColor = document.getElementById('menu').eColor.value;
        gl.uniform4fv(u_limit, [min[2], max[2], minColor, maxColor]);
    } else {
        gl.uniform4fv(u_limit, [0.0, 0.0, 0.0, 0.0]);
    }
   
    mMatrix = m4.xRotate(m4.identity(), radians(xRot));
    mMatrix = m4.yRotate(mMatrix, radians(yRot));
    mMatrix = m4.zRotate(mMatrix, radians(zRot));
    if (document.getElementById("menu").projMode.value == "ortho") {
        var aspect = gl.canvas.width / gl.canvas.height;
        var oDev = - 0.5 * z;                                           // Desvio da origem
        var zFactor =  - gl.canvas.height / z;                  // Fator de zoom assumido aspecto > 1.0
        pMatrix = m4.ortho(gl.canvas.width, gl.canvas.height, gl.canvas.width);
        mMatrix = m4.translate(mMatrix, oDev * aspect, oDev,  oDev);
        mMatrix = m4.scale(mMatrix, zFactor, zFactor, zFactor);
    } else {
        pMatrix = m4.perspective(radians(45), gl.canvas.width / gl.canvas.height, 0.1, 100.0);
        mMatrix = m4.translate(mMatrix, 0.0, 0.0, z);
    }
    gl.uniformMatrix4fv(u_model, false, mMatrix);
    gl.uniformMatrix4fv(u_proj, false, pMatrix);
    gl.enable(gl.DEPTH_TEST);
    gl.clearDepth(1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (nFaces) {
        gl.drawElements(eval(document.getElementById("primitives").value), nFaces, gl.UNSIGNED_SHORT, 0);
    } else {
        gl.drawArrays(eval(document.getElementById("primitives").value), 0, nPoints);
    }
};
redraw();

// função de animação
var lastTime = 0;
var animate = function (time) {
											
    if (lastTime != 0) {
        var elapsed = time - lastTime;
        xRot += (xSpeed * elapsed) / 500.0;
        yRot += (ySpeed * elapsed) / 500.0;
        zRot += (zSpeed * elapsed) / 500.0;
        xSpeed *= amortization;
        ySpeed *= amortization;
        zSpeed *= amortization;
    }
    lastTime = time;
    redraw();
    requestAnimationFrame(animate);
	
};
animate(0);


var ctrlV = [];
var ctrlC = [];
var pointAtArc = function (r, t) {
    var p1 = r*Math.cos(t);
    var p2 = r*Math.sin(t);
    return [p1, p2];
}
var makeArcs = function (s) {
    var n = s*4;
    // Pontos no plano XY
    for (var i = 0; i <= 2*Math.PI; i += 2*Math.PI/n) {
        var pt = pointAtArc(Math.sqrt(2), i);
        ctrlV.push(pt[0]);
        ctrlV.push(pt[1]);
        ctrlV.push(0);
        ctrlC.push(pt[0]/Math.sqrt(2));
        ctrlC.push(pt[1]/Math.sqrt(2));
        ctrlC.push(0.5);
    }
    // 1/4 dos pontos no plano XZ
	
    for (var i = 0; i <= 0.5*Math.PI; i += 2*Math.PI/n) {
        var pt = pointAtArc(Math.sqrt(2), i);
        ctrlV.push(pt[0]);
        ctrlV.push(0);
        ctrlV.push(pt[1]);
        ctrlC.push(pt[0]/Math.sqrt(2));
        ctrlC.push(0.5);
        ctrlC.push(pt[1]/Math.sqrt(2));
    }
    // Pontos no plano YZ
    for (var i = 0; i <= 2*Math.PI; i += 2*Math.PI/n) {
        var pt = pointAtArc(Math.sqrt(2), i);
        ctrlV.push(0);
        ctrlV.push(pt[1]);
        ctrlV.push(pt[0]);
        ctrlC.push(0.5);
        ctrlC.push(pt[1]/Math.sqrt(2));
        ctrlC.push(pt[0]/Math.sqrt(2));
    }
	
  // 3/4 dos pontos restantes no plano XZ
    for (var i = 0.5*Math.PI; i <= 2*Math.PI; i += 2*Math.PI/n) {
        var pt = pointAtArc(Math.sqrt(2), i);
        ctrlV.push(pt[0]);
        ctrlV.push(0);
        ctrlV.push(pt[1]);
        ctrlC.push(pt[0]/Math.sqrt(2));
        ctrlC.push(0.5);
        ctrlC.push(pt[1]/Math.sqrt(2));
    }
	
    dim = 3;
    nFaces = 0;
    nPoints = Math.floor(ctrlV.length/dim);
    min = getMin(ctrlV);
    max = getMax(ctrlV);
    vertexBuffer = initData(gl, ctrlV, dim, gl.FLOAT, gpuProgram, "coord");
    colorBuffer = initData(gl, ctrlC, dim, gl.FLOAT, gpuProgram, "color");
}
makeArcs(10);