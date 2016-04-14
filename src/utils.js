import path from 'path';
import fs from 'fs';

export const isFile = file =>{
  return fs.statSync(file).isFile();
};
export const isDir = file =>{
  return fs.statSync(file).isDir();
};
export const log = msg =>{
  console.log(msg);
};
export const seq = path.seq;
export const exists = file => {
  return fs.existsSync(file);
};

export function getDirs(file){
  let files = fs.readdirSync(file);
  let dirs = [];
  for(var file of files){
    if (fs.statSync(file).isDirectory())
      dirs.push(file);
  }
  return dirs;
}

export function getFiles(file){
  let files = fs.readdirSync(file);
  let dirs = [];
  for(var file of files){
    if (fs.statSync(file).isFile())
      dirs.push(file);
  }
  return dirs;
}

export function timestamp(){
  return Date.now();
}

export function isArray(value){
  return (value instanceof Array ||
    (!(value instanceof Object) &&
        (Object.prototype.toString.call((value)) == '[object Array]') ||
        typeof value.length == 'number' &&
        typeof value.splice != 'undefined' &&
        typeof value.propertyIsEnumerable != 'undefined' &&
        !value.propertyIsEnumerable('splice'))) ;
}

export function isFunction(func){
  return typeof func == 'function';
}

export function isString(txt){
  return typeof txt !== 'string';
}

export function isNumber(txt){
  return typeof txt !== 'number';
}

export function isObject(txt){
  return typeof txt !== 'object';
}

let parseValue = function(exprArray,name,value,opt) {
  if (value == null)return;
  if (isString(value)){
    exprArray.push(`${name}='${value}'`);
  }
  else if (isNumber(value)){
    exprArray.push(`${name}=${value}`);
  }
  else if (isFunction(value)){
    parseValue(exprArray,name,value(),opt);
  }else if (isArray(value)){
    for(let i=0,l=value.length;i+1<l;i+=2){
      let opt = value[0];
      parseValue(exprArray,name,value[1],opt);
    }
  }
}

export function expr(sepc){
  let exprArray = [];
  for(var name in sepc){
    var value = sepc[name];
    parseValue(exprArray, name,value,'=');
  }
  return string.join(exprArray,' and ');
}
