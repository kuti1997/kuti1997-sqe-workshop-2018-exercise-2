import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let gotVar = [];
let globalVars = {};
let toPaintGreen = [];
let toPaintRed = [];

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse, {range: true, loc : true});
};

const makePretty = (ugly)=>{
    return escodegen.generate(parseCode(ugly));
};

const substitute = (codeToParse) => {
    let parsedCode = parseCode(codeToParse);
    let rangeOfFunction = getRangeOfFunctionStart(parsedCode);
    let beforeFunctionCode = codeToParse.substring(0,rangeOfFunction[0]);
    let parsedMiddle = parseCode(codeToParse.substring(rangeOfFunction[0],rangeOfFunction[1]));
    let afterFunctionCode = codeToParse.substring(rangeOfFunction[1]);
    recursiveGetAllGlobalVars(parseCode(beforeFunctionCode));
    let newString =  beforeFunctionCode + getMeMyNewString(parsedMiddle['body'],{},codeToParse)[0]  + afterFunctionCode;
    return makePretty(newString);
};

const paintMePlease = (str,input_vector)=>{
    getLinesToPaint(parseCode(str),str,input_vector);
    return paintText(str);
};
//Finding the start of the function

const getRangeOfFunctionStart = (parsedCode)=>{
    let body = parsedCode['body'];
    for(let i=0;i<body.length;i++)
    {
        if(body[i]['type'] === 'FunctionDeclaration')
        {
            return body[i]['range'];
        }
    }
};

//Put all global variables in a map

const recursiveGetAllGlobalVars = (parsedCode) => {
    let body = parsedCode['body'];
    for(let i=0;i<body.length;i++)
    {
        if(body[i]['type'] === 'VariableDeclaration') {
            let declarations = body[i]['declarations'];
            for(let j=0;j<declarations.length;j++)
            {
                globalVars[declarations[j]['id']['name']] = getMeMyNewString(declarations[j]['init'],globalVars)[0];
            }
        }
        else
        {
            let expression = body[i]['expression'];
            globalVars[expression['left']['name']] = getMeMyNewString(expression['right'],globalVars)[0];
        }
    }
};

const getMeMyNewString = (parsedCode,varMap) => {
    if(Array.isArray(parsedCode)) {
        let text ='';
        for(let i=0;i<parsedCode.length;i++)
        {
            let result = getMeMyNewString(parsedCode[i],varMap);
            text = text + result[0];
            varMap = result[1];
        }
        return [text,varMap];
    }
    else {
        return TypeToHandler[parsedCode['type']].call(undefined,parsedCode,varMap);
    }
};

const ifHandler = (parsedCode,varMap) =>{
    let addElse = '';
    if(parsedCode['alternate'] !== null)
    {
        addElse = 'else{\n' + getMeMyNewString(parsedCode['alternate'],varMap)[0] + '\n}';
    }
    return ['if (' + getMeMyNewString(parsedCode['test'],varMap)[0] +
        '){\n' + getMeMyNewString(parsedCode['consequent'],varMap)[0] + '\n}' + addElse,varMap];
};

const funDecHandler = (parsedCode,varMap) =>{
    let vars = '';
    for(let i=0;i<parsedCode['params'].length;i++)
    {
        if(vars === '')
        {
            vars = parsedCode['params'][i]['name'];
        }
        else
        {
            vars = vars + ',' + parsedCode['params'][i]['name'];
        }
        gotVar.push(parsedCode['params'][i]['name']);
    }
    return ['function ' + parsedCode['id']['name'] + '(' + vars+ '){\n'
        + getMeMyNewString(parsedCode['body'],varMap)[0] + '\n}',varMap];
};

const varHandler = (parsedCode,varMap) =>{
    if(varMap.hasOwnProperty(parsedCode['name']))
    {
        return [varMap[parsedCode['name']],varMap];
    }
    else
    {
        return [escodegen.generate(parsedCode),varMap];
    }
};

const declarationHandler = (parsedCode,varMap) =>{
    let newMap ={};
    for(let x in varMap) {
        newMap[x] = varMap[x];
    }
    let workingWith = parsedCode['declarations'];
    for(let i=0;i<workingWith.length;i++)
    {
        newMap[workingWith[i]['id']['name']] = getMeMyNewString(workingWith[i]['init'],newMap)[0];
    }
    return ['',newMap];
};

const assHandler = (parsedCode,varMap) =>{
    if(parsedCode['left']['type'] === 'MemberExpression')
    {
        return assHandlerArrayPlace(parsedCode,varMap);
    }
    else
    {
        return assHandlerRegular(parsedCode,varMap);
    }
};

