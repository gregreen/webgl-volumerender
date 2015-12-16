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
  var t0 = Date.now();

  canvas = document.getElementById("gl-canvas");
  gl = initWebGL(canvas);

  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  initShaders();
  initBuffers();
  initTextures();

  var waitInterval = setInterval(function() {
    if(allTexturesLoaded) {
      console.log("Took " + (Date.now() - t0) + " ms to initialize.");
      clearInterval(waitInterval);
      startAnimation();
    }
  }, 10);
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

var sphereTexture = [],
    sphereImage = [],
    nTexturesLoaded = 0,
    allTexturesLoaded = false;

function initTextures() {
  for(var i=0; i<8; i++) {
    sphereTexture[i] = gl.createTexture();
    sphereImage[i] = new Image();
    (function(index) {
      sphereImage[i].onload = function() {
        handleTextureLoaded(sphereImage[index], sphereTexture[index]);
        console.log('Loaded image ' + index);
        console.log('# loaded: ' + (nTexturesLoaded+1));
        if (++nTexturesLoaded >= 8) {
          allTexturesLoaded = true;
          console.log("loaded all images.");
        }
      };
    }(i));
    sphereImage[i].src = "texture_" + i + ".png";
  };
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  //gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

var fps = null;
var tLastFrame = null;

function updateFPS() {
  var tNow = Date.now();

  if (!tLastFrame){
    tLastFrame = tNow;
    return;
  }

  if (!fps) {
    fps = 1000. / (tNow - tLastFrame);
  } else {
    fps = 0.95 * fps + 0.05 * 1000. / (tNow - tLastFrame);
  }

  tLastFrame = tNow;

  document.getElementById("fps").innerHTML = Math.round(fps);
}

var startTime, animationActive;

function drawScene() {
  updateFPS();

  var s = window.getComputedStyle(canvas);
  canvas.width = parseInt(s["width"], 10);
  canvas.height = parseInt(s["height"], 10);

  gl.viewport(0, 0, canvas.width, canvas.height);

  // Screen (x, y)
  var position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  // Canvas size
  var canvasSize = gl.getUniformLocation(program, "canvasSize");
  gl.uniform2f(canvasSize, canvas.width, canvas.height);

  // Time
  var tElapsed = Date.now()-startTime;
  var t = gl.getUniformLocation(program, "time");
  gl.uniform1f(t, tElapsed);

  // Camera origin
  var dOrigin = 0.5 * Math.sin(Math.PI * tElapsed/60000.);
  dOrigin *= dOrigin;

  var xyzCamera = [
    dOrigin * Math.cos(2.*Math.PI * tElapsed/30000.),
    dOrigin * Math.sin(2.*Math.PI * tElapsed/30000.),
    0.5 * Math.sin(2.*Math.PI * tElapsed/45000.)
  ];
  var cameraOrigin = gl.getUniformLocation(program, "cameraOrigin");
  gl.uniform3f(cameraOrigin, xyzCamera[0], xyzCamera[1], xyzCamera[2]);

  // Camera orientation
  var cameraRotMat = make3DRotation(
    Math.PI/2.,
    -Math.PI/2.,
    0.
  );
  cameraRotMat = matrixMultiply(
    makeXRotation(0.15*Math.PI * Math.sin(2.*Math.PI * tElapsed/45000.)),
    cameraRotMat
  );
  cameraRotMat = matrixMultiply(
      cameraRotMat,
      makeZRotation(2.*Math.PI*(tElapsed/15000.))
  );
  var cameraRot = gl.getUniformLocation(program, "cameraRot");
  gl.uniformMatrix4fv(cameraRot, false, cameraRotMat);

  // Texture (to be interpreted as Cartesian projection)
  for(var i=0; i<8; i++) {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, sphereTexture[i]);
  }
  var textureLoc = gl.getUniformLocation(program, "uSampler");
  gl.uniform1iv(textureLoc, [0,1,2,3,4,5,6,7,8]);

  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  if (animationActive) {
    requestAnimationFrame(drawScene);
  }
}

function startAnimation() {
  startTime = Date.now();

  animationActive = true;
  drawScene();
}

function stopAnimation() {
  animationActive = false;
}

function makeXRotation(theta) {
  var c = Math.cos(theta);
  var s = Math.sin(theta);
  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ];
};

function makeYRotation(theta) {
  var c = Math.cos(theta);
  var s = Math.sin(theta);
  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ];
};

function makeZRotation(theta) {
  var c = Math.cos(theta);
  var s = Math.sin(theta);
  return [
     c, s, 0, 0,
    -s, c, 0, 0,
     0, 0, 1, 0,
     0, 0, 0, 1,
  ];
}

function make3DRotation(a, b, g) {
  var matrix = makeZRotation(g);
  matrix = matrixMultiply(matrix, makeYRotation(b));
  matrix = matrixMultiply(matrix, makeXRotation(a));
  return matrix;
}

function matrixMultiply(a, b) {
  var a00 = a[0*4+0];
  var a01 = a[0*4+1];
  var a02 = a[0*4+2];
  var a03 = a[0*4+3];
  var a10 = a[1*4+0];
  var a11 = a[1*4+1];
  var a12 = a[1*4+2];
  var a13 = a[1*4+3];
  var a20 = a[2*4+0];
  var a21 = a[2*4+1];
  var a22 = a[2*4+2];
  var a23 = a[2*4+3];
  var a30 = a[3*4+0];
  var a31 = a[3*4+1];
  var a32 = a[3*4+2];
  var a33 = a[3*4+3];
  var b00 = b[0*4+0];
  var b01 = b[0*4+1];
  var b02 = b[0*4+2];
  var b03 = b[0*4+3];
  var b10 = b[1*4+0];
  var b11 = b[1*4+1];
  var b12 = b[1*4+2];
  var b13 = b[1*4+3];
  var b20 = b[2*4+0];
  var b21 = b[2*4+1];
  var b22 = b[2*4+2];
  var b23 = b[2*4+3];
  var b30 = b[3*4+0];
  var b31 = b[3*4+1];
  var b32 = b[3*4+2];
  var b33 = b[3*4+3];
  return [a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
          a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
          a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
          a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,
          a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
          a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
          a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
          a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,
          a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
          a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
          a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
          a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,
          a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
          a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
          a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
          a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33];
}

})();
