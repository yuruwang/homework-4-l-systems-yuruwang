import { vec3, mat4, vec4, quat } from "gl-matrix";
import { Scene } from "./Scene";
import Model from './geometry/Model';
import Cube from './geometry/Cube';

const PI = 3.1415;

class Turtle {
    pos: vec4;
    ori: vec4;
    depth: number;

    constructor(pos: vec4, ori: vec4, depth: number) {
        let tempPos = vec4.create();
        vec4.add(tempPos, tempPos, pos);

        let tempOri = vec4.create();
        vec4.add(tempOri, tempOri, ori);

        let tempDepth = 0;
        tempDepth = tempDepth + depth; 

        this.pos = tempPos;
        this.ori = tempOri;
        this.depth = tempDepth;
    }

    public rotate(axis: vec3, rad: number) {
        let rotateM = mat4.fromValues(0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0);

        mat4.fromRotation(rotateM, rad, axis);
        vec4.transformMat4(this.ori, this.ori, rotateM);
    }

    public translate(v: vec3) {
        this.pos[0] = this.pos[0] + v[0];
        this.pos[1] = this.pos[1] + v[1];
        this.pos[2] = this.pos[2] + v[2];
    }
}

class Stack {
    list = new Array<Turtle>();

    public pushTurtle(turtle: Turtle) {
        this.list.push(turtle);
    }

    public popTurtle(): Turtle {
        return this.list.pop();
    }
}

class DrawTree {
    stack: Stack;
    str: string;
    turtle: Turtle;
    tree: Scene;
    leaves: Scene;
    birds: Scene;
    OBJ: any;
    cylinderMesh: any;
    leafMesh: any;
    crowMesh: any;
    angle: number;
    leafDensity: number;

    constructor(str: string, tree: Scene, leaves: Scene, birds: Scene, angle: number, leafDensity: number) {
        this.angle = angle;
        this.leafDensity = leafDensity;

        this.str = str;
        this.tree = tree;
        this.leaves = leaves;
        this.birds = birds;
        this.stack = new Stack();
        this.turtle = new Turtle(vec4.fromValues(0, 0, 0, 1), vec4.fromValues(0, 1, 0, 0), 0);
        this.loadObj();
        this.paseString(this.str);

    }

    public loadObj() {
        this.OBJ = require('webgl-obj-loader');

        var data = this.readTextFile("./src/obj/cylinder.obj");
        this.cylinderMesh = new this.OBJ.Mesh(data);

        data = this.readTextFile("./src/obj/Leaf.obj");
        this.leafMesh = new this.OBJ.Mesh(data);

        data = this.readTextFile("./src/obj/crowMaya.obj");
        this.crowMesh = new this.OBJ.Mesh(data);

    }

    public readTextFile(dir: string) : string
    {
        var allText
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", dir, false);
        rawFile.onreadystatechange = function ()
        {
            if(rawFile.readyState === 4)
            {
                if(rawFile.status === 200 || rawFile.status == 0)
                {
                    allText = rawFile.responseText;
                    return allText;
                }
            }
        }
        rawFile.send(null);
        return allText;
    }

