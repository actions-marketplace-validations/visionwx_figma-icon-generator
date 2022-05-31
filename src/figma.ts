// const got = require('got');
import got from 'got';
import FS_EXTRA from 'fs-extra';
import {join, resolve} from 'path';
import * as Figma from 'figma-js';
import PQueue  from 'p-queue';
import sanitize from "sanitize-filename";

const { ensureDir, writeFile } = FS_EXTRA;
  
function queueTasks(tasks:any, options:any):Promise<void> {
  const queue = new PQueue(Object.assign({concurrency: 3}, options))
  for (const task of tasks) {
    queue.add(task)
  }
  queue.start()
  return queue.onIdle()
}


export type FigmaExportOption = {
    format:string;
    outputDir:string;
    scale:number;
}

export type FigmaComponentData = {
    name:string;
    filename:string;
    id:string;
    key:string;
    file:string;
    description:string;
    width:number;
    height:number;
    image:string | null;
}


export default class FigmaExporter {
    token:string;
    client:Figma.ClientInterface;

    constructor(token:string,) {
        this.token = token;
        this.client = Figma.Client({
            personalAccessToken: this.token,
        });
    }

    getFigmaFileId(figmaFileUrl:string): string {
        let fileId:string;
        if (figmaFileUrl == null) {
            throw Error('figmaFileUrl is null');
        }
        try {
            fileId = figmaFileUrl?.match(/file\/([a-z0-9]+)\//i)[1];
        } catch (e) {
            throw Error('Cannot find figma file key!');
        }
        return fileId;
    }

    // download svg data from figma
    async downloadSVGData(
        components:{ [key: string]: FigmaComponentData; },
        options:FigmaExportOption,
    ) {
        // const contentTypes = {
        //     'svg': 'image/svg+xml',
        //     'png': 'image/png',
        //     'jpg': 'image/jpeg'
        // }
        await queueTasks(Object.values(components).map(component => () => {
            return got.get(component.image, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                },
                encoding: 'utf8'
            }).then(response => {
                return ensureDir(join(options.outputDir, options.format))
                    .then(() => writeFile(join(options.outputDir, options.format, component.filename), response.body, 'utf8'))
            })
        }), null);
    }

    // save component data to output folder data.json
    async saveData(
        components:{ [key: string]: FigmaComponentData; },
        options:FigmaExportOption,
    ) {
        await ensureDir(join(options.outputDir));
        await writeFile(
            resolve(options.outputDir, 'data.json'), 
            JSON.stringify(components), 
            'utf8'
        );
    }

    async getComponentImageData(
        components:{ [key: string]: FigmaComponentData; },
        fileId:string, 
        options:FigmaExportOption,
    ) {
        console.log('----> Getting component exporting image urls')
        let { data } = await this.client.fileImages(
          fileId,
          {
            format: options.format as Figma.exportFormatOptions,
            ids: Object.keys(components),
            scale: options.scale
          }
        );

        for(const id of Object.keys(data.images)) {
            components[id].image = data.images[id]
        }
        return components
    }


    // get component data from figma file data
    getComponentData(
        data:Figma.FileResponse, 
        fileId:string, 
        componentNamePrefix:string,
        options:FigmaExportOption,
    ):{ [key: string]: FigmaComponentData; } {
        const components: { [key: string]: FigmaComponentData; } = {};

        function check(c:Figma.Node) {
            if (c.type === 'COMPONENT' && c.name && c.name.startsWith(componentNamePrefix)) {

                const {name, id} = c;
                const cName:string = name.replace(componentNamePrefix, "");
                const {description = '', key} = data.components[c.id];
                const {width, height} = c.absoluteBoundingBox;
                const filename = `${sanitize(cName).toLowerCase()}.${options.format}`;
                const image:string = null;

                components[id] = {
                    name: cName,
                    filename: filename,
                    id: id,
                    key: key,
                    file: fileId,
                    description: description,
                    width: width,
                    height: height,
                    image: image
                };

            } else if ((c as any)?.children) {
                (c as any)?.children.forEach(check);
            }
        }

        data.document.children.forEach(check);

        if (Object.values(components).length === 0) {
            throw Error('No components found!')
        }
        console.log(`${Object.values(components).length} components found in the figma file`)
        return components
    }

    // export SVG
    async exportSVG(figmaFileUrl:string, figmaComponentPrefix:string, 
        outputFolder:string, fontFamilyName:string): Promise<void> {
        // options
        const options:FigmaExportOption = {
            format: 'svg',
            outputDir: outputFolder,
            scale: 1
        };
        // get fileId
        let fileId:string = this.getFigmaFileId(figmaFileUrl);
        // get figma file data
        let fileData = await this.client.file(fileId);
        console.log("----> fileData Done");
        // get figma component data
        let componentData:{ [key: string]: FigmaComponentData; } = this.getComponentData(
            fileData.data, fileId, figmaComponentPrefix, options
        );
        // update figma component image url data
        componentData = await this.getComponentImageData(
            componentData, fileId, options
        );
        console.log(componentData);
        // save component data to local
        this.saveData(
            componentData, options
        );
        console.log("----> Done save data.json");
        // download component svg data
        await this.downloadSVGData(
            componentData, options
        );
        console.log("----> Done download svg data");
        // 
    }    

}