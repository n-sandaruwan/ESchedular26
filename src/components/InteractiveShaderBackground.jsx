import React from 'react';

function InteractiveShaderBackground() {
  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden bg-[#050810]"
      aria-hidden="true"
    >
      {/* Deep Violet Aura - Top Left */}
      <div 
        className="absolute -top-[20%] -left-[10%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full opacity-40 blur-[100px] sm:blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(89, 51, 217, 0.6) 0%, rgba(5, 8, 16, 0) 70%)'
        }}
      />
      
      {/* Electric Sky Blue Aura - Center Right */}
      <div 
        className="absolute top-[20%] -right-[15%] w-[75vw] h-[75vw] max-w-[750px] max-h-[750px] rounded-full opacity-35 blur-[110px] sm:blur-[150px]"
        style={{
          background: 'radial-gradient(circle, rgba(0, 188, 255, 0.5) 0%, rgba(5, 8, 16, 0) 70%)'
        }}
      />

      {/* Vivid Emerald Aura - Bottom Left */}
      <div 
        className="absolute -bottom-[20%] left-[10%] w-[70vw] h-[70vw] max-w-[700px] max-h-[700px] rounded-full opacity-25 blur-[120px] sm:blur-[160px]"
        style={{
          background: 'radial-gradient(circle, rgba(13, 209, 140, 0.45) 0%, rgba(5, 8, 16, 0) 70%)'
        }}
      />

      {/* Subtle HD Architectural Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] md:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  );
}

export default InteractiveShaderBackground;