const assHandlerRegular = (parsedCode,varMap)=>{
    if(!varMap.hasOwnProperty(parsedCode['left']['name']))
    {
        return [parsedCode['left']['name'] + '' + parsedCode['operator'] + getMeMyNewString(parsedCode['right'],varMap)[0] + ';',varMap];
    }
    let newMap ={};
    for(let x in varMap) {
        newMap[x] = varMap[x];
    }
    newMap[parsedCode['left']['name']] = getMeMyNewString(parsedCode['right'],newMap)[0];
    return ['',newMap];
};

const assHandlerArrayPlace =(parsedCode,varMap)=>{
    return [parsedCode['left']['object']['name'] + '[' + getMeMyNewString(parsedCode['left']['property'],varMap)[0] + ']' + parsedCode['operator'] + getMeMyNewString(parsedCode['right'],varMap)[0] + ';',varMap];
};

const whileHandler = (parsedCode,varMap)=>{
    return ['while (' + getMeMyNewString(parsedCode['test'],varMap)[0] +
    '){\n' + getMeMyNewString(parsedCode['body'],varMap)[0] + '\n}',varMap];
};
const returnHandler = (parsedCode,varMap) =>{
    return ['return ' + getMeMyNewString(parsedCode['argument'],varMap)[0] + ';',varMap];
};

const blockStatementHandler = (parsedCode,varMap)=>{
    return getMeMyNewString(parsedCode['body'],varMap);
};

const binaryHandler = (parsedCode,varMap)=>{
    return ['(' + getMeMyNewString(parsedCode['left'],varMap)[0] + parsedCode['operator'] +
        getMeMyNewString(parsedCode['right'],varMap)[0] + ')',varMap];
};

const literalHandler = (parsedCode,varMap)=>{
    return [parsedCode['raw'],varMap];
};

const expressionHandler = (parsedCode,varMap)=>{
    return getMeMyNewString(parsedCode['expression'],varMap);
};

const arrayPlaceHandler = (parsedCode,varMap)=>{
    let object = getMeMyNewString(parsedCode['object'],varMap)[0];
    let property = getMeMyNewString(parsedCode['property'],varMap)[0];
    if(parsedCode['computed'] === true)
    {
        return [object + '[' + property + ']',varMap];
    }
    return [object + '.' + property,varMap];
};

const arrayExpHandler = (parsedCode,varMap)=>{
    let toReturn ='[';
    for(let i=0;i<parsedCode['elements'].length;i++)
    {
        let addOn = ',';
        if(i === 0)
        {
            addOn = '';
        }
        toReturn = toReturn + addOn + getMeMyNewString(parsedCode['elements'][i],varMap)[0];
    }
    toReturn = toReturn + ']';
    return [toReturn,varMap];
};
const callFuncHandler = (parsedCode,varMap)=>{
    let toReturn = parsedCode['callee']['name'] + '(';
    for(let i=0;i<parsedCode['arguments'].length;i++)
    {
        let addOn = ',';
        if(i === 0)
        {
            addOn = '';
        }
        toReturn = toReturn + addOn + getMeMyNewString(parsedCode['arguments'][i],varMap)[0];
    }
    toReturn = toReturn + ')';
    return [toReturn,varMap];
};
const logicalHandler = (parsedCode,varMap)=>{
    return [getMeMyNewString(parsedCode['left'],varMap)[0] + parsedCode['operator'] +
    getMeMyNewString(parsedCode['right'],varMap)[0],varMap];
};
const TypeToHandler = {'IfStatement': ifHandler, 'FunctionDeclaration': funDecHandler, 'Identifier': varHandler,
    'VariableDeclaration': declarationHandler, 'AssignmentExpression': assHandler, 'ReturnStatement': returnHandler
    ,'WhileStatement': whileHandler, 'BlockStatement': blockStatementHandler, 'BinaryExpression': binaryHandler,
    'Literal': literalHandler, 'ExpressionStatement': expressionHandler, 'MemberExpression': arrayPlaceHandler,
    'ArrayExpression' : arrayExpHandler, 'CallExpression': callFuncHandler, 'LogicalExpression': logicalHandler
};

const calculate =(statement)=>{
    // try {
    return eval(statement);
    // }
    /*catch (e) {
        return statement;
    }*/
};

