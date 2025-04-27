import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useRouter } from 'next/router';


const ParticleBackground = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesMeshRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2());
  const timeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene Setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(rendererRef.current.domElement);

    // Particle System Setup
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 20000;
    const posArray = new Float32Array(particlesCnt * 3);
    const colorArray = new Float32Array(particlesCnt * 3);
    const sizeArray = new Float32Array(particlesCnt);

    for (let i = 0; i < particlesCnt * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 5;
      posArray[i + 1] = (Math.random() - 0.5) * 5;
      posArray[i + 2] = (Math.random() - 0.5) * 5;

      colorArray[i] = 0.5;
      colorArray[i + 1] = 0.5;
      colorArray[i + 2] = 0.5;

      sizeArray[i / 3] = Math.random() * 0.03 + 0.005;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    particlesMeshRef.current = new THREE.Points(particlesGeometry, particlesMaterial);
    sceneRef.current.add(particlesMeshRef.current);

    // Camera Position
    cameraRef.current.position.z = 5;

    // Shape Transformation Functions
    const transformShape = (shape) => {
      const positions = particlesGeometry.attributes.position.array;
      for (let i = 0; i < particlesCnt; i++) {
        const i3 = i * 3;
        let x, y, z;

        switch (shape) {
          case 'circle':
            const angle = (i / particlesCnt) * Math.PI * 2;
            x = Math.cos(angle) * 2;
            y = Math.sin(angle) * 2;
            z = (Math.random() - 0.5) * 0.5;
            break;
          case 'nine':
            const t = i / particlesCnt;
            if (t < 0.6) {
              const circleAngle = (t * Math.PI * 2) / 0.6;
              x = Math.cos(circleAngle) * 1.5;
              y = Math.sin(circleAngle) * 1.5 + 1;
            } else {
              x = 1.5 - (t - 0.6) * 3;
              y = -2 * (t - 0.6) * 5;
            }
            z = (Math.random() - 0.5) * 0.5;
            break;
          case 'square':
            const side = 4;
            x = (Math.random() - 0.5) * side;
            y = (Math.random() - 0.5) * side;
            z = (Math.random() - 0.5) * 0.5;
            break;
          case 'heart':
            const heartT = (i / particlesCnt) * Math.PI * 2;
            x = 16 * Math.pow(Math.sin(heartT), 3);
            y = 13 * Math.cos(heartT) - 5 * Math.cos(2 * heartT) - 2 * Math.cos(3 * heartT) - Math.cos(4 * heartT);
            x /= 16;
            y /= 16;
            z = (Math.random() - 0.5) * 0.5;
            break;
          case 'ix':
            const spiralAngle = (i / particlesCnt) * Math.PI * 20;
            const spiralRadius = (1 - i / particlesCnt) * 3;
            x = Math.cos(spiralAngle) * spiralRadius;
            y = Math.sin(spiralAngle) * spiralRadius;
            z = (i / particlesCnt - 0.5) * 5;
            break;
        }

        gsap.to(positions, {
          [i3]: x,
          [i3 + 1]: y,
          [i3 + 2]: z,
          duration: shape === 'ix' ? 3 : 2,
          ease: shape === 'ix' ? 'power4.inOut' : 'power2.inOut',
          onComplete: () => {
            if (shape === 'ix' && i === particlesCnt - 1) {
              explodeParticles(positions, particlesCnt);
            }
          },
        });
      }
    };

    const explodeParticles = (positions, particlesCnt) => {
      for (let i = 0; i < particlesCnt; i++) {
        const i3 = i * 3;
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 5;

        const x = Math.sin(angle1) * Math.cos(angle2) * radius;
        const y = Math.sin(angle1) * Math.sin(angle2) * radius;
        const z = Math.cos(angle1) * radius;

        gsap.to(positions, {
          [i3]: x,
          [i3 + 1]: y,
          [i3 + 2]: z,
          duration: 2,
          ease: 'power4.out',
        });
      }
    };

    // Animation Loop
    const animate = () => {
      timeRef.current += 0.005;

      const positions = particlesGeometry.attributes.position.array;
      const colors = particlesGeometry.attributes.color.array;
      const sizes = particlesGeometry.attributes.size.array;

      for (let i = 0; i < particlesCnt; i++) {
        const i3 = i * 3;
        const x = positions[i3];
        const y = positions[i3 + 1];

        const mouseDistance = Math.sqrt(
          Math.pow(x - mouseRef.current.x * 2.5, 2) + 
          Math.pow(y - mouseRef.current.y * 2.5, 2)
        );

        const spotlightRadius = 1.5;
        const colorIntensity = Math.max(0, 1 - mouseDistance / spotlightRadius);
        const baseColor = 0.5;

        colors[i3] = baseColor + colorIntensity * 0.5;
        colors[i3 + 1] = baseColor + colorIntensity * 0.3;
        colors[i3 + 2] = baseColor + colorIntensity * 0.8;

        positions[i3 + 1] = y + Math.sin(timeRef.current + x) * 0.02;
        positions[i3] = x + Math.cos(timeRef.current + y) * 0.02;

        sizes[i] = sizeArray[i] * (1 + Math.sin(timeRef.current * 2 + i) * 0.5);
        sizes[i] *= 1 + colorIntensity * 0.5;
      }

      particlesGeometry.attributes.position.needsUpdate = true;
      particlesGeometry.attributes.color.needsUpdate = true;
      particlesGeometry.attributes.size.needsUpdate = true;

      if (particlesMeshRef.current) {
        particlesMeshRef.current.rotation.y = timeRef.current * 0.1;
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestAnimationFrame(animate);
    };

    // Event Listeners
    const handleMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Make transform function available globally
    window.transformShape = transformShape;

    // Start Animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  const router = useRouter()

  return (
    <div className="fixed inset-0 z-0">
    <div ref={containerRef} className="w-full h-full" />
    
    {/* Center container using flex */}
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
      {/* Logo */}
      <img src="/logomain.png" width="350" alt="Logo" className="mb-2" />
      <div className="flex gap-3 mb-4">
      <Sheet>
      <SheetTrigger asChild>
        <Button variant="home">About Us</Button>
      </SheetTrigger>
      <SheetContent className="bg-[#1c1c1c] sm:max-w-full border-none">
        <SheetHeader>
          <SheetTitle>About us</SheetTitle>
          
        </SheetHeader>
        
        
      </SheetContent>
    </Sheet>
      <Sheet>
      <SheetTrigger asChild>
        <Button variant="home">Research</Button>
      </SheetTrigger>
      <SheetContent className="bg-[#1c1c1c] sm:max-w-full border-none">
        <SheetHeader>
          <SheetTitle>About us</SheetTitle>
          
        </SheetHeader>
        
        
      </SheetContent>
    </Sheet>
      <Sheet>
      <SheetTrigger asChild>
        <Button variant="home">Back Story</Button>
      </SheetTrigger>
      <SheetContent className="bg-[#1c1c1c] sm:max-w-full border-none">
        <SheetHeader>
          <SheetTitle>About us</SheetTitle>
          
        </SheetHeader>
        
        
      </SheetContent>
    </Sheet>
      <Sheet>
      <SheetTrigger asChild>
        <Button variant="home">Features</Button>
      </SheetTrigger>
      <SheetContent className="bg-[#1c1c1c] sm:max-w-full border-none">
        <SheetHeader>
          <SheetTitle>About us</SheetTitle>
          
        </SheetHeader>
        
        
      </SheetContent>
    </Sheet>
      
        
      </div>

      <Button className="mb-4 bg-blue-800 rounded-lg font-semibold" onClick={()=> {router.push("/auth/login")}}>Get Started</Button>
      
      {/* Shape buttons */}
      <div className="flex gap-5">
        <button 
          onClick={() => window.transformShape('circle')} 
          className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center text-2xl hover:bg-white/20 transition-colors"
        >●</button>
        <button 
          onClick={() => window.transformShape('nine')} 
          className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center text-2xl hover:bg-white/20 transition-colors"
        >9</button>
        <button 
          onClick={() => window.transformShape('square')} 
          className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center text-2xl hover:bg-white/20 transition-colors"
        >■</button>
        <button 
          onClick={() => window.transformShape('heart')} 
          className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center text-2xl hover:bg-white/20 transition-colors"
        >♥</button>
        <button 
          onClick={() => window.transformShape('ix')} 
          className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center text-2xl hover:bg-white/20 transition-colors"
        >IX</button>
      </div>
    </div>
  </div>
  );
};

export default ParticleBackground;