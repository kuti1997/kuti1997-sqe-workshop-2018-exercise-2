import assert from 'assert';
import {substitute, makePretty, giveMeArray, getMapFromInput, paintMePlease} from '../src/js/code-analyzer';

let input1 = 'function f(a,b,c){\n' +
    'c=5;\n'+
    'let g=8;\n' +
    'let ggg = fib(1,2,3);\n'+
    'let d = [1,2,3];\n' +
    'return a + d[1];\n' +
    '}';
let input2 = 'function f(a,b,c){\n' +
    'let g=8;\n' +
    'let r=a;\n' +
    'let d = [1,2,3];\n' +
    'r=c + b;\n' +
    'return a + d[1] + r;\n' +
    '}';
let input4 = 'function foo(x, y, z){\n' +
    '    let a = [1,2,3,4];\n' +
    'let h = a.length;'+
    '    let b = a[3];\n' +
    '    if(b === 4){\n' +
    '     return b;\n' +
    '}\n' +
    'else\n' +
    '{\n' +
    'return 5;\n' +
    '}\n' +
    '}\n';
let input5 = 'let d = 5;\n' +
    'function foo(x, y, z){\n' +
    'x[0] = 5;\n'+
    '    let a = [1,2,3,4];\n' +
    '    let b = a[3];\n' +
    '    if(d === 4){\n' +
    '     return b;\n' +
    '}\n' +
    'else\n' +
    '{\n' +
    'return 5;\n' +
    '}\n' +
    '}\n';
let input6 = 'let d = 5;\n' +
    'let c = 5;\n' +
    'let c = d + 7;\n' +
    'function foo(x, y, z){\n' +
    '    let a = [1,2,3,4];\n' +
    '    let b = a[3];\n' +
    '    if(d === 4){\n' +
    '     return b;\n' +
    '}\n' +
    'else\n' +
    '{\n' +
    'return 5;\n' +
    '}\n' +
    '}\n';
let input7 = 'let d = 5;\n' +
    'let c = 5;\n' +
    'c = d+5;\n' +
    'function f(x){\n' +
    'let a = [1,2,3,4];\n' +
    'let b = a[3];\n' +
    'if(x[0]=== 1)\n' +
    'return b;\n' +
    '}';
let input8 = 'let d = 5;\n' +
    'let c = 5;\n' +
    'c = d+5;\n' +
    'function f(x){\n' +
    'let a = 5;\n' +
    'let b = 6;\n' +
    'let e = a + b + x + c;\n' +
    'return e;\n' +
    '}';
let input9 = 'let d = [1,2,3];\n' +
    'function f(x){\n' +
    'if(d[2] === 3)\n' +
    'return d[2];\n' +
    '}';
let input10 = 'function f(z){\n' +
    'let x = 1;\n' +
    'let y = 1;\n' +
    'return x;\n' +
    '}';
let input11 = 'function f(z){\n' +
    'let t = 0;\n' +
    'let x = z[0];\n' +
    'let y = 1;\n' +
    'return x;\n' +
    '}';
let input12 = 'function f(z){while(z > 0){return 0;}}';
let input13 = 'function f(z){let a="hardWord";let b=a[0];return b;}';
let input14 = 'function g() { let a = ["juice"]; let b = 0; if(a[b][1] === \'u\') { return a; } }';
let input15 = 'function fib(n) { let index = n-1;if(index === 0 || index === 1){return 1;}else{return fib(index-1)+fib(index-2);}}';
let inputPaint1 =
    'function f(x){\n' +
    'if(1 === 3){\n' +
    '\treturn d[2];\n' +
    '}\n' +
    'else if(60 === 60){\n' +
    '\treturn 0;\n' +
    '}\n' +
    '}';