const handleMapPaint = (parsedCode,beforeParseCode,input_vector) =>{
    if(parsedCode.hasOwnProperty('type'))
    {
        if(parsedCode['type'] === 'IfStatement') {
            let replacementWithInputVector = getMeMyNewString(parsedCode['test'],input_vector)[0];
            if(calculate(getMeMyNewString(parseCode(replacementWithInputVector)['body'],globalVars)[0])) {
                toPaintGreen.push(parsedCode['loc']['start']['line']);
            }
            else {
                toPaintRed.push(parsedCode['loc']['start']['line']);
            }
        }
        for(let x in parsedCode)
        {
            getLinesToPaint(parsedCode[x],beforeParseCode,input_vector);
        }
    }
};

const getLinesToPaint = (parsedCode,beforeParseCode,input_vector)=>{
    if(allTypesToCheck(parsedCode))return;
    if(Array.isArray(parsedCode))
    {
        for(let i=0;i<parsedCode.length;i++)
        {
            getLinesToPaint(parsedCode[i],beforeParseCode,input_vector);
        }
    }
    else
    {
        handleMapPaint(parsedCode,beforeParseCode,input_vector);
    }
};
const allTypesToCheck =(parsedCode)=>{
    return parsedCode === undefined || parsedCode === null || typeof parsedCode === 'string' || typeof parsedCode === 'number';
};

const paintText = (text)=>
{
    let toReturn = '<table>';
    let splitedText = text.split('\n');
    for(let i=0;i<splitedText.length;i++)
    {
        if(myContains(toPaintRed,i+1)) {
            toReturn = toReturn + '<tr><td>' + '<font color="red">' + splitedText[i] + '</font>' + '</td></tr>';
        }
        else {
            if(myContains(toPaintGreen,i+1)){
                toReturn = toReturn + '<tr><td>' +'<font color="green">' + splitedText[i] + '</font>' + '</td></tr>';
            }
            else {
                toReturn = toReturn+ '<tr><td>' + splitedText[i]  + '</td></tr>';
            }
        }
    }
    return toReturn + '</table>';
};

const myContains = (array,item)=>{
    for(let i=0;i<array.length;i++)
    {
        if(item === array[i]) return true;
    }
    return false;
};

const getMapFromInput = (var_str)=>{
    let withoutBrackets = var_str.substring(var_str.indexOf('(')+1,var_str.indexOf(')'));
    let toReturn = {};
    recursiveMapMaker(withoutBrackets,toReturn);
    return toReturn;
};

const recursiveMapMaker = (input_vars,varMap)=>{
    //alert(JSON.stringify(parseCode('[' + input_vars + ']')));
    if(input_vars === '') return {};
    let varName = input_vars.substring(0,input_vars.indexOf('='));
    if(miniFunc.hasOwnProperty(input_vars.charAt(input_vars.indexOf('=') + 1))) {
        miniFunc[input_vars.charAt(input_vars.indexOf('=') + 1)].call(null,input_vars,varMap,varName);
    }
    else
    {
        if(input_vars.indexOf(',') >= 0) {
            varMap[varName] = input_vars.substring(input_vars.indexOf('=') + 1,input_vars.indexOf(','));
            recursiveMapMaker(input_vars.substring(input_vars.indexOf(',') + 1),varMap);
        }
        else
        {
            varMap[varName] = input_vars.substring(input_vars.indexOf('=') + 1);
        }
    }

};
const squareMe = (input_vars,varMap,varName)=>{
    varMap[varName] = giveMeArray(input_vars.substring(input_vars.indexOf('[') + 1,input_vars.indexOf(']')));
    recursiveMapMaker(input_vars.substring(input_vars.indexOf(']') + 2),varMap);
};
const geresh = (input_vars,varMap,varName)=>{
    let withoutFirst = input_vars.substring(input_vars.indexOf('=') + 2);
    varMap[varName] = '\'' + withoutFirst.substring(0,withoutFirst.indexOf('\'') + 1);
    recursiveMapMaker(withoutFirst.substring(withoutFirst.indexOf('\'') + 2), varMap);
};
const gershaim = (input_vars,varMap,varName)=>{
    let withoutFirst = input_vars.substring(input_vars.indexOf('=') + 2);
    varMap[varName] = '"' + withoutFirst.substring(0,withoutFirst.indexOf('"') + 1);
    recursiveMapMaker(withoutFirst.substring(withoutFirst.indexOf('"') + 2),varMap);
};

const miniFunc = {'[' : squareMe,'\'': geresh,'"': gershaim};

const giveMeArray = (str)=>{
    let arr = [];
    let splitMe = str.split(',');
    for(let i=0;i<splitMe.length;i++)
    {
        arr.push(splitMe[i]);
    }
    return arr;
};
export {parseCode, substitute, getLinesToPaint, getMapFromInput, paintMePlease, makePretty, giveMeArray};
