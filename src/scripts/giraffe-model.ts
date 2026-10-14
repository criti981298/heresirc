import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Anatomical, monochrome giraffe bust. Y up, muzzle toward +Z; neck joins at origin. */
export function createGiraffeHead(): THREE.Group {
  const giraffe = new THREE.Group();
  giraffe.name = 'GiraffeHead';

  const coat = new THREE.MeshPhysicalMaterial({ color: 0xf7f7f7, roughness: 0.87, metalness: 0, clearcoat: 0.02 });
  coat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      varying vec3 vCoatPosition;
      #ifdef GIRAFFE_CUSTOM_COAT_POSITION
        attribute vec3 coatPosition;
      #endif
    `);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef GIRAFFE_CUSTOM_COAT_POSITION
        vCoatPosition = coatPosition;
      #else
        vCoatPosition = position;
      #endif
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vCoatPosition;
      float giraffeHash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
      float giraffeNoise(vec3 p) {
        vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(giraffeHash(i),giraffeHash(i+vec3(1,0,0)),f.x),mix(giraffeHash(i+vec3(0,1,0)),giraffeHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(giraffeHash(i+vec3(0,0,1)),giraffeHash(i+vec3(1,0,1)),f.x),mix(giraffeHash(i+vec3(0,1,1)),giraffeHash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float giraffeCells(vec3 p) {
        vec3 i=floor(p), f=fract(p); float d1=9.0,d2=9.0;
        for(int z=-1;z<=1;z++) for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++) {
          vec3 g=vec3(float(x),float(y),float(z));
          vec3 n=vec3(giraffeHash(i+g),giraffeHash(i+g+17.0),giraffeHash(i+g+37.0));
          float d=length(g+n-f);
          if(d<d1){d2=d1;d1=d;} else {d2=min(d2,d);}
        }
        return d2-d1;
      }
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec3 coatPoint=vCoatPosition*5.0;
      coatPoint += vec3(giraffeNoise(coatPoint*.9),giraffeNoise(coatPoint*.9+4.1),giraffeNoise(coatPoint*.9+8.7))*.46;
      float cell=giraffeCells(coatPoint);
      float faceFade=1.0-smoothstep(.30,.91,vCoatPosition.z);
      float headZone=smoothstep(1.44,1.90,vCoatPosition.y);
      float patchEdge=mix(.17,.23,headZone);
      float coatPatch=smoothstep(patchEdge,patchEdge+.055,cell)*faceFade;
      float fur=giraffeNoise(vCoatPosition*270.0)*.065;
      diffuseColor.rgb *= vec3(mix(.96-fur,.035+fur*.18,coatPatch));
    `);
    // Reuse the existing fur signal: screen derivatives give a restrained grain
    // in the light without extra noise samples or texture memory.
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      vec3 giraffeFurDx=dFdx(-vViewPosition);
      vec3 giraffeFurDy=dFdy(-vViewPosition);
      giraffeFurDx*=inversesqrt(max(dot(giraffeFurDx,giraffeFurDx),.000001));
      giraffeFurDy*=inversesqrt(max(dot(giraffeFurDy,giraffeFurDy),.000001));
      normal=normalize(normal-(giraffeFurDx*dFdx(fur)+giraffeFurDy*dFdy(fur))*.6);
    `);
  };
  coat.customProgramCacheKey = () => 'giraffe-anatomical-coat-v4';
  const ivory = new THREE.MeshPhysicalMaterial({ color: 0xf0f0f0, roughness: .91 });
  const muzzleMaterial = new THREE.MeshPhysicalMaterial({ color: 0xdadada, roughness: .93 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: .96 });
  const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x292929, roughness: 1 });
  const eyeMaterial = new THREE.MeshPhysicalMaterial({ color: 0x060606, roughness: .12, clearcoat: 1, clearcoatRoughness: .06, metalness: .05 });

  function addMesh(geometry: THREE.BufferGeometry, material: THREE.Material, name: string): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    giraffe.add(mesh);
    return mesh;
  }
  function ellipsoid(name: string, at: number[], scale: number[], material: THREE.Material, segments = 40): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, segments, 28);
    geometry.scale(scale[0], scale[1], scale[2]);
    geometry.translate(at[0], at[1], at[2]);
    return addMesh(geometry, material, name);
  }
  function line(name: string, points: THREE.Vector3[], radius: number, material: THREE.Material): THREE.Mesh {
    return addMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), Math.max(18, points.length * 8), radius, 7, false), material, name);
  }
  const interpolate = (a: number, b: number, c: number, d: number, t: number) => .5 * ((2*b) + (-a+c)*t + (2*a-5*b+4*c-d)*t*t + (-a+3*b-3*c+d)*t*t*t);

  // A continuous cross-section loft carries the poll, cheekbone, bridge, jaw and muzzle.
  const sections = [
    [-.255,1.77,.008,.018],[-.215,1.77,.15,.29],[-.10,1.79,.263,.395],
    [.045,1.77,.309,.409],[.19,1.72,.313,.358],[.34,1.65,.267,.286],
    [.49,1.57,.222,.220],[.64,1.49,.238,.183],[.79,1.435,.277,.176],
    [.94,1.425,.286,.171],[1.065,1.435,.25,.155],[1.13,1.445,.13,.112],[1.155,1.445,.004,.018],
  ];
  const skullPositions: number[] = [], skullUVs: number[] = [], skullIndices: number[] = [];
  const rings = 128, sides = 64;
  for (let j=0;j<=rings;j++) {
    const value=j/rings*(sections.length-1), at=Math.min(sections.length-2,Math.floor(value)), t=value-at;
    const s=[0,1,2,3].map(k=>interpolate(sections[Math.max(0,at-1)][k],sections[at][k],sections[at+1][k],sections[Math.min(sections.length-1,at+2)][k],t));
    for(let i=0;i<=sides;i++) {
      const angle=i/sides*Math.PI*2, sin=Math.sin(angle), cos=Math.cos(angle);
      const cheek = 1 + .035 * Math.sin(j/rings*Math.PI*3) * cos*cos;
      skullPositions.push(s[2]*cos*cheek,s[1]+s[3]*sin,s[0]);
      skullUVs.push(i/sides,j/rings);
      if(j<rings&&i<sides){const a=j*(sides+1)+i,b=a+sides+1;skullIndices.push(a,a+1,b,b,a+1,b+1);}
    }
  }
  const skull = new THREE.BufferGeometry();
  skull.setAttribute('position',new THREE.Float32BufferAttribute(skullPositions,3));
  skull.setAttribute('uv',new THREE.Float32BufferAttribute(skullUVs,2));
  skull.setIndex(skullIndices); skull.computeVertexNormals();
  addMesh(skull,coat,'Sculpted skull and muzzle');

  // Ears are closed, thin organic leaves with a cupped front and rolled light rims.
  for(const side of [-1,1]) {
    const vertices:number[]=[], colors:number[]=[],indices:number[]=[];
    const rows=42,columns=20, layerSize=(rows+1)*(columns+1);
    for(let layer=0;layer<2;layer++) for(let j=0;j<=rows;j++) {
      const t=j/rows, w=Math.pow(Math.sin(Math.PI*t),.72)*.171+.003;
      for(let i=0;i<=columns;i++) {
        const s=i/columns*2-1;
        const x=side*(.255+t*.72+s*w*.18);
        const y=1.965+t*.275+s*w*.95+Math.sin(Math.PI*t)*.038;
        const bowl=(1-s*s)*Math.sin(Math.PI*t)*.082;
        const z=-.072-t*.102+(layer===0 ? -.012-bowl : -.045-bowl*.65);
        vertices.push(x,y,z);
        const inner=layer===0 ? Math.pow(1-Math.abs(s),.45)*Math.sin(Math.PI*t)*.76 : 0;
        const shade=1-inner;
        colors.push(shade,shade,shade);
        if(j<rows&&i<columns){const a=layer*layerSize+j*(columns+1)+i,b=a+columns+1;if(layer===0)indices.push(a,a+1,b,b,a+1,b+1);else indices.push(a,b,a+1,b,b+1,a+1);}
      }
    }
    for(let j=0;j<rows;j++) for(const i of [0,columns]) {
      const a=j*(columns+1)+i,b=a+columns+1,c=a+layerSize,d=b+layerSize;
      indices.push(a,b,c,c,b,d);
    }
    const earGeometry=new THREE.BufferGeometry();
    earGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    earGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    earGeometry.setIndex(indices);earGeometry.computeVertexNormals();
    addMesh(earGeometry,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.98,vertexColors:true,side:THREE.DoubleSide}),side<0?'Left concave ear':'Right concave ear');
    const rimPoints:THREE.Vector3[]=[];
    for(let i=0;i<=60;i++) {
      const t=i/60,w=Math.pow(Math.sin(Math.PI*t),.72)*.171+.003;
      rimPoints.push(new THREE.Vector3(side*(.255+t*.72+w*.18),1.965+t*.275+w*.95+Math.sin(Math.PI*t)*.038,-.069-t*.102));
    }
    for(let i=59;i>=0;i--) {
      const t=i/60,w=Math.pow(Math.sin(Math.PI*t),.72)*.171+.003;
      rimPoints.push(new THREE.Vector3(side*(.255+t*.72-w*.18),1.965+t*.275-w*.95+Math.sin(Math.PI*t)*.038,-.069-t*.102));
    }
    line('Soft ear rim',rimPoints,.009,ivory);
  }

  // Ossicones emerge as tapered, gently splayed skin-covered bone with dark velvet tips.
  for(const side of [-1,1]) {
    const hornPoints:THREE.Vector3[]=[];
    const positions:number[]=[],indices:number[]=[];
    const count=40, radial=24;
    for(let j=0;j<=count;j++) {
      const t=j/count,y=2.035+t*.30,x=side*(.156+t*.035),z=-.075-.04*t;
      hornPoints.push(new THREE.Vector3(x,y,z));
      const radius=.076*(1-t)+.040*t+.009*Math.sin(Math.PI*t);
      for(let i=0;i<=radial;i++) {
        const angle=i/radial*Math.PI*2;
        positions.push(x+Math.cos(angle)*radius,y,z+Math.sin(angle)*radius*.88);
        if(j<count&&i<radial){const a=j*(radial+1)+i,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1);}
      }
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    addMesh(geometry,ivory,'Tapered ossicone');
    ellipsoid('Velvet ossicone tip',[side*.191,2.345,-.115],[.059,.067,.054],dark);
    for(let i=0;i<18;i++) {
      const angle=i/18*Math.PI*2;
      line('Fine horn hair',[new THREE.Vector3(side*.191+Math.cos(angle)*.045,2.380,-.115+Math.sin(angle)*.04),new THREE.Vector3(side*.191+Math.cos(angle)*.051,2.427+(i%3)*.008,-.115+Math.sin(angle)*.05)],.0022,dark);
    }
  }

  for(const side of [-1,1]) {
    ellipsoid('Lateral glossy eye',[side*.301,1.852,.194],[.048,.063,.083],eyeMaterial);
    const upper:THREE.Vector3[]=[],lower:THREE.Vector3[]=[],brow:THREE.Vector3[]=[];
    for(let i=0;i<=26;i++) {
      const t=i/26*Math.PI;
      upper.push(new THREE.Vector3(side*(.329+.016*Math.sin(t)),1.852+.065*Math.sin(t),.194+.086*Math.cos(t)));
      lower.push(new THREE.Vector3(side*(.323+.012*Math.sin(t)),1.852-.055*Math.sin(t),.194+.086*Math.cos(t)));
      brow.push(new THREE.Vector3(side*(.294+.021*Math.sin(t)),1.855+.095*Math.sin(t),.194+.105*Math.cos(t)));
    }
    line('Upper sculpted eyelid',upper,.012,muzzleMaterial);
    line('Soft bony brow ridge',brow,.022,muzzleMaterial);
    line('Lower sculpted eyelid',lower,.009,muzzleMaterial);
    for(let i=0;i<9;i++) {
      const t=.25+i/8*2.5;
      const root=new THREE.Vector3(side*(.337+.01*Math.sin(t)),1.852+.066*Math.sin(t),.194+.085*Math.cos(t));
      line('Individual eyelash',[root,new THREE.Vector3(root.x+side*.026,root.y+.024,root.z+.006),new THREE.Vector3(root.x+side*.045,root.y+.025,root.z+.01)],.0018,dark);
    }
    // Recessed nostrils, slightly tilted toward the cheeks, with a soft upper lip edge.
    ellipsoid('Recessed nostril',[side*.205,1.505,1.047],[.031,.046,.061],dark);
    line('Nostril upper fold',[
      new THREE.Vector3(side*.18,1.544,1.026),new THREE.Vector3(side*.207,1.557,1.047),new THREE.Vector3(side*.235,1.539,1.056),
    ],.009,muzzleMaterial);
    const mouth:THREE.Vector3[]=[];
    for(let i=0;i<=25;i++) {
      const t=i/25;
      mouth.push(new THREE.Vector3(side*(.024+t*.235),1.362-.016*Math.sin(t*Math.PI),1.145-.203*t*t));
    }
    line('Fine mouth crease',mouth,.0055,seamMaterial);
    line('Lower muzzle contour',[
      new THREE.Vector3(side*.02,1.336,1.123),new THREE.Vector3(side*.14,1.326,1.07),new THREE.Vector3(side*.235,1.345,.95),
    ],.0075,muzzleMaterial);
  }
  line('Central upper lip',[
    new THREE.Vector3(0,1.449,1.155),new THREE.Vector3(0,1.400,1.153),new THREE.Vector3(0,1.364,1.148),
  ],.0035,seamMaterial);

  // All coordinates are baked into the geometry, so each shared surface can be
  // drawn once, including the many small mane fibers and eyelashes.
  const surfaceGroups = new Map<THREE.Material, THREE.Mesh[]>();
  for (const child of [...giraffe.children]) {
    if (!(child instanceof THREE.Mesh) || Array.isArray(child.material)) continue;
    const meshes = surfaceGroups.get(child.material) ?? [];
    meshes.push(child);
    surfaceGroups.set(child.material, meshes);
  }
  for (const [material, meshes] of surfaceGroups) {
    if (meshes.length < 2) continue;
    for (const mesh of meshes) mesh.geometry.deleteAttribute('uv');
    const merged = mergeGeometries(meshes.map(mesh => mesh.geometry), false);
    if (!merged) continue;
    for (const mesh of meshes) {
      giraffe.remove(mesh);
      mesh.geometry.dispose();
    }
    const surface = new THREE.Mesh(merged, material);
    surface.name = material === dark ? 'Mane lashes and dark details' : 'Merged anatomical surface';
    giraffe.add(surface);
  }
  giraffe.userData.coat=coat;
  giraffe.userData.attachmentRadius=.27;
  giraffe.userData.baseY=0;
  giraffe.userData.neckHeight=1.8;
  return giraffe;
}







