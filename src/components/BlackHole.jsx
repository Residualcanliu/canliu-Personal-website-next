"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

// ══════════════════════════════════════════════════════════════════════
//  Presets — ported from ghostty-blackhole DEMO_TOUR
// ══════════════════════════════════════════════════════════════════════
const PRESETS = [
  { name:'Inferno — 烈焰', temp:5500, incl:1.50, roll:2.7, inner:1.8, outer:8.0, opac:0.90, dopp:0.60, beam:2.5, gain:2.2, contr:1.6, wind:7.0, speed:5.0, expo:1.40, star:0.0 },
  { name:'Gargantua — 巨浪', temp:4500, incl:1.52, roll:2.7, inner:2.2, outer:7.0, opac:0.85, dopp:0.35, beam:2.0, gain:1.4, contr:0.5, wind:7.0, speed:5.0, expo:1.20, star:0.0 },
  { name:'M87* Donut — 甜甜圈', temp:3800, incl:0.55, roll:2.7, inner:2.2, outer:6.0, opac:0.45, dopp:0.90, beam:3.5, gain:1.6, contr:0.4, wind:3.0, speed:2.5, expo:1.10, star:0.0 },
  { name:'Face-on Ember — 余烬', temp:6500, incl:0.30, roll:2.7, inner:3.0, outer:10.0, opac:0.50, dopp:0.80, beam:2.5, gain:1.0, contr:1.1, wind:7.0, speed:5.0, expo:1.00, star:0.0 },
  { name:'Quasar — 类星体', temp:15000, incl:1.30, roll:2.7, inner:3.0, outer:14.0, opac:0.35, dopp:1.00, beam:4.0, gain:1.2, contr:1.3, wind:8.0, speed:5.0, expo:0.80, star:0.0 },
  { name:'Blazar — 耀变体', temp:18000, incl:1.05, roll:2.7, inner:3.0, outer:16.0, opac:0.30, dopp:1.00, beam:5.0, gain:1.0, contr:1.5, wind:9.0, speed:6.0, expo:0.75, star:0.0 },
  { name:'Pure Lens — 纯透镜', temp:5500, incl:1.50, roll:2.7, inner:1.8, outer:8.0, opac:0.00, dopp:1.00, beam:2.5, gain:0.0, contr:1.6, wind:7.0, speed:5.0, expo:1.00, star:0.6 },
  { name:'Inferno (复现)', temp:5500, incl:1.50, roll:2.7, inner:1.8, outer:8.0, opac:0.90, dopp:0.60, beam:2.5, gain:2.2, contr:1.6, wind:7.0, speed:5.0, expo:1.40, star:0.0 },
];

