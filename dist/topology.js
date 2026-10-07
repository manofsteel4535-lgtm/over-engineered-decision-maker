import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { THEME_PALETTES } from './theme-palette.js';

/** A real WebGL decision graph; DOM labels follow projected 3D coordinates. */
export class DecisionTopology {
  constructor(container,theme='dark') {
    this.theme=theme;this.lastWinner=null;
    this.active=true;this.destroyed=false;
    this.container=container;this.chaos=42;this.running=false;this.lowPower=false;this.hasResult=false;
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(43,1,.1,100);
    this.camera.position.set(0,1,8.5);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.setClearColor(0x0e141f,0);
    container.prepend(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.06;
    this.controls.autoRotate=!matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.controls.autoRotateSpeed=.45;this.controls.minDistance=4;this.controls.maxDistance=15;
    this.controls.target.set(0,0,0);this.controls.enablePan=true;
    this.graph=new THREE.Group();this.scene.add(this.graph);
    this.nodes=[];this.lines=[];this.labels=[];
    const definitions=[['User Choice Instance',[0,0,0],0x5ae6dc],['Uncertainty',[-2.15,1.15,.3],0x5ae6dc],['Volatility',[2.1,1.2,-.5],0xefa957],['Cost Friction',[-2,-1.05,-.6],0x75b7d5],['Satisfaction',[2,-1.15,.7],0x5ae6dc]];
    const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;
    const ctx=glowCanvas.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.15,'rgba(255,255,255,.6)');g.addColorStop(.4,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
    const glowTexture=new THREE.CanvasTexture(glowCanvas);
    definitions.forEach(([name,position,color],i)=>{
      const geometry=i===0?new THREE.IcosahedronGeometry(.67,1):new THREE.IcosahedronGeometry(.19,0);
      const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:i===0?.085:.35}));
      mesh.position.set(...position);mesh.userData={name,index:i,base:new THREE.Vector3(...position),origin:new THREE.Vector3(...position),weight:null,targetScale:1};
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:i===0?.7:.9}));mesh.add(edges);
      const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:i===0?.18:.5,depthWrite:false,blending:THREE.AdditiveBlending}));
      glow.scale.setScalar(i===0?2.5:1);mesh.add(glow);this.graph.add(mesh);this.nodes.push(mesh);
      if(i){
        const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),mesh.position]),new THREE.LineBasicMaterial({color,transparent:true,opacity:.45}));this.graph.add(line);this.lines.push(line);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.31,.005,4,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.6}));ring.rotation.x=Math.PI/2;mesh.add(ring);
      }
      const label=document.createElement('span');label.className='node-label'+(i===0?' center':'');label.textContent=name;document.getElementById('node-labels').append(label);this.labels.push(label);
    });
    for(let i=0;i<3;i++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.91+i*.18,.006,5,90),new THREE.MeshBasicMaterial({color:i===1?0xefa957:0x5ae6dc,transparent:true,opacity:.3}));
      ring.rotation.set(i*.65+.6,i*.9,.3);ring.userData.pulseRing=true;this.nodes[0].add(ring);
    }
    this.grid=new THREE.GridHelper(14,28,0x274e59,0x19323d);this.grid.position.y=-1.9;this.grid.material.transparent=true;this.scene.add(this.grid);
    const particlePositions=new Float32Array(1200*3);for(let i=0;i<particlePositions.length;i++)particlePositions[i]=(Math.random()-.5)*13;
    const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
    this.particles=new THREE.Points(pg,new THREE.PointsMaterial({color:0x77becb,size:.013,transparent:true,opacity:.36}));this.scene.add(this.particles);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    container.addEventListener('pointermove',e=>this.hover(e));
    container.addEventListener('pointerleave',()=>{document.getElementById('node-tooltip').hidden=true;});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);this.resize();
    this.setTheme(theme);this.lastFrame=0;this.animate(0);
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('integrity').textContent='RECONNECT';});
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
  /** Keep one scene/renderer; stop scheduling frames while its module is hidden. */
  setActive(value){
    if(this.destroyed)return;
    this.container.dataset.renderState=value?'active':'paused';
    if(this.active===value)return;
    this.active=value;
    if(!value){cancelAnimationFrame(this.frame);this.frame=null;document.getElementById('node-tooltip').hidden=true;}
    else{this.resize();this.lastFrame=0;this.animate(performance.now());}
  }
  setPerformance(value){this.lowPower=value;this.particles.geometry.setDrawRange(0,value?150:1200);this.renderer.setPixelRatio(value?1:Math.min(devicePixelRatio,2));this.resize();}
  reset(){this.camera.position.set(0,1,8.5);this.controls.target.set(0,0,0);this.controls.update();}
  setTheme(theme){
    this.theme=theme;
    const palette=THEME_PALETTES[theme].scene,dark=theme==='dark';
    this.renderer.setClearColor(palette.background,1);
    const gridColor=new THREE.Color(palette.grid),colors=this.grid.geometry.attributes.color;
    for(let i=0;i<colors.count;i++)colors.setXYZ(i,gridColor.r,gridColor.g,gridColor.b);
    colors.needsUpdate=true;this.grid.material.opacity=palette.gridOpacity;
    this.nodes.forEach((node,i)=>{
      // In Solar mode a node's color identifies its factor, independent of winner.
      const color=dark?((i===0&&this.lastWinner==='b')||i===2?palette.amber:i===3?palette.secondary:palette.cyan):palette.nodeColors[i];
      this.labels[i].style.setProperty('--node-color','#'+color.toString(16).padStart(6,'0'));
      node.material.color.setHex(color);node.material.opacity=i===0?(dark ? .085 : .055):(dark ? .35 : .16);
      node.children.forEach(child=>{
        child.material.color.setHex(color);
        if(child.isSprite){
          child.material.blending=dark?THREE.AdditiveBlending:THREE.NormalBlending;
          child.material.opacity=i===0?(dark ? .18 : .08):(dark ? .5 : .2);child.material.needsUpdate=true;
        }else child.material.opacity=dark ? .7 : child.userData.pulseRing ? .42 : .95;
      });
      if(i){
        this.lines[i-1].material.color.setHex(dark?color:palette.cyan);
        this.lines[i-1].material.opacity=dark?Math.max(palette.lineOpacity,this.hasResult ? .2+node.userData.weight*.005 : 0):palette.lineOpacity;
      }
    });
    this.particles.material.color.setHex(dark&&this.lastWinner==='b'?palette.amber:palette.cyan);
    this.particles.material.opacity=palette.particleOpacity;
  }
  beginRun(chaos,context){
    this.chaos=chaos;this.running=true;this.hasResult=false;
    this.nodes.forEach((node,i)=>{
      if(i)node.userData.name=context.factors[i-1];
      node.userData.weight=null;node.userData.targetScale=1;
      this.labels[i].textContent=node.userData.name;delete this.labels[i].dataset.weight;
    });
    document.getElementById('node-tooltip').hidden=true;
    this.container.setAttribute('aria-label','Decision graph processing fresh scenarios for '+context.title+'.');
  }
  update(result,context){
    this.hasResult=true;
    this.nodes.forEach((node,i)=>{
      const weight=i===0?result.probability:result.nodeWeights[i-1];
      node.userData.weight=weight;node.userData.targetScale=.8+weight*.008;
      if(i){
        node.userData.name=context.factors[i-1];node.userData.base.copy(node.userData.origin).multiplyScalar(.88+weight*.003);
        this.lines[i-1].material.opacity=.2+weight*.005;
      }
      this.labels[i].textContent=node.userData.name+' · '+weight.toFixed(1)+'%';
      this.labels[i].dataset.weight=weight.toFixed(3);
    });
    this.lastWinner=result.winner;this.setTheme(this.theme);
    this.container.setAttribute('aria-label','Decision graph: '+this.nodes.map(n=>n.userData.name+' weight '+n.userData.weight.toFixed(1)+' percent').join(', ')+'. Drag to rotate; scroll to zoom.');
  }
  hover(event){
    const rect=this.container.getBoundingClientRect();this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.nodes,false),tooltip=document.getElementById('node-tooltip');
    if(!hits.length){tooltip.hidden=true;return;}
    const node=hits[0].object;tooltip.hidden=false;
    tooltip.textContent=node.userData.name+' · '+(node.userData.weight===null?'Standby: no simulation weight assigned.':'Simulation weight: '+node.userData.weight.toFixed(1)+'% · Chaos: '+this.chaos+'/100');
    tooltip.style.left=Math.max(8,Math.min(rect.width-245,event.clientX-rect.left+12))+'px';tooltip.style.top=Math.max(8,Math.min(rect.height-90,event.clientY-rect.top+15))+'px';
  }
  animate(time){
    if(!this.active||this.destroyed)return;
    this.frame=requestAnimationFrame(t=>this.animate(t));
    if(document.hidden||this.lowPower&&time-this.lastFrame<32)return;
    this.lastFrame=time;const t=time/1000;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.nodes.forEach((n,i)=>{
      n.position.x=THREE.MathUtils.lerp(n.position.x,n.userData.base.x,.06);
      n.position.z=THREE.MathUtils.lerp(n.position.z,n.userData.base.z,.06);
      n.position.y=THREE.MathUtils.lerp(n.position.y,n.userData.base.y+(reduced?0:Math.sin(t*.55+i)*.08),.06);
      const pulse = reduced ? 1 : 1 + Math.sin(t * (this.running ? 3 : .9) + i) * (this.hasResult ? .015 : .045);
      n.scale.setScalar(THREE.MathUtils.lerp(n.scale.x,n.userData.targetScale*pulse,.06));
      if(i===0&&this.theme==='light')n.children.filter(child=>child.userData.pulseRing).forEach((ring,index)=>{
        ring.material.opacity=reduced?.42:.42+Math.sin(t*1.3+index*.8)*.12;
      });
      if(!reduced){n.rotation.y=t*(this.running ? .5 : .09);n.rotation.z=Math.sin(t*.2)*.1;}
      if(i){const a=this.lines[i-1].geometry.attributes.position;a.setXYZ(0,0,this.nodes[0].position.y,0);a.setXYZ(1,n.position.x,n.position.y,n.position.z);a.needsUpdate=true;}
    });
    this.controls.update();this.renderer.render(this.scene,this.camera);
    const positions=this.nodes.map((node,i)=>{
      const p=node.getWorldPosition(new THREE.Vector3());p.y-=i===0?.9:.4;p.project(this.camera);
      return {x:(p.x*.5+.5)*this.container.clientWidth,y:(-p.y*.5+.5)*this.container.clientHeight,hidden:p.z>1,i};
    });
    // Keep labels legible when a side-on orbit projects several nodes together.
    positions.sort((a,b)=>a.y-b.y).forEach((p,index,list)=>{
      for(let j=0;j<index;j++){const other=list[j];if(Math.abs(p.x-other.x)<125&&p.y-other.y<34)p.y=other.y+34;}
      const label=this.labels[p.i];label.style.left=Math.max(65,Math.min(this.container.clientWidth-65,p.x))+'px';
      label.style.top=Math.max(10,Math.min(this.container.clientHeight-38,p.y))+'px';label.style.display=p.hidden?'none':'block';
    });
    document.getElementById('coordinate-x').textContent=(this.camera.position.x>=0?'+':'')+this.camera.position.x.toFixed(2);
  }
  destroy(){this.destroyed=true;this.active=false;cancelAnimationFrame(this.frame);this.observer.disconnect();this.controls.dispose();this.scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.map?.dispose();m.dispose();});});this.renderer.dispose();}
}
