import React, { useEffect, useRef } from 'react';

function InteractiveShaderBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      powerPreference: 'high-performance',
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false
    });

    if (!gl) return;

    // High-performance high-definition vertex shader
    const vertexSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Premium HD Domain-Warped Fluid Aurora Fragment Shader
    const fragmentSource = `
      precision highp float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      varying vec2 vUv;

      // High precision noise functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 a0 = x - floor(x + 0.5);
        vec3 g = a0 * vec3(x0.x,x12.xz) + h * vec3(x0.y,x12.yw);
        vec3 l = 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 r = g * l;
        return 130.0 * dot(m, r);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 4; i++) {
          value += amplitude * snoise(p * frequency);
          frequency *= 2.1;
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        // Aspect ratio correction
        vec2 st = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
        vec2 mouseSt = (uMouse - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
        
        // Fluid domain warping
        vec2 q = vec2(0.0);
        q.x = fbm(st + 0.05 * uTime);
        q.y = fbm(st + vec2(1.0));

        vec2 r = vec2(0.0);
        r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * uTime);
        r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * uTime);

        float f = fbm(st + r);

        // Deep Lumina Space Palette
        vec3 bgColor = vec3(0.02, 0.03, 0.06);           // Deepest Cosmic Navy #050810
        vec3 electricSky = vec3(0.0, 0.74, 1.0);         // Vibrant Electric Blue #00bcff
        vec3 emeraldGlow = vec3(0.05, 0.82, 0.55);        // Vivid Emerald #0dd18c
        vec3 deepViolet = vec3(0.35, 0.2, 0.85);         // High Density Violet #5933d9

        // Layer color blending with domain warp
        vec3 color = mix(bgColor, deepViolet, clamp(f * f * 3.0, 0.0, 1.0));
        color = mix(color, electricSky, clamp(length(q), 0.0, 1.0) * 0.45);
        color = mix(color, emeraldGlow, clamp(length(r.x), 0.0, 1.0) * 0.35);

        // Mouse Cursor Magnetic Energy Glow
        float mouseDist = length(st - mouseSt);
        float mouseGlow = smoothstep(0.4, 0.0, mouseDist);
        mouseGlow = pow(mouseGlow, 2.5);

        // Add electric aura around cursor
        color += electricSky * mouseGlow * 0.45;
        color += emeraldGlow * pow(mouseGlow, 1.5) * 0.25;

        // Subtle ambient vignette
        float vignette = 1.0 - length(st * 0.7);
        color *= clamp(vignette, 0.3, 1.0);

        // Atmospheric micro-grain to prevent color banding on 4K screens
        float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.015;
        color += grain;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function createShader(glCtx, type, source) {
      const shader = glCtx.createShader(type);
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error(glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'uTime');
    const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
    const mouseLocation = gl.getUniformLocation(program, 'uMouse');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Instantaneous real-time mouse tracking
    let mouseX = (window.innerWidth / 2) * dpr;
    let mouseY = (window.innerHeight / 2) * dpr;

    const resize = () => {
      const width = window.innerWidth * dpr;
      const height = window.innerHeight * dpr;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const handleMouseMove = (e) => {
      mouseX = e.clientX * dpr;
      mouseY = (window.innerHeight - e.clientY) * dpr;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        mouseX = e.touches[0].clientX * dpr;
        mouseY = (window.innerHeight - e.touches[0].clientY) * dpr;
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    resize();

    let animationFrameId;

    const render = (time) => {
      gl.uniform1f(timeLocation, time * 0.001);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform2f(mouseLocation, mouseX, mouseY);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="shader-canvas"
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
    />
  );
}

export default InteractiveShaderBackground;
