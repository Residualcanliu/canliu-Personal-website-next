    
varying vec2 vUv;uniform vec2 uRes,uBH,uMouse;uniform float uTime,uRadius,uZoom,uQuality;uniform sampler2D uTex;
float h23(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float h31(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h23(i),h23(i+vec2(1,0)),f.x),mix(h23(i+vec2(0,1)),h23(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;vec2 s=p;for(int i=0;i<4;i++){v+=a*noise(s);s*=2.1;a*=.5;}return v;}
const float PI=3.14159265;const float SQRT3=1.7320508;
vec3 renderBackground(vec2 uv){vec3 col=vec3(0);
float nd=noise(uv*5.+1.3)*.5+noise(uv*2.8-2.1)*.5;
col+=mix(vec3(.008,.006,.012),vec3(.015,.01,.02),nd);
float gas=fbm(uv*1.6+vec2(.3,1.1));
float dust=fbm(uv*1.9+vec2(2.1,.5));
float emi=fbm(uv*1.3+vec2(1.5,2.3));
col+=vec3(.012,.004,.003)*gas;
col+=vec3(.004,.008,.01)*dust;
col+=vec3(.006,.003,.014)*emi;
return col;}
vec3 renderStars(vec2 uv,float time){vec3 col=vec3(0);
for(int L=0;L<7;L++){if(uQuality<1.&&L>=2)continue;if(uQuality<2.&&L>=4)continue;float sc=pow(2.1,float(L));vec2 suv=uv*sc*65.;vec2 ce=floor(suv),lo=fract(suv)-.5;
float hh=h23(ce+float(L)*999.),h2=h23(ce+float(L)*777.+413.),h3=h23(ce+float(L)*541.+237.);
float thr=.014+float(L)*.007;
if(hh<thr){float tb=(thr-hh)/thr;
float br=pow(tb,1.5)*(.3+.7*h2);br*=.45+.55*float(7-L)/7.;
float tw=.7+.3*sin(time*(1.2+h2*2.5)+hh*32.);
float ct=h3;vec3 sc;
if(ct<.12)sc=mix(vec3(1.,.72,.35),vec3(1.,.88,.65),ct/.12);
else if(ct<.28)sc=mix(vec3(1.,.88,.65),vec3(.95,.95,.98),(ct-.12)/.16);
else if(ct<.6)sc=vec3(.95,.95,.98);
else if(ct<.82)sc=mix(vec3(.95,.95,.98),vec3(.65,.75,1.),(ct-.6)/.22);
else sc=mix(vec3(.65,.75,1.),vec3(.45,.55,.9),(ct-.82)/.18);
float d=length(lo);float st=1.-smoothstep(0.,.5,d*(4.5+float(L)*1.3));st=pow(st,3.5);
col+=sc*st*br*tw*2.8;}}
return col;}
vec2 lensDeflect(vec2 px,vec2 bh,float r){
vec2 d=px-bh;float di=length(d);
if(r<.5)return vec2(0.,1.);
if(di<r)return vec2(0.,0.);
float shadow=smoothstep(r*.35,r*3.2,di);
float deflect=0.;
if(di>r*1.003){float beyond=max(di-r*.997,r*.003);deflect=(r*r*14.)/beyond;deflect=min(deflect,di-r*1.001);deflect=max(deflect,0.);}
return vec2(deflect,shadow);}
vec3 renderEventHorizon(vec2 px,vec2 bh,float r){
vec2 d=px-bh;float di=length(d);vec3 col=vec3(0);
if(r<.5)return col;
if(di<r){float nz2=1.-(di*di)/(r*r);float nz=sqrt(max(nz2,0.));
float darkness=.01+.05*nz;col+=vec3(.001,.002,.008)*darkness;}
if(di>r&&di<r*2.){float nd=(di-r)/r;float at=exp(-nd*nd/.1)*.025;col+=vec3(.04,.08,.2)*at;}
return col;}
vec3 renderDisk(vec2 px,vec2 bh,float r,float time,vec2 mouse,float lensBoost){
if(uQuality<0.5)return vec3(0);
vec2 d=px-bh;float di=length(d);vec3 col=vec3(0);
if(r<.5)return col;
float tilt=.3;float sx=d.x,sy=d.y/cos(tilt);
float dd=sqrt(sx*sx+sy*sy);float diDisk=r*2.2,duDisk=r*6.5;
float ang=atan(sy,sx);
float diskT=(dd-diDisk)/(duDisk-diDisk);
float turb=noise(vec2(ang*8.,diskT*12.+time*.15))*noise(vec2(ang*15.+2.,diskT*8.-time*.1));
turb+=.5*noise(vec2(ang*3.-time*.2,diskT*5.));
float spiral=sin(ang*3.+diskT*10.-time*.25)*.5+.5;
float hotspot=pow(noise(vec2(ang*20.,diskT*15.+time*.3)),4.)*.6;
float density=.7+.3*(turb*.6+spiral*.3+hotspot*.1);
float beamAngle=ang+time*.35;
float doppler=pow(max(cos(beamAngle)*.5+.5,.02),3.5);
float dopplerAsym=.05+.95*doppler;
vec3 diskC;
if(diskT<.06)diskC=mix(vec3(1.2,1.1,.95),vec3(1.,.9,.55),diskT/.06);
else if(diskT<.2)diskC=mix(vec3(1.,.9,.55),vec3(1.,.55,.12),(diskT-.06)/.14);
else if(diskT<.5)diskC=mix(vec3(1.,.55,.12),vec3(.55,.35,.15),(diskT-.2)/.3);
else diskC=mix(vec3(.55,.35,.15),vec3(.35,.25,.18),(diskT-.5)/.5);
float la=abs(ang+PI*.5);float lowerMask=1.-smoothstep(PI*.38,PI*.52,la);
float ua=abs(ang-PI*.5);float upperMask=1.-smoothstep(PI*.38,PI*.52,ua);
float eqDist=abs(d.y)/max(r,.01);
float midW=clamp(.6+1.9*(1.-dd/(duDisk*1.65)),.6,2.5);
float midMask=exp(-eqDist*eqDist/midW);
if(dd>diDisk&&dd<duDisk&&lowerMask>.001){
float rad=exp(-diskT*0.3)*1.8;
float ef=smoothstep(diDisk,diDisk+r*.3,dd)*(1.-smoothstep(duDisk-r*3.5,duDisk,dd));
col+=diskC*rad*dopplerAsym*ef*lowerMask*density*1.4;}
if(dd>diDisk&&dd<duDisk&&upperMask>.001){
float rad=exp(-diskT*0.3)*1.8;
float ef=smoothstep(diDisk,diDisk+r*.3,dd)*(1.-smoothstep(duDisk-r*3.5,duDisk,dd));
col+=diskC*rad*dopplerAsym*ef*upperMask*density*1.4;}
if(dd>diDisk&&dd<duDisk*1.65&&midMask>.001){
float bEf=smoothstep(diDisk,diDisk+r*.3,dd)*(1.-smoothstep(duDisk*1.2,duDisk*1.65,dd));
float bDir=d.x>0.?1.:-1.;float bTravel=fract(dd/duDisk*1.2-time*.2*bDir);float bHot=exp(-pow(bTravel*10.-5.,2.));
float bFlow=1.+.35*bHot;
vec3 bCol=mix(vec3(.55,.35,.12),vec3(1.,.88,.6),smoothstep(diDisk,duDisk*.8,dd));
col+=bCol*1.4*bEf*midMask*bFlow*(.6+.4*dopplerAsym);}
return col;}
float segDist(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}
vec3 renderConstellations(vec2 uv,float time){vec3 col=vec3(0);float s=1.+.1*sin(time*.6);vec3 w=vec3(.35);vec3 lc=vec3(.22);float ls=.0000015;
      // Leo (scale 0.6)
vec2 L[9];L[0]=vec2(.150,.724);L[1]=vec2(.171,.740);L[2]=vec2(.159,.754);L[3]=vec2(.203,.783);L[4]=vec2(.195,.794);L[5]=vec2(.202,.816);L[6]=vec2(.215,.816);L[7]=vec2(.220,.782);L[8]=vec2(.234,.768);
for(int i=0;i<9;i++){float d=length(uv-L[i]);float br=(i==3)?1.8:1.;col+=w*(exp(-d*d/.000012)*br+exp(-d*d/.00006)*.1)*s;}
col+=lc*exp(-segDist(uv,L[2],L[3])*segDist(uv,L[2],L[3])/ls)*.45;col+=lc*exp(-segDist(uv,L[3],L[4])*segDist(uv,L[3],L[4])/ls)*.45;
col+=lc*exp(-segDist(uv,L[4],L[5])*segDist(uv,L[4],L[5])/ls)*.45;col+=lc*exp(-segDist(uv,L[5],L[6])*segDist(uv,L[5],L[6])/ls)*.45;
col+=lc*exp(-segDist(uv,L[3],L[7])*segDist(uv,L[3],L[7])/ls)*.4;col+=lc*exp(-segDist(uv,L[7],L[8])*segDist(uv,L[7],L[8])/ls)*.4;
col+=lc*exp(-segDist(uv,L[0],L[2])*segDist(uv,L[0],L[2])/ls)*.35;col+=lc*exp(-segDist(uv,L[0],L[1])*segDist(uv,L[0],L[1])/ls)*.3;
col+=lc*exp(-segDist(uv,L[1],L[8])*segDist(uv,L[1],L[8])/ls)*.35;
      // Orion (scale 0.6)
vec2 O[17];O[0]=vec2(.734,.708);O[1]=vec2(.740,.735);O[2]=vec2(.747,.737);O[3]=vec2(.751,.741);O[4]=vec2(.759,.732);O[5]=vec2(.769,.713);O[6]=vec2(.758,.765);O[7]=vec2(.747,.778);O[8]=vec2(.725,.769);O[9]=vec2(.718,.777);O[10]=vec2(.708,.795);O[11]=vec2(.719,.816);O[12]=vec2(.796,.767);O[13]=vec2(.795,.776);O[14]=vec2(.795,.762);O[15]=vec2(.793,.752);O[16]=vec2(.786,.747);
for(int i=0;i<17;i++){float d=length(uv-O[i]);float br=(i==0||i==5||i==8||i==12||(i>=1&&i<=3))?1.5:1.;col+=w*(exp(-d*d/.000012)*br+exp(-d*d/.00006)*.1)*s;}
col+=lc*exp(-segDist(uv,O[8],O[6])*segDist(uv,O[8],O[6])/ls)*.4;col+=lc*exp(-segDist(uv,O[6],O[7])*segDist(uv,O[6],O[7])/ls)*.4;
col+=lc*exp(-segDist(uv,O[8],O[0])*segDist(uv,O[8],O[0])/ls)*.35;
col+=lc*exp(-segDist(uv,O[6],O[4])*segDist(uv,O[6],O[4])/ls)*.3;col+=lc*exp(-segDist(uv,O[4],O[5])*segDist(uv,O[4],O[5])/ls)*.3;
col+=lc*exp(-segDist(uv,O[0],O[5])*segDist(uv,O[0],O[5])/ls)*.25;
col+=lc*exp(-segDist(uv,O[1],O[2])*segDist(uv,O[1],O[2])/ls)*.5;col+=lc*exp(-segDist(uv,O[2],O[3])*segDist(uv,O[2],O[3])/ls)*.5;
col+=lc*exp(-segDist(uv,O[2],O[6])*segDist(uv,O[2],O[6])/ls)*.35;
col+=lc*exp(-segDist(uv,O[8],O[9])*segDist(uv,O[8],O[9])/ls)*.35;col+=lc*exp(-segDist(uv,O[9],O[10])*segDist(uv,O[9],O[10])/ls)*.35;
col+=lc*exp(-segDist(uv,O[10],O[11])*segDist(uv,O[10],O[11])/ls)*.35;
col+=lc*exp(-segDist(uv,O[6],O[12])*segDist(uv,O[6],O[12])/ls)*.3;col+=lc*exp(-segDist(uv,O[12],O[13])*segDist(uv,O[12],O[13])/ls)*.3;
col+=lc*exp(-segDist(uv,O[12],O[14])*segDist(uv,O[12],O[14])/ls)*.3;col+=lc*exp(-segDist(uv,O[14],O[15])*segDist(uv,O[14],O[15])/ls)*.3;
col+=lc*exp(-segDist(uv,O[15],O[16])*segDist(uv,O[15],O[16])/ls)*.3;
      // Lyra (scale 0.6)
vec2 Y[5];Y[0]=vec2(.144,.152);Y[1]=vec2(.169,.170);Y[2]=vec2(.124,.204);Y[3]=vec2(.149,.224);Y[4]=vec2(.163,.246);
for(int i=0;i<5;i++){float d=length(uv-Y[i]);float br=(i==0||i==4)?1.8:1.;col+=w*(exp(-d*d/.000012)*br+exp(-d*d/.00006)*.1)*s;}
col+=lc*exp(-segDist(uv,Y[0],Y[1])*segDist(uv,Y[0],Y[1])/ls)*.4;col+=lc*exp(-segDist(uv,Y[1],Y[3])*segDist(uv,Y[1],Y[3])/ls)*.4;
col+=lc*exp(-segDist(uv,Y[3],Y[2])*segDist(uv,Y[3],Y[2])/ls)*.4;col+=lc*exp(-segDist(uv,Y[2],Y[0])*segDist(uv,Y[2],Y[0])/ls)*.4;
col+=lc*exp(-segDist(uv,Y[4],Y[3])*segDist(uv,Y[4],Y[3])/ls)*.45;col+=lc*exp(-segDist(uv,Y[4],Y[2])*segDist(uv,Y[4],Y[2])/ls)*.4;
col+=lc*exp(-segDist(uv,Y[4],Y[0])*segDist(uv,Y[4],Y[0])/ls)*.3;
      // Cygnus (scale 0.6)
vec2 C[9];C[0]=vec2(.849,.146);C[1]=vec2(.816,.170);C[2]=vec2(.791,.184);C[3]=vec2(.775,.198);C[4]=vec2(.816,.204);C[5]=vec2(.778,.160);C[6]=vec2(.753,.146);C[7]=vec2(.821,.223);C[8]=vec2(.829,.228);
for(int i=0;i<9;i++){float d=length(uv-C[i]);float br=(i==0||i==2||i==8)?1.6:1.;col+=w*(exp(-d*d/.000012)*br+exp(-d*d/.00006)*.1)*s;}
col+=lc*exp(-segDist(uv,C[8],C[7])*segDist(uv,C[8],C[7])/ls)*.45;col+=lc*exp(-segDist(uv,C[7],C[2])*segDist(uv,C[7],C[2])/ls)*.4;
col+=lc*exp(-segDist(uv,C[2],C[1])*segDist(uv,C[2],C[1])/ls)*.4;col+=lc*exp(-segDist(uv,C[1],C[0])*segDist(uv,C[1],C[0])/ls)*.4;
col+=lc*exp(-segDist(uv,C[2],C[5])*segDist(uv,C[2],C[5])/ls)*.4;col+=lc*exp(-segDist(uv,C[5],C[6])*segDist(uv,C[5],C[6])/ls)*.4;
col+=lc*exp(-segDist(uv,C[2],C[4])*segDist(uv,C[2],C[4])/ls)*.4;col+=lc*exp(-segDist(uv,C[4],C[3])*segDist(uv,C[4],C[3])/ls)*.4;
return col;}
vec2 renderLens(vec2 uv,vec2 px,vec2 bh,float r,float lensStrength){
float di=length(px-bh);vec2 ld=lensDeflect(px,bh,r);float deflect=ld.x;
vec2 luv=uv;
if(deflect>.1&&r>.5){vec2 tw=normalize(bh-px);luv+=tw*deflect*lensStrength/uRes;}
return luv;}
vec3 toneMapping(vec3 col){
float a=2.2;float b=.02;float c=2.1;float d=.5;float e=.12;
return clamp((col*(a*col+b))/(col*(c*col+d)+e),0.,1.);}
vec3 postProcess(vec3 col,vec2 uv,float time){
float ca=.0015;float rad=length(uv-.5);
float r=ca*rad;col.r=col.r*(1.-r)+col.g*r*.5;col.b=col.b*(1.-r)+col.g*r*.5;
if(uQuality>=2.){
float grain=(h23(uv*vec2(1234.,5678.)+time*100.)-.5)*.025;
col+=grain;}
float vig=1.-dot(uv-.5,uv-.5)*.22;col*=vig;
return col;}
void main(){
vec2 uv=vUv;vec2 px=uv*uRes;vec2 bh=uBH;
float r=uRadius;float time=uTime;vec2 mouse=uMouse;
float breath=1.+.003*sin(time*.4)*.5+.002*cos(time*.7)*.5;
r*=breath;
vec2 ld=lensDeflect(px,bh,r);float deflect=ld.x,shadow=ld.y;
float lensBoost=.8+.4*mouse.x;
vec2 luv=renderLens(uv,px,bh,r,lensBoost);
float distBH=length(px-bh);float infR=r*12.;
float blendLens=0.;if(infR>.5)blendLens=1.-smoothstep(infR*.02,infR*.8,distBH);
vec3 bg=renderBackground(uv);vec3 bgL=renderBackground(luv);
vec3 stars=renderStars(uv,time);vec3 starsL=renderStars(luv,time);
float lensMag=1.+.6*(1.-smoothstep(r*2.,r*8.,distBH));
vec3 color=mix(bg+stars,bgL+starsL*lensMag,blendLens);
color*=.02+.98*shadow;
color+=renderConstellations(luv,time);
color+=renderEventHorizon(px,bh,r);
color+=renderDisk(px,bh,r,time,mouse,lensBoost);
vec2 tuv=renderLens(uv,px,bh,r,lensBoost);tuv.y-=.08;
vec4 ts=texture(uTex,tuv);color=mix(color,ts.rgb*1.1,ts.a);
color=toneMapping(color);
color=postProcess(color,uv,time);
gl_FragColor=vec4(color,1.);}

