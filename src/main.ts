import * as core from '@actions/core';
// const github = require('@actions/github');
import FigmaExporter, {FigmaExportOption, FigmaComponentData} from './figma';
import convertCssToDart from './flutter';
// import fontGenerator from '../node_modules/icon-font-generator/lib/index.js';
const fontGenerator = require('../node_modules/icon-font-generator/lib/index');
import FS_EXTRA from 'fs-extra';
import {join, resolve} from 'path';
const { ensureDir, writeFile } = FS_EXTRA;
import glob from 'glob';

function getEnvPara(parameterName:string, defaultValue:any = undefined, raiseExceptionIfNone: boolean = true) {
    let parameterValue = process.env[parameterName] ?? defaultValue;
    if (parameterValue === undefined) {
        console.log(parameterName + " not defined");
        core.setFailed(parameterName + " not defined");
        return;
    }
    return parameterValue;
}

function getInputPara(parameterName:string) {
  let val = core.getInput(parameterName);
  if (val === "") {
    val = getEnvPara(parameterName);
  }
  return val;
}

const figmaFileUrl = getInputPara("figmaFileUrl");
const figmaToken   = getInputPara("figmaToken");
const figmaComponentPrefix = getInputPara("figmaComponentPrefix");
const fontFamilyName = getInputPara("fontFamilyName");
const cssClassPrefix = getInputPara("cssClassPrefix");
const outputFolder   = getInputPara("outputFolder");


console.log(figmaFileUrl);
console.log(figmaToken);


/**
 * Resolve globs
 *
 * @param  {String} globs
 * @return {[String]}
 */
 function getPaths(globs:string[]):string[] {
  var out:string[] = [];

  globs.forEach(str => out = out.concat(glob.sync(str)))

  return out
}

function iconfontGeneratorOptions(
  svgFolder:string,
  outFolder:string,
  fontFamilyName:string,
  cssClassPrefix:string,
):any {
  return {
    paths              : getPaths([svgFolder + "/svg/*.svg"]),
    outputDir          : outFolder,
    fontName           : fontFamilyName,
    silent             : false,
    classPrefix        : cssClassPrefix,
    normalize          : true,
    round              : 0,
    fixedWidth         : true,
    fontHeight         : 1024
  };
}


export default class FigmaIconGenerator {

  static async main():Promise<void> {
    console.log("----> start main");
    console.log("----> figma token", figmaToken);
    // init
    const figmaExporter:FigmaExporter = new FigmaExporter(figmaToken);
    const svgOutFolder = outputFolder + "/svg";
    const iconfontOutFolder = outputFolder + "/iconfont";

    // 1. Download SVG Icon from Figma
    await figmaExporter.exportSVG(figmaFileUrl, figmaComponentPrefix, svgOutFolder, fontFamilyName);
    // 2. Convert SVG Icon to IconFont
    await ensureDir(join(iconfontOutFolder));
    const options = iconfontGeneratorOptions(
      svgOutFolder,
      iconfontOutFolder,
      fontFamilyName,
      cssClassPrefix
    );
    // 3. start download
    console.log("----> start convert to iconfont");
    await fontGenerator.generate(options);
    // 4. convert css to dart
    console.log("----> start convert css to dart");
    convertCssToDart(
      iconfontOutFolder + "/" + fontFamilyName + ".css",
      iconfontOutFolder + "/" + fontFamilyName + ".dart",
      fontFamilyName
    );
  }

}

FigmaIconGenerator.main();