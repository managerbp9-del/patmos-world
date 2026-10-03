export function createGroundSampler(positions, indices) {
  const bins = new Map(), size = 80;
  for (let i=0; i<indices.length; i+=3) {
    const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
    const minX=Math.floor(Math.min(positions[a],positions[b],positions[c])/size),maxX=Math.floor(Math.max(positions[a],positions[b],positions[c])/size);
    const minZ=Math.floor(Math.min(positions[a+2],positions[b+2],positions[c+2])/size),maxZ=Math.floor(Math.max(positions[a+2],positions[b+2],positions[c+2])/size);
    for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++){const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(i);}
  }
  return (x,z)=>{
    for(const i of bins.get(Math.floor(x/size)+','+Math.floor(z/size))||[]){
      const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
      const ax=positions[a],az=positions[a+2],bx=positions[b],bz=positions[b+2],cx=positions[c],cz=positions[c+2];
      const d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(d)<1e-10)continue;
      const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d,w=1-u-v;
      if(u<-.00001||v<-.00001||w<-.00001)continue;
      const ay=positions[a+1],by=positions[b+1],cy=positions[c+1];
      const nx=(by-ay)*(cz-az)-(bz-az)*(cy-ay),ny=(bz-az)*(cx-ax)-(bx-ax)*(cz-az),nz=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
      return {height:u*ay+v*by+w*cy,normalY:Math.abs(ny)/Math.hypot(nx,ny,nz)};
    }
    return null;
  };
}

// WGS84 / UTM zone 35N inverse. Checked against PROJ reference coordinates.
export function toWgs84(x,z,origin){
  const a=6378137,e2=0.0066943799901413165,k=.9996,ep=e2/(1-e2);
  const e1=(1-Math.sqrt(1-e2))/(1+Math.sqrt(1-e2));
  const mu=(origin[1]-z)/k/(a*(1-e2/4-3*e2**2/64-5*e2**3/256));
  const f=mu+(3*e1/2-27*e1**3/32)*Math.sin(2*mu)+(21*e1**2/16-55*e1**4/32)*Math.sin(4*mu)+151*e1**3/96*Math.sin(6*mu)+1097*e1**4/512*Math.sin(8*mu);
  const sin=Math.sin(f),cos=Math.cos(f),t=Math.tan(f)**2,c=ep*cos*cos,n=a/Math.sqrt(1-e2*sin*sin),r=a*(1-e2)/(1-e2*sin*sin)**1.5,d=(origin[0]+x-500000)/(n*k);
  const lat=f-n*Math.tan(f)/r*(d*d/2-(5+3*t+10*c-4*c*c-9*ep)*d**4/24+(61+90*t+298*c+45*t*t-252*ep-3*c*c)*d**6/720);
  const lon=(d-(1+2*t+c)*d**3/6+(5-2*c+28*t-3*c*c+8*ep+24*t*t)*d**5/120)/cos;
  return {lon:27+lon*180/Math.PI,lat:lat*180/Math.PI};
}
