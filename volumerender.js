;(function() {
"use strict"

var gl, program, buffer, canvas;

window.addEventListener("load", init, false);

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

function init() {
  canvas = document.getElementById("gl-canvas");
  gl = initWebGL(canvas);

  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  initShaders();
  initBuffers();
  initTextures();
  startAnimation();
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

  if (!fragmentShader || !vertexShader) {
    return null;
  }

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

var sphereTexture;

function initTextures() {
  sphereTexture = gl.createTexture();
  var sphereImage = new Image();
  sphereImage.onload = function() {
    handleTextureLoaded(sphereImage, sphereTexture);
  };
  sphereImage.src = "checkers.png";
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

var startTime, animationActive;

function drawScene() {
  var s = window.getComputedStyle(canvas);
  canvas.width = parseInt(s["width"], 10);
  canvas.height = parseInt(s["height"], 10);

  gl.viewport(0, 0, canvas.width, canvas.height);

  var position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  var canvasSize = gl.getUniformLocation(program, "canvasSize");
  gl.uniform2f(canvasSize, canvas.width, canvas.height);

  var t = gl.getUniformLocation(program, "time");
  gl.uniform1f(t, Date.now()-startTime);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
  gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);

  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  if (animationActive) {
    requestAnimationFrame(drawScene);
  }
}

function startAnimation() {
  startTime = Date.now();

  animationActive = true;
  //timer = setInterval(drawScene, 17);
  drawScene();
}

function stopAnimation() {
  animationActive = false;
  //clearInterval(timer);
}

})();
