import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import * as dat from "dat.gui";

const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();
const gui = new dat.GUI();
const gltfLoader = new GLTFLoader();
const rgbLoader = new RGBELoader();
const textureLoader = new THREE.TextureLoader();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function addLight(x, y, z, cast) {
  const pointLight = new THREE.PointLight(0xffffff, 0.1);
  pointLight.position.set(x, y, z);

  // pointLight.castShadow = cast;

  scene.add(pointLight);

  //   const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.1);
  //   scene.add(pointLightHelper);
}

// Camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.01,
  100
);
camera.position.z = 2;
camera.position.y = 0.7;
camera.lookAt(new THREE.Vector3(0, 0.2, 0));
scene.add(camera);
addLight(0, 5, 2, true);
addLight(3, 5, 5, false);
addLight(-3, 5, 5, false);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = true;
controls.minDistance = 0.1;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2;
// controls.minAzimuthAngle = -Math.PI / 2;
// controls.maxAzimuthAngle = Math.PI / 2;
controls.target.set(0, 0.2, 0);
controls.update();

function bottleGUI(mat, gltfName) {
  let conf = { color: mat.color.getHex() };
  let BottleFolder = gui.addFolder("Bottle");
  BottleFolder.addColor(conf, "color")
    .onChange((color) => {
      mat.color.set(color);
    })
    .name("Bottle Color");
  BottleFolder.add(mat, "roughness", 0, 1, 0.01).name("Roughness");
  BottleFolder.add(mat, "metalness", 0, 1, 0.01).name("Metalness");
  BottleFolder.add(mat, "transmission", 0, 1, 0.01).name("Transmission");
  BottleFolder.add(mat, "ior", 1.5, 2.33, 0.01).name("ior");
}

function capGUI(mat, gltfName) {
  let capConf = { color: mat.color.getHex() };
  let CapFolder = gui.addFolder("Cap");
  CapFolder.addColor(capConf, "color")
    .onChange((color) => {
      mat.color.set(color);
    })
    .name("Cap Color");

  CapFolder.add(mat, "roughness", 0, 1, 0.01).name("Roughness");
  CapFolder.add(mat, "metalness", 0, 1, 0.01).name("Metalness");
  CapFolder.add(mat, "transmission", 0, 1, 0.01).name("Transmission");
  CapFolder.add(mat, "ior", 1.5, 2.33, 0.01).name("ior");
}

/**
 * Object
 */

rgbLoader.load("env.hdr", (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  // this.scene.background = texture;
  scene.environment = texture;
  scene.backgroundBlurriness = 0.1;
  scene.backgroundIntensity = 0.9;
});

gltfLoader.load("50g.gltf", (gltf) => {
  const gltfName = gltf.scene.name;
  gltf.scene.position.set(0, 0, 0);
  scene.add(gltf.scene);
  gltf.scene.traverse((child) => {
    console.log(child.name);
    if (child.name.includes(`Bottle`)) {
      child.material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        envMap: scene.environment,
        envMapIntensity: 0.3,
        transmission: 1.0,
        ior: 1.9,
        roughness: 0.0,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
      bottleGUI(child.material, "Bottle");
    }
    if (child.name.includes(`Cap`)) {
      child.material = new THREE.MeshPhysicalMaterial({
        color: child.material.color,
        envMap: scene.environment,
        envMapIntensity: 0.3,
        side: THREE.DoubleSide,
      });
      capGUI(child.material, "Cap");
    }
    if (child.name.includes(`Label`)) {
      child.needsUpdate = true;

      // disable the label
      // child.visible = false;

      let options = { texture: "color" };
      let hash = {
        label1: textureLoader.load("Label1.png"),
        label2: textureLoader.load("Label2.png"),
      };
      hash.label1.flipY = false;
      hash.label1.colorSpace = "srgb";
      hash.label1.repeat.set(1, 1);
      hash.label2.flipY = false;
      hash.label2.colorSpace = "srgb";

      child.material = new THREE.MeshPhysicalMaterial({
        map: hash.label1,
        side: THREE.DoubleSide,
        envMap: scene.environment,
        envMapIntensity: 0.3,
      });

      gui.add(options, "texture", Object.keys(hash)).onChange((value) => {
        child.material.map = hash[value];
      });

      // Create a button using Dta GUI to hide the label
      let optionsHide = { hideLabel: false };
      gui.add(optionsHide, "hideLabel").onChange((value) => {
        child.visible = !value;
      });
    }
  });
});

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
