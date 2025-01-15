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
    this.tunnelRadius = 2;
    this.waterLevel = -1.5;
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
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0x151515);
    this.scene.add(ambientLight);

    this.createFlashlight();
    
    this.camera.position.set(0, 0.2, 2);
    this.camera.rotation.x = -0.15;

    this.createTunnel();
    this.createWater();
  }

  createFlashlight() {
    const flashlight = new THREE.SpotLight(0xffffcc, 3);
    flashlight.position.set(0, 0.3, 1.2);
    flashlight.angle = Math.PI / 5;
    flashlight.penumbra = 0.4;
    flashlight.decay = 1.2;
    flashlight.distance = 10;
    flashlight.castShadow = true;
    
    flashlight.shadow.mapSize.width = 1024;
    flashlight.shadow.mapSize.height = 1024;
    flashlight.shadow.camera.near = 0.5;
    flashlight.shadow.camera.far = 15;
    flashlight.shadow.bias = -0.001;

    this.camera.add(flashlight);
    this.scene.add(this.camera);
    this.flashlight = flashlight;
  }

  createTunnelSegment(position) {
    const geometry = new THREE.CylinderGeometry(this.tunnelRadius, this.tunnelRadius, this.segmentLength, 32, 4, true);
    const material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      side: THREE.BackSide,
      roughness: 1,
      metalness: 0.2,
      bumpScale: 0.05
    });

    const segment = new THREE.Mesh(geometry, material);
    segment.rotation.x = Math.PI / 2;
    segment.position.z = position;
    segment.castShadow = true;
    segment.receiveShadow = true;
    
    this.addSewerDetails(segment);
    this.addBrickTexture(segment);
    
    this.tunnelSegments.push(segment);
    this.scene.add(segment);
  }

  addBrickTexture(segment) {
    const brickCount = 12;
    const rowCount = 4;
    
    for (let i = 0; i < brickCount; i++) {
      for (let j = 0; j < rowCount; j++) {
        const brickGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.05);
        const brickMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 1,
          metalness: 0
        });
        
        const brick = new THREE.Mesh(brickGeometry, brickMaterial);
        const angle = (i / brickCount) * Math.PI * 2;
        const height = (j / rowCount) * this.segmentLength - this.segmentLength / 2;
        
        brick.position.set(
          Math.cos(angle) * (this.tunnelRadius - 0.05),
          height,
          Math.sin(angle) * (this.tunnelRadius - 0.05)
        );
        brick.lookAt(new THREE.Vector3(0, height, 0));
        segment.add(brick);
      }
    }
  }

  addSewerDetails(segment) {
    const pipePositions = [
      { angle: Math.PI / 6, y: -0.8 },
      { angle: -Math.PI / 6, y: -0.8 },
      { angle: Math.PI * 0.8, y: -0.5 },
      { angle: -Math.PI * 0.8, y: -0.5 }
    ];

    pipePositions.forEach(pos => {
      const pipeGeometry = new THREE.CylinderGeometry(0.15, 0.15, this.segmentLength, 12);
      const pipeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a2a,
        roughness: 0.8,
        metalness: 0.4
      });
      
      const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.x = Math.cos(pos.angle) * this.tunnelRadius * 0.9;
      pipe.position.y = pos.y;
      pipe.position.z = Math.sin(pos.angle) * this.tunnelRadius * 0.9;
      pipe.castShadow = true;
      
      const jointGeometry = new THREE.TorusGeometry(0.2, 0.05, 16, 32);
      const joint = new THREE.Mesh(jointGeometry, pipeMaterial);
      joint.position.y = Math.random() * this.segmentLength - this.segmentLength / 2;
      pipe.add(joint);

      if (Math.random() > 0.7) {
        const wheelGeometry = new THREE.TorusGeometry(0.15, 0.02, 16, 32);
        const wheel = new THREE.Mesh(wheelGeometry, pipeMaterial);
        wheel.rotation.y = Math.PI / 2;
        wheel.position.y = Math.random() * this.segmentLength - this.segmentLength / 2;
        pipe.add(wheel);
      }
      
      segment.add(pipe);
    });

    if (Math.random() > 0.7) {
      const createDrip = () => {
        const dropGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const dropMaterial = new THREE.MeshPhongMaterial({
          color: 0x6688aa,
          transparent: true,
          opacity: 0.7,
          shininess: 100
        });
        
        const drip = new THREE.Mesh(dropGeometry, dropMaterial);
        const angle = Math.random() * Math.PI * 2;
        drip.position.set(
          Math.cos(angle) * (this.tunnelRadius - 0.2),
          Math.random() * this.segmentLength - this.segmentLength / 2,
          Math.sin(angle) * (this.tunnelRadius - 0.2)
        );
        
        return drip;
      };

      for (let i = 0; i < 8; i++) {
        segment.add(createDrip());
      }
    }
  }

  createWater() {
    const waterGeometry = new THREE.PlaneGeometry(4, this.segmentLength * this.tunnelLength);
    const waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x224455,
      transparent: true,
      opacity: 0.8,
      shininess: 90,
      specular: 0x444444
    });
    this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = this.waterLevel;
    this.waterMesh.position.z = -this.tunnelLength * this.segmentLength / 2;
    this.scene.add(this.waterMesh);
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

new SewerGame();