// ══════════════════════════════════════════════════════════════════════
//  Vertex Shader — fullscreen quad
// ══════════════════════════════════════════════════════════════════════
const VS = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// ══════════════════════════════════════════════════════════════════════
//  Fragment Shader — ghostty-blackhole.glsl → WebGL 2
//  (N_STEPS placeholder replaced at compile time per quality tier)
// ══════════════════════════════════════════════════════════════════════
const FS_TEMPLATE = `#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec4  u_date;
uniform sampler2D u_background;
uniform vec4  u_cursorColor;
uniform vec4  u_prevCursorColor;
uniform float u_timeCursorChange;

uniform float u_intensity;
uniform vec2  u_center;
uniform float u_sizeDial;
uniform float u_diskTemp;
uniform float u_diskIncl;
uniform float u_diskRoll;
uniform float u_diskInner;
uniform float u_diskOuter;
uniform float u_diskOpac;
uniform float u_diskDopp;
uniform float u_diskBeam;
uniform float u_diskGain;
uniform float u_diskContrast;
uniform float u_diskWind;
uniform float u_diskSpeed;
uniform float u_exposure;
uniform float u_starGain;
uniform float u_driftSpeed;

out vec4 fragColor;

#define HOLE_RADIUS   0.0200
#define LENS_DEPTH    13.0000
#define N_STEPS       __STEPS__
#define MODE_WEB      3
#define SIZE_MODE     MODE_WEB

const ivec3 TOKEN_BASE_HI = ivec3(0xF, 0xB, 0x0);

float tokenFromBytes(ivec3 v) {
    ivec3 lo = v & 0xF;
    if ((v >> 4) != TOKEN_BASE_HI || lo.r != (lo.g ^ lo.b ^ 0x5)) return -1.0;
    int fill = (lo.g << 4) | lo.b;
    return fill > 250 ? -1.0 : float(fill) / 250.0;
}

float tokenDecode(vec3 cc) {
    vec3 c = clamp(cc, 0.0, 1.0);
    float lvl = tokenFromBytes(ivec3(int(floor(c.r * 255.0 + 0.5)), int(floor(c.g * 255.0 + 0.5)), int(floor(c.b * 255.0 + 0.5))));
    if (lvl >= 0.0) return lvl;
    return -1.0;
}

float tokenLevel() {
    float cur = tokenDecode(u_cursorColor.rgb);
    return cur;
}

#define B_CRIT 2.5980762

float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

float vnoiseWrapY(vec2 p, float perY) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float y0 = mod(i.y, perY), y1 = mod(i.y + 1.0, perY);
    return mix(mix(hash21(vec2(i.x, y0)), hash21(vec2(i.x + 1.0, y0)), f.x),
               mix(hash21(vec2(i.x, y1)), hash21(vec2(i.x + 1.0, y1)), f.x),
               f.y);
}

vec2 mirrorUV(vec2 u) { return 1.0 - abs(1.0 - mod(u, 2.0)); }

vec2 rot(vec2 v, float a) {
    float c = cos(a), s = sin(a);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

vec2 lissa(float t) {
    return vec2(0.75 * sin(t * 0.37) + 0.25 * sin(t * 0.83 + 1.0),
                0.70 * sin(t * 0.54 + 2.1) + 0.30 * sin(t * 1.07));
}

vec3 blackbody(float T) {
    float t = clamp(T, 1500.0, 40000.0) / 100.0;
    float r = t <= 66.0 ? 1.0 : clamp(1.292936 * pow(t - 60.0, -0.1332047), 0.0, 1.0);
    float g = t <= 66.0 ? clamp(0.3900816 * log(t) - 0.6318414, 0.0, 1.0)
                        : clamp(1.1298909 * pow(t - 60.0, -0.0755148), 0.0, 1.0);
    float b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0
                                 : clamp(0.5432068 * log(t - 10.0) - 1.1962540, 0.0, 1.0));
    return vec3(r, g, b);
}

vec3 stars(vec3 d) {
    float t = u_time;
    vec2 sph = vec2(atan(d.x, -d.z), asin(clamp(d.y, -1.0, 1.0)));
    vec2 g   = sph * 40.0;
    vec2 id  = floor(g);
    float h  = hash21(id);
    if (h < 0.92) return vec3(0.0);
    vec2 f   = fract(g) - 0.5;
    vec2 off = (vec2(hash21(id + 17.3), hash21(id + 31.7)) - 0.5) * 0.7;
    float spark = smoothstep(0.10, 0.0, length(f - off));
    float tw    = 0.7 + 0.3 * sin(t * (0.5 + 2.0 * hash21(id + 5.1)) + 40.0 * h);
    vec3 tint   = mix(vec3(1.0, 0.82, 0.60), vec3(0.75, 0.85, 1.0), hash21(id + 2.9));
    return tint * spark * tw * ((h - 0.92) / 0.08);
}

struct DiskLook {
    float temp, incl, roll, inner, outer, opac, dopp, beam,
          gain, contr, wind, speed, expo, star;
};

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 res    = u_resolution;
    vec2 uv     = fragCoord / res;
    float aspect = res.x / res.y;
    float yUp = 1.0 - uv.y;
    float t = u_time * u_driftSpeed;

    DiskLook L = DiskLook(
        u_diskTemp, u_diskIncl, u_diskRoll, u_diskInner, u_diskOuter,
        u_diskOpac, u_diskDopp, u_diskBeam, u_diskGain, u_diskContrast,
        u_diskWind, u_diskSpeed, u_exposure, u_starGain);

    float rin  = max(L.inner, 1.6);
    float rout = max(L.outer, rin + 0.5);

    float g = u_intensity;
    if (g <= 0.0) {
        fragColor = texture(u_background, uv);
        return;
    }
    float I = mix(0.10, 1.0, g);
    float rhMin = sqrt(0.01 * aspect / 3.1415927);
    float rhMax = sqrt(0.50 * aspect / 3.1415927);
    float rhT = mix(rhMin, rhMax, g) * (HOLE_RADIUS / 0.08) * u_sizeDial;
    float sz = rhT / max(HOLE_RADIUS, 1e-4);

    float marg = min(rhT * mix(1.45, 0.90, g), 0.45);
    float xPad = marg / aspect;
    vec2 center = clamp(u_center,
        vec2(min(xPad, 0.5), marg),
        vec2(max(0.5, 1.0 - xPad), 1.0 - marg));

    float vis = smoothstep(0.0, 0.10, I);
    if (vis <= 0.0) {
        fragColor = texture(u_background, uv);
        return;
    }
    float rh = HOLE_RADIUS * sz;

    float dil = mix(1.0, 0.20, I);

    float WORK_AREA = 0.0;
    float shield = vis * smoothstep(WORK_AREA, WORK_AREA + 0.18, yUp);

    vec2  p    = (uv - center) * vec2(aspect, 1.0);
    float plen = length(p);

    float W  = B_CRIT / max(rh, 1e-4);
    vec2  pr = rot(vec2(p.x, -p.y), L.roll) * W;
    float b  = length(pr);

    float window = exp(-pow(plen / (7.0 * rh), 2.0));

    float bmax = rout + 3.0;
    float Z0   = max(14.0, rout + 5.0);

    // ── far field: analytic weak deflection ──
    if (b >= bmax) {
        float u    = Z0 * inversesqrt(Z0 * Z0 + b * b);
        float defl = (2.0 / (W * W)) / max(plen, 1e-4)
                   * (1.29 * u + 0.07) * max(LENS_DEPTH - 2.14 * u + 0.75, 0.0)
                   * window * shield;
        vec2  dir  = p / max(plen, 1e-5);
        vec3  term;
        float ab = 0.035 * smoothstep(1.0, 2.0, b / bmax);
        for (int i = 0; i < 3; i++) {
            float k   = 1.0 + (float(i) - 1.0) * ab;
            vec2  sp  = p - dir * defl * k;
            vec2  suv = mirrorUV(center + sp / vec2(aspect, 1.0));
            term[i]   = texture(u_background, suv)[i];
        }
        vec3 d = normalize(vec3(-(pr / b) * (2.0 / b), -1.0));
        fragColor = vec4(term + stars(d) * L.star * window * shield, 1.0);
        return;
    }

    // ── near field: geodesic integration ──
    vec3  x  = vec3(pr, Z0);
    vec3  v  = vec3(0.0, 0.0, -1.0);
    float h2 = dot(pr, pr);

    float ci = cos(L.incl), si = sin(L.incl);
    vec3  n  = vec3(0.0, si, ci);
    vec3  e2 = vec3(0.0, ci, -si);
    float sdir = L.speed < 0.0 ? -1.0 : 1.0;
    float spd  = abs(L.speed);

    vec3  emitc = vec3(0.0);
    float trans = 1.0;
    bool  captured = false;
    float sPrev = dot(x, n);
    vec3  xPrev = x;

    for (int i = 0; i < N_STEPS; i++) {
        float r2 = dot(x, x);
        if (r2 < 1.0) { captured = true; break; }
        if (x.z < -Z0 && v.z < 0.0) break;
        if (r2 > 4.0 * Z0 * Z0) break;
        float r  = sqrt(r2);
        float dt = clamp(0.16 * r, 0.03, 1.5);
        vec3 a = -1.5 * h2 * x / (r2 * r2 * r);
        v += a * (0.5 * dt);
        x += v * dt;
        r2 = dot(x, x);
        r  = sqrt(r2);
        a  = -1.5 * h2 * x / (r2 * r2 * r);
        v += a * (0.5 * dt);

        float s = dot(x, n);
        if (s * sPrev < 0.0 && trans > 0.02) {
            float tc = sPrev / (sPrev - s);
            vec3  xc = mix(xPrev, x, tc);
            float rc = length(xc);
            if (rc > rin && rc < rout) {
                float band = smoothstep(rin, rin * 1.25, rc)
                           * (1.0 - smoothstep(rout * 0.70, rout, rc));

                float phi   = atan(dot(xc, e2), xc.x);
                float turns = phi / 6.2831853;
                float kep   = pow(rin / rc, 1.5);
                float gloc  = sqrt(max(1.0 - 1.5 / rc, 0.02));
                float swirl = rc * L.wind * 0.12 - t * kep * spd * gloc * dil * sdir;
                float streaks = vnoiseWrapY(vec2(rc * 2.8, turns * 19.0 + swirl * 3.0), 19.0) * 0.65 +
                                vnoiseWrapY(vec2(rc * 1.0, turns * 9.0  + swirl * 1.5 + 7.0), 9.0) * 0.35;
                streaks = 0.35 + L.contr * streaks * streaks;

                vec3  gasdir = normalize(cross(n, xc)) * sdir;
                float beta   = clamp(inversesqrt(max(2.0 * (rc - 1.0), 0.2)), 0.0, 0.99);
                float g_dopp = gloc / max(1.0 + beta * dot(gasdir, normalize(v)), 0.05);
                g_dopp = mix(1.0, g_dopp, L.dopp);

                float xpr   = max(1.0 - sqrt(rin / rc), 0.0);
                float tprof = pow(rin / rc, 0.75) * pow(xpr, 0.25) / 0.488;
                vec3  cbb   = blackbody(L.temp * tprof * g_dopp);
                float boost = pow(g_dopp, L.beam);

                float density = band * streaks;
                emitc += trans * cbb * (L.gain * 2.2 * density * tprof * tprof * boost);
                trans *= 1.0 - clamp(L.opac * density, 0.0, 1.0);
            }
        }
        sPrev = s;
        xPrev = x;
    }
    if (!captured && dot(x, x) < 4.0) captured = true;

    vec3 bg = vec3(0.0);
    if (!captured) {
        vec3 d = normalize(v);
        bg += stars(d) * L.star * window * shield;
        if (d.z < -0.05) {
            float tpl = (-LENS_DEPTH - x.z) / d.z;
            vec3  hp  = x + d * tpl;
            vec2  q   = rot(hp.xy, -L.roll) / W;
            vec2  sp  = vec2(q.x, -q.y);
            vec2  suv = mirrorUV(center + (p + (sp - p) * window * shield) / vec2(aspect, 1.0));
            float toward = smoothstep(0.05, 0.35, -d.z);
            bg += texture(u_background, suv).rgb * toward;
        }
    }

    vec3 col = bg * trans + (vec3(1.0) - exp(-emitc * L.expo));
    fragColor = vec4(col, 1.0);
}`;

