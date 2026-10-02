import * as THREE from "three";

/**
 * Backs the camera away from `target` along `dir` until every point lands
 * inside the frame, so a scene fills its card at any width without cropping.
 */
export function fitCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  dir: THREE.Vector3,
  points: THREE.Vector3[],
  margin = { x: 0.94, y: 0.88 }
) {
  const unit = dir.clone().normalize();
  const projected = new THREE.Vector3();
  const place = (distance: number) => {
    camera.position.copy(target).addScaledVector(unit, distance);
    camera.lookAt(target);
    camera.updateMatrixWorld();
  };
  camera.updateProjectionMatrix();

  let near = 0.5;
  let far = 200;
  for (let i = 0; i < 32; i++) {
    const distance = (near + far) / 2;
    place(distance);
    const fits = points.every((point) => {
      projected.copy(point).project(camera);
      return projected.z < 1 && Math.abs(projected.x) <= margin.x && Math.abs(projected.y) <= margin.y;
    });
    if (fits) far = distance;
    else near = distance;
  }
  place(far);
}

/** The eight corners of an axis-aligned box. */
export function boxCorners(min: THREE.Vector3, max: THREE.Vector3): THREE.Vector3[] {
  const corners: THREE.Vector3[] = [];
  for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) corners.push(new THREE.Vector3(x, y, z));
  return corners;
}
