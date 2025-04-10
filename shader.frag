precision highp float;       // Telefonlar için Güncelleme

uniform vec2 iResolution;
uniform float iTime;
uniform float u_speed;         // Kalp Hızı eklendi 

#define POINT_COUNT 8
vec2 points[POINT_COUNT];
const float len = 0.25;
const float scale = 0.012;
float intensity = 1.3;
float radius = 0.015;

float speed = u_speed * -0.5;  // TEK bir yerde tanımlandı


float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C) {    
    vec2 a = B - A;
    vec2 b = A - 2.0 * B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;

    float kk = 1.0 / dot(b, b);
    float kx = kk * dot(a, b);
    float ky = kk * (2.0 * dot(a, a) + dot(d, b)) / 3.0;
    float kz = kk * dot(d, a);      

    float res = 0.0;
    float p = ky - kx * kx;
    float p3 = p * p * p;
    float q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
    float h = q * q + 4.0 * p3;

    if (h >= 0.0) { 
        h = sqrt(h);
        vec2 x = (vec2(h, -h) - q) / 2.0;
        vec2 uv = sign(x) * pow(abs(x), vec2(1.0 / 3.0));
        float t = uv.x + uv.y - kx;
        t = clamp(t, 0.0, 1.0);

        vec2 qos = d + (c + b * t) * t;
        res = length(qos);
    } else {
        float z = sqrt(-p);
        float v = acos(q / (p * z * 2.0)) / 3.0;
        float m = cos(v);
        float n = sin(v) * 1.732050808;
        vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
        t = clamp(t, 0.0, 1.0);

        vec2 qos = d + (c + b * t.x) * t.x;
        float dis = dot(qos, qos);
        res = dis;

        qos = d + (c + b * t.y) * t.y;
        dis = dot(qos, qos);
        res = min(res, dis);

        qos = d + (c + b * t.z) * t.z;
        dis = dot(qos, qos);
        res = min(res, dis);

        res = sqrt(res);
    }
    return res;
}

vec2 getHeartPosition(float t) {
    return vec2(16.0 * sin(t) * sin(t) * sin(t),
                -(13.0 * cos(t) - 5.0 * cos(2.0 * t)
                - 2.0 * cos(3.0 * t) - cos(4.0 * t)));
}

float getGlow(float dist, float radius, float intensity) {
    return pow(radius / dist, intensity);
}

float getSegment(float t, vec2 pos, float offset) {
    for (int i = 0; i < POINT_COUNT; i++) {
        points[i] = getHeartPosition(offset + float(i) * len + mod(speed * t, 6.28));
    }

    vec2 c = (points[0] + points[1]) / 2.0;
    vec2 c_prev;
    float dist = 10000.0;

    for (int i = 0; i < POINT_COUNT - 1; i++) {
        c_prev = c;
        c = (points[i] + points[i + 1]) / 2.0;
        dist = min(dist, sdBezier(pos, scale * c_prev, scale * points[i], scale * c));
    }
    return max(0.0, dist);
}

vec3 getColor(float t) {
    float cycle = mod(t, 4.0);
    if (cycle < 1.0) {
        return mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), cycle);
    } else if (cycle < 2.0) {
        return mix(vec3(0.0, 0.0, 1.0), vec3(0.5, 0.0, 1.0), cycle - 1.0);
    } else if (cycle < 3.0) {
        return mix(vec3(0.5, 0.0, 1.0), vec3(1.0, 0.0, 1.0), cycle - 2.0);
    } else {
        return mix(vec3(1.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), cycle - 3.0);
    }
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float ratio = iResolution.x / iResolution.y;
    vec2 pos = vec2(0.5) - uv;
    pos.y /= ratio;
    pos.y += 0.03;
    float t = iTime;

    float dist = getSegment(t, pos, 0.0);
    float glow = getGlow(dist, radius, intensity);
    vec3 col = vec3(0.0);
    col += 10.0 * smoothstep(0.01, 0.002, dist);
    col += glow * getColor(t);

    dist = getSegment(t, pos, 3.4);
    glow = getGlow(dist, radius, intensity);
    col += 10.0 * smoothstep(0.01, 0.002, dist);
    col += glow * getColor(t);

    col = 1.0 - exp(-col);
    col = pow(col, vec3(0.4545));
    gl_FragColor = vec4(col, 1.0);
}
