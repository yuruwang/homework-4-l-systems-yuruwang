
class Rule {
    prob: number;
    mapStr: string;

    constructor(prob: number, mapStr: string) {
        this.prob = prob;
        this.mapStr = mapStr;
    }
}

class RuleSet {
    ruleSet: Rule[];
    constructor(rules: Rule[]) {
        this.ruleSet = rules;
    }
}


class Grammer {
    charArray: RuleSet[] = [];

    constructor() {

        this.charArray['B'.charCodeAt(0) - 'A'.charCodeAt(0)] = new RuleSet([new Rule(1, 'B')]);
      
        this.charArray['F'.charCodeAt(0) - 'A'.charCodeAt(0)] = new RuleSet([new Rule(0.7, 'FF[YFXFXF][ZFYFYF][XFZFZF]'), new Rule(0.3, 'FF[YFXFXF][XFZFZF][ZFYFYF]')]);
    }

}

class LSystem {
    axiom: string;
    interations: number;
    grammer: Grammer;
    expanded: string;

    constructor(axiom: string, interations: number) {
        this.axiom = axiom;
        this.interations = interations;
        this.grammer = new Grammer();

        this.expanded = this.buildDrawString(this.axiom, this.interations, this.grammer);
    }
    
public buildDrawString(axiom: string, interations: number, grammer: Grammer): string {
    let expanded = "" + axiom;
    for (let i = 0; i < interations; i++) {
        expanded = this.expand(expanded, grammer);
    }
    return expanded;
}

public expand(str: string, grammer: Grammer) {
    let resultStr = "";
    for (let i = 0; i < str.length; i++) {
        let c = str.charAt(i);

        if (!grammer.charArray[c.charCodeAt(0) - 'A'.charCodeAt(0)]) {
            resultStr += c;
            continue;
        }
        let allRules = grammer.charArray[c.charCodeAt(0) - 'A'.charCodeAt(0)].ruleSet;

        let probSum = 0;
        let rand = Math.random();
        for (let i = 0; i < allRules.length; i++) {
            probSum += allRules[i].prob;
            if (rand <= probSum) {
                resultStr = resultStr + allRules[i].mapStr;
                break;
            }
        }
    } 
    return resultStr;  
}
}

export {LSystem, Grammer};