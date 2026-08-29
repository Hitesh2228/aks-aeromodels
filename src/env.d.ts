/// <reference path="../.astro/types.d.ts" />

declare module 'three' {
  const THREE: any;
  export = THREE;
}
declare module 'three/examples/jsm/loaders/GLTFLoader.js' {
  export const GLTFLoader: any;
}