    public paseString(str: string) {
        let depth = 0;
        for (let i = 0; i < str.length; i++) {
            let c = str.charAt(i);

            if (c === 'F') {
                let turtleDir = vec3.fromValues(this.turtle.ori[0], this.turtle.ori[1], this.turtle.ori[2]);
                let upDir = vec3.fromValues(0, 1, 0);
                let theta = Math.acos(vec3.dot(turtleDir, upDir));
                if (Math.abs(theta - PI/2) < PI / 15 * (this.leafDensity) + 3) {
                    let rand = Math.random();
                    let idxStart = str.length * 0.5;
                    if (rand > 1 - this.leafDensity) {
                        let leaf = new Model(this.leafMesh, vec4.fromValues(1, 0, 0, 1));
                        // translate model so that it originates at origion
                        leaf.translate(vec4.fromValues(0, -130, 0, 1));
                        // scale model down
                        leaf.scale(0.015, 0.015, 0.015);
                        // randomly orients model
                        let oriRand = Math.random();
                        leaf.rotate(PI * 2 * oriRand, vec3.fromValues(1, 0, 0));
                        leaf.rotate(PI * 2 * oriRand, vec3.fromValues(0, 1, 0));
                        leaf.rotate(PI * 2 * oriRand, vec3.fromValues(0, 0, 1));
                        // translate leaf to turtle's position
                        leaf.translate(this.turtle.pos);
                        this.leaves.addElement(leaf);
                    }
                }


                if (Math.abs(theta - PI/2) < PI / 40 * (this.leafDensity)) {
                    let rand = Math.random();
                    let idxStart = str.length * 0.5;
                    if (rand > 1 - this.leafDensity) {
                        let crow = new Model(this.crowMesh, vec4.fromValues(1, 0, 0, 1));
                        // scale model down
                        crow.scale(20, 20, 20);
                        // randomly orients model
                        let oriRand = Math.random();
                        crow.rotate(PI * 2 * oriRand, vec3.fromValues(0, 1, 0));
                        // translate leaf to turtle's position
                        crow.translate(this.turtle.pos);
                        this.birds.addElement(crow);
                    }
                }
            }
           
    
            if (c === 'B') {
                let cylinder = new Model(this.cylinderMesh, vec4.fromValues(1, 1, 1, 1));
                cylinder.scale(2, 20, 2);
                cylinder.translate(vec4.fromValues(-0.5, 0, -0.5, 1));
                this.drawBranch(cylinder);

                // move turtle toward a branch length
                let branchLen = cylinder.height;
                // let branchLen = 2;
                let moveDist = vec3.fromValues(this.turtle.ori[0] * branchLen, this.turtle.ori[1] * branchLen, this.turtle.ori[2] * branchLen);
                this.turtle.translate(moveDist);
            } else if (c === 'F' || c === 'A') {
                let cylinder = new Model(this.cylinderMesh, vec4.fromValues(1, 1, 1, 1));
                cylinder.scale(1 / Math.pow(2, this.turtle.depth), 1 / Math.pow(2, this.turtle.depth) * 5, 1 / Math.pow(2, this.turtle.depth));
                this.drawBranch(cylinder);

                if (i < 5) {
                    let base = new Model(this.cylinderMesh, vec4.fromValues(1, 0, 0, 1));
                    base.scale(5, 0.5, 5);
                    this.tree.addElement(base);
                }

                // move turtle toward a branch length
                let branchLen = cylinder.height;
                // let branchLen = 2;
                let moveDist = vec3.fromValues(this.turtle.ori[0] * branchLen, this.turtle.ori[1] * branchLen, this.turtle.ori[2] * branchLen);
                this.turtle.translate(moveDist);

            } else if (c == 'X'){
                // rotate turtle to right by 45 degrees
                // let rad = Math.random() * PI - PI / 2;
                // let rand = Math.random();
                let rad = 0;
                if (Math.random() < 0.5) {
                    rad = -PI / 4;
                } else {
                    rad = PI / 4;
                }

                this.turtle.rotate(vec3.fromValues(1, 0,0), rad);
                

            } else if (c == 'Y'){
                // rotate turtle to right by 45 degrees
                // let rad = Math.random() * PI - PI / 2;
                // let rand = Math.random();

                let rad = 0;
                if (Math.random() < 0.5) {
                    rad = -PI / 4;
                } else {
                    rad = PI / 4;
                }
                this.turtle.rotate(vec3.fromValues(0, 1, 0), rad);

            } else if (c == 'Z'){
                // rotate turtle to right by 45 degrees
                // let rad = Math.random() * PI - PI / 2;
                // let rand = Math.random();

                let rad = 0;
                if (Math.random() < 0.5) {
                    rad = -PI / 4;
                } else {
                    rad = PI / 4;
                }
                this.turtle.rotate(vec3.fromValues(0, 0, 1), rad);

            } else if (c === '[') {
                this.stack.pushTurtle(new Turtle(this.turtle.pos, this.turtle.ori, depth));
                this.turtle.depth++;
                

            } else if (c === ']') {
                this.turtle = this.stack.popTurtle();
            }

            
        }
    }
    
    public drawBranch(cylinder: Model) {
        // rotate model
        let turtleOri = vec3.fromValues(this.turtle.ori[0], this.turtle.ori[1], this.turtle.ori[2]);
        let modelOri = vec3.fromValues(0, 1, 0);
        if (!vec3.equals(turtleOri, modelOri)) {
            let normOri = vec3.fromValues(0, 0, 0); 
            // vec3.cross(normOri, turtleOri, modelOri);
            vec3.cross(normOri, modelOri, turtleOri);
            let rad = Math.acos(vec3.dot(turtleOri, modelOri));
            cylinder.rotate(rad, normOri);
        }

        cylinder.translate(this.turtle.pos);
        this.tree.addElement(cylinder);
    }
     

}

export {DrawTree,};
