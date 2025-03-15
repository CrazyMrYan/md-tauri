export enum PreviewMode {
  Adaptive = 'adaptive', // 自适应宽度
  Mobile = 'mobile',    // 手机预览
  FullScreen = 'full'   // 全屏预览
}

export interface PreviewConfig {
  mode: PreviewMode;
  mobileWidth: number;  // 手机预览宽度
  adaptiveWidth: number; // 自适应预览最大宽度
}

export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  mode: PreviewMode.Adaptive,
  mobileWidth: 375,     // iPhone 标准宽度
  adaptiveWidth: 800    // 默认最大宽度
}; 