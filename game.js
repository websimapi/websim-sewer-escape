import * as THREE from 'three';

class SewerGame {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.speed = 0.1;
    this.distance = 0;
    this.tunnelSegments = [];
    this.tunnelLength = 50;
    this.segmentLength = 5;
    this.gameStarted = false;
    this.audio = new Audio('/Underground Sewer - Sonauto.wav');
    this.audio.loop = true;
    this.flashlight = null;
    this.waterMesh = null;
    this.init();
    this.setupEventListeners();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    
    // Darker ambient lighting for more atmospheric feel
    const ambientLight = new THREE.AmbientLight(0x202020);
    this.scene.add(ambientLight);

    // Create and position flashlight
    this.createFlashlight();
    
    // Initial camera position
    this.camera.position.set(0, 0.5, 2);
    this.camera.rotation.x = -0.1;

    this.createTunnel();
    this.createWater();
  }

  createFlashlight() {
    const flashlight = new THREE.SpotLight(0xffffcc, 2);
    flashlight.position.set(0, 0.5, 1.5);
    flashlight.angle = Math.PI / 6;
    flashlight.penumbra = 0.3;
    flashlight.decay = 1.5;
    flashlight.distance = 8;
    flashlight.castShadow = true;

    // Attach flashlight to camera
    this.camera.add(flashlight);
    this.scene.add(this.camera);
    this.flashlight = flashlight;
  }

  createWater() {
    const waterGeometry = new THREE.PlaneGeometry(4, this.segmentLength * this.tunnelLength);
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x224455,
      transparent: true,
      opacity: 0.6,
      shininess: 90
    });
    this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = -1.8;
    this.waterMesh.position.z = -this.tunnelLength * this.segmentLength / 2;
    this.scene.add(this.waterMesh);
  }

  createTunnelSegment(position) {
    const geometry = new THREE.CylinderGeometry(2, 2, this.segmentLength, 32, 1, true);
    const material = new THREE.MeshPhongMaterial({
      color: 0x555555,
      side: THREE.BackSide,
      wireframe: false,
      roughness: 0.9,
      metalness: 0.1,
      bumpScale: 0.02
    });

    const segment = new THREE.Mesh(geometry, material);
    segment.rotation.x = Math.PI / 2;
    segment.position.z = position;
    segment.castShadow = true;
    segment.receiveShadow = true;
    
    this.addSewerDetails(segment);
    
    this.tunnelSegments.push(segment);
    this.scene.add(segment);
  }

  addSewerDetails(segment) {
    // Add main pipes
    for (let i = 0; i < 4; i++) {
      const pipeGeometry = new THREE.CylinderGeometry(0.15, 0.15, this.segmentLength, 8);
      const pipeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.3
      });
      const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      
      pipe.rotation.x = Math.PI / 2;
      pipe.position.x = Math.cos(i * Math.PI / 2) * 1.8;
      pipe.position.y = Math.sin(i * Math.PI / 2) * 1.8;
      pipe.castShadow = true;
      
      segment.add(pipe);

      // Add smaller pipes and valves
      if (Math.random() > 0.7) {
        const valveGeometry = new THREE.TorusGeometry(0.2, 0.05, 16, 32);
        const valve = new THREE.Mesh(valveGeometry, pipeMaterial);
        valve.position.x = pipe.position.x * 1.1;
        valve.position.y = pipe.position.y * 1.1;
        valve.rotation.y = Math.PI / 2;
        segment.add(valve);
      }
    }

    // Add dripping water particles
    if (Math.random() > 0.8) {
      const dripsGeometry = new THREE.SphereGeometry(0.02, 8, 8);
      const dripsMaterial = new THREE.MeshPhongMaterial({
        color: 0x6688aa,
        transparent: true,
        opacity: 0.6
      });
      for (let i = 0; i < 5; i++) {
        const drip = new THREE.Mesh(dripsGeometry, dripsMaterial);
        drip.position.x = (Math.random() - 0.5) * 3;
        drip.position.y = Math.random() * 2 - 1;
        drip.position.z = (Math.random() - 0.5) * this.segmentLength;
        segment.add(drip);
      }
    }
  }

  createTunnel() {
    for (let i = 0; i < this.tunnelLength; i++) {
      this.createTunnelSegment(-i * this.segmentLength);
    }
  }

  moveTunnel() {
    this.tunnelSegments.forEach(segment => {
      segment.position.z += this.speed;
      
      if (segment.position.z > this.segmentLength) {
        segment.position.z = -this.tunnelLength * this.segmentLength + this.segmentLength;
      }
    });

    // Move water with tunnel
    if (this.waterMesh) {
      this.waterMesh.position.z += this.speed;
      if (this.waterMesh.position.z > 0) {
        this.waterMesh.position.z = -this.tunnelLength * this.segmentLength / 2;
      }
    }
    
    this.distance += this.speed;
    document.getElementById('distanceCounter').textContent = Math.floor(this.distance);
  }

  startGame() {
    this.gameStarted = true;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    this.audio.play();
    this.animate();
  }

  animate() {
    if (!this.gameStarted) return;
    
    requestAnimationFrame(() => this.animate());
    this.moveTunnel();
    this.renderer.render(this.scene, this.camera);
  }

  setupEventListeners() {
    document.getElementById('startButton').addEventListener('click', () => this.startGame());
    
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Enhanced keyboard controls for flashlight movement
    document.addEventListener('keydown', (e) => {
      if (!this.gameStarted) return;
      
      const rotationSpeed = 0.05;
      const flashlightSpeed = 0.1;
      
      switch(e.key) {
        case 'ArrowLeft':
          this.camera.rotation.z += rotationSpeed;
          break;
        case 'ArrowRight':
          this.camera.rotation.z -= rotationSpeed;
          break;
        case 'ArrowUp':
          this.flashlight.angle = Math.max(this.flashlight.angle - 0.1, Math.PI / 12);
          break;
        case 'ArrowDown':
          this.flashlight.angle = Math.min(this.flashlight.angle + 0.1, Math.PI / 4);
          break;
      }
    });
  }
}

// Initialize the game
new SewerGame();