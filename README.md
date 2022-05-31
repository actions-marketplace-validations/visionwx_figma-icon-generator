# figma-icon-generator

#### Description
this action is used to generate figma iconfont.

#### Usage
- name: Figma Icon Generator
    uses: visionwx/figma-icon-generator@v1.0.0
    with:
        figmaFileUrl: "https://www.figma.com/file/dl3xK2kay66wdgJiCaV0wy..."
        figmaToken: ${{ secrets.FIGMA_TOKEN }}
        figmaComponentPrefix: icon/
        fontFamilyName: iconfont
        outputFolder: out

#### Inputs
figmaFileUrl: The figma file url
figmaToken: The figma personal access token
figmaComponentPrefix: icon component prefix, used to filter component
fontFamilyName: the icon font family name
outputFolder: the output folder