;(function() {
"use strict"

var gl, program, buffer, canvas;

window.addEventListener("load", start, false);

function initWebGL(canvas) {
  gl = null;

  try {
    gl = canvas.getContext("webgl") || canvas.getContext("expeimental-webgl");
  } catch(e) {}

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }

  return gl;
}

function start() {
  canvas = document.getElementById("gl-canvas");
  gl = initWebGL(canvas);

  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  initShaders();
  initBuffers();
  drawScene();
}

function compileShader(id) {
  var shaderScript = document.getElementById(id);
  var source = shaderScript.innerHTML;

  var shader;

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  // Check if compilation succeeded
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the " + shaderScript.type + " shader.");
    return null;
  }

  return shader;
}

function initShaders() {
  var fragmentShader = compileShader("fragment-shader");
  var vertexShader = compileShader("vertex-shader");

  program = gl.createProgram();
  gl.attachShader(program, fragmentShader);
  gl.attachShader(program, vertexShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var linkErrLog = gl.getProgramInfoLog(program);
    alert("Unable to initialze the shader program: " + linkErrLog);
    return null;
  }

  gl.useProgram(program);
}

function initBuffers() {
  buffer = gl.createBuffer();
  var vertices = [
    -1,-1,  1,-1, -1,1, // Fist triangle
    -1, 1,  1,-1,  1,1  // Second triangle
  ];

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertices),
    gl.STATIC_DRAW
  );
}

function drawScene() {
  var position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  var canvasSize = gl.getUniformLocation(program, "canvasSize");
  gl.uniform2f(canvasSize, canvas.width, canvas.height);

  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

})();
