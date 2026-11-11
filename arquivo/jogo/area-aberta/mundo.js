'use strict';
(() => {
  // Coordenadas em 1280 × 720, independentes da resolução da tela.
  const nodes = {
    cabana:[260,240], acampamento:[320,265], margem:[245,295], registroOeste:[278,335], registro:[397,360], barragem:[440,390],
    encontro:[570,410], clareira:[650,370], bosque:[605,300], trilha:[755,350],
    leste:[930,390], escada:[960,235], degraus:[915,180], topo:[875,105],
    planalto:[1020,110], norte:[1130,135], curva:[1120,330], direita:[1190,400],
    descida:[1080,510], sul:[1190,560], retorno:[1100,665],
    ponteLeste:[445,450], ponte:[340,473], ponteOeste:[230,480],
    oeste:[160,540], abrigo:[110,505]
  };
  const edges = [
    ['cabana','acampamento',32],['acampamento','margem',27],['margem','registroOeste',20],['registroOeste','registro',18],['registro','barragem',18],
    ['barragem','encontro',28],['encontro','clareira',35],['clareira','bosque',32],
    ['clareira','trilha',38],['trilha','leste',32],['leste','escada',20,'escadaria'],
    ['escada','degraus',20],['degraus','topo',22],['topo','planalto',24],
    ['planalto','norte',35],['escada','curva',26],['curva','direita',26],
    ['leste','descida',28],['descida','sul',27],['sul','retorno',26],
    ['encontro','ponteLeste',24],['ponteLeste','ponte',18],['ponte','ponteOeste',18],
    ['ponteOeste','oeste',30],['oeste','abrigo',29]
  ];
  const fires = [
    {id:0,x:690,y:288}, {id:1,x:822,y:332}, {id:2,x:1020,y:145},
    {id:3,x:1130,y:182}, {id:4,x:1120,y:290,kind:'espirito'}, {id:5,x:1210,y:537},
    {id:6,x:1080,y:628}, {id:7,x:145,y:565}
  ];
  const animals = [
    {id:'capivara',name:'Capivara',x:208,y:544,sprite:4,fires:[7],node:'oeste'},
    {id:'cervo',name:'Cervo',x:1148,y:106,sprite:5,fires:[2,3],node:'norte'},
    {id:'passaro',name:'Passarinho',x:1210,y:595,sprite:6,fires:[5,6],node:'sul'}
  ];
  const sprites = [[64,65,349,326],[517,136,363,300],[917,143,413,254],[1380,128,310,300],[78,539,352,287],[558,451,313,375],[977,613,252,206],[1447,462,211,375]];
  const clearings=[
    [[190,225],[345,222],[420,254],[417,274],[350,286],[282,314],[207,299]],
    [[590,290],[633,262],[670,284],[672,319],[725,344],[800,353],[850,371],[850,396],[690,410],[618,421],[574,397]],
    [[942,89],[1121,76],[1204,110],[1207,153],[1124,158],[985,154]],
    [[80,482],[235,485],[260,530],[232,581],[154,607],[75,572]],
    [[1100,474],[1235,507],[1253,555],[1200,601],[1116,660],[1064,630],[1092,570]]
  ];
  const reservoir=[[335,285],[410,275],[500,300],[542,330],[540,356],[470,370],[410,350],[340,330],[303,323]];
  function inside(p,polygon){
    let result=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
      if((yi>p.y)!==(yj>p.y)&&p.x<(xj-xi)*(p.y-yi)/(yj-yi)+xi)result=!result;
    }
    return result;
  }
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  function segmentDistance(p,a,b) {
    const dx=b[0]-a[0],dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy)));
    return Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy);
  }
  const walkable = p => !inside(p,reservoir)&&(clearings.some(zone=>inside(p,zone))||edges.some(([a,b,width]) => segmentDistance(p,nodes[a],nodes[b])<=width));
  function closestNode(p) {
    return Object.keys(nodes).reduce((best,id)=>distance(p,{x:nodes[id][0],y:nodes[id][1]})<distance(p,{x:nodes[best][0],y:nodes[best][1]})?id:best,'clareira');
  }
  function route(from,to) {
    const start=closestNode(from),finish=closestNode(to),cost={},previous={},todo=new Set(Object.keys(nodes));
    for(const id of todo) cost[id]=Infinity;
    cost[start]=0;
    while(todo.size) {
      const id=[...todo].reduce((a,b)=>cost[a]<cost[b]?a:b);todo.delete(id);
      if(id===finish)break;
      for(const [a,b] of edges) {
        const next=a===id?b:b===id?a:null;if(!next||!todo.has(next))continue;
        const candidate=cost[id]+Math.hypot(nodes[id][0]-nodes[next][0],nodes[id][1]-nodes[next][1]);
        if(candidate<cost[next]){cost[next]=candidate;previous[next]=id;}
      }
    }
    const path=[finish];while(path[0]!==start){const next=previous[path[0]];if(!next)return [];path.unshift(next);}
    return path.map(id=>({x:nodes[id][0],y:nodes[id][1]}));
  }
  window.GuardiaoMundo=Object.freeze({width:1280,height:720,nodes,edges,clearings,reservoir,fires,animals,sprites,distance,walkable,route,closestNode});
})();
