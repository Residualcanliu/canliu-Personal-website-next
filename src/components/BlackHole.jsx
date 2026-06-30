"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";

const BlackHole = forwardRef(function BlackHole({ onReady }, ref) {
  const canvasRef = useRef(null);
  const selfRef = useRef({ speed: 50, attract: 0.45, bhMode: 1 });

  useImperativeHandle(ref, () => selfRef.current, []);

  useEffect(() => {
    const c = canvasRef.current;
    let h = document.getElementById("hint");
    if (!h) { h = document.createElement("div"); h.id = "hint"; h.className = "hint"; document.body.appendChild(h); }

    // 性能分档：根据屏幕宽度自动选档（0=low 1=medium 2=high）
    const q = innerWidth < 640 ? 0 : innerWidth < 1024 ? 1 : 2;
    const maxPR = q === 0 ? 1 : q === 1 ? 1.5 : 2;
    const TRES = q === 0 ? 512 : q === 1 ? 1024 : 2048;
    const TRESH = q === 0 ? 128 : q === 1 ? 256 : 512;

    const R = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: false });
    R.setPixelRatio(Math.min(devicePixelRatio, maxPR));
    R.setSize(innerWidth, innerHeight);
    const gl = R.getContext();
    const _cs = gl.compileShader.bind(gl);
    gl.compileShader = function (s) {
      _cs(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        h.innerHTML = "⚠ " + gl.getShaderInfoLog(s).substring(0, 120);
        h.style.color = "rgba(255,120,120,0.9)";
      }
    };

    const S = new THREE.Scene();
    const K = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    K.position.z = 1;
    const RE = new THREE.Vector2(innerWidth, innerHeight);

    // Canvas texture — shared draw function so clock updates
    const tc = document.createElement("canvas");
    tc.width = TRES;
    tc.height = TRESH;
    const tx = tc.getContext("2d");
    tx.textAlign = "center";
    tx.textBaseline = "middle";
    tx.shadowColor = "rgba(180,210,255,0.5)";
    const te = new THREE.CanvasTexture(tc);
    te.minFilter = THREE.LinearFilter;
    te.magFilter = THREE.LinearFilter;

    function drawTexture() {
      tx.clearRect(0, 0, tc.width, tc.height);
      const cx = tc.width / 2;
      const scale = TRES / 2048; // 缩放系数，用于字体/位置
      // Clock
      const n = new Date();
      const pad = (v) => String(v).padStart(2, "0");
      const ts = n.getFullYear() + "-" + pad(n.getMonth() + 1) + "-" + pad(n.getDate()) + " " +
        pad(n.getHours()) + ":" + pad(n.getMinutes()) + ":" + pad(n.getSeconds());
      tx.shadowBlur = 6 * scale;
      tx.font = "400 " + Math.round(20 * scale) + "px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      tx.fillStyle = "rgba(255,255,255,0.5)";
      tx.fillText(ts, cx, 90 * scale);
      // Hint
      tx.font = "400 " + Math.round(20 * scale) + "px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      tx.shadowBlur = 4 * scale;
      tx.fillStyle = "rgba(255,255,255,0.22)";
      tx.fillText("点击星图或右上角查看各个栏目", cx, 195 * scale);
      // Main title
      tx.font = "600 " + Math.round(80 * scale) + "px \"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      tx.shadowBlur = 30 * scale;
      tx.fillStyle = "rgba(255,255,255,0.95)";
      tx.fillText("欢迎来到我的频道", cx, 256 * scale);
      te.needsUpdate = true;
    }
    drawTexture();
    let clockTimer = setInterval(drawTexture, 1000);

    // 标签页隐藏时暂停渲染，节省资源
    let animId, paused = false;
    const onVisibility = () => {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(animId);
        clearInterval(clockTimer);
        clockTimer = null;
      } else if (paused) {
        paused = false;
        animId = requestAnimationFrame(A);
        clockTimer = setInterval(drawTexture, 1000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const U = {
      uRes: { value: RE },
      uTime: { value: 0 },
      uBH: { value: new THREE.Vector2(innerWidth * 0.5, innerHeight * 0.78) },
      uRadius: { value: 0 },
      uTex: { value: te },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uZoom: { value: 0 },
      uQuality: { value: q },
      uBHMode: { value: 1 }, // 0=classic 1=ray-traced (default)
    };

    const VS = "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}";

    // ===== FRAGMENT SHADER (exact copy from v1.2) =====
    const FS = [
      "varying vec2 vUv;uniform vec2 uRes,uBH,uMouse;uniform float uTime,uRadius,uZoom,uQuality,uBHMode;uniform sampler2D uTex;",
      "float h23(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float h31(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}",
      "float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h23(i),h23(i+vec2(1,0)),f.x),mix(h23(i+vec2(0,1)),h23(i+vec2(1,1)),f.x),f.y);}",
      "float fbm(vec2 p){float v=0.,a=.5;vec2 s=p;for(int i=0;i<4;i++){v+=a*noise(s);s*=2.1;a*=.5;}return v;}",
      "vec3 blackbody(float T){float t=clamp(T,1500.,40000.)/100.;float r=t<=66.?1.:clamp(1.292936*pow(t-60.,-0.1332047),0.,1.);float g=t<=66.?clamp(.3900816*log(t)-.6318414,0.,1.):clamp(1.1298909*pow(t-60.,-.0755148),0.,1.);float b=t>=66.?1.:(t<=19.?.0:clamp(.5432068*log(t-10.)-1.196254,0.,1.));return vec3(r,g,b);}",
      "const float PI=3.14159265;const float SQRT3=1.7320508;",
      "vec3 renderBackground(vec2 uv){vec3 col=vec3(0);",
      "float nd=noise(uv*5.+1.3)*.5+noise(uv*2.8-2.1)*.5;",
      "col+=mix(vec3(.008,.006,.012),vec3(.015,.01,.02),nd);",
      "float gas=fbm(uv*1.6+vec2(.3,1.1));",
      "float dust=fbm(uv*1.9+vec2(2.1,.5));",
      "float emi=fbm(uv*1.3+vec2(1.5,2.3));",
      "col+=vec3(.012,.004,.003)*gas;",
      "col+=vec3(.004,.008,.01)*dust;",
      "col+=vec3(.006,.003,.014)*emi;",
      "return col;}",
      "vec3 renderStars(vec2 uv,float time){vec3 col=vec3(0);",
      "for(int L=0;L<7;L++){if(uQuality<1.&&L>=2)continue;if(uQuality<2.&&L>=4)continue;float sc=pow(2.1,float(L));vec2 suv=uv*sc*65.;vec2 ce=floor(suv),lo=fract(suv)-.5;",
      "float hh=h23(ce+float(L)*999.),h2=h23(ce+float(L)*777.+413.),h3=h23(ce+float(L)*541.+237.);",
      "float thr=.014+float(L)*.007;",
      "if(hh<thr){float tb=(thr-hh)/thr;",
      "float br=pow(tb,1.5)*(.3+.7*h2);br*=.45+.55*float(7-L)/7.;",
      "float tw=.7+.3*sin(time*(1.2+h2*2.5)+hh*32.);",
      "float ct=h3;vec3 sc;",
      "if(ct<.12)sc=mix(vec3(1.,.72,.35),vec3(1.,.88,.65),ct/.12);",
      "else if(ct<.28)sc=mix(vec3(1.,.88,.65),vec3(.95,.95,.98),(ct-.12)/.16);",
      "else if(ct<.6)sc=vec3(.95,.95,.98);",
      "else if(ct<.82)sc=mix(vec3(.95,.95,.98),vec3(.65,.75,1.),(ct-.6)/.22);",
      "else sc=mix(vec3(.65,.75,1.),vec3(.45,.55,.9),(ct-.82)/.18);",
      "float d=length(lo);float st=1.-smoothstep(0.,.5,d*(4.5+float(L)*1.3));st=pow(st,3.5);",
      "col+=sc*st*br*tw*2.8;}}",
      "return col;}",
      // === Full Schwarzschild geodesic ray-trace with thin accretion disk ===
      // Adapted from ghostty-blackhole (s0xDk) — Binet-form leapfrog integrator
      "vec4 traceNearField(vec2 px,vec2 bh,float r,float time){",
      "vec2 d=px-bh;float di=length(d);",
      "float rs=r/2.598;",
      "float cr=cos(.55),sr=sin(.55);",
      "vec2 pr_raw=vec2(d.x,-d.y)/rs;",
      "vec2 pr=vec2(pr_raw.x*cr-pr_raw.y*sr,pr_raw.x*sr+pr_raw.y*cr);",
      "float b_len=length(pr);",
      "if(b_len<2.59)return vec4(0.,0.,0.,0.);",
      "float Z0=14.;vec3 xw=vec3(pr,Z0),vw=vec3(0.,0.,-1.);float h2=b_len*b_len;",
      "float incl=1.05,ci=cos(incl),si=sin(incl);",
      "vec3 n=vec3(0.,si,ci),e2=vec3(0.,ci,-si);",
      "float rin=3.,rout=16.;",
      "vec3 emitc=vec3(0.);float trans=1.;",
      "float sPrev=dot(xw,n);vec3 xPrev2=xw;",
      "for(int i=0;i<40;i++){",
      "float r2=dot(xw,xw);",
      "if(r2<1.)return vec4(0.,0.,0.,0.);",
      "if(xw.z<-Z0&&vw.z<0.)break;",
      "float rn=sqrt(r2);float dt=clamp(.16*rn,.03,1.5);",
      // Full leapfrog: kick1 → drift → kick2 (matches ghostty-blackhole)
      "vec3 a=-1.5*h2*xw/(r2*r2*rn);vw+=a*.5*dt;xw+=vw*dt;",
      "r2=dot(xw,xw);rn=sqrt(r2);a=-1.5*h2*xw/(r2*r2*rn);vw+=a*.5*dt;",
      // Disk crossing check after complete step
      "float sNew=dot(xw,n);",
      "if(sPrev*sNew<0.&&trans>.02){",
      "float tc=sPrev/(sPrev-sNew);vec3 xc=mix(xPrev2,xw,tc);float rc=length(xc);",
      "if(rc>rin&&rc<rout){",
      "float band=smoothstep(rin,rin*1.25,rc)*(1.-smoothstep(rout*.7,rout,rc));",
      "float phi=atan(dot(xc,e2),xc.x);float turns=phi/6.2831853;",
      "float kep=pow(rin/rc,1.5);float gloc=sqrt(max(1.-1.5/rc,.02));",
      "float swirl=rc*1.08-time*kep*6.*gloc;",
      "float strk=noise(vec2(rc*2.8,turns*19.+swirl*3.))*.65+noise(vec2(rc*1.,turns*9.+swirl*1.5+7.))*.35;",
      "strk=.3+1.5*strk*strk;",
      "vec3 gasdir=normalize(cross(n,xc));",
      "float beta=clamp(inversesqrt(max(2.*(rc-1.),.2)),0.,.99);",
      "float g=gloc/max(1.+beta*dot(gasdir,vw)/length(vw),.05);g=mix(1.,g,1.);",
      "float xpr=max(1.-sqrt(rin/rc),0.);float tprof=pow(rin/rc,.75)*pow(xpr,.25)/.488;",
      "vec3 cbb=blackbody(18000.*tprof*g);float boost=pow(g,5.);",
      "float density=band*strk;",
      "emitc+=trans*cbb*(1.*2.2*density*tprof*tprof*boost);",
      "trans*=1.-clamp(.3*density,0.,1.);}}",
      "sPrev=sNew;xPrev2=xw;}",
      "if(dot(xw,xw)<4.||vw.z>0.)return vec4(0.,0.,0.,0.);",
      "float lensZ=-(Z0+6.),tSky=(lensZ-xw.z)/vw.z;vec3 hp=xw+vw*tSky;",
      "vec2 skyW=vec2(hp.x*cr+hp.y*sr,-hp.x*sr+hp.y*cr);",
      "vec2 skyScr=vec2(skyW.x,-skyW.y)*rs;",
      "vec2 bgUV=(bh+skyScr)/uRes;bgUV=clamp(bgUV,0.,1.);",
      "vec3 bg=renderBackground(bgUV)+renderStars(bgUV,time);bg*=trans;",
      "vec3 col=bg+(vec3(1.)-exp(-emitc*.75));return vec4(col,1.);}",
      // Schwarzschild geodesic ray-trace (ghostty-blackhole Binet-form leapfrog integrator)
      "vec2 lensDeflect(vec2 px,vec2 bh,float r){",
      "vec2 d=px-bh;float di=length(d);",
      "if(r<.5)return vec2(0.,1.);",
      // Near-field ray trace: desktop quality (uQuality>=1.5), within 3r of hole
      "if(di<r*3.&&uQuality>=1.5){",
      "float rs=r/2.598;float b=di/rs;", // convert screen px to Schwarzschild radii
      "if(b<2.59)return vec2(0.,0.);",   // captured: below critical impact parameter
      "float Z0=14.;float x=b,z=Z0,vx=0.,vz=-1.,h2=b*b;",
      "for(int i=0;i<16;i++){",
      "float r2=x*x+z*z;if(r2<1.)return vec2(0.,0.);if(z<-Z0&&vz<0.)break;",
      "float rn=sqrt(r2);float dt=clamp(.12*rn,.03,1.);",
      "float ax=-1.5*h2*x/(r2*r2*rn),az=-1.5*h2*z/(r2*r2*rn);",
      "vx+=ax*.5*dt;vz+=az*.5*dt;x+=vx*dt;z+=vz*dt;",
      "r2=x*x+z*z;rn=sqrt(r2);",
      "ax=-1.5*h2*x/(r2*r2*rn);az=-1.5*h2*z/(r2*r2*rn);",
      "vx+=ax*.5*dt;vz+=az*.5*dt;}",
      "if(x*x+z*z<6.||vz>=-.01)return vec2(0.,0.);", // wound up near photon sphere
      "float lensZ=-(Z0+6.),t=(lensZ-z)/vz,xSky=x+vx*t;",
      "float defl=(b-xSky)*rs;defl=min(defl,di*.85);",
      "float bCrit=r*.94;float sh=(di<bCrit?0.:smoothstep(bCrit,bCrit*1.07,di));",
      "return vec2(max(defl,0.),sh);}",
      // Analytic weak-field fallback (far field + mobile/tablet)
      "float bCrit=r*.94;",
      "if(di<bCrit)return vec2(0.,0.);",
      "float shadow=smoothstep(bCrit,bCrit*1.07,di);",
      "float deflect=0.;",
      "float x=di/r;",
      "if(x<1.3)deflect=r*12./max(x-.932,.002);",
      "else if(x<3.5)deflect=r*r*3.8/max(di-r*.55,r*.02);",
      "else deflect=r*r*2.2/di;",
      "deflect=min(deflect,di*.85);",
      "return vec2(deflect,shadow);}",
      "vec3 renderEventHorizon(vec2 px,vec2 bh,float r){",
      "vec2 d=px-bh;float di=length(d);vec3 col=vec3(0);",
      "if(r<.5)return col;",
      "if(di<r){float nz2=1.-(di*di)/(r*r);float nz=sqrt(max(nz2,0.));",
      "float darkness=.01+.05*nz;col+=vec3(.001,.002,.008)*darkness;}",
      "if(di>r&&di<r*2.){float nd=(di-r)/r;float at=exp(-nd*nd/.1)*.025;col+=vec3(.04,.08,.2)*at;}",
      "return col;}",
      "vec3 renderDisk(vec2 px,vec2 bh,float r,float time,vec2 mouse,float lensBoost){",
      "if(uQuality<0.5)return vec3(0);",
      "vec2 d=px-bh;float di=length(d);vec3 col=vec3(0);",
      "if(r<.5)return col;",
      "float tilt=.3;float sx=d.x,sy=d.y/cos(tilt);",
      "float dd=sqrt(sx*sx+sy*sy);float diDisk=r*2.2,duDisk=r*6.5;",
      "float ang=atan(sy,sx);",
      "float diskT=(dd-diDisk)/(duDisk-diDisk);",
      "float dil=sqrt(max(1.-r*1.5/max(dd,r*.1),.07));float lt=time*dil;",
      "float turb=noise(vec2(ang*8.,diskT*12.+lt*.15))*noise(vec2(ang*15.+2.,diskT*8.-lt*.1));",
      "turb+=.5*noise(vec2(ang*3.-lt*.2,diskT*5.));",
      "float spiral=sin(ang*3.+diskT*10.-lt*.25)*.5+.5;",
      "float hotspot=pow(noise(vec2(ang*20.,diskT*15.+lt*.3)),4.)*.6;",
      "float density=.7+.3*(turb*.6+spiral*.3+hotspot*.1);",
      "float beamAngle=ang+lt*.15;",
      "float doppler=1./max(1.-.55*cos(beamAngle),.12);doppler=clamp(pow(doppler,2.)*.5,.05,1.);",
      "float dopplerAsym=.05+.95*doppler;",
      "vec3 diskC;",
      "float diskTemp=mix(8500.,2200.,diskT);diskC=blackbody(diskTemp);",
      "float la=abs(ang+PI*.5);float lowerMask=1.-smoothstep(PI*.38,PI*.52,la);",
      "float ua=abs(ang-PI*.5);float upperMask=1.-smoothstep(PI*.38,PI*.52,ua);",
      "float eqDist=abs(d.y)/max(r,.01);",
      "float midW=clamp(.6+1.9*(1.-dd/(duDisk*1.65)),.6,2.5);",
      "float midMask=exp(-eqDist*eqDist/midW);",
      "if(dd>diDisk&&dd<duDisk&&lowerMask>.001){",
      "float rad=exp(-diskT*0.3)*1.8;",
      "float ef=smoothstep(diDisk,diDisk+r*.3,dd)*(1.-smoothstep(duDisk-r*3.5,duDisk,dd));",
      "col+=diskC*rad*dopplerAsym*ef*lowerMask*density*1.4;}",
      "if(dd>diDisk&&dd<duDisk&&upperMask>.001){",
      "float rad=exp(-diskT*0.3)*1.8;",
      "float ef=smoothstep(diDisk,diDisk+r*.3,dd)*(1.-smoothstep(duDisk-r*3.5,duDisk,dd));",
      "col+=diskC*rad*dopplerAsym*ef*upperMask*density*1.4;}",
      "if(dd>diDisk&&dd<duDisk*1.65&&midMask>.001){",
      "float bEf=smoothstep(diDisk,diDisk+r*.3,dd)*(1.-smoothstep(duDisk*1.2,duDisk*1.65,dd));",
      "float bDir=d.x>0.?1.:-1.;float bTravel=fract(dd/duDisk*1.2-lt*.2*bDir);float bHot=exp(-pow(bTravel*10.-5.,2.));",
      "float bFlow=1.+.35*bHot;",
      "vec3 bCol=mix(vec3(.55,.35,.12),vec3(1.,.88,.6),smoothstep(diDisk,duDisk*.8,dd));",
      "col+=bCol*1.4*bEf*midMask*bFlow*(.6+.4*dopplerAsym);}",
      "return col;}",
      "float segDist(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}",
      "vec3 renderConstellations(vec2 uv,float time){vec3 col=vec3(0);float s=1.+.1*sin(time*.6);vec3 w=vec3(.35);vec3 lc=vec3(.22);float ls=.0000015;",
      // Leo (scale 0.6)
      "vec2 L[9];L[0]=vec2(.150,.724);L[1]=vec2(.171,.740);L[2]=vec2(.159,.754);L[3]=vec2(.203,.783);L[4]=vec2(.195,.794);L[5]=vec2(.202,.816);L[6]=vec2(.215,.816);L[7]=vec2(.220,.782);L[8]=vec2(.234,.768);",
      "for(int i=0;i<9;i++){float d=length(uv-L[i]);float br=(i==3)?1.8:1.;col+=w*(exp(-d*d/.000012)*br+exp(-d*d/.00006)*.1)*s;}",
      "col+=lc*exp(-segDist(uv,L[2],L[3])*segDist(uv,L[2],L[3])/ls)*.45;col+=lc*exp(-segDist(uv,L[3],L[4])*segDist(uv,L[3],L[4])/ls)*.45;",
      "col+=lc*exp(-segDist(uv,L[4],L[5])*segDist(uv,L[4],L[5])/ls)*.45;col+=lc*exp(-segDist(uv,L[5],L[6])*segDist(uv,L[5],L[6])/ls)*.45;",
      "col+=lc*exp(-segDist(uv,L[3],L[7])*segDist(uv,L[3],L[7])/ls)*.4;col+=lc*exp(-segDist(uv,L[7],L[8])*segDist(uv,L[7],L[8])/ls)*.4;",
      "col+=lc*exp(-segDist(uv,L[0],L[2])*segDist(uv,L[0],L[2])/ls)*.35;col+=lc*exp(-segDist(uv,L[0],L[1])*segDist(uv,L[0],L[1])/ls)*.3;",
      "col+=lc*exp(-segDist(uv,L[1],L[8])*segDist(uv,L[1],L[8])/ls)*.35;",
      // Orion (scale 0.6)
      "vec2 O[17];O[0]=vec2(.734,.708);O[1]=vec2(.740,.735);O[2]=vec2(.747,.737);O[3]=vec2(.751,.741);O[4]=vec2(.759,.732);O[5]=vec2(.769,.713);O[6]=vec2(.758,.765);O[7]=vec2(.747,.778);O[8]=vec2(.725,.769);O[9]=vec2(.718,.777);O[10]=vec2(.708,.795);O[11]=vec2(.719,.816);O[12]=vec2(.796,.767);O[13]=vec2(.795,.776);O[14]=vec2(.795,.762);O[15]=vec2(.793,.752);O[16]=vec2(.786,.747);",
      "for(int i=0;i<17;i++){float d=length(uv-O[i]);float br=(i==0||i==5||i==8||i==12||(i>=1&&i<=3))?1.5:1.;col+=w*(exp(-d*d/.000012)*br+exp(-d*d/.00006)*.1)*s;}",
      "col+=lc*exp(-segDist(uv,O[8],O[6])*segDist(uv,O[8],O[6])/ls)*.4;col+=lc*exp(-segDist(uv,O[6],O[7])*segDist(uv,O[6],O[7])/ls)*.4;",
      "col+=lc*exp(-segDist(uv,O[8],O[0])*segDist(uv,O[8],O[0])/ls)*.35;",
      "col+=lc*exp(-segDist(uv,O[6],O[4])*segDist(uv,O[6],O[4])/ls)*.3;col+=lc*exp(-segDist(uv,O[4],O[5])*segDist(uv,O[4],O[5])/ls)*.3;",
      "col+=lc*exp(-segDist(uv,O[0],O[5])*segDist(uv,O[0],O[5])/ls)*.25;",
      "col+=lc*exp(-segDist(uv,O[1],O[2])*segDist(uv,O[1],O[2])/ls)*.5;col+=lc*exp(-segDist(uv,O[2],O[3])*segDist(uv,O[2],O[3])/ls)*.5;",
      "col+=lc*exp(-segDist(uv,O[2],O[6])*segDist(uv,O[2],O[6])/ls)*.35;",
      "col+=lc*exp(-segDist(uv,O[8],O[9])*segDist(uv,O[8],O[9])/ls)*.35;col+=lc*exp(-segDist(uv,O[9],O[10])*segDist(uv,O[9],O[10])/ls)*.35;",
      "col+=lc*exp(-segDist(uv,O[10],O[11])*segDist(uv,O[10],O[11])/ls)*.35;",
      "col+=lc*exp(-segDist(uv,O[6],O[12])*segDist(uv,O[6],O[12])/ls)*.3;col+=lc*exp(-segDist(uv,O[12],O[13])*segDist(uv,O[12],O[13])/ls)*.3;",
      "col+=lc*exp(-segDist(uv,O[12],O[14])*segDist(uv,O[12],O[14])/ls)*.3;col+=lc*exp(-segDist(uv,O[14],O[15])*segDist(uv,O[14],O[15])/ls)*.3;",
      "col+=lc*exp(-segDist(uv,O[15],O[16])*segDist(uv,O[15],O[16])/ls)*.3;",
      // Lyra (scale 0.6)
      "vec2 Y[5];Y[0]=vec2(.144,.152);Y[1]=vec2(.169,.170);Y[2]=vec2(.124,.204);Y[3]=vec2(.149,.224);Y[4]=vec2(.163,.246);",
      "for(int i=0;i<5;i++){float d=length(uv-Y[i]);float br=(i==0||i==4)?1.8:1.;col+=w*(exp(-d*d/.000012)*br+exp(-d*d/.00006)*.1)*s;}",
      "col+=lc*exp(-segDist(uv,Y[0],Y[1])*segDist(uv,Y[0],Y[1])/ls)*.4;col+=lc*exp(-segDist(uv,Y[1],Y[3])*segDist(uv,Y[1],Y[3])/ls)*.4;",
      "col+=lc*exp(-segDist(uv,Y[3],Y[2])*segDist(uv,Y[3],Y[2])/ls)*.4;col+=lc*exp(-segDist(uv,Y[2],Y[0])*segDist(uv,Y[2],Y[0])/ls)*.4;",
      "col+=lc*exp(-segDist(uv,Y[4],Y[3])*segDist(uv,Y[4],Y[3])/ls)*.45;col+=lc*exp(-segDist(uv,Y[4],Y[2])*segDist(uv,Y[4],Y[2])/ls)*.4;",
      "col+=lc*exp(-segDist(uv,Y[4],Y[0])*segDist(uv,Y[4],Y[0])/ls)*.3;",
      // Cygnus (scale 0.6)
      "vec2 C[9];C[0]=vec2(.849,.146);C[1]=vec2(.816,.170);C[2]=vec2(.791,.184);C[3]=vec2(.775,.198);C[4]=vec2(.816,.204);C[5]=vec2(.778,.160);C[6]=vec2(.753,.146);C[7]=vec2(.821,.223);C[8]=vec2(.829,.228);",
      "for(int i=0;i<9;i++){float d=length(uv-C[i]);float br=(i==0||i==2||i==8)?1.6:1.;col+=w*(exp(-d*d/.000012)*br+exp(-d*d/.00006)*.1)*s;}",
      "col+=lc*exp(-segDist(uv,C[8],C[7])*segDist(uv,C[8],C[7])/ls)*.45;col+=lc*exp(-segDist(uv,C[7],C[2])*segDist(uv,C[7],C[2])/ls)*.4;",
      "col+=lc*exp(-segDist(uv,C[2],C[1])*segDist(uv,C[2],C[1])/ls)*.4;col+=lc*exp(-segDist(uv,C[1],C[0])*segDist(uv,C[1],C[0])/ls)*.4;",
      "col+=lc*exp(-segDist(uv,C[2],C[5])*segDist(uv,C[2],C[5])/ls)*.4;col+=lc*exp(-segDist(uv,C[5],C[6])*segDist(uv,C[5],C[6])/ls)*.4;",
      "col+=lc*exp(-segDist(uv,C[2],C[4])*segDist(uv,C[2],C[4])/ls)*.4;col+=lc*exp(-segDist(uv,C[4],C[3])*segDist(uv,C[4],C[3])/ls)*.4;",
      "return col;}",
      "vec2 renderLens(vec2 uv,vec2 px,vec2 bh,float r,float lensStrength){",
      "float di=length(px-bh);vec2 ld=lensDeflect(px,bh,r);float deflect=ld.x;",
      "vec2 luv=uv;",
      "if(deflect>.1&&r>.5){vec2 tw=normalize(bh-px);luv+=tw*deflect*lensStrength/uRes;}",
      "return luv;}",
      "vec3 toneMapping(vec3 col){",
      "float a=2.2;float b=.02;float c=2.1;float d=.5;float e=.12;",
      "return clamp((col*(a*col+b))/(col*(c*col+d)+e),0.,1.);}",
      "vec3 postProcess(vec3 col,vec2 uv,float time){",
      "float ca=.0015;float rad=length(uv-.5);",
      "float r=ca*rad;col.r=col.r*(1.-r)+col.g*r*.5;col.b=col.b*(1.-r)+col.g*r*.5;",
      "if(uQuality>=2.){",
      "float grain=(h23(uv*vec2(1234.,5678.)+time*100.)-.5)*.025;",
      "col+=grain;}",
      "float vig=1.-dot(uv-.5,uv-.5)*.22;col*=vig;",
      "return col;}",
      "void main(){",
      "vec2 uv=vUv;vec2 px=uv*uRes;vec2 bh=uBH;",
      "float r=uRadius;float time=uTime;vec2 mouse=uMouse;",
      "float breath=1.+.003*sin(time*.4)*.5+.002*cos(time*.7)*.5;",
      "r*=breath;",
      "float distBH=length(px-bh);float lensBoost=.8+.4*mouse.x;",
      "vec3 color;float shadow;",
      // ── Near field: Schwarzschild ray-trace + thin accretion disk ──
      "if(distBH<r*7.&&uQuality>=1.5){",
      "vec4 rt=traceNearField(px,bh,r,time);color=rt.rgb;shadow=rt.a;",
      "vec2 luv2=renderLens(uv,px,bh,r,lensBoost);color+=renderConstellations(luv2,time)*.7;",
      "float prDist2=abs(distBH-r);float ph=exp(-prDist2*prDist2/(r*r*.0008))*.2;color+=vec3(.5,.65,.95)*ph*smoothstep(.1,.4,r);",
      "color*=.02+.98*shadow;",
      // ── Far field: analytic pipeline ──
      "}else{",
      "vec2 ld=lensDeflect(px,bh,r);float deflect=ld.x;shadow=ld.y;",
      "vec2 luv=renderLens(uv,px,bh,r,lensBoost);",
      "float infR=r*12.;float blendLens=0.;if(infR>.5)blendLens=1.-smoothstep(infR*.02,infR*.8,distBH);",
      "vec3 bg=renderBackground(uv);vec3 bgL=renderBackground(luv);",
      "vec3 stars=renderStars(uv,time);vec3 starsL=renderStars(luv,time);",
      "vec3 starsArc=starsL;if(distBH<r*4.5&&blendLens>.05){starsArc=vec3(0);for(int si=0;si<3;si++){float st=float(si)/2.;vec2 suv=mix(uv,luv,st);starsArc+=renderStars(suv,time)/3.;}}",
      "float lensMag=1.+.6*(1.-smoothstep(r*2.,r*8.,distBH));",
      "color=mix(bg+stars,bgL+starsArc*lensMag,blendLens);",
      "color*=.02+.98*shadow;",
      "color+=renderConstellations(luv,time);",
      "if(uQuality<1.5)color+=renderEventHorizon(px,bh,r);",
      "float prDist2=abs(distBH-r);float ph=exp(-prDist2*prDist2/(r*r*.0008))*.35;color+=vec3(.5,.65,.95)*ph*smoothstep(.1,.4,r);",
      // Only use old disk on mobile/tablet; desktop ray-trace handles it
      "if(uQuality<1.5){",
      "color+=renderDisk(px,bh,r,time,mouse,lensBoost);",
      "if(distBH>r&&distBH<r*3.8){float farStr=1./max(distBH/r-.88,.08);vec2 farPX=bh-(px-bh)*min(farStr*.55,1.3);float farDi=length(farPX-bh);float vw=abs(px.y-bh.y)/max(distBH,1.);float farMask=smoothstep(r*1.2,r*.94,distBH)*smoothstep(r*4.,r*3.,distBH)*min(vw*2.8,1.)*.4;if(farMask>.01){vec3 farDisk=renderDisk(farPX,bh,r,time,mouse,lensBoost*.5);color+=farDisk*farMask;}}",
      "}",
      "}",
      "vec2 tuv=renderLens(uv,px,bh,r,lensBoost);tuv.y-=.08;",
      "vec4 ts=texture(uTex,tuv);color=mix(color,ts.rgb*1.1,ts.a);",
      "color=toneMapping(color);",
      "color=postProcess(color,uv,time);",
      "gl_FragColor=vec4(color,1.);}",
    ].join("\n");

    // 经典版 shader 文件（云端 v2.14 原版），运行时加载
    const FS_RAYTRACED = FS;
    let classicShader = null, prevMode = selfRef.current.bhMode;
    const isDesktop = q >= 2;
    fetch("/blackhole_classic.glsl")
      .then(r => r.text()).then(src => {
        classicShader = src;
        // 非桌面设备始终用经典版 shader
        if (!isDesktop) { M.fragmentShader = classicShader; M.needsUpdate = true; }
      }).catch(() => {});

    const M = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS });
    S.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), M));

    // State
    const TR = Math.min(innerWidth, innerHeight) * 0.035;
    const bhTarget = { x: innerWidth * 0.5, y: innerHeight * 0.78 };
    const bh = { x: innerWidth * 0.5, y: innerHeight * 0.78, radius: 0, animStart: performance.now(), animDur: 3200 };
    const mouse = { x: innerWidth * 0.5, y: innerHeight * 0.78 };
    let mouseOn = false;
    const camDrift = { x: 0, y: 0, zoom: 0, waypointX: innerWidth * 0.5, waypointY: innerHeight * 0.78 };

    c.addEventListener("pointermove", function (e) {
      const rect = c.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouseOn = true;
    });
    c.addEventListener("pointerleave", () => { mouseOn = false; });

    const handleKey = (e) => {
      if (e.key.toLowerCase() === "r") { e.preventDefault(); bhTarget.x = innerWidth * 0.5; bhTarget.y = innerHeight * 0.78; }
    };
    window.addEventListener("keydown", handleKey);

    const handleResize = () => {
      R.setSize(innerWidth, innerHeight);
      RE.set(innerWidth, innerHeight);
      U.uRes.value.set(innerWidth, innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation
    const clock = new THREE.Clock();
    let first = true;
    function A(ts) {
      animId = requestAnimationFrame(A);
      const dt = Math.min(clock.getDelta(), 0.1);
      U.uTime.value += dt;

      const el = ts - bh.animStart;
      const at = Math.min(el / bh.animDur, 1);
      const ea = 1 - Math.pow(1 - at, 3);
      bh.radius = TR * ea;

      // BH movement
      const dx = mouse.x - bh.x, dy = mouse.y - bh.y;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);
      const s = selfRef.current;
      const attract = Math.min(Math.max(s.attract || 0.45, 0.05), 0.8);
      const attractRange = Math.min(innerWidth, innerHeight) * attract;
      const distToTarget = Math.sqrt((bh.x - camDrift.waypointX) ** 2 + (bh.y - camDrift.waypointY) ** 2);
      camDrift.zoom -= dt;
      if (camDrift.zoom <= 0 || distToTarget < 60) {
        camDrift.zoom = 5 + Math.random() * 3;
        camDrift.waypointX = 80 + Math.random() * (innerWidth - 160);
        camDrift.waypointY = 80 + Math.random() * (innerHeight - 160);
      }
      bhTarget.x = camDrift.waypointX;
      bhTarget.y = camDrift.waypointY;
      if (mouseOn && distToMouse < attractRange) {
        const pull = 0.4 + 1.2 * (1 - distToMouse / attractRange);
        bhTarget.x = bh.x + dx * pull;
        bhTarget.y = bh.y + dy * pull;
      }
      let tx = bhTarget.x - bh.x, ty = bhTarget.y - bh.y;
      const td = Math.sqrt(tx * tx + ty * ty);
      const patrolSpeed = Math.min(Math.max(s.speed || 50, 10), 200);
      const chaseSpeed = patrolSpeed * 2.4;
      const speed = (mouseOn && distToMouse < attractRange) ? chaseSpeed : patrolSpeed;
      if (td > 1) { const step = Math.min(speed * dt, td); bh.x += tx / td * step; bh.y += ty / td * step; }
      bh.x = Math.min(innerWidth - 5, Math.max(5, bh.x));
      bh.y = Math.min(innerHeight - 5, Math.max(5, bh.y));

      U.uBH.value.set(bh.x, RE.y - bh.y);
      U.uRadius.value = bh.radius;
      U.uMouse.value.set(mouse.x / innerWidth, mouse.y);
      U.uZoom.value = camDrift.zoom;
      U.uBHMode.value = s.bhMode;
      // 切换经典版 / 光线追踪 shader
      if (prevMode !== s.bhMode) {
        prevMode = s.bhMode;
        // 非桌面设备强制经典版，桌面设备按用户选择
        const useClassic = s.bhMode === 0 || !isDesktop;
        M.fragmentShader = useClassic && classicShader ? classicShader : FS_RAYTRACED;
        M.needsUpdate = true;
      }

      R.render(S, K);
      if (first) {
        first = false;
        const er = gl.getError();
        h.innerHTML = er !== gl.NO_ERROR ? "⚠ GL err 0x" + er.toString(16) : "made by gch / 残留v枫楪<br><span style='font-size:.75rem;opacity:.85'>建议用电脑打开，效果更佳</span>";
      }
    }
    requestAnimationFrame(A);

    onReady?.();

    return () => {
      cancelAnimationFrame(animId);
      if (clockTimer) clearInterval(clockTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleResize);
      R.dispose();
      M.dispose();
      te.dispose();
    };
  }, []);

  return <canvas id="bg" ref={canvasRef} />;
});

export default BlackHole;
