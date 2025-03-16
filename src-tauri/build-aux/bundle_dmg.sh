#!/bin/bash
# src-tauri/build-aux/bundle_dmg.sh

# 此脚本用于macOS上创建DMG文件

APP_NAME="$1"
DMG_PATH="$2"
SOURCE_DIR="$3"

if [ -z "$APP_NAME" ] || [ -z "$DMG_PATH" ] || [ -z "$SOURCE_DIR" ]; then
  echo "使用: $0 APP_NAME DMG_PATH SOURCE_DIR"
  exit 1
fi

# 确保目标目录存在
mkdir -p "$(dirname "$DMG_PATH")"

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
  "$SOURCE_DIR"

# 检查是否成功创建
if [ $? -eq 0 ]; then
  echo "DMG文件创建成功: $DMG_PATH"
else
  echo "DMG文件创建失败"
  exit 1
fi