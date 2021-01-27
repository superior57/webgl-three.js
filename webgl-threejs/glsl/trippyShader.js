const trippyShader = `
#define GLSLIFY 1
//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
  }

uniform sampler2D u_map;
uniform sampler2D u_hovermap;

uniform float u_alpha;
uniform float u_time;
uniform float u_progressHover;
uniform float u_progressClick;

uniform vec2 u_res;
uniform vec2 u_mouse;
uniform vec2 u_ratio;
uniform vec2 u_hoverratio;

varying vec2 v_uv;

float circle(in vec2 _st, in float _radius, in float blurriness){
    vec2 dist = _st;
	  return 1. - smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
}

void main() {
  vec2 resolution = u_res * PR;
  float time = u_time * 0.05;
  float progress = u_progressClick;

  float progressHover = u_progressHover;
  vec2 uv = v_uv;
  vec2 uv_h = v_uv;

  vec2 st = gl_FragCoord.xy / resolution.xy - vec2(.5);
  st.y *= resolution.y / resolution.x;

  vec2 mouse = vec2((u_mouse.x / u_res.x) * 8. - 1.,-(u_mouse.y / u_res.y) * 8. + 1.) * -.5;
  mouse.y *= resolution.y / resolution.x;

  vec2 cpos = st + mouse;

  float c = circle(cpos, .02 * progressHover + progress * 0.8, 2.);

  float offX = uv.x + sin(uv.y + time * 2.);
  float offY = uv.y - time * .2 - cos(time * 2.) * 0.0001;
  float nc = (snoise(vec3(offX, offY, mouse) * 2.)) * progressHover;
  float nh = (snoise(vec3(offX, offY, mouse ) * 1.)) * .3;

  uv_h -= vec2(0.5);
  uv_h *= 1. - u_progressHover * 0.1;
  uv_h += vec2(0.5);

  uv_h *= u_hoverratio;

  uv -= vec2(0.5);
  uv *= 1. - u_progressHover * 0.2;
  uv *= u_ratio;
  uv += vec2(0.5);

  vec4 image = texture2D(u_hovermap, uv_h);
  vec4 imageDistorted = texture2D(u_map, uv + vec2(nh) * progressHover);

  float finalMask = smoothstep(.99, 1., pow(c, 2.));

  vec4 finalImage = mix(imageDistorted, image, clamp(finalMask + progress, 0.1, 1.));

  gl_FragColor = vec4(finalImage.rgb, u_alpha);
}
`
        