describe('The javascript parser', () => {
    /*it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script"}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
        );
    });*/
    it('is parsing a big function',()=>{
        assert.equal(substitute(input1),makePretty('function f(a, b, c) {c=5;\n' +
            'return a + [1,2,3][1];\n' +
            '}'));
    });
    it('is parsing a big function2',()=>{
        assert.equal(substitute(input2),makePretty('function f(a, b, c) {\n' +
            '    return a + [1,2,3][1] + (c + b);\n' +
            '}'));
    });
    it('is parsing a big function4',()=>{
        assert.equal(substitute(input4),makePretty('function foo(x, y, z) {if ([1,2,3,4][3] === 4) {return [1,2,3,4][3];\n' +
            '} else {return 5;}}'));
    });
    it('is parsing a big function5',()=>{
        assert.equal(substitute(input5),makePretty('let d = 5;\n' +
            'function foo(x, y, z) {x[0] = 5;' +
            '    if (d === 4) {\n' +
            '        return [1,2,3,4][3];\n' +
            '    } else {\n' +
            '        return 5;\n' +
            '    }\n' +
            '}'));
    });
    it('is parsing a big function6',()=>{
        assert.equal(substitute(input6),makePretty('let d = 5;let c = 5;let c = d + 7;' +
            'function foo(x, y, z) {if (d === 4) {return [1,2,3,4][3];} else {return 5;}}'));
    });
    it('is parsing a big function7',()=>{
        assert.equal(substitute(input7),makePretty('let d = 5;let c = 5;c = d + 5;' +
            'function f(x){if(x[0]=== 1){return [1,2,3,4][3];}}'));
    });
    it('is parsing a big function8',()=>{
        assert.equal(substitute(input8),'let d = 5;\n' + makePretty('let c = 5;c = d+5;' +
            'function f(x){return 5 + 6 + x + c;}'));
    });
    it('is parsing a big function9',()=>{
        assert.equal(substitute(input9),makePretty('let d = [1,2,3];' +
            'function f(x){if(d[2] === 3){return d[2];}}'));
    });
    it('is parsing a big function10',()=>{
        assert.equal(substitute(input10),makePretty('function f(z){return 1;}'));
    });
    it('is parsing a big function11',()=>{
        assert.equal(substitute(input11),makePretty('function f(z){return z[0];}'));
    });
    it('is parsing a big function12',()=>{
        assert.equal(substitute(input12),makePretty(input12));
    });
    it('is parsing a big function13',()=>{
        assert.equal(substitute(input13),makePretty('function f(z){return \'hardWord\'[0];}'));
    });
    it('is parsing a big function14',()=>{
        assert.equal(substitute(input14),makePretty('function g() { if([\'juice\'][0][1]=== \'u\') { return ["juice"]; } }'));
    });
    it('is parsing a big function15',()=>{
        assert.equal(substitute(input15),makePretty('function fib(n) { if(n-1 === 0 || n-1 === 1){return 1;}else{return fib(n-1-1)+fib(n-1-2);}}'));
    });
    it('giveMeArray',()=>{
        assert.equal(JSON.stringify(giveMeArray('1,2,3,4')),JSON.stringify(['1','2','3','4']));
    });
    it('getMapFromInput1', ()=>{
        assert.equal(JSON.stringify(getMapFromInput('(x=1,y="3",z=[1,2,3])')),JSON.stringify({'x':'1','y':'"3"','z': ['1','2','3']}));
    });
    it('getMapFromInput2', ()=>{
        assert.equal(JSON.stringify(getMapFromInput('(x=1,y=\'3\',z=4)')),JSON.stringify({'x':'1','y':'\'3\'','z': '4'}));
    });
    it('paintMePlease1', ()=>{
        assert.equal(paintMePlease(inputPaint1,{'x': '1'}),'<table><tr><td>function f(x){</td></tr><tr><td><font color="red">if(1 === 3){</font></td></tr><tr><td>\treturn d[2];</td></tr><tr><td>}</td></tr><tr><td><font color="green">else if(60 === 60){</font></td></tr><tr><td>\treturn 0;</td></tr><tr><td>}</td></tr><tr><td>}</td></tr></table>');
    });
});
