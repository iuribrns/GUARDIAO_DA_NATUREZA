'use strict';
// Coordenadas em unidades do cenário (1280 × 720). Colisão nos pés, não na copa.
(() => {
  const original = window.FlorestaMundo;
  const radius = 8;
  const reservoir = {x:377,y:356,rx:43,ry:28};
  const obstacles = [
    {name:'reservatório',ellipse:reservoir},{name:'Carlos',ellipse:{x:245,y:245,rx:12,ry:9}},
    {name:'cabana',polygon:[[43,104],[207,72],[283,153],[239,202],[162,225],[45,197]]},
    {name:'abrigo',polygon:[[314,137],[417,118],[472,160],[455,213],[347,228],[313,194]]},
    ...original.trees.map(t=>({name:'tronco',ellipse:{x:t.x,y:t.y,rx:13,ry:7}})),
    {name:'bosque central',polygon:[[696,450],[755,421],[809,442],[833,512],[803,554],[727,550],[688,500]]},
    {name:'bosque oeste',polygon:[[60,346],[157,304],[237,343],[254,405],[222,450],[155,449],[72,407]]}
  ];
  // Trilhas largas e clareiras reais: a travessia está na ponte, não na cisterna.
  const edges=[...original.edges.map(([a,b,w])=>[a,b,Math.max(w,38)]),['leste','cervo',32],['baixo','passaro',35],['cinza','capivara',35]];
  const nodes={...original.nodes,cervo:[1190,240],passaro:[1140,590],capivara:[260,540],registro:[436,392],cisterna:[315,407],beira:[470,408],ponteOeste:[506,405],ponte:[575,405],ponteLeste:[647,405],alto:[900,200],norte:[995,161]};
  const zones=[...original.zones,[[290,315],[445,306],[488,355],[492,414],[423,441],[290,443]],
    [[252,260],[354,265],[365,315],[328,362],[288,407],[272,454],[218,478],[206,445],[267,344]],
    [[300,384],[343,390],[412,394],[468,376],[503,382],[507,427],[422,441],[323,443]],
    [[685,300],[760,270],[846,301],[895,278],[926,200],[1017,143],[1160,164],[1197,229],[1174,307],[1225,342],[1223,398],[1117,461],[1147,530],[1208,543],[1145,617],[995,649],[861,661],[860,603],[1026,557],[1055,474],[976,444],[893,404],[820,420],[743,434],[679,405]]
  ];
  const distance=original.distance,inside=original.inside;
  function segment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/d)):0;return Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy);}
  function solid(p){return obstacles.some(o=>o.ellipse?((p.x-o.ellipse.x)/o.ellipse.rx)**2+((p.y-o.ellipse.y)/o.ellipse.ry)**2<=1:inside(p,o.polygon));}
  function floor(p){return p.x>20&&p.x<1255&&p.y>45&&p.y<692&&(!inside(p,original.river)||inside(p,original.bridge))&&(zones.some(z=>inside(p,z))||edges.some(([a,b,w])=>segment(p,nodes[a],nodes[b])<w))&&!solid(p);}
  function walkable(p,r=radius){if(!floor(p))return false;for(let i=0;i<8;i++){const a=i*Math.PI/4;if(!floor({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r}))return false;}return true;}
  let hazards=[];const clear=p=>!hazards.some(h=>(h.life>0||['ferido','seguro'].includes(h.stage))&&distance(p,h.position||h)<(h.stage?19:27));
  function visible(a,b){const n=Math.max(1,Math.ceil(distance(a,b)/4));for(let i=0;i<=n;i++)if(!walkable({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n})||!clear({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;return true;}
  // Grade de 8 px compartilhada por Kai e animais; diagonais não cortam quinas.
  const cell=8,cols=160,rows=90,grid=new Uint8Array(cols*rows);
  const point=id=>({x:(id%cols)*cell+4,y:Math.floor(id/cols)*cell+4});
  for(let id=0;id<grid.length;id++)grid[id]=Number(walkable(point(id)));
  function closest(p){let best=-1,d=Infinity;for(let id=0;id<grid.length;id++){if(!grid[id]||!clear(point(id)))continue;const q=point(id),n=distance(p,q);if(n<d&&(!walkable(p)||visible(p,q))){d=n;best=id;}}return best;}
  function route(from,to){
    if(visible(from,to))return [{...to}];
    const start=closest(from),end=closest(to);if(start<0||end<0)return [];
    const open=new Set([start]),cost=new Map([[start,0]]),score=new Map([[start,distance(point(start),point(end))]]),prev=new Map();
    while(open.size){let id=-1,lowest=Infinity;for(const i of open){if(score.get(i)<lowest){id=i;lowest=score.get(i);}}if(id===end){const path=[point(end)];while(id!==start){id=prev.get(id);path.unshift(point(id));}if(walkable(to)&&visible(path.at(-1),to))path.push({...to});const smooth=[];let anchor=from,index=0;while(index<path.length){let last=index;while(last+1<path.length&&visible(anchor,path[last+1]))last++;smooth.push(path[last]);anchor=path[last];index=last+1;}return smooth;}
      open.delete(id);const x=id%cols,y=Math.floor(id/cols);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const xx=x+dx,yy=y+dy,next=yy*cols+xx;if(xx<0||xx>=cols||yy<0||yy>=rows||!grid[next]||!clear(point(next)))continue;if(dx&&dy&&(!grid[y*cols+xx]||!grid[yy*cols+x]))continue;const c=cost.get(id)+Math.hypot(dx,dy)*cell;if(c<(cost.get(next)??Infinity)){cost.set(next,c);prev.set(next,id);score.set(next,c+distance(point(next),point(end)));open.add(next);}}
    }return [];
  }
  function approach(from,target,range=65){const choices=[];for(let r=range;r>=24;r-=16)for(let i=0;i<24;i++){const a=i*Math.PI/12,p={x:target.x+Math.cos(a)*r,y:target.y+Math.sin(a)*r};if(walkable(p))choices.push(p);}choices.sort((a,b)=>distance(from,a)-distance(from,b));for(const p of choices){const path=route(from,p);if(path.length)return path;}return [];}
  function nearest(p){return Object.keys(nodes).sort((a,b)=>distance(p,{x:nodes[a][0],y:nodes[a][1]})-distance(p,{x:nodes[b][0],y:nodes[b][1]}))[0];}
  window.FlorestaMundo=Object.freeze({...original,nodes,edges,zones,obstacles,radius,reservoir,setHazards:value=>{hazards=value;},walkable,visible,route,approach,nearest});
})();
