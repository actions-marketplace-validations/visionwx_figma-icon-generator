# figma-icon-generator

#### Description
this action is used to generate iconfont by providing a figma file url

#### Usage
```
- name: Figma Icon Generator
    uses: visionwx/figma-icon-generator@v1.0.0
    with:
        figmaFileUrl: "https://www.figma.com/file/dl3xK2kay66wdgJiCaV0wy..."
        figmaToken: ${{ secrets.FIGMA_TOKEN }}
        figmaComponentPrefix: icon/
        fontFamilyName: iconfont
        cssClassPrefix: icon
        outputFolder: out
```

#### Inputs
- figmaFileUrl: The figma file url
- figmaToken: The figma personal access token
- figmaComponentPrefix: icon component prefix, used to filter component
- fontFamilyName: the icon font family name
- cssClassPrefix: the css class prefix
- outputFolder: the output folder