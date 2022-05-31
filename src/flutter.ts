import * as fs from 'fs';

// './out/iconfont/iconfont.css'
async function convertCssToDart(
    cssFile:string, 
    dartFile:string,
    fontFamilyName:string
) {
    fs.readFile(cssFile, (err, buffer) => {
        if (err) console.error(err);
      
        let css = buffer.toString()
    
        let dartData = buildDratClass(css, fontFamilyName);
    
        fs.writeFile(dartFile, dartData, (err) => {
            if (err) console.error(err);
        });
    });
}

function buildDratClass(
    css:string, 
    fontFamilyName:string
){
    let names = css.match(/(?<=\.).+(?=:before)/g);
    let values = css.match(/(?<="\\)f[0-9a-zA-Z]{3}(?=";)/g);

    let rawContent = "import 'package:flutter/widgets.dart';";
    rawContent += "\n";
    rawContent += "\nclass IconFont {";
    rawContent += "\n\tstatic const String _family = '" + fontFamilyName + "';";
    rawContent += "\n\tIconFont._();";

    for(let i=0;i<names.length;i++){
        let name = names[i].replace(/-/g,'').replace(fontFamilyName, '');
        rawContent += "\n\tstatic const IconData "+name+" = IconData(0x"+values[i]+", fontFamily: _family);"
    }

    rawContent += "\n}";
    console.log(rawContent);

    return rawContent;
}

export default convertCssToDart;