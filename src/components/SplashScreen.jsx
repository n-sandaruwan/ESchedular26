import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Step 1: Logo is already visible from index.html preloader
    // Step 2: DEIE 26 fades in (0.7s)
    const t2 = setTimeout(() => setStep(2), 700);
    // Step 3: EShedullar fades in (1.5s)
    const t3 = setTimeout(() => setStep(3), 1500);
    // Step 4: Fade everything out (3.0s)
    const t4 = setTimeout(() => setStep(4), 3000);
    // Step 5: Unmount and load app (3.5s)
    const t5 = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center transition-opacity duration-500 ${step === 4 ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* App Logo */}
      <div className={`transition-all duration-700 ease-out transform ${step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
        <img src="./pwa-icon.svg" alt="App Logo" className="w-32 h-32 md:w-40 md:h-40" />
      </div>

      {/* DEIE 26 */}
      <div className={`mt-8 text-2xl md:text-3xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-[#818cf8] transition-all duration-700 transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        DEIE 26
      </div>

      {/* EShedullar */}
      <div className={`mt-3 text-lg md:text-xl font-medium tracking-wider text-gray-400 transition-all duration-700 transform ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        EShedullar
      </div>

    </div>
  );
};

export default SplashScreen;
