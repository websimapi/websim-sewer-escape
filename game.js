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

    this.init();
    this.setupEventListeners();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    
    // Initial camera position
    this.camera.position.set(0, 0.5, 2);
    this.camera.rotation.x = -0.1;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    const pointLight = new THREE.PointLight(0x404040, 2);
    pointLight.position.set(0, 1, 2);
    this.scene.add(ambientLight, pointLight);

    this.createTunnel();
  }

  createTunnelSegment(position) {
    const geometry = new THREE.CylinderGeometry(2, 2, this.segmentLength, 16, 1, true);
    const material = new THREE.MeshPhongMaterial({
      color: 0x555555,
      side: THREE.BackSide,
      wireframe: false,
      roughness: 0.8,
    });

    const segment = new THREE.Mesh(geometry, material);
    segment.rotation.x = Math.PI / 2;
    segment.position.z = position;
    
    // Add details to make it look more like a sewer
    this.addSewerDetails(segment);
    
    this.tunnelSegments.push(segment);
    this.scene.add(segment);
  }

  addSewerDetails(segment) {
    // Add pipes along the walls
    for (let i = 0; i < 4; i++) {
      const pipeGeometry = new THREE.CylinderGeometry(0.1, 0.1, this.segmentLength, 8);
      const pipeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      
      pipe.rotation.x = Math.PI / 2;
      pipe.position.x = Math.cos(i * Math.PI / 2) * 1.8;
      pipe.position.y = Math.sin(i * Math.PI / 2) * 1.8;
      
      segment.add(pipe);
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
      
      // If segment is behind camera, move it to the end of the tunnel
      if (segment.position.z > this.segmentLength) {
        segment.position.z = -this.tunnelLength * this.segmentLength + this.segmentLength;
      }
    });
    
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

    // Basic keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!this.gameStarted) return;
      
      const rotationSpeed = 0.05;
      switch(e.key) {
        case 'ArrowLeft':
          this.camera.rotation.z += rotationSpeed;
          break;
        case 'ArrowRight':
          this.camera.rotation.z -= rotationSpeed;
          break;
      }
    });
  }
}

// Initialize the game
new SewerGame();