const BlackHole = forwardRef(function BlackHole({ onReady }, ref) {
  const canvasRef = useRef(null);
  const selfRef = useRef({
    speed: 50, attract: 0.20, preset: 0, sizeDial: 0.7, customParams: null
  });

  useImperativeHandle(ref, () => selfRef.current, []);

  useEffect(() => {
    const c = canvasRef.current;
    let h = document.getElementById("hint");
    if (!h) { h = document.createElement("div"); h.id = "hint"; h.className = "hint"; document.body.appendChild(h); }

    // 性能分档
    const q = innerWidth < 640 ? 0 : innerWidth < 1024 ? 1 : 2;
    const maxPR = q === 0 ? 1 : q === 1 ? 1.5 : 2;
    const steps = q === 0 ? 0 : q === 1 ? 32 : 48;

    // 手机端：不初始化 WebGL，仅显示深色背景
    if (q === 0) {
      c.style.background = "radial-gradient(ellipse at center, #0d0d12 0%, #020206 100%)";
      c.width = innerWidth; c.height = innerHeight;
      onReady?.();
      return () => {};
    }

    // ── WebGL 2 初始化 ──
    const gl = c.getContext("webgl2", { antialias: true, alpha: false });
    if (!gl) {
      h.innerHTML = "浏览器不支持 WebGL 2.0";
      h.style.color = "rgba(255,120,120,0.9)";
      onReady?.();
      return () => {};
    }

    // 注入 N_STEPS
    const FS = FS_TEMPLATE.replace("__STEPS__", String(steps));

    // 编译 shader
    function compileShader(type, source) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(sh);
        h.innerHTML = "⚠ " + err.substring(0, 120);
        h.style.color = "rgba(255,120,120,0.9)";
      }
      return sh;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VS);
    const fs = compileShader(gl.FRAGMENT_SHADER, FS);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      h.innerHTML = "⚠ Shader link error";
      h.style.color = "rgba(255,120,120,0.9)";
    }

    // 全屏四边形
    const quad = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const UL = {};
    for (const name of [
      "u_resolution","u_time","u_date","u_background",
      "u_cursorColor","u_prevCursorColor","u_timeCursorChange",
      "u_intensity","u_center","u_sizeDial",
      "u_diskTemp","u_diskIncl","u_diskRoll","u_diskInner","u_diskOuter",
      "u_diskOpac","u_diskDopp","u_diskBeam","u_diskGain","u_diskContrast",
      "u_diskWind","u_diskSpeed","u_exposure","u_starGain","u_driftSpeed"
    ]) {
      UL[name] = gl.getUniformLocation(program, name);
    }

    // ── 星空背景纹理（含星座）──
    function createStarfieldTexture() {
      const size = 1024;
      const bgc = document.createElement("canvas");
      bgc.width = size; bgc.height = size;
      const ctx = bgc.getContext("2d");

      // 深空渐变
      const grad = ctx.createRadialGradient(size*0.3, size*0.4, 0, size*0.5, size*0.5, size*0.8);
      grad.addColorStop(0, "#0d0d12");
      grad.addColorStop(0.5, "#08080c");
      grad.addColorStop(1, "#020206");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // 星云薄雾
      for (let i = 0; i < 5; i++) {
        const nx = Math.random() * size;
        const ny = Math.random() * size;
        const nr = 100 + Math.random() * 300;
        const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        const hue = Math.random() < 0.5 ? 260 : 290;
        ng.addColorStop(0, `hsla(${hue}, 60%, 30%, 0.08)`);
        ng.addColorStop(0.5, `hsla(${hue}, 50%, 15%, 0.03)`);
        ng.addColorStop(1, "transparent");
        ctx.fillStyle = ng;
        ctx.fillRect(0, 0, size, size);
      }

      // 星点
      const starCount = 2000;
      for (let i = 0; i < starCount; i++) {
        const sx = Math.random() * size;
        const sy = Math.random() * size;
        const sr = Math.random() * 2.2;
        const brightness = 0.2 + Math.random() * 0.8;
        const hue = Math.random() < 0.1 ? 30 + Math.random() * 30
                  : Math.random() < 0.3 ? 200 + Math.random() * 40 : 0;
        const sat = hue > 0 ? 40 : 0;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${70 + brightness * 30}%, ${brightness})`;
        ctx.fill();
      }

      // 亮星辉光
      for (let i = 0; i < 30; i++) {
        const sx = Math.random() * size;
        const sy = Math.random() * size;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8 + Math.random() * 15);
        glow.addColorStop(0, "rgba(255,255,255,0.9)");
        glow.addColorStop(0.1, "rgba(200,220,255,0.6)");
        glow.addColorStop(0.4, "rgba(100,150,255,0.15)");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(sx-20, sy-20, 40, 40);
      }

      // ── 星座叠加 ──
      const stars = [
        // Leo (scale 0.6)
        [0.150,0.724],[0.171,0.740],[0.159,0.754],[0.203,0.783],[0.195,0.794],[0.202,0.816],[0.215,0.816],[0.220,0.782],[0.234,0.768],
        // Orion (scale 0.6)
        [0.734,0.708],[0.740,0.735],[0.747,0.737],[0.751,0.741],[0.759,0.732],[0.769,0.713],[0.758,0.765],[0.747,0.778],[0.725,0.769],[0.718,0.777],[0.708,0.795],[0.719,0.816],[0.796,0.767],[0.795,0.776],[0.795,0.762],[0.793,0.752],[0.786,0.747],
        // Lyra (scale 0.6)
        [0.144,0.152],[0.169,0.170],[0.124,0.204],[0.149,0.224],[0.163,0.246],
        // Cygnus (scale 0.6)
        [0.849,0.146],[0.816,0.170],[0.791,0.184],[0.775,0.198],[0.816,0.204],[0.778,0.160],[0.753,0.146],[0.821,0.223],[0.829,0.228],
      ];
      // 星座连线
      const lines = [
        [2,3],[3,4],[4,5],[5,6],[3,7],[7,8],[0,2],[0,1],[1,8], // Leo
        [8+9,6+9],[6+9,7+9],[8+9,0+9],[6+9,4+9],[4+9,5+9],[0+9,5+9],[1+9,2+9],[2+9,3+9],[2+9,6+9],[8+9,9+9],[9+9,10+9],[10+9,11+9],[6+9,12+9],[12+9,13+9],[12+9,14+9],[14+9,15+9],[15+9,16+9], // Orion (offset 9 = 9 Leo stars)
        [0+26,1+26],[1+26,3+26],[3+26,2+26],[2+26,0+26],[4+26,3+26],[4+26,2+26],[4+26,0+26], // Lyra (offset 26 = 9 Leo + 17 Orion)
        [7+31,2+31],[2+31,1+31],[1+31,0+31],[2+31,5+31],[5+31,6+31],[2+31,4+31],[4+31,3+31], // Cygnus (offset 31 = 9+17+5)
      ];
      // Glow pass
      ctx.shadowColor = "rgba(160,200,255,0.5)";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "rgba(180,210,255,0.18)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (const [a, b] of lines) {
        ctx.moveTo(stars[a][0] * size, stars[a][1] * size);
        ctx.lineTo(stars[b][0] * size, stars[b][1] * size);
      }
      ctx.stroke();
      // Main pass
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(220,240,255,0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const [a, b] of lines) {
        ctx.moveTo(stars[a][0] * size, stars[a][1] * size);
        ctx.lineTo(stars[b][0] * size, stars[b][1] * size);
      }
      ctx.stroke();
      // 星座星点
      for (const [sx, sy] of stars) {
        ctx.beginPath();
        ctx.arc(sx * size, sy * size, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220,240,255,0.75)";
        ctx.fill();
      }

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bgc);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      gl.generateMipmap(gl.TEXTURE_2D);
      return tex;
    }

    const bgTexture = createStarfieldTexture();

    // ── 文字叠加层（DOM）──
    let overlayDiv = document.getElementById("welcome-overlay");
    if (!overlayDiv) {
      overlayDiv = document.createElement("div");
      overlayDiv.id = "welcome-overlay";
      overlayDiv.style.cssText = "position:fixed;top:42%;left:50%;transform:translate(-50%,-50%);text-align:center;z-index:30;pointer-events:none;font-family:\"PingFang SC\",\"Microsoft YaHei UI\",sans-serif";
      document.body.appendChild(overlayDiv);
    }
    function updateOverlay() {
      const n = new Date();
      const pad = (v) => String(v).padStart(2, "0");
      const ts = n.getFullYear() + "-" + pad(n.getMonth() + 1) + "-" + pad(n.getDate()) + " " +
        pad(n.getHours()) + ":" + pad(n.getMinutes()) + ":" + pad(n.getSeconds());
      overlayDiv.innerHTML =
        '<div style="font-size:0.9rem;color:rgba(255,255,255,0.55);margin-bottom:8px;text-shadow:0 0 14px rgba(150,190,240,0.35)">' + ts + '</div>' +
        '<div style="font-size:0.85rem;color:rgba(255,255,255,0.3);margin-bottom:55px;text-shadow:0 0 10px rgba(150,190,240,0.25)">点击星图或右上角查看各个栏目</div>' +
        '<div style="font-size:2.8rem;font-weight:600;color:rgba(255,255,255,0.92);text-shadow:0 0 50px rgba(140,190,250,0.55),0 0 100px rgba(120,160,240,0.3)">欢迎来到我的频道</div>';
    }
    updateOverlay();
    let clockTimer = setInterval(updateOverlay, 1000);

    // 标签页隐藏暂停
    let animId, paused = false;
    const onVisibility = () => {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(animId);
        if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
      } else if (paused) {
        paused = false;
        animId = requestAnimationFrame(render);
        clockTimer = setInterval(updateOverlay, 1000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // ── 状态 ──
    const TR = Math.min(innerWidth, innerHeight) * 0.035;
    const bhTarget = { x: innerWidth * 0.5, y: innerHeight * 0.78 };
    const bh = { x: innerWidth * 0.5, y: innerHeight * 0.78, radius: 0, animStart: performance.now(), animDur: 3200 };
    const mouse = { x: innerWidth * 0.5, y: innerHeight * 0.78 };
    let mouseOn = false;
    const camDrift = { x: 0, y: 0, zoom: 0, waypointX: innerWidth * 0.5, waypointY: innerHeight * 0.78 };

    c.addEventListener("pointermove", (e) => {
      const rect = c.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouseOn = true;
    });
    c.addEventListener("pointerleave", () => { mouseOn = false; });

    const handleKey = (e) => {
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        bhTarget.x = innerWidth * 0.5;
        bhTarget.y = innerHeight * 0.78;
      }
      // 预设快捷键 0-7
      const idx = parseInt(e.key);
      if (idx >= 0 && idx <= 7 && PRESETS[idx]) {
        selfRef.current.preset = idx;
      }
    };
    window.addEventListener("keydown", handleKey);

    const handleResize = () => {
      const dpr = Math.min(devicePixelRatio, maxPR);
      c.width = innerWidth * dpr;
      c.height = innerHeight * dpr;
      c.style.width = innerWidth + "px";
      c.style.height = innerHeight + "px";
      gl.viewport(0, 0, c.width, c.height);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    // ── 渲染循环 ──
    let startTime = performance.now() / 1000;
    let first = true;

    function render(ts) {
      animId = requestAnimationFrame(render);
      const now = ts / 1000;
      const dt = Math.min(now - startTime, 0.1);
      startTime = now;

      const s = selfRef.current;

      // 黑洞生长动画
      const el = ts - bh.animStart;
      const at = Math.min(el / bh.animDur, 1);
      const ea = 1 - Math.pow(1 - at, 3);
      bh.radius = TR * ea;

      // BH 移动
      const dx = mouse.x - bh.x, dy = mouse.y - bh.y;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);
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
      let tx2 = bhTarget.x - bh.x, ty = bhTarget.y - bh.y;
      const td = Math.sqrt(tx2 * tx2 + ty * ty);
      const patrolSpeed = Math.min(Math.max(s.speed || 50, 10), 200);
      const chaseSpeed = patrolSpeed * 2.4;
      const spd = (mouseOn && distToMouse < attractRange) ? chaseSpeed : patrolSpeed;
      if (td > 1) { const step = Math.min(spd * dt, td); bh.x += tx2 / td * step; bh.y += ty / td * step; }
      bh.x = Math.min(innerWidth - 5, Math.max(5, bh.x));
      bh.y = Math.min(innerHeight - 5, Math.max(5, bh.y));

      // 应用预设（preset=-1 时使用自定义参数）
      const p = (s.preset >= 0 && s.preset < PRESETS.length)
        ? PRESETS[s.preset]
        : (s.customParams || PRESETS[5]);
      const intensity = Math.min(bh.radius / TR, 1.0);

      // 上传 uniforms
      gl.useProgram(program);
      gl.uniform2f(UL.u_resolution, c.width, c.height);
      gl.uniform1f(UL.u_time, now);
      const d = new Date();
      gl.uniform4f(UL.u_date, d.getFullYear(), d.getMonth()+1, d.getDate(),
                   d.getHours()*3600 + d.getMinutes()*60 + d.getSeconds());
      gl.uniform4f(UL.u_cursorColor, 0, 0, 0, 0);
      gl.uniform4f(UL.u_prevCursorColor, 0, 0, 0, 0);
      gl.uniform1f(UL.u_timeCursorChange, 0);
      gl.uniform1f(UL.u_intensity, intensity);
      gl.uniform2f(UL.u_center, bh.x / innerWidth, 1.0 - bh.y / innerHeight);
      gl.uniform1f(UL.u_sizeDial, (bh.radius / TR) * (s.sizeDial || 0.7));
      gl.uniform1f(UL.u_diskTemp, p.temp);
      gl.uniform1f(UL.u_diskIncl, p.incl);
      gl.uniform1f(UL.u_diskRoll, p.roll);
      gl.uniform1f(UL.u_diskInner, p.inner);
      gl.uniform1f(UL.u_diskOuter, p.outer);
      gl.uniform1f(UL.u_diskOpac, p.opac);
      gl.uniform1f(UL.u_diskDopp, p.dopp);
      gl.uniform1f(UL.u_diskBeam, p.beam);
      gl.uniform1f(UL.u_diskGain, p.gain);
      gl.uniform1f(UL.u_diskContrast, p.contr);
      gl.uniform1f(UL.u_diskWind, p.wind);
      gl.uniform1f(UL.u_diskSpeed, p.speed);
      gl.uniform1f(UL.u_exposure, p.expo);
      gl.uniform1f(UL.u_starGain, p.star);
      gl.uniform1f(UL.u_driftSpeed, 1.0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bgTexture);
      gl.uniform1i(UL.u_background, 0);

      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (first) {
        first = false;
        const er = gl.getError();
        h.innerHTML = er !== gl.NO_ERROR ? "⚠ GL err 0x" + er.toString(16)
          : "made by gch / 残留v枫楪<br><span style='font-size:.75rem;opacity:.85'>建议用电脑打开，效果更佳</span>";
      }
    }
    requestAnimationFrame(render);

    onReady?.();

    return () => {
      cancelAnimationFrame(animId);
      if (clockTimer) clearInterval(clockTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleResize);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(buf);
      gl.deleteTexture(bgTexture);
    };
  }, []);

  return <canvas id="bg" ref={canvasRef} />;
});

export default BlackHole;
