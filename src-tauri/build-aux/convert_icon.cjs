// src-tauri/build-aux/convert_icon.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 此脚本用于在Windows构建前将PNG图标转换为正确格式的ICO文件
 * 解决Windows资源编译器错误: "resource file is not in 3.00 format"
 */

function checkImageMagick() {
  try {
    // 检查是否安装了ImageMagick
    execSync('magick --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.log('ImageMagick未安装，将使用备用方法...');
    return false;
  }
}

function convertIconWithImageMagick(pngPath, icoPath) {
  try {
    // 使用ImageMagick转换PNG到ICO
    execSync(`magick convert "${pngPath}" -define icon:auto-resize=256,128,64,48,32,16 "${icoPath}"`);
    console.log(`成功使用ImageMagick将PNG转换为ICO: ${icoPath}`);
    return true;
  } catch (error) {
    console.error('ImageMagick转换失败:', error.message);
    return false;
  }
}

function main() {
  const iconsDir = path.join(__dirname, '..', 'icons');
  const pngPath = path.join(iconsDir, 'icon.png');
  const icoPath = path.join(iconsDir, 'icon.ico');
  
  // 检查源PNG文件是否存在
  if (!fs.existsSync(pngPath)) {
    console.error(`错误: 源PNG文件不存在: ${pngPath}`);
    process.exit(1);
  }
  
  // 尝试使用ImageMagick转换
  if (checkImageMagick()) {
    if (convertIconWithImageMagick(pngPath, icoPath)) {
      process.exit(0);
    }
  }
  
  // 如果ImageMagick不可用或转换失败，提供替代方案的指导
  console.log('\n无法自动转换图标。请手动执行以下步骤:');
  console.log('1. 使用在线工具如https://convertico.com将PNG转换为ICO');
  console.log('2. 确保生成的ICO文件包含多种尺寸(16x16, 32x32, 48x48, 64x64, 128x128)');
  console.log(`3. 将生成的ICO文件替换到: ${icoPath}\n`);
  
  // 在CI环境中，这是一个错误
  if (process.env.CI === 'true') {
    process.exit(1);
  }
}

main();