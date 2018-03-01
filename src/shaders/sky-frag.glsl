#version 300 es
precision highp float;

uniform vec2 u_Dimensions;

out vec4 outColor;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

// Sunset palette
const vec4 skyPalette[3] = vec4[](vec4(31.0 / 255.0, 31.0 / 255.0, 31.0 / 255.0, 1.0),
                               vec4(255.0 / 255.0, 191.0 / 255.0, 115.0 / 255.0, 1.0),
                               vec4(23.0 / 255.0, 42.0 / 255.0, 94.0 / 255.0, 1.0));
const vec4 moonColor = vec4(255.0 / 255.0, 255.0 / 255.0, 255.0 / 255.0, 1.0);

void main()
{
    vec2 uv = vec2(gl_FragCoord.x / u_Dimensions.x, gl_FragCoord.y / u_Dimensions.y);
    vec4 color = vec4(0.1, 0.6, 0.5, 1);
    if (uv.y < 0.2) {
        color = skyPalette[0];

    } else if (uv.y <= 0.5) {
        color = mix(skyPalette[0], skyPalette[1], (uv.y - 0.2) / 0.3);

    } else if (uv.y < 0.5) {
        color = skyPalette[1];

    } else if (uv.y <= 0.6) {
        color = mix(skyPalette[1], skyPalette[2], (uv.y - 0.5) / 0.1);

    } else {
        color = skyPalette[2];
    }

    // draw moon
    float radius = 100.0;
    vec2 centerFrag = vec2(u_Dimensions.x / 2.0, u_Dimensions.y * 3.0 / 4.0);
    float dist = sqrt(pow(gl_FragCoord.x - centerFrag.x, 2.0) + pow(gl_FragCoord.y - centerFrag.y, 2.0));
    if (dist < radius * 0.8) {
        color = moonColor;
    } 
    if (dist >= radius * 0.8 && dist < radius){
        color = mix( skyPalette[2], moonColor, 1.0 - dist / radius);
    }


    outColor = color;
}