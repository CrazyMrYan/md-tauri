#!/bin/bash
# src-tauri/build-aux/bundle_dmg.sh

# 此脚本用于macOS上创建DMG文件

APP_NAME="$1"
DMG_PATH="$2"
SOURCE_DIR="$3"

if [ -z "$APP_NAME" ] || [ -z "$DMG_PATH" ] || [ -z "$SOURCE_DIR" ]; then
  echo "错误: 缺少必要参数"
  echo "使用: $0 APP_NAME DMG_PATH SOURCE_DIR"
  echo "当前参数:"
  echo "APP_NAME: $APP_NAME"
  echo "DMG_PATH: $DMG_PATH"
  echo "SOURCE_DIR: $SOURCE_DIR"
  exit 1
fi

# 检查源目录是否存在
if [ ! -d "$SOURCE_DIR" ]; then
  echo "错误: 源目录不存在: $SOURCE_DIR"
  exit 1
fi

# 检查应用程序是否存在
if [ ! -d "$SOURCE_DIR/$APP_NAME.app" ]; then
  echo "错误: 应用程序不存在: $SOURCE_DIR/$APP_NAME.app"
  ls -la "$SOURCE_DIR"
  exit 1
fi

# 确保目标目录存在
mkdir -p "$(dirname "$DMG_PATH")" || {
  echo "错误: 无法创建目标目录: $(dirname "$DMG_PATH")"
  exit 1
}

# 检查create-dmg命令是否可用
if ! command -v create-dmg &> /dev/null; then
  echo "错误: create-dmg 命令未找到，请确保已安装"
  exit 1
fi

echo "开始创建DMG文件..."
echo "应用名称: $APP_NAME"
echo "DMG路径: $DMG_PATH"
echo "源目录: $SOURCE_DIR"

# 创建DMG文件
create-dmg \
  --volname "$APP_NAME" \
  --volicon "$SOURCE_DIR/$APP_NAME.app/Contents/Resources/icon.icns" \
  --window-pos 200 120 \
  --window-size 600 400 \
  --icon-size 100 \
  --icon "$APP_NAME.app" 200 190 \
  --hide-extension "$APP_NAME.app" \
  --app-drop-link 400 190 \
  "$DMG_PATH" \
  "$SOURCE_DIR" || {
    echo "错误: DMG文件创建失败"
    exit 1
  }

echo "DMG文件创建成功: $DMG_